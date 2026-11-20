import { useCallback, useEffect, useState } from 'react'
import { getMyOrders, cancelOrder } from './api/orderApi'

function MyOrders({ onBack }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [cancellingId, setCancellingId] = useState(null)

    const loadOrders = useCallback(async () => {
        const result = await getMyOrders()
        setOrders(Array.isArray(result.data) ? result.data : [])
    }, [])

    useEffect(() => {
        let active = true

        const fetchOrders = async () => {
            setLoading(true)
            setError('')

            try {
                const result = await getMyOrders()

                if (active) {
                    setOrders(Array.isArray(result.data) ? result.data : [])
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        'Unable to load your orders.'
                    )
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchOrders()

        return () => {
            active = false
        }
    }, [])

    const handleCancel = async (orderId) => {
        const confirmed = window.confirm(
            'Are you sure you want to cancel this order?'
        )

        if (!confirmed) return

        setCancellingId(orderId)
        setError('')
        setMessage('')

        try {
            await cancelOrder(orderId)
            setMessage('Order cancelled successfully.')
            await loadOrders()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to cancel this order.'
            )
        } finally {
            setCancellingId(null)
        }
    }

    const formatDate = (date) => {
        if (!date) return 'Date unavailable'

        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    const formatStatus = (status) => {
        return (status || 'Unknown')
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    }

    const getTotal = (order) => {
        return order.totalAmount ??
            order.totalPrice ??
            order.total ??
            0
    }

    return (
        <main className="min-h-screen bg-background text-text">
            <header className="border-b border-border bg-surface">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">
                            CampusHub
                        </h1>
                        <p className="text-sm text-muted-text">
                            Your campus, connected
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition cursor-pointer"
                    >
                        ← Dashboard
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                        Your Activity
                    </p>
                    <h2 className="text-4xl font-bold text-text">My Orders</h2>
                    <p className="mt-3 text-muted-text">
                        View your previous orders and check their status.
                    </p>
                </section>

                {message && (
                    <div className="mb-5 rounded-xl border border-green-300 bg-green-50 px-5 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true)
                                setError('')
                                try {
                                    await loadOrders()
                                } catch (err) {
                                    setError(err.message || 'Unable to load orders.')
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            className="ml-2 font-semibold underline cursor-pointer"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm text-muted-text">
                        Loading your orders...
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
                        <div className="mb-4 text-5xl">📦</div>
                        <h3 className="mt-1 font-bold text-text text-xl">
                            No orders placed yet
                        </h3>
                        <p className="mt-2 text-muted-text">
                            Your placed orders will appear here.
                        </p>
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition cursor-pointer"
                        >
                            Explore CampusHub
                        </button>
                    </div>
                )}

                {!loading && orders.length > 0 && (
                    <div className="space-y-5">
                        {orders.map((order, index) => (
                            <article
                                key={order._id}
                                className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
                            >
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                                            Order ID
                                        </p>
                                        <h3 className="mt-1 font-bold text-text text-lg">
                                            Order #{index + 1}
                                        </h3>
                                        <p className="mt-2 text-sm text-muted-text">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <span className="w-fit rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary">
                                        {formatStatus(order.status)}
                                    </span>
                                </div>

                                <div className="mt-5 border-t border-border pt-5">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-text">
                                            Total Amount
                                        </span>
                                        <span className="font-bold text-primary text-lg">
                                            ₹{getTotal(order)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4 mt-2">
                                        <span className="text-muted-text">
                                            Payment
                                        </span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                            order.paymentStatus === 'paid'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800'
                                                : order.paymentStatus === 'rejected'
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border dark:border-amber-800'
                                        }`}>
                                            {order.paymentMethod === 'upi'
                                                ? (order.paymentStatus === 'paid' ? 'Paid ✓' : order.paymentStatus === 'rejected' ? `Rejected: ${order.paymentRejectReason || ''}` : 'UPI Pending Verification')
                                                : 'Pay at Counter'}
                                        </span>
                                    </div>

                                    {Array.isArray(order.items) && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-sm font-semibold text-text">
                                                Items
                                            </p>
                                            {order.items.map((item, itemIdx) => (
                                                <div
                                                    key={item._id || itemIdx}
                                                    className="flex justify-between gap-3 py-1 text-sm text-muted-text"
                                                >
                                                    <span>
                                                        {item.name ||
                                                            item.menuItemId?.name ||
                                                            item.menuItem?.name ||
                                                            'Menu Item'}
                                                        {' × '}
                                                        {item.quantity || 1}
                                                    </span>
                                                    <span className="font-medium text-text">
                                                        ₹{item.price ?? item.subtotal ?? 0}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {order.status === 'placed' && (
                                        <button
                                            type="button"
                                            disabled={cancellingId === order._id}
                                            onClick={() => handleCancel(order._id)}
                                            className="mt-5 rounded-xl border border-red-300 dark:border-red-800 px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50 cursor-pointer"
                                        >
                                            {cancellingId === order._id
                                                ? 'Cancelling...'
                                                : 'Cancel Order'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

export default MyOrders