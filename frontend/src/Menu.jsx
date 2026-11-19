import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from './components/Card'
import Button from './components/Button'
import Badge from './components/Badge'
import Input from './components/Input'

const OUTLETS = [
  {
    id: '1',
    category: 'canteen',
    name: 'Campus Canteen',
    description:
      'Browse the available food and beverages from the campus canteen.',
    icon: '🍽️',
    categories: ['Food', 'Juice', 'Milk Shakes', 'Beverages'],
  },
  {
    id: '2',
    category: 'foodcourt',
    name: 'Akshay Food Court',
    description:
      'Explore the food, snacks, beverages and other items available at Akshay Food Court.',
    icon: '🍛',
    categories: [
      'Papad',
      'Fries',
      'Soup',
      'Gobi Starters',
      'Mushroom Starters',
      'Babycorn Starters',
      'Paneer Starters',
      'Fried Nuggets',
      'Momos',
      'Veg Dishes',
      'Mushroom Dishes',
      'Babycorn Dishes',
      'Paneer Dishes',
      'Kaju Dishes',
      'Dal Dishes',
      'Roti',
      'Rice Items',
      'Biriyani Items',
      'Noodles',
      'Beverages',
      'Juice',
      'Milkshakes',
      'Smoothies',
    ],
  },
  {
    id: '3',
    category: 'bakery',
    name: 'Campus Bakery',
    description:
      'Browse snacks, bakery items, burgers and refreshments from the campus bakery.',
    icon: '🥐',
    categories: ['Bakery'],
  },
]

const SHOP_CONFIG = {
  '1': OUTLETS[0],
  '2': OUTLETS[1],
  '3': OUTLETS[2],
  canteen: OUTLETS[0],
  foodcourt: OUTLETS[1],
  bakery: OUTLETS[2],
}

const getToken = () => localStorage.getItem('campushub_token')

