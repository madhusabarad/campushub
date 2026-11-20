import { useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'
import Dashboard from './Dashboard'
import Menu from './Menu'
import Cart from './Cart'
import Xerox from './Xerox'
import AdminDashboard from './AdminDashboard'
import ShopkeeperDashboard from './ShopkeeperDashboard'
import MyOrders from './MyOrders'
import XeroxHistory from './XeroxHistory'
import ShopkeeperXerox from './ShopkeeperXerox'
import ShopkeeperOrders from './ShopkeeperOrders'
import AdminUsers from './AdminUsers'
import AdminShops from './AdminShops'
import AdminOrders from './AdminOrders'
import AppLayout from './components/AppLayout'
import ThemeToggle from './components/ThemeToggle'
import { OrderNotificationProvider } from './context/OrderNotificationContext'
import './App.css'

// Decode a JWT payload without external library (base64url -> JSON)
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

function getStoredUser() {
  const token = localStorage.getItem('campushub_token')
  if (!token) return null

  const payload = decodeJwt(token)
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('campushub_token')
    localStorage.removeItem('campushub_role')
    localStorage.removeItem('campushub_user')
    return null
  }

  let storedUser = null
  try {
    const raw = localStorage.getItem('campushub_user')
    if (raw) storedUser = JSON.parse(raw)
  } catch {
    storedUser = null
  }

  const storedRole = localStorage.getItem('campushub_role')
  const role = (storedRole || storedUser?.role || payload?.role || 'student').toLowerCase()

  return {
    ...payload,
    ...(storedUser || {}),
    role,
  }
}

function getDashboardRouteForRole(role) {
  const r = (role || 'student').toLowerCase()
  if (r === 'admin') return '/admin'
  if (r === 'shopkeeper') return '/shopkeeper'
  return '/dashboard'
}

function resolveProtectedPage(requestedPath, role) {
  const r = (role || 'student').toLowerCase()
  const cleanPath = (requestedPath || '').replace(/^\/+/, '')

  if (r === 'admin') {
    if (cleanPath.startsWith('admin')) return `/${cleanPath}`
    return '/admin'
  }

  if (r === 'shopkeeper') {
    if (cleanPath.startsWith('shopkeeper')) return `/${cleanPath}`
    return '/shopkeeper'
  }

  // Student role
  if (
    cleanPath.startsWith('dashboard') ||
    cleanPath.startsWith('student-dashboard') ||
    cleanPath.startsWith('menu') ||
    cleanPath.startsWith('cart') ||
    cleanPath.startsWith('my-orders') ||
    cleanPath.startsWith('xerox')
  ) {
    return `/${cleanPath}`
  }

  return '/dashboard'
}

function LoginPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login'

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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      if (isSignup) {
        setIsSignup(false)
        setFormData({
          name: '',
          email: formData.email.trim(),
          password: '',
          collegeId: '',
        })
        setError('Account created successfully. Please log in.')
        return
      }

      const token = data.token || data.data?.token
      const userData = data.user || data.data?.user || {}

      if (!token) {
        throw new Error('Authentication token was not received')
      }

      let userRole = userData.role || data.role || data.data?.role
      if (!userRole && token) {
        const payload = decodeJwt(token)
        userRole = payload?.role
      }
      userRole = (userRole || 'student').toLowerCase()

      const fullUser = { ...userData, role: userRole }
      onLogin(token, userRole, fullUser)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-text flex items-center justify-center px-6 py-10">
      {/* Theme Toggle in top corner before login */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl min-h-[650px] bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#7b1e1e] dark:bg-[#341818] text-white p-10 md:p-14 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border">
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

        <div className="p-8 md:p-14 flex items-center bg-surface text-text">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">
                {isSignup ? 'Create account' : 'Welcome back'}
              </p>

              <h2 className="text-3xl font-bold text-text">
                {isSignup ? 'Join CampusHub' : 'Sign in to CampusHub'}
              </h2>

              <p className="text-muted-text mt-2">
                {isSignup
                  ? 'Create your account to get started.'
                  : 'Enter your details to continue.'}
              </p>
            </div>

            {error && (
              <div
                role="status"
                className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                  error.includes('successfully')
                    ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'
                    : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted-text/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-text">
                  Campus Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your campus email"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted-text/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted-text/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">
                    College ID
                  </label>
                  <input
                    type="text"
                    name="collegeId"
                    value={formData.collegeId}
                    onChange={handleChange}
                    required
                    placeholder="Enter your college ID"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted-text/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create Account'
                    : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-text">
              {isSignup
                ? 'Already have an account?'
                : "Don't have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup)
                  setError('')
                }}
                className="ml-2 font-semibold text-primary hover:underline cursor-pointer"
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

function MenuRouteWrapper({ onBack, userRole }) {
  const { shopId } = useParams()
  return <Menu shopId={shopId || '1'} onBack={onBack} userRole={userRole} />
}

function StudentLayoutWrapper({ children, currentPage, onLogout }) {
  const navigate = useNavigate()

  const handleNavigate = (page) => {
    if (page === 'dashboard') {
      navigate('/dashboard')
    } else if (page === 'menu') {
      navigate('/menu')
    } else if (page === 'cart') {
      navigate('/cart')
    } else if (page === 'xerox') {
      navigate('/xerox')
    } else if (page === 'my-orders') {
      navigate('/my-orders')
    } else {
      navigate(`/${page}`)
    }
  }

  const handleOpenCart = () => {
    navigate('/cart')
  }

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      onOpenCart={handleOpenCart}
    >
      {children}
    </AppLayout>
  )
}

function ProtectedRoute({ children, user, allowedRoles }) {
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = (user.role || 'student').toLowerCase()
  if (allowedRoles && !allowedRoles.includes(role)) {
    const targetDashboard = getDashboardRouteForRole(role)
    return <Navigate to={targetDashboard} replace />
  }

  return children
}

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const navigate = useNavigate()

  const role = (user?.role || 'student').toLowerCase()

  const handleLogin = (token, roleArg, userArg) => {
    let tokenVal = token
    let roleVal = roleArg
    let userVal = userArg

    if (typeof token === 'object' && token !== null && !roleArg) {
      tokenVal = token.token || token.data?.token
      userVal = token.user || token.data?.user
      roleVal = userVal?.role || token.role
    } else if (typeof roleArg === 'object' && roleArg !== null && !userArg) {
      userVal = roleArg
      roleVal = roleArg.role
    }

    if (!roleVal && tokenVal) {
      const payload = decodeJwt(tokenVal)
      roleVal = payload?.role
    }

    roleVal = (roleVal || 'student').toLowerCase()
    userVal = { ...(userVal || {}), role: roleVal }

    localStorage.setItem('campushub_token', tokenVal)
    localStorage.setItem('campushub_role', roleVal)
    localStorage.setItem('campushub_user', JSON.stringify(userVal))

    setUser(userVal)

    const targetRoute = getDashboardRouteForRole(roleVal)
    navigate(targetRoute, { replace: true })
  }

  const handleLogout = () => {
    localStorage.removeItem('campushub_token')
    localStorage.removeItem('campushub_role')
    localStorage.removeItem('campushub_user')
    localStorage.removeItem('campushub_notifications')
    localStorage.removeItem('campushub_known_statuses')
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')

    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <OrderNotificationProvider role={role}>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getDashboardRouteForRole(role)} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Student Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="dashboard" onLogout={handleLogout}>
                <Dashboard
                  onOpenMenu={(shopId) => navigate(shopId ? `/menu/${shopId}` : '/menu')}
                  onOpenCart={() => navigate('/cart')}
                  onOpenOrders={() => navigate('/my-orders')}
                  onOpenXerox={() => navigate('/xerox')}
                  onLogout={handleLogout}
                  userRole={role}
                  userName={user?.name || ''}
                />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="menu" onLogout={handleLogout}>
                <Menu
                  shopId="1"
                  onBack={() => navigate('/dashboard')}
                  userRole={role}
                />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu/:shopId"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="menu" onLogout={handleLogout}>
                <MenuRouteWrapper
                  onBack={() => navigate('/dashboard')}
                  userRole={role}
                />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="cart" onLogout={handleLogout}>
                <Cart onBack={() => navigate('/dashboard')} />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="my-orders" onLogout={handleLogout}>
                <MyOrders onBack={() => navigate('/dashboard')} />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/xerox"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="xerox" onLogout={handleLogout}>
                <Xerox onBack={() => navigate('/dashboard')} userRole={role} />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/xerox-history"
          element={
            <ProtectedRoute user={user} allowedRoles={['student']}>
              <StudentLayoutWrapper currentPage="xerox-history" onLogout={handleLogout}>
                <XeroxHistory onBack={() => navigate('/dashboard')} />
              </StudentLayoutWrapper>
            </ProtectedRoute>
          }
        />

        {/* Shopkeeper Routes */}
        <Route
          path="/shopkeeper"
          element={
            <ProtectedRoute user={user} allowedRoles={['shopkeeper']}>
              <ShopkeeperDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shopkeeper-dashboard"
          element={<Navigate to="/shopkeeper" replace />}
        />

        <Route
          path="/shopkeeper/orders"
          element={
            <ProtectedRoute user={user} allowedRoles={['shopkeeper']}>
              <ShopkeeperOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shopkeeper/xerox"
          element={
            <ProtectedRoute user={user} allowedRoles={['shopkeeper']}>
              <ShopkeeperXerox />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin" replace />}
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/shops"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminShops />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to={getDashboardRouteForRole(role)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </OrderNotificationProvider>
  )
}

export { resolveProtectedPage }
export default App
