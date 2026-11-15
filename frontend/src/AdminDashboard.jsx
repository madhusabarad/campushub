import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const getHeaders = () => {
  const token = localStorage.getItem('campushub_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiGet(url) {
  const res = await fetch(url, { headers: getHeaders() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
        {label}
      </p>
      <p className="mt-2 text-4xl font-bold text-[#3f2720]">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
    </div>
  )
}

function ChartSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-[#3f2720]">{title}</h3>
      {children}
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
      <span className="ml-3 text-sm text-gray-500">Loading…</span>
    </div>
  )
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">Failed to load data</p>
      <p className="mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-semibold underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}

function EmptyBox({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d9cabb] bg-[#fffaf4] px-6 py-12 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function handleRetry() {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/admin/stats')
      setStats(data.data)
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    apiGet('/api/admin/stats')
      .then((data) => {
        if (!ignore) {
          setStats(data.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Unable to load dashboard data.')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  // Prepare PieChart data for User Roles
  const userRolesData = stats?.users
    ? [
        { name: 'Students', value: stats.users.students || 0, color: '#7b1e1e' },
        { name: 'Faculty', value: stats.users.faculty || 0, color: '#c27a4a' },
        { name: 'Shopkeepers', value: stats.users.shopkeepers || 0, color: '#d97706' },
        { name: 'Admins', value: stats.users.admins || 0, color: '#475569' },
      ].filter((item) => item.value > 0)
    : []

  // Prepare PieChart data for Order Statuses
  const orderStatusData = stats?.orders
    ? [
        { name: 'Placed', value: stats.orders.placed || 0, color: '#3b82f6' },
        { name: 'Preparing', value: stats.orders.preparing || 0, color: '#f59e0b' },
        { name: 'Ready', value: stats.orders.ready || 0, color: '#8b5cf6' },
        { name: 'Completed', value: stats.orders.completed || 0, color: '#10b981' },
        { name: 'Cancelled', value: stats.orders.cancelled || 0, color: '#ef4444' },
      ].filter((item) => item.value > 0)
    : []

  return (
    <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">
      {/* Header */}
      <header className="border-b border-[#eadfd2] bg-[#fffaf4]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-[#7b1e1e]">CampusHub</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl bg-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#641818]"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b5e3c]">
            Admin
          </p>
          <h2 className="text-4xl font-bold">Dashboard</h2>
          <p className="mt-3 text-gray-600">
            Platform analytics, orders and revenue insights.
          </p>
        </section>

        {loading && <LoadingBox />}
        {!loading && error && (
          <ErrorBox message={error} onRetry={handleRetry} />
        )}

        {!loading && !error && stats && (
          <>
            {/* Summary Stats */}
            <section className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Users"
                value={stats.users.total}
                sub={`${stats.users.students} students · ${stats.users.faculty || 0} faculty · ${stats.users.shopkeepers} shopkeepers`}
              />
              <StatCard
                label="Total Shops"
                value={stats.shops.total}
                sub={`${stats.shops.open} open · ${stats.shops.closed} closed`}
              />
              <StatCard
                label="Total Orders"
                value={stats.orders.total}
                sub={`${stats.orders.completed} completed · ${stats.orders.cancelled} cancelled`}
              />
              <StatCard
                label="Total Revenue"
                value={`₹${Number(stats.totalOrderValue || 0).toLocaleString('en-IN')}`}
                sub="Excl. cancelled orders"
              />
            </section>

            {/* Charts Row 1: Trends & Revenue */}
            <section className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Orders Per Day */}
              <ChartSection title="Orders Per Day">
                {!stats.dailyOrders || stats.dailyOrders.length === 0 ? (
                  <EmptyBox message="No order data available yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={stats.dailyOrders}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8de" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: '#eadfd2',
                          fontSize: 12,
                        }}
                        formatter={(value) => [value, 'Orders']}
                      />
                      <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                      <Line
                        type="monotone"
                        name="Orders"
                        dataKey="count"
                        stroke="#7b1e1e"
                        strokeWidth={2.5}
                        dot={{ fill: '#7b1e1e', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>

              {/* Revenue Per Shop */}
              <ChartSection title="Revenue Per Shop">
                {!stats.revenuePerShop || stats.revenuePerShop.length === 0 ? (
                  <EmptyBox message="No revenue data available yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={stats.revenuePerShop}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8de" />
                      <XAxis
                        dataKey="shopName"
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: '#eadfd2',
                          fontSize: 12,
                        }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                      <Bar name="Revenue (₹)" dataKey="revenue" fill="#7b1e1e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>
            </section>

            {/* Charts Row 2: Distributions */}
            <section className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Order Status Distribution */}
              <ChartSection title="Order Status Distribution">
                {orderStatusData.length === 0 ? (
                  <EmptyBox message="No orders available yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {orderStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: '#eadfd2',
                          fontSize: 12,
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>

              {/* User Distribution by Role */}
              <ChartSection title="User Distribution by Role">
                {userRolesData.length === 0 ? (
                  <EmptyBox message="No users registered yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <Pie
                        data={userRolesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {userRolesData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: '#eadfd2',
                          fontSize: 12,
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>
            </section>

            {/* Popular Items */}
            <section className="mb-8">
              <ChartSection title="Popular Menu Items (Top 10 by quantity sold)">
                {!stats.popularItems || stats.popularItems.length === 0 ? (
                  <EmptyBox message="No item sales data available yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={stats.popularItems}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8de" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 11, fill: '#8b5e3c' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: '#eadfd2',
                          fontSize: 12,
                        }}
                        formatter={(value) => [value, 'Qty Sold']}
                      />
                      <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                      <Bar
                        name="Quantity Sold"
                        dataKey="quantitySold"
                        fill="#c27a4a"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>
            </section>

            {/* Order Status Breakdown Cards */}
            <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Placed', key: 'placed' },
                { label: 'Preparing', key: 'preparing' },
                { label: 'Ready', key: 'ready' },
                { label: 'Completed', key: 'completed' },
                { label: 'Cancelled', key: 'cancelled' },
              ].map(({ label, key }) => (
                <div
                  key={key}
                  className="rounded-2xl border border-[#eadfd2] bg-white p-5 text-center shadow-sm"
                >
                  <p className="text-2xl font-bold text-[#3f2720]">
                    {stats.orders[key]}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
