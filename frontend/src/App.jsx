import { useEffect, useState } from 'react'
import Dashboard from './Dashboard'
import Menu from './Menu'
import Cart from './Cart'
import './App.css'

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
      const endpoint = isSignup
        ? '/api/auth/register'
        : '/api/auth/login'

      const body = isSignup
        ? {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
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
          role: 'student',
          collegeId: '',
        })
        setError('Account created successfully. Please log in.')
        return
      }

      const token = data.token || data.data?.token

      if (!token) {
        throw new Error('Authentication token was not received')
      }

      onLogin(token)
    } catch (err) {
      setError(err.message || 'Something went wrong')
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('campushub_token') !== null
  )

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedShopId, setSelectedShopId] = useState(null)

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state

      if (!state || state.page === 'dashboard') {
        setCurrentPage('dashboard')
        setSelectedShopId(null)
        return
      }

      if (state.page === 'menu') {
        setCurrentPage('menu')
        setSelectedShopId(state.shopId)
        return
      }

      if (state.page === 'cart') {
        setCurrentPage('cart')
        setSelectedShopId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('campushub_token', token)
    setIsLoggedIn(true)
    setCurrentPage('dashboard')
    setSelectedShopId(null)

    window.history.replaceState(
      { page: 'dashboard' },
      '',
      window.location.pathname
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('campushub_token')
    setIsLoggedIn(false)
    setCurrentPage('dashboard')
    setSelectedShopId(null)

    window.history.replaceState(
      { page: 'login' },
      '',
      window.location.pathname
    )
  }

  const openMenu = (shopId) => {
    setSelectedShopId(shopId)
    setCurrentPage('menu')

    window.history.pushState(
      { page: 'menu', shopId },
      '',
      window.location.pathname
    )
  }

  const openCart = () => {
    setCurrentPage('cart')
    setSelectedShopId(null)

    window.history.pushState(
      { page: 'cart' },
      '',
      window.location.pathname
    )
  }

  const goToDashboard = () => {
    setCurrentPage('dashboard')
    setSelectedShopId(null)

    window.history.pushState(
      { page: 'dashboard' },
      '',
      window.location.pathname
    )
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (currentPage === 'menu' && selectedShopId) {
    return (
      <Menu
        shopId={selectedShopId}
        onBack={goToDashboard}
      />
    )
  }

  if (currentPage === 'cart') {
    return <Cart onBack={goToDashboard} />
  }

  return (
    <Dashboard
      onOpenMenu={openMenu}
      onOpenCart={openCart}
      onLogout={handleLogout}
    />
  )
}

export default App