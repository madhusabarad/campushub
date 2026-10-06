import { useState } from 'react'

function App() {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <main className="min-h-screen bg-[#f5efe7] px-5 py-8 text-[#342c29]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-2xl border border-[#d8c9ba] bg-[#fbf8f3] shadow-[0_20px_60px_rgba(68,45,38,0.12)] md:grid-cols-2">

          {/* Brand section */}
          <div className="hidden min-h-[620px] flex-col justify-between bg-[#641f2b] p-12 text-[#f8f0e6] md:flex">
            <div>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8b8ae] bg-[#f5e9dc] text-xl font-semibold text-[#641f2b]">
                C
              </div>

              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#e1c7bd]">
                CampusHub
              </p>

              <h1 className="max-w-md font-serif text-4xl leading-tight">
                Your campus services, brought together.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-[#eadbd3]">
                Food, printing and campus ordering services in one simple place.
              </p>
            </div>

            <p className="text-sm text-[#dfc9c0]">
              Simple. Reliable. Made for campus life.
            </p>
          </div>

          {/* Login / Signup section */}
          <div className="flex min-h-[620px] items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-md">

              <div className="mb-8">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#8a4a55]">
                  Welcome
                </p>

                <h2 className="font-serif text-3xl font-semibold text-[#342c29]">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>

                <p className="mt-2 text-sm text-[#766d63]">
                  {isSignup
                    ? 'Create your CampusHub account to get started.'
                    : 'Sign in to continue to CampusHub.'}
                </p>
              </div>

              {/* Login / Signup tabs */}
              <div className="mb-8 flex border-b border-[#d8c9ba]">
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className={`w-1/2 border-b-2 pb-3 text-sm font-medium transition ${!isSignup
                      ? 'border-[#641f2b] text-[#641f2b]'
                      : 'border-transparent text-[#8a8177] hover:text-[#544c44]'
                    }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className={`w-1/2 border-b-2 pb-3 text-sm font-medium transition ${isSignup
                      ? 'border-[#641f2b] text-[#641f2b]'
                      : 'border-transparent text-[#8a8177] hover:text-[#544c44]'
                    }`}
                >
                  Sign Up
                </button>
              </div>

              <form className="space-y-5">

                {/* Full Name */}
                {isSignup && (
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-[#514940]"
                    >
                      Full Name
                    </label>

                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full border border-[#d5c8b8] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa095] focus:border-[#8a4a55] focus:ring-2 focus:ring-[#8a4a55]/15"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#514940]"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border border-[#d5c8b8] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa095] focus:border-[#8a4a55] focus:ring-2 focus:ring-[#8a4a55]/15"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#514940]"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full border border-[#d5c8b8] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa095] focus:border-[#8a4a55] focus:ring-2 focus:ring-[#8a4a55]/15"
                  />
                </div>

                {/* Confirm Password */}
                {isSignup && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-[#514940]"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="w-full border border-[#d5c8b8] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa095] focus:border-[#8a4a55] focus:ring-2 focus:ring-[#8a4a55]/15"
                    />
                  </div>
                )}

                {/* Main button */}
                <button
                  type="button"
                  className="w-full bg-[#641f2b] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4f1721]"
                >
                  {isSignup ? 'Create Account' : 'Login'}
                </button>
              </form>

              {/* Bottom switch */}
              <p className="mt-7 text-center text-sm text-[#766d63]">
                {isSignup
                  ? 'Already have an account?'
                  : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="font-medium text-[#8a4a55] hover:text-[#6e3540]"
                >
                  {isSignup ? 'Login' : 'Sign Up'}
                </button>
              </p>

            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App