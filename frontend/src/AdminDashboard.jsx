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
import { useTheme } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-secondary">
        {label}
      </p>
      <p className="mt-2 text-4xl font-bold text-text">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted-text">{sub}</p>}
    </div>
  )
}

function ChartSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-text">{title}</h3>
      {children}
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="ml-3 text-sm text-muted-text">Loading…</span>
    </div>
  )
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-5 text-sm text-red-700 dark:text-red-300">
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
    <div className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-6 py-12 text-center">
      <p className="text-sm text-muted-text">{message}</p>
    </div>
  )
}

export default function AdminDashboard({ onLogout }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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

  // Prepare chart colors based on resolvedTheme
  const gridStroke = isDark ? '#3a312c' : '#f0e8de'
  const tickFill = isDark ? '#d4b29c' : '#8b5e3c'
  const primaryChartColor = isDark ? '#e05a56' : '#7b1e1e'
  const secondaryChartColor = isDark ? '#e29d62' : '#c27a4a'
  const tooltipContentStyle = {
    backgroundColor: isDark ? '#241e1b' : '#ffffff',
    borderColor: isDark ? '#3a312c' : '#eadfd2',
    color: isDark ? '#f5efe7' : '#3f2720',
    borderRadius: 10,
    fontSize: 12,
  }
  const tooltipItemStyle = {
    color: isDark ? '#f5efe7' : '#3f2720',
  }
  const legendWrapperStyle = {
    paddingTop: 10,
    fontSize: 12,
    color: isDark ? '#f5efe7' : '#3f2720',
  }

  // Prepare PieChart data for User Roles
  const userRolesData = stats?.users
    ? [
        { name: 'Students', value: stats.users.students || 0, color: isDark ? '#e05a56' : '#7b1e1e' },
        { name: 'Faculty', value: stats.users.faculty || 0, color: isDark ? '#e29d62' : '#c27a4a' },
        { name: 'Shopkeepers', value: stats.users.shopkeepers || 0, color: isDark ? '#f59e0b' : '#d97706' },
        { name: 'Admins', value: stats.users.admins || 0, color: isDark ? '#94a3b8' : '#475569' },
      ].filter((item) => item.value > 0)
    : []

  // Prepare PieChart data for Order Statuses
  const orderStatusData = stats?.orders
    ? [
        { name: 'Placed', value: stats.orders.placed || 0, color: isDark ? '#60a5fa' : '#3b82f6' },
        { name: 'Preparing', value: stats.orders.preparing || 0, color: isDark ? '#fbbf24' : '#f59e0b' },
        { name: 'Ready', value: stats.orders.ready || 0, color: isDark ? '#a78bfa' : '#8b5cf6' },
        { name: 'Completed', value: stats.orders.completed || 0, color: isDark ? '#34d399' : '#10b981' },
        { name: 'Cancelled', value: stats.orders.cancelled || 0, color: isDark ? '#f87171' : '#ef4444' },
      ].filter((item) => item.value > 0)
    : []

  return (
    <main className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-primary">CampusHub</h1>
            <p className="text-sm text-muted-text">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            Admin
          </p>
          <h2 className="text-4xl font-bold text-text">Dashboard</h2>
          <p className="mt-3 text-muted-text">
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
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: tickFill }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: tickFill }}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value) => [value, 'Orders']}
                      />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Line
                        type="monotone"
                        name="Orders"
                        dataKey="count"
                        stroke={primaryChartColor}
                        strokeWidth={2.5}
                        dot={{ fill: primaryChartColor, r: 4 }}
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
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        dataKey="shopName"
                        tick={{ fontSize: 11, fill: tickFill }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: tickFill }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Bar name="Revenue (₹)" dataKey="revenue" fill={primaryChartColor} radius={[6, 6, 0, 0]} />
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
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: 12, fontSize: 12, color: isDark ? '#f5efe7' : '#3f2720' }}
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
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: 12, fontSize: 12, color: isDark ? '#f5efe7' : '#3f2720' }}
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
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: tickFill }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 11, fill: tickFill }}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(value) => [value, 'Qty Sold']}
                      />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Bar
                        name="Quantity Sold"
                        dataKey="quantitySold"
                        fill={secondaryChartColor}
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
                  className="rounded-2xl border border-border bg-surface p-5 text-center shadow-sm"
                >
                  <p className="text-2xl font-bold text-text">
                    {stats.orders[key]}
                  </p>
                  <p className="mt-1 text-sm text-muted-text">{label}</p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