const getHeaders = () => {
  const token = getToken()

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
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

function Menu({ shopId = '1', onBack }) {
  const [activeShopId, setActiveShopId] = useState(() => {
    if (shopId && SHOP_CONFIG[shopId]) {
      return SHOP_CONFIG[shopId].id
    }
    return '1'
  })
  const [prevShopId, setPrevShopId] = useState(shopId)

  if (shopId !== prevShopId) {
    setPrevShopId(shopId)
    setActiveShopId(shopId && SHOP_CONFIG[shopId] ? SHOP_CONFIG[shopId].id : '1')
  }

  const currentShop = SHOP_CONFIG[activeShopId] || OUTLETS[0]

  const [availableShops, setAvailableShops] = useState([])
  const [shop, setShop] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const [cart, setCart] = useState([])
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyItemId, setBusyItemId] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availableOnly, setAvailableOnly] = useState(false)

  const handleSelectOutlet = (id) => {
    setActiveShopId(id)
    setSearchQuery('')
    setSelectedCategory('all')
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(
        { page: 'menu', shopId: id },
        '',
        window.location.pathname,
      )
    }
  }

  const loadCart = useCallback(async () => {
    const result = await apiRequest('/api/cart')
    const cartData = result.data || {}

    setCart(
      (cartData.items || [])
        .filter((item) => item.menuItemId)
        .map((item) => ({
          id: item._id,
          menuItemId: item.menuItemId._id,
          name: item.menuItemId.name,
          category: item.menuItemId.category || '',
          price: item.price ?? item.menuItemId.price,
          quantity: item.quantity,
        })),
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMenu() {
      setLoading(true)
      setError('')
      setMenuItems([])
      setShop(null)

      try {
        const result = await apiRequest('/api/shops?limit=100')
        const shops = result.data || []

        if (cancelled) return
        setAvailableShops(shops)

        const matchedShop = shops.find(
          (item) => item.category === currentShop.category,
        )

        if (!matchedShop) {
          throw new Error(
            `${currentShop.name} was not found. Please check the backend menu data.`,
          )
        }

        const menuResult = await apiRequest(
          `/api/shops/${matchedShop._id}/menu?limit=100`,
        )

        if (cancelled) return

        setShop(matchedShop)
        setMenuItems(
          (menuResult.data || []).map((item) => ({
            ...item,
            id: item._id,
          })),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load the menu.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [currentShop.category, currentShop.name, reloadTrigger])

  useEffect(() => {
    let cancelled = false

    async function loadInitialCart() {
      setCartLoading(true)
      setCartError('')

      try {
        await loadCart()
      } catch (err) {
        if (!cancelled) {
          setCartError(err.message || 'Unable to load your cart.')
        }
      } finally {
        if (!cancelled) setCartLoading(false)
      }
    }

    loadInitialCart()

    return () => {
      cancelled = true
    }
  }, [loadCart])

  const runCartAction = async (itemId, action) => {
    setBusyItemId(itemId)
    setActionError('')
    setCartError('')

    try {
      await action()
      await loadCart()
    } catch (err) {
      setActionError(err.message || 'Unable to update your cart.')
    } finally {
      setBusyItemId(null)
    }
  }

  const addToCart = (item) => {
    if (!item.isAvailable || item.price == null) return

    runCartAction(item._id, () =>
      apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          menuItemId: item._id,
          quantity: 1,
        }),
      }),
    )
  }

  const increaseQuantity = (item) => {
    runCartAction(item.id, () =>
      apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          menuItemId: item.menuItemId,
          quantity: 1,
        }),
      }),
    )
  }

  const decreaseQuantity = (item) => {
    runCartAction(item.id, () => {
      if (item.quantity <= 1) {
        return apiRequest(`/api/cart/item/${item.id}`, {
          method: 'DELETE',
        })
      }

      return apiRequest(`/api/cart/item/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: item.quantity - 1,
        }),
      })
    })
  }

  const removeFromCart = (item) => {
    runCartAction(item.id, () =>
      apiRequest(`/api/cart/item/${item.id}`, {
        method: 'DELETE',
      }),
    )
  }

  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  )

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.price || 0) * item.quantity,
        0,
      ),
    [cart],
  )

  const cartItemsByMenuId = useMemo(() => {
    const map = new Map()
    cart.forEach((c) => {
      if (c.menuItemId) {
        map.set(c.menuItemId, c)
      }
    })
    return map
  }, [cart])

  const categories = useMemo(() => {
    const itemCats = new Set()
    menuItems.forEach((item) => {
      if (item.category) itemCats.add(item.category)
    })

    const configured = (currentShop.categories || []).filter((c) =>
      itemCats.has(c),
    )
    const others = Array.from(itemCats).filter(
      (c) => !(currentShop.categories || []).includes(c),
    )

    return [...configured, ...others]
  }, [menuItems, currentShop.categories])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (availableOnly && (!item.isAvailable || item.price == null)) {
        return false
      }

      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const nameMatch = (item.name || '').toLowerCase().includes(query)
        const categoryMatch = (item.category || '')
          .toLowerCase()
          .includes(query)
        if (!nameMatch && !categoryMatch) {
          return false
        }
      }

      return true
    })
  }, [menuItems, availableOnly, selectedCategory, searchQuery])

  const groupedCategories = useMemo(() => {
    if (categories.length === 0) {
      return filteredItems.length > 0
        ? [{ category: 'Menu Items', items: filteredItems }]
        : []
    }

    const groups = []
    categories.forEach((cat) => {
      const items = filteredItems.filter((item) => item.category === cat)
      if (items.length > 0) {
        groups.push({ category: cat, items })
      }
    })

    const uncategorized = filteredItems.filter(
      (item) => !item.category || !categories.includes(item.category),
    )
    if (uncategorized.length > 0) {
      groups.push({ category: 'Other Items', items: uncategorized })
    }

    return groups
  }, [categories, filteredItems])

  return (
    <main className="min-h-full bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
        {/* Navigation back to Dashboard if handler provided */}
        {onBack && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <header className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" size="sm">
                  Campus Dining
                </Badge>
                <Badge
                  variant={shop?.isOpen !== false ? 'success' : 'danger'}
                  size="sm"
                >
                  {shop?.isOpen !== false ? 'Outlet Open' : 'Outlet Closed'}
                </Badge>
                <Badge variant="info" size="sm">
                  {shop?.name || currentShop.name}
                </Badge>
              </div>

              <h1 className="font-serif text-3xl font-bold tracking-tight text-text sm:text-4xl">
                {shop?.name || currentShop.name}
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-text">
                {shop?.description || currentShop.description}
              </p>
            </div>

            {cartItemCount > 0 && (
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-background/50 p-4 shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  🛒
                </div>
                <div>
                  <p className="text-xs text-muted-text">Cart Summary</p>
                  <p className="text-lg font-bold text-primary">
                    ₹{cartTotal}{' '}
                    <span className="text-xs font-normal text-muted-text">
                      ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Outlet Selector / Cards */}
        <section aria-labelledby="outlets-heading" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="outlets-heading"
                className="font-serif text-2xl font-bold tracking-tight text-text"
              >
                Campus Food Outlets
              </h2>
              <p className="text-sm text-muted-text">
                Select an outlet to explore its freshly prepared menu
              </p>
            </div>
            <span className="text-xs text-muted-text">
              {OUTLETS.length} outlets available
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OUTLETS.map((outlet) => {
              const isSelected = activeShopId === outlet.id
              const liveShop = availableShops.find(
                (s) => s.category === outlet.category,
              )
              const isOpen = liveShop ? liveShop.isOpen : true

              return (
                <Card
                  key={outlet.id}
                  as="article"
                  onClick={() => handleSelectOutlet(outlet.id)}
                  className={`flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary shadow-md bg-surface'
                      : 'hover:-translate-y-1 hover:shadow-md hover:border-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                        {outlet.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <Badge variant="info" size="sm">
                            Active
                          </Badge>
                        )}
                        <Badge
                          variant={isOpen ? 'success' : 'danger'}
                          size="sm"
                        >
                          {isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-text">{outlet.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-text">
                      {liveShop?.description || outlet.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectOutlet(outlet.id)
                      }}
                    >
                      {isSelected ? 'Viewing Menu ✓' : 'View Menu →'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Menu Section with Filters and Items */}
        <section aria-labelledby="menu-heading" className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="menu-heading"
                  className="font-serif text-2xl font-bold tracking-tight text-text"
                >
                  {shop?.name || currentShop.name} Menu
                </h2>
                {!loading && (
                  <Badge variant="default" size="sm">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-text">
                Browse categories or search for specific items to order.
              </p>
            </div>

            {/* Search & Availability Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                id="menu-search-input"
                type="search"
                placeholder="Search items (e.g., Dosa, Juice)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                containerClassName="w-full sm:w-64"
              />

              <label className="flex items-center gap-2 text-sm font-medium text-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <span>Available only</span>
              </label>
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'border border-border bg-surface text-text hover:bg-background'
                }`}
              >
                All Items ({menuItems.length})
              </button>

              {categories.map((cat) => {
                const count = menuItems.filter((i) => i.category === cat).length
                const isCatActive = selectedCategory === cat

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex shrink-0 items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isCatActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'border border-border bg-surface text-text hover:bg-background'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Loading Skeleton State */}
          {loading && (
            <div
              role="status"
              aria-label="Loading menu"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-border/60 rounded-md w-3/4"></div>
                      <div className="h-4 bg-border/40 rounded-md w-1/3"></div>
                    </div>
                    <div className="h-5 bg-border/60 rounded-full w-16"></div>
                  </div>
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="h-6 bg-border/60 rounded-md w-14"></div>
                    <div className="h-9 bg-border/60 rounded-xl w-24"></div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <Card className="border-danger/30 bg-danger/5 text-center py-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-2xl text-danger mb-3">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-danger">
                Unable to load menu
              </h3>
              <p className="mt-1 text-sm text-muted-text max-w-md mx-auto">
                {error}
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadTrigger((prev) => prev + 1)}
                >
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State - Outlet has no items in database */}
          {!loading && !error && menuItems.length === 0 && (
            <Card className="text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl mb-4">
                🍽️
              </div>
              <h3 className="text-lg font-bold text-text">
                No Menu Items Available
              </h3>
              <p className="mt-1 text-sm text-muted-text max-w-md mx-auto">
                No menu items are currently listed for this outlet. Please check
                back later or choose another campus outlet.
              </p>
            </Card>
          )}

          {/* Empty State - Filters returned 0 matches */}
          {!loading &&
            !error &&
            menuItems.length > 0 &&
            filteredItems.length === 0 && (
              <Card className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl mb-4">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-text">
                  No Matching Items Found
                </h3>
                <p className="mt-1 text-sm text-muted-text max-w-md mx-auto">
                  {searchQuery
                    ? `We couldn't find any items matching "${searchQuery}".`
                    : 'No items match the selected category or availability filter.'}
                </p>
                <div className="mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setAvailableOnly(false)
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            )}

          {/* Menu Items List (Grouped by Category) */}
          {!loading && !error && groupedCategories.length > 0 && (
            <div className="space-y-10">
              {groupedCategories.map(({ category, items }) => (
                <section key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-xl font-bold text-text">
                      {category}
                    </h3>
                    <Badge variant="default" size="sm">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => {
                      const unavailable =
                        !item.isAvailable || item.price == null
                      const cartItem = cartItemsByMenuId.get(item._id)
                      const isBusy = busyItemId === item._id

                      return (
                        <Card
                          key={item._id}
                          as="article"
                          className="flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-primary/40"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <h4 className="text-base font-bold text-text">
                                  {item.name}
                                </h4>
                                {item.category && (
                                  <Badge variant="default" size="sm">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>

                              <Badge
                                variant={
                                  item.isAvailable ? 'success' : 'danger'
                                }
                                size="sm"
                              >
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                            <div>
                              <span className="text-xs text-muted-text block">
                                Price
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {item.price == null
                                  ? 'Unavailable'
                                  : `₹${item.price}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {cartItem && (
                                <Badge variant="info" size="sm">
                                  In cart: {cartItem.quantity}
                                </Badge>
                              )}

                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                disabled={unavailable || isBusy}
                                loading={isBusy}
                                onClick={() => addToCart(item)}
                                aria-label={`Add ${item.name} to cart`}
                              >
                                {isBusy
                                  ? 'Adding...'
                                  : unavailable
                                    ? 'Unavailable'
                                    : cartItem
                                      ? '+ Add'
                                      : 'Add to Cart'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        {/* Existing Cart Section */}
        <section
          id="cart-section"
          aria-labelledby="cart-heading"
          className="mt-12"
        >
          <Card
            title="Your Order Cart"
            subtitle="Review your selections and adjust quantities before placing an order."
            headerAction={
              <Badge
                variant={cart.length > 0 ? 'success' : 'default'}
                size="md"
              >
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </Badge>
            }
          >
            {actionError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
              >
                {actionError}
              </div>
            )}

            {cartError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
              >
                Cart Error: {cartError}
              </div>
            )}

            {cartLoading && (
              <div className="py-8 text-center text-sm text-muted-text">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
                <p>Loading your cart...</p>
              </div>
            )}

            {!cartLoading && cart.length === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl mb-3">
                  🛒
                </div>
                <h4 className="text-base font-bold text-text">
                  Your cart is empty
                </h4>
                <p className="mt-1 text-xs text-muted-text max-w-sm mx-auto">
                  Add fresh dishes, snacks, or drinks from the menu above to get
                  started.
                </p>
              </div>
            )}

            {!cartLoading && cart.length > 0 && (
              <div className="space-y-4">
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-text truncate">
                            {item.name}
                          </h4>
                          {item.category && (
                            <Badge variant="default" size="sm">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-text">
                          ₹{item.price} each
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="flex items-center rounded-xl border border-border bg-background">
                          <button
                            type="button"
                            disabled={busyItemId === item.id}
                            onClick={() => decreaseQuantity(item)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="flex h-8 w-8 items-center justify-center text-base font-bold text-text transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            −
                          </button>

                          <span className="min-w-10 text-center text-sm font-bold text-text">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={busyItemId === item.id}
                            onClick={() => increaseQuantity(item)}
                            aria-label={`Increase ${item.name} quantity`}
                            className="flex h-8 w-8 items-center justify-center text-base font-bold text-text transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>

                        <div className="min-w-16 text-right font-bold text-primary">
                          ₹{Number(item.price) * item.quantity}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyItemId === item.id}
                          onClick={() => removeFromCart(item)}
                          className="text-danger border-danger/30 hover:bg-danger hover:text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-text block">
                      Total Amount
                    </span>
                    <span className="text-sm font-medium text-text">
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      ₹{cartTotal}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>
    </main>
  )
}

export default Menu
