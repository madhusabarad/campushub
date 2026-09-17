import { useState } from 'react'

function App() {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4">
            C
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            CampusHub
          </h1>

          <p className="mt-2 text-slate-500">
            Campus services in one place
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-7">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-7">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${!isSignup
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
                }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${isSignup
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
                }`}
            >
              Sign Up
            </button>
          </div>

          {!isSignup ? (
            <form>
              <div className="mb-5">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Login
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form>
              <div className="mb-4">
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Full Name
                </label>

                <input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email
                </label>

                <input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password
                </label>

                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Confirm Password
                </label>

                <input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Create Account
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          CampusHub
        </p>
      </div>
    </div>
  )
}

export default App