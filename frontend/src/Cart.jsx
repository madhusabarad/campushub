
import { useCallback, useEffect, useMemo, useState } from 'react'

const getHeaders = () => {
    const token = localStorage.getItem('campushub_token')

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

function Cart({ onBack }) {
    const [cartItems, setCartItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')
    const [busyItemId, setBusyItemId] = useState(null)
    const [clearing, setClearing] = useState(false)

    const loadCart = useCallback(async () => {
        const result = await apiRequest('/api/cart')
        const data = result.data || {}

        const items = (data.items || [])
            .filter((item) => item.menuItemId)
            .map((item) => ({
                id: item._id,
                menuItemId: item.menuItemId._id,
                name: item.menuItemId.name,
                category: item.menuItemId.category || 'Menu Item',
                price: Number(item.price ?? item.menuItemId.price ?? 0),
                quantity: item.quantity,
            }))

        setCartItems(items)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function fetchCart() {
            setLoading(true)
            setError('')

            try {
                await loadCart()
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Unable to load your cart.')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchCart()

        return () => {
            cancelled = true
        }
    }, [loadCart])

    const performAction = async (itemId, action) => {
        setBusyItemId(itemId)
        setActionError('')

        try {
            await action()
            await loadCart()
        } catch (err) {
            setActionError(err.message || 'Unable to update your cart.')
        } finally {
            setBusyItemId(null)
        }
    }

    const increaseQuantity = (item) => {
        performAction(item.id, () =>
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
        performAction(item.id, () => {
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

    const removeItem = (item) => {
        performAction(item.id, () =>
            apiRequest(`/api/cart/item/${item.id}`, {
                method: 'DELETE',
            }),
        )
    }

    const clearCart = async () => {
        setClearing(true)
        setActionError('')

        try {
            await apiRequest('/api/cart', { method: 'DELETE' })
            setCartItems([])
        } catch (err) {
            setActionError(err.message || 'Unable to clear your cart.')
        } finally {
            setClearing(false)
        }
    }

    const totalItems = useMemo(
        () => cartItems.reduce((total, item) => total + item.quantity, 0),
        [cartItems],
    )

    const totalAmount = useMemo(
        () =>
            cartItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            ),
        [cartItems],
    )

    return (
        <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">
            <header className="border-b border-[#eadfd2] bg-[#fffaf4]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-[#7b1e1e]">
                            CampusHub
                        </h1>
                        <p className="text-sm text-gray-500">Your campus, connected</p>
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

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b5e3c]">
                        Your Order
                    </p>
                    <h2 className="text-4xl font-bold">Cart</h2>
                    <p className="mt-3 text-gray-600">
                        Review your selected items before placing your order.
                    </p>
                </section>

                {loading && (
                    <div className="mb-6 rounded-2xl border border-[#eadfd2] bg-white px-6 py-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
                            <p className="text-sm font-medium text-gray-600">
                                Loading your cart...
                            </p>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
                        <p className="font-semibold text-red-700">
                            Unable to load your cart
                        </p>
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true)
                                setError('')
                                try {
                                    await loadCart()
                                } catch (err) {
                                    setError(err.message || 'Unable to load your cart.')
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            className="mt-3 text-sm font-semibold text-red-700 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && cartItems.length === 0 && (
                    <div className="rounded-2xl border border-[#eadfd2] bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1e3d5] text-3xl">
                            🛒
                        </div>
                        <h3 className="text-2xl font-bold">Your cart is empty</h3>
                        <p className="mx-auto mt-2 max-w-md text-gray-500">
                            Add some items from a campus outlet to see them here.
                        </p>
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white transition hover:bg-[#641818]"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {actionError && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {!loading && !error && cartItems.length > 0 && (
                    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                        <section>
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">Selected Items</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={clearing || busyItemId !== null}
                                    onClick={clearCart}
                                    className="text-sm font-semibold text-[#7b1e1e] hover:underline disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing...' : 'Clear Cart'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
                                                    {item.category}
                                                </p>
                                                <h4 className="mt-1 text-xl font-bold">{item.name}</h4>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    ₹{item.price} each
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between gap-6 sm:justify-end">
                                                <div className="flex items-center rounded-xl border border-[#dfd0c1]">
                                                    <button
                                                        type="button"
                                                        disabled={busyItemId === item.id || clearing}
                                                        onClick={() => decreaseQuantity(item)}
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                        className="px-4 py-2 text-lg font-semibold text-[#7b1e1e] hover:bg-[#f7f0e6] disabled:opacity-50"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="min-w-10 text-center font-semibold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={busyItemId === item.id || clearing}
                                                        onClick={() => increaseQuantity(item)}
                                                        aria-label={`Increase ${item.name} quantity`}
                                                        className="px-4 py-2 text-lg font-semibold text-[#7b1e1e] hover:bg-[#f7f0e6] disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="min-w-20 text-right">
                                                    <p className="font-bold">
                                                        ₹{item.price * item.quantity}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        disabled={busyItemId === item.id || clearing}
                                                        onClick={() => removeItem(item)}
                                                        className="mt-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <aside>
                            <div className="sticky top-6 rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm">
                                <h3 className="text-2xl font-bold">Order Summary</h3>

                                <div className="mt-6 space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Items</span>
                                        <span className="font-medium">{totalItems}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">₹{totalAmount}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Service fee</span>
                                        <span className="font-medium">₹0</span>
                                    </div>

                                    <div className="border-t border-[#eadfd2] pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold">Total</span>
                                            <span className="text-lg font-bold text-[#7b1e1e]">
                                                ₹{totalAmount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled
                                    className="mt-6 w-full cursor-not-allowed rounded-xl bg-[#7b1e1e] px-5 py-3.5 font-semibold text-white opacity-70"
                                >
                                    Place Order
                                </button>

                                <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                                    Order placement will be connected to the backend API later.
                                </p>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    )
}

export default Cart
