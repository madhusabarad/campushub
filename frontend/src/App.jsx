import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { loginUser, registerUser } from './api/authApi'
import { getAdminStats } from './api/adminApi'
import Dashboard from './Dashboard'
import Menu from './Menu'
import Cart from './Cart'
import './App.css'
import MyOrders from './MyOrders'
import XeroxRequest from './XeroxRequest'
import XeroxHistory from './XeroxHistory'
import ShopkeeperXerox from './ShopkeeperXerox'
import ShopkeeperOrders from './ShopkeeperOrders'
import AdminUsers from './AdminUsers' 
import AdminShops from './AdminShops' 
import AdminOrders from './AdminOrders' 

function LoginPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    collegeId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    const body = isSignup
      ? {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'student',
          collegeId: formData.collegeId.trim(),
        }
      : {
          email: formData.email.trim(),
          password: formData.password,
        }

    if (isSignup) {
      await registerUser(body)

      setIsSignup(false)
      setFormData({
        name: '',
        email: formData.email.trim(),
        password: '',
        role: 'student',
        collegeId: '',
      })

      setError('Account created successfully. Please log in.')
      return
    }

    const data = await loginUser(body)

    const token = data.token || data.data?.token

    if (!token) {
      throw new Error('Authentication token was not received')
    }

    onLogin(data.user, token)

  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    )
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen bg-[#f7f0e6] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl min-h-[650px] bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">

        <div className="bg-[#7b1e1e] text-white p-10 md:p-14 flex flex-col justify-center">
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.3em] text-[#f4d7b7] mb-5">
              Welcome to
            </p>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              CampusHub
            </h1>

            <p className="text-lg leading-8 text-[#f8e8d8]">
              Your campus, connected. Explore food, services,
              orders and everything your campus has to offer.
            </p>

            <div className="mt-10 space-y-4 text-[#f8e8d8]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f4d7b7]" />
                <span>Discover campus services</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f4d7b7]" />
                <span>Order from campus outlets</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f4d7b7]" />
                <span>Stay connected with campus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-14 flex items-center">
          <div className="w-full max-w-md mx-auto">

            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8b5e3c] mb-2">
                {isSignup ? 'Create account' : 'Welcome back'}
              </p>

              <h2 className="text-3xl font-bold text-[#3f2720]">
                {isSignup ? 'Join CampusHub' : 'Sign in to CampusHub'}
              </h2>

              <p className="text-gray-500 mt-2">
                {isSignup
                  ? 'Create your account to get started.'
                  : 'Enter your details to continue.'}
              </p>
            </div>

            {error && (
              <div
                role="status"
                className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error.includes('successfully')
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                  }`}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {isSignup && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#3f2720] mb-2">
                      Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#7b1e1e] focus:ring-2 focus:ring-[#7b1e1e]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3f2720] mb-2">
                      Role
                    </label>

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#7b1e1e] focus:ring-2 focus:ring-[#7b1e1e]/10"
                    >
                      <option value="student">Student</option>
                      <option value="shopkeeper">Shopkeeper</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3f2720] mb-2">
                      College ID
                    </label>

                    <input
                      type="text"
                      name="collegeId"
                      value={formData.collegeId}
                      onChange={handleChange}
                      required
                      placeholder="Enter your actual college ID"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#7b1e1e] focus:ring-2 focus:ring-[#7b1e1e]/10"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-[#3f2720] mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#7b1e1e] focus:ring-2 focus:ring-[#7b1e1e]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3f2720] mb-2">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#7b1e1e] focus:ring-2 focus:ring-[#7b1e1e]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#7b1e1e] px-4 py-3.5 font-semibold text-white transition hover:bg-[#641818] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create Account'
                    : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup)
                  setError('')
                }}
                className="ml-2 font-semibold text-[#7b1e1e] hover:underline"
              >
                {isSignup ? 'Login' : 'Sign up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()

  return user ? children : <Navigate to="/login" replace />
}

function MenuPage() {
  const { shopId } = useParams()
  const navigate = useNavigate()

  return (
    <Menu
      shopId={shopId}
      onBack={() => navigate('/dashboard')}
    />
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
 <Dashboard
  onOpenMenu={(shopId) => navigate(`/menu/${shopId}`)}
  onOpenCart={() => navigate('/cart')}
  onOpenOrders={() => navigate('/my-orders')}
  onOpenXerox={() => navigate('/xerox')}
  onLogout={handleLogout}
/>
  )
}
function XeroxPage() {
  const navigate = useNavigate()

  return (
    <XeroxRequest
      onBack={() => navigate('/dashboard')}
      onViewHistory={() => navigate('/xerox-history')}
    />
  )
}

function XeroxHistoryPage() {
  const navigate = useNavigate()

  return (
    <XeroxHistory
      onBack={() => navigate('/xerox')}
    />
  )
}

function CartPage() {
  const navigate = useNavigate()

  return <Cart onBack={() => navigate('/dashboard')} />
}

function MyOrdersPage() {
  const navigate = useNavigate()

  return (
    <MyOrders onBack={() => navigate('/dashboard')} />
  )
}

function ShopkeeperPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8f3ed]">
      <div className="flex items-center justify-between bg-[#7b1e1e] p-5 text-white">
        <h1 className="text-2xl font-bold">
          CampusHub Shopkeeper Dashboard
        </h1>

        <button
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className="rounded bg-white px-4 py-2 font-semibold text-[#7b1e1e]"
        >
          Logout
        </button>
      </div>

      <ShopkeeperXerox />
      <ShopkeeperOrders/>
    </div>
  )
}

function AdminPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getAdminStats()
      setStats(result.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load admin statistics.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const statCards = [
    { title: 'Total Users', value: stats?.users?.total ?? 0 },
    { title: 'Students', value: stats?.users?.students ?? 0 },
    { title: 'Shopkeepers', value: stats?.users?.shopkeepers ?? 0 },
    { title: 'Total Shops', value: stats?.shops?.total ?? 0 },
    { title: 'Open Shops', value: stats?.shops?.open ?? 0 },
    { title: 'Total Orders', value: stats?.orders?.total ?? 0 },
    { title: 'Preparing Orders', value: stats?.orders?.preparing ?? 0 },
    { title: 'Completed Orders', value: stats?.orders?.completed ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-[#f8f3ed]">
      <header className="flex items-center justify-between bg-[#7b1e1e] p-5 text-white">
        <h1 className="text-2xl font-bold">CampusHub Admin Dashboard</h1>

        <button
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className="rounded bg-white px-4 py-2 font-semibold text-[#7b1e1e]"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <h2 className="mb-2 text-2xl font-bold text-[#7b1e1e]">
          Dashboard Overview
        </h2>

        <p className="mb-6 text-gray-600">
          Monitor CampusHub users, shops and food orders.
        </p>

        <button
          onClick={loadStats}
          className="mb-6 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Statistics
        </button>
        <button
  onClick={() => navigate('/admin/users')}
  className="mb-6 ml-3 rounded-lg border border-[#7b1e1e] px-4 py-2 text-[#7b1e1e]"
>
  Manage Users
</button>

<button
  onClick={() => navigate('/admin/shops')}
  className="mb-6 ml-3 rounded-lg border border-[#7b1e1e] px-4 py-2 text-[#7b1e1e]"
>
  Manage Shops
</button>

<button
  onClick={() => navigate('/admin/orders')}
  className="mb-6 ml-3 rounded-lg border border-[#7b1e1e] px-4 py-2 text-[#7b1e1e]"
>
  Manage Orders
</button>

        {loading ? (
          <p>Loading dashboard statistics...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl bg-white p-5 shadow"
                >
                  <p className="text-gray-600">{card.title}</p>
                  <h3 className="mt-2 text-3xl font-bold text-[#7b1e1e]">
                    {card.value}
                  </h3>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-white p-5 shadow">
              <h3 className="mb-3 text-xl font-bold text-[#7b1e1e]">
                Order Value
              </h3>
              <p className="text-3xl font-bold">
                ₹{stats?.totalOrderValue ?? 0}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function App() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (userData, token) => {
  login(userData, token)

  const role = userData?.role?.toLowerCase()

  if (role === 'student') {
    navigate('/dashboard', { replace: true })
  } else if (role === 'shopkeeper') {
    navigate('/shopkeeper', { replace: true })
  } else if (role === 'admin') {
    navigate('/admin', { replace: true })
  } else {
    navigate('/login', { replace: true })
  }
}

  return (
    <Routes>
      <Route
  path="/login"
  element={
    user
      ? <Navigate
          to={
            user.role?.toLowerCase() === 'shopkeeper'
              ? '/shopkeeper'
              : user.role?.toLowerCase() === 'admin'
              ? '/admin'
              : '/dashboard'
          }
          replace
        />
      : <LoginPage onLogin={handleLogin} />
  }
/>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
  path="/xerox"
  element={
    <ProtectedRoute>
      <XeroxPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/xerox-history"
  element={
    <ProtectedRoute>
      <XeroxHistoryPage />
    </ProtectedRoute>
  }
/>

      <Route
        path="/menu/:shopId"
        element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />

      <Route
  path="/my-orders"
  element={
    <ProtectedRoute>
      <MyOrdersPage />
    </ProtectedRoute>
  }
/>

      <Route
  path="/shopkeeper"
  element={
    <ProtectedRoute>
      <ShopkeeperPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
<Route
 path="/admin/users"
  element={
  <AdminUsers />
  } 
  />

  <Route path="/admin/shops" element={<AdminShops />} />

  <Route path="/admin/orders" element={<AdminOrders />} />

      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
