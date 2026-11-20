import { useCallback, useEffect, useMemo, useState } from 'react'
import ShopReviews from './ShopReviews'

const SHOP_CONFIG = {
  '1': {
    name: 'Campus Canteen',
    expectedCount: 30,
  },
  '2': {
    name: 'Akshay Food Court',
    expectedCount: 147,
  },
  '3': {
    name: 'Campus Bakery',
    expectedCount: 12,
  },
  '4': {
    name: 'Campus Xerox',
    expectedCount: 5,
  },
}

function getToken() {
  return (
    localStorage.getItem('campushub_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  )
}

async function apiRequest(url, options = {}) {
  const token = getToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok || result.success === false) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session may have expired. Please log in again.')
    }

    throw new Error(result.message || 'Something went wrong. Please try again.')
  }

  return result
}

function Menu({ shopId, onBack, userRole = 'student' }) {
  const isStudent = userRole === 'student'

  const [shop, setShop] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(isStudent)
  const [error, setError] = useState('')
  const [cartError, setCartError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyItemId, setBusyItemId] = useState(null)

  const loadCart = useCallback(async () => {
    if (!isStudent) {
      setCartLoading(false)
      return
    }

    setCartLoading(true)
    setCartError('')

    try {
      const result = await apiRequest('/api/cart')
      const items = (result.data?.items || [])
        .filter((entry) => entry.menuItemId)
        .map((entry) => ({
          _id: entry._id,
          menuItemId: entry.menuItemId._id,
          name: entry.menuItemId.name,
          price: Number(entry.price ?? entry.menuItemId.price ?? 0),
          quantity: entry.quantity,
          category: entry.menuItemId.category || 'Food',
        }))

      setCart(items)
    } catch (err) {
      setCartError(err.message || 'Unable to load cart.')
    } finally {
      setCartLoading(false)
    }
  }, [isStudent])

  useEffect(() => {
    let cancelled = false

    async function loadMenu() {
      setLoading(true)
      setError('')
      setMenuItems([])
      setShop(null)
      setActiveCategory('All')

      try {
        const shopsResult = await apiRequest('/api/shops?limit=100')
        const shops = shopsResult.data || []

        let matchedShop = shops.find(
          (s) => s._id === shopId || s._id?.toString() === String(shopId)
        )

        if (!matchedShop && SHOP_CONFIG[String(shopId)]) {
          const expectedName = SHOP_CONFIG[String(shopId)].name.toLowerCase()
          matchedShop = shops.find((s) => s.name?.trim().toLowerCase() === expectedName)
        }

        if (!matchedShop && String(shopId).toLowerCase().includes('xerox')) {
          matchedShop = shops.find((s) => s.category === 'xerox' || s.name?.toLowerCase().includes('xerox'))
        }

        if (!matchedShop && shops.length > 0) {
          matchedShop = shops[0]
        }

        if (!matchedShop) {
          throw new Error('The requested shop was not found. Please return to the dashboard and try again.')
        }

        if (cancelled) return
        setShop(matchedShop)

        const firstPage = await apiRequest(
          `/api/shops/${matchedShop._id}/menu?page=1&limit=100`
        )

        const totalPages = Number(firstPage.pagination?.totalPages || 1)
        const remainingPages = Array.from(
          { length: Math.max(0, totalPages - 1) },
          (_, index) => index + 2
        )

        const remainingResults = await Promise.all(
          remainingPages.map((page) =>
            apiRequest(`/api/shops/${matchedShop._id}/menu?page=${page}&limit=100`)
          )
        )

        if (cancelled) return

        const allItems = [
          ...(firstPage.data || []),
          ...remainingResults.flatMap((r) => r.data || []),
        ]

        setMenuItems(allItems)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load menu. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [shopId])

  useEffect(() => {
    if (isStudent) {
      loadCart()
    }
  }, [isStudent, loadCart])

  const categories = useMemo(() => {
    const set = new Set(menuItems.map((item) => item.category).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return menuItems
    return menuItems.filter((item) => item.category === activeCategory)
  }, [menuItems, activeCategory])

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  )

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  )

  const addToCart = async (item) => {
    if (!isStudent) return
    setBusyItemId(item._id)
    setActionError('')

    try {
      await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          menuItemId: item._id,
          quantity: 1,
        }),
      })

      await loadCart()
    } catch (err) {
      setActionError(err.message || 'Unable to add item to cart.')
    } finally {
      setBusyItemId(null)
    }
  }

  const changeQuantity = async (cartItemId, delta) => {
    if (!isStudent) return
    setBusyItemId(cartItemId)
    setActionError('')

    try {
      const item = cart.find((i) => i._id === cartItemId || i.menuItemId === cartItemId)
      if (!item) return

      const nextQuantity = item.quantity + delta

      if (nextQuantity <= 0) {
        await apiRequest(`/api/cart/item/${item._id}`, {
          method: 'DELETE',
        })
      } else {
        await apiRequest(`/api/cart/item/${item._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: nextQuantity }),
        })
      }

      await loadCart()
    } catch (err) {
      setActionError(err.message || 'Unable to update item quantity.')
    } finally {
      setBusyItemId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e6] pb-24 text-[#3f2720]">
      <header className="border-b border-[#eadfd2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b5e3c]">
              Campus Outlet
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {shop?.name || 'Campus Menu'}
            </h1>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-[#7b1e1e] transition hover:bg-[#7b1e1e] hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {actionError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
            <p className="text-sm text-gray-500">Loading menu items…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-red-700">Unable to load menu</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Category Filter Pills (Menu Expansion UI) */}
            <section className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? 'bg-[#7b1e1e] text-white shadow-sm'
                        : 'border border-[#eadfd2] bg-white text-gray-700 hover:bg-[#f7ece1]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* Menu Items Grid */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col justify-between rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-[#3f2720]">{item.name}</h2>
                      {item.category && (
                        <span className="shrink-0 rounded-full bg-[#f7e7d5] px-2 py-0.5 text-xs font-semibold text-[#8b5e3c]">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-extrabold text-[#7b1e1e]">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    {item.isAvailable === false ? (
                      <span className="text-sm font-semibold text-gray-400">
                        Unavailable
                      </span>
                    ) : isStudent ? (
                      <button
                        type="button"
                        disabled={busyItemId === item._id}
                        onClick={() => addToCart(item)}
                        className="rounded-xl bg-[#7b1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#641818] disabled:opacity-50"
                      >
                        {busyItemId === item._id ? 'Adding…' : 'Add +'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">Student login required to order</span>
                    )}
                  </div>
                </article>
              ))}
            </section>

            {filteredItems.length === 0 && (
              <p className="py-12 text-center text-gray-500">
                No items found in this category.
              </p>
            )}

            {/* Shop Reviews Section */}
            {shop && (
              <div className="mt-12">
                <ShopReviews shopId={shop._id} userRole={userRole} />
              </div>
            )}
          </>
        )}

        {/* Sticky bottom cart bar from main for student */}
        {isStudent && cartCount > 0 && (
          <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl bg-[#3f2720] p-4 text-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold">
                  {cartCount} item{cartCount > 1 ? 's' : ''} in cart
                </p>
                <p className="text-sm text-gray-300">Total: ₹{cartTotal}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex max-h-12 flex-wrap gap-1 overflow-hidden">
                  {cart.map((cartItem) => (
                    <div
                      key={cartItem._id}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs"
                    >
                      <span className="max-w-[120px] truncate">{cartItem.name}</span>
                      <button
                        onClick={() => changeQuantity(cartItem._id, -1)}
                        className="rounded px-1 font-bold hover:bg-white/20"
                        aria-label={`Remove one ${cartItem.name}`}
                      >
                        −
                      </button>
                      <span>{cartItem.quantity}</span>
                      <button
                        onClick={() => changeQuantity(cartItem._id, 1)}
                        className="rounded px-1 font-bold hover:bg-white/20"
                        aria-label={`Add one ${cartItem.name}`}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}

export default Menu
