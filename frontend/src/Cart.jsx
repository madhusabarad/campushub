import { useCallback, useEffect, useMemo, useState } from 'react'
import UPIPaymentForm from './components/UPIPaymentForm'

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
            throw new Error(result.message || 'Your session may have expired. Please log in again.')
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
    const [placingOrder, setPlacingOrder] = useState(false)
    const [placedOrder, setPlacedOrder] = useState(null)
    const [checkoutStage, setCheckoutStage] = useState('cart')

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

    const handlePlaceOrder = async () => {
        if (
            placingOrder ||
            clearing ||
            busyItemId !== null ||
            cartItems.length === 0
        ) {
            return
        }

        setPlacingOrder(true)
        setActionError('')

        try {
            const result = await apiRequest('/api/orders', {
                method: 'POST',
                body: JSON.stringify({}),
            })

            setCartItems([])
            setPlacedOrder(result.data || null)
            setCheckoutStage('payment')
        } catch (err) {
            setActionError(err.message || 'Unable to place your order. Please try again.')
        } finally {
            setPlacingOrder(false)
        }
    }

    const totalItems = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems],
    )

    const totalAmount = useMemo(
        () =>
            cartItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            ),
        [cartItems],
    )

    return (
        <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">
            <header className="border-b border-[#eadfd2] bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-[#8b5e3c]">
                            Checkout
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight">Your Cart</h1>
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

            <div className="mx-auto max-w-6xl px-6 py-10">
                {actionError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {loading && (
                    <div className="flex items-center gap-3 py-16">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
                        <p className="text-sm text-gray-500">Loading your cart…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <h3 className="text-lg font-semibold text-red-700">
                            Failed to load cart
                        </h3>
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                        <button
                            type="button"
                            onClick={loadCart}
                            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && checkoutStage === 'payment' && placedOrder && (
                    <div className="mx-auto max-w-2xl py-4">
                        <UPIPaymentForm
                            order={placedOrder}
                            showCounterOption={true}
                            onSuccess={(finalOrder) => {
                                setPlacedOrder(finalOrder || placedOrder)
                                setCheckoutStage('success')
                            }}
                            onCancel={() => {
                                setCheckoutStage('success')
                            }}
                        />
                    </div>
                )}

                {!loading && !error && checkoutStage === 'success' && placedOrder && (
                    <div className="rounded-2xl border border-[#eadfd2] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1e3d5] text-3xl">
                            🎉
                        </div>
                        <h3 className="text-3xl font-bold text-[#3f2720]">Order Placed Successfully!</h3>
                        <p className="mx-auto mt-2 max-w-lg text-gray-600">
                            Your order has been received by the shop. Please show your order token at the counter for pickup.
                        </p>

                        <div className="mx-auto my-6 inline-block rounded-2xl border-2 border-dashed border-[#7b1e1e] bg-[#fffaf4] px-8 py-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e3c]">
                                Your Order Token
                            </p>
                            <p className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-[#7b1e1e]">
                                {placedOrder.orderToken}
                            </p>
                        </div>

                        {placedOrder.pickupToken && (
                            <div className="mx-auto mb-6 max-w-sm rounded-xl border border-[#eadfd2] bg-[#fbf7f2] p-4 text-center">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#8b5e3c]">
                                    Pickup Token
                                </p>
                                <p className="mt-1 font-mono text-sm font-bold text-[#7b1e1e] break-all">
                                    {placedOrder.pickupToken}
                                </p>
                            </div>
                        )}

                        <div className="mx-auto max-w-sm rounded-xl bg-[#f7f0e6] p-4 text-left text-sm text-gray-700">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Status</span>
                                <span className="font-semibold capitalize text-amber-700">
                                    {placedOrder.status || 'placed'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Total Amount</span>
                                <span className="font-bold text-[#7b1e1e]">
                                    ₹{placedOrder.totalAmount}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Payment</span>
                                <span className="font-semibold text-emerald-800">
                                    {placedOrder.paymentMethod === 'upi'
                                        ? `UPI (${placedOrder.paymentStatus === 'paid' ? 'Paid' : placedOrder.paymentStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}${placedOrder.paymentUtr ? ` - UTR: ${placedOrder.paymentUtr}` : ''})`
                                        : 'Pay at Counter'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setPlacedOrder(null)
                                    setCheckoutStage('cart')
                                    loadCart()
                                }}
                                className="rounded-xl border border-[#7b1e1e] px-6 py-3 font-semibold text-[#7b1e1e] transition hover:bg-[#7b1e1e] hover:text-white"
                            >
                                Order More
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white transition hover:bg-[#641818]"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && checkoutStage === 'cart' && cartItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#d9cabb] bg-[#fffaf4] p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e3d5] text-2xl">
                            🛒
                        </div>
                        <h3 className="text-xl font-bold">Your cart is empty</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Browse campus outlets and add items to your cart.
                        </p>
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 rounded-xl bg-[#7b1e1e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#641818]"
                        >
                            Browse Shops
                        </button>
                    </div>
                )}

                {!loading && !error && checkoutStage === 'cart' && cartItems.length > 0 && (
                    <div className="grid gap-8 lg:grid-cols-3">
                        <section className="lg:col-span-2">
                            <div className="flex items-center justify-between border-b border-[#eadfd2] pb-4">
                                <p className="text-sm font-semibold uppercase tracking-widest text-[#8b5e3c]">
                                    {totalItems} item{totalItems > 1 ? 's' : ''} in cart
                                </p>
                                <button
                                    type="button"
                                    disabled={clearing || placingOrder}
                                    onClick={clearCart}
                                    className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing…' : 'Clear cart'}
                                </button>
                            </div>

                            <div className="mt-4 divide-y divide-[#eadfd2]">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-[#3f2720]">
                                                    {item.name}
                                                </h4>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {item.category} • ₹{item.price} each
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center rounded-xl border border-[#eadfd2] bg-white">
                                                    <button
                                                        type="button"
                                                        disabled={busyItemId === item.id || placingOrder}
                                                        onClick={() => decreaseQuantity(item)}
                                                        className="px-3 py-2 text-lg font-semibold text-[#7b1e1e] hover:bg-[#f7f0e6] disabled:opacity-50"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={busyItemId === item.id || placingOrder}
                                                        onClick={() => increaseQuantity(item)}
                                                        className="px-3 py-2 text-lg font-semibold text-[#7b1e1e] hover:bg-[#f7f0e6] disabled:opacity-50"
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
                                                        disabled={busyItemId === item.id || clearing || placingOrder}
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
                                    disabled={
                                        cartItems.length === 0 ||
                                        placingOrder ||
                                        clearing ||
                                        busyItemId !== null
                                    }
                                    onClick={handlePlaceOrder}
                                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#7b1e1e] px-5 py-3.5 font-semibold text-white transition hover:bg-[#641818] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {placingOrder ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Placing Order...
                                        </span>
                                    ) : (
                                        'Place Order'
                                    )}
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    )
}

export default Cart
