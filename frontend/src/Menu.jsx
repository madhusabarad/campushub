
import { useCallback, useEffect, useMemo, useState } from 'react'

const SHOP_CONFIG = {
    '1': {
        category: 'canteen',
        name: 'Campus Canteen',
        description:
            'Browse the available food and beverages from the campus canteen.',
        categories: ['Food', 'Juice', 'Milk Shakes', 'Beverages'],
    },
    '2': {
        category: 'foodcourt',
        name: 'Akshay Food Court',
        description:
            'Explore the food, snacks, beverages and other items available at Akshay Food Court.',
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
    '3': {
        category: 'bakery',
        name: 'Campus Bakery',
        description:
            'Browse snacks, bakery items, burgers and refreshments from the campus bakery.',
        categories: ['Bakery'],
    },
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

function Menu({ shopId, onBack }) {
    const currentShop = SHOP_CONFIG[shopId] || SHOP_CONFIG['1']

    const [shop, setShop] = useState(null)
    const [menuItems, setMenuItems] = useState([])
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(true)
    const [cartLoading, setCartLoading] = useState(true)
    const [error, setError] = useState('')
    const [cartError, setCartError] = useState('')
    const [actionError, setActionError] = useState('')
    const [busyItemId, setBusyItemId] = useState(null)

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
                const result = await apiRequest('/api/shops')
                const shops = result.data || []

                const matchedShop = shops.find(
                    (item) => item.category === currentShop.category,
                )

                if (!matchedShop) {
                    throw new Error(
                        `${currentShop.name} was not found. Please check the backend menu data.`,
                    )
                }

                const menuResult = await apiRequest(
                    `/api/shops/${matchedShop._id}/menu`,
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
    }, [currentShop.category, currentShop.name])

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

    return (
        <main className="min-h-screen bg-[#f5efe7] text-[#342c29]">
            <header className="border-b border-[#d8c9ba] bg-[#fbf8f3]">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <p className="text-lg font-semibold text-[#641f2b]">CampusHub</p>
                    <p className="text-xs text-[#766d63]">{currentShop.name}</p>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-6 text-sm font-medium text-[#641f2b]"
                >
                    ← Back to Dashboard
                </button>

                <section className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                        Menu
                    </p>

                    <h1 className="font-serif text-3xl font-semibold text-[#342c29] sm:text-4xl">
                        {shop?.name || currentShop.name}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766d63]">
                        {currentShop.description}
                    </p>
                </section>

                {loading && (
                    <p className="py-8 text-sm text-[#766d63]">Loading menu...</p>
                )}

                {!loading && error && (
                    <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-3 font-semibold underline"
                        >
                            Reload page
                        </button>
                    </div>
                )}

                {!loading && !error && menuItems.length === 0 && (
                    <p className="py-8 text-sm text-[#766d63]">
                        No menu items are available for this outlet.
                    </p>
                )}

                {!loading && !error && (
                    <div className="space-y-10">
                        {currentShop.categories.map((category) => {
                            const categoryItems = menuItems.filter(
                                (item) => item.category === category,
                            )

                            if (categoryItems.length === 0) return null

                            return (
                                <section key={category}>
                                    <h2 className="mb-4 text-xl font-semibold text-[#641f2b]">
                                        {category}
                                    </h2>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {categoryItems.map((item) => {
                                            const unavailable =
                                                !item.isAvailable || item.price == null

                                            return (
                                                <article
                                                    key={item._id}
                                                    className="border border-[#d8c9ba] bg-[#fbf8f3] p-5"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-[#342c29]">
                                                                {item.name}
                                                            </h3>

                                                            <p className="mt-1 text-sm text-[#766d63]">
                                                                {item.price == null
                                                                    ? 'Price unavailable'
                                                                    : item.isAvailable
                                                                        ? 'Available'
                                                                        : 'Unavailable'}
                                                            </p>
                                                        </div>

                                                        <p className="text-base font-semibold text-[#641f2b]">
                                                            {item.price == null
                                                                ? 'Price unavailable'
                                                                : `₹${item.price}`}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={unavailable || busyItemId === item._id}
                                                        onClick={() => addToCart(item)}
                                                        className="mt-4 text-sm font-medium text-[#641f2b] disabled:cursor-not-allowed disabled:text-[#a8a099]"
                                                    >
                                                        {busyItemId === item._id
                                                            ? 'Adding...'
                                                            : unavailable
                                                                ? 'Unavailable'
                                                                : 'Add to Cart'}
                                                    </button>
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                )}

                {actionError && (
                    <p
                        role="alert"
                        className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {actionError}
                    </p>
                )}

                {cartError && (
                    <p
                        role="alert"
                        className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        Cart: {cartError}
                    </p>
                )}

                {cartLoading && (
                    <p className="mt-8 text-sm text-[#766d63]">Loading your cart...</p>
                )}

                {!cartLoading && cart.length > 0 && (
                    <section className="mt-12 border border-[#d8c9ba] bg-[#fbf8f3] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a55]">
                                    Cart
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold text-[#342c29]">
                                    Your Cart
                                </h2>
                            </div>

                            <p className="text-sm text-[#766d63]">
                                {cartItemCount} item(s)
                            </p>
                        </div>

                        <div className="mt-6 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-4 border-b border-[#e2d7ca] pb-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold text-[#342c29]">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-[#766d63]">
                                            ₹{item.price} each
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border border-[#d8c9ba]">
                                            <button
                                                type="button"
                                                disabled={busyItemId === item.id}
                                                onClick={() => decreaseQuantity(item)}
                                                aria-label={`Decrease ${item.name} quantity`}
                                                className="px-3 py-2 text-lg text-[#641f2b] hover:bg-[#f5efe7] disabled:opacity-50"
                                            >
                                                −
                                            </button>

                                            <span className="min-w-10 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                disabled={busyItemId === item.id}
                                                onClick={() => increaseQuantity(item)}
                                                aria-label={`Increase ${item.name} quantity`}
                                                className="px-3 py-2 text-lg text-[#641f2b] hover:bg-[#f5efe7] disabled:opacity-50"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="min-w-16 text-right font-semibold text-[#641f2b]">
                                            ₹{Number(item.price) * item.quantity}
                                        </p>

                                        <button
                                            type="button"
                                            disabled={busyItemId === item.id}
                                            onClick={() => removeFromCart(item)}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-[#d8c9ba] pt-5">
                            <p className="font-semibold text-[#342c29]">Total</p>
                            <p className="text-xl font-semibold text-[#641f2b]">
                                ₹{cartTotal}
                            </p>
                        </div>
                    </section>
                )}

                {!cartLoading && cart.length === 0 && !cartError && (
                    <p className="mt-8 text-sm text-[#766d63]">
                        Your cart is empty. Add an item to get started.
                    </p>
                )}
            </div>
        </main>
    )
}

export default Menu
