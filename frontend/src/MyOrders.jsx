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
        <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">
            <header className="border-b border-[#eadfd2] bg-[#fffaf4]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-[#7b1e1e]">
                            CampusHub
                        </h1>
                        <p className="text-sm text-gray-500">
                            Your campus, connected
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-xl border border-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-[#7b1e1e] hover:bg-[#7b1e1e] hover:text-white"
                    >
                        ← Dashboard
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#8b5e3c]">
                        Your Activity
                    </p>
                    <h2 className="text-4xl font-bold">My Orders</h2>
                    <p className="mt-3 text-gray-600">
                        View your previous orders and check their status.
                    </p>
                </section>

                {message && (
                    <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
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
                            className="ml-2 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                        Loading your orders...
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="rounded-2xl border border-[#eadfd2] bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mb-4 text-5xl">📦</div>
                      <h3 className="mt-1 font-bold">
                          Order #{index + 1}
                     </h3>
                        <p className="mt-2 text-gray-500">
                            Your placed orders will appear here.
                        </p>
                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white hover:bg-[#641818]"
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
                                className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm"
                            >
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8b5e3c]">
                                            Order ID
                                        </p>
                                        <h3 className="mt-1 font-bold">
                                            Order #{index + 1}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <span className="w-fit rounded-full bg-[#f1e3d5] px-4 py-2 text-sm font-semibold text-[#7b1e1e]">
                                        {formatStatus(order.status)}
                                    </span>
                                </div>

                                <div className="mt-5 border-t border-[#eadfd2] pt-5">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">
                                            Total Amount
                                        </span>
                                        <span className="font-bold text-[#7b1e1e]">
                                            ₹{getTotal(order)}
                                        </span>
                                    </div>

                                    {Array.isArray(order.items) && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-sm font-semibold">
                                                Items
                                            </p>
                                            {order.items.map((item, index) => (
                                                <div
                                                    key={item._id || index}
                                                    className="flex justify-between gap-3 py-1 text-sm text-gray-600"
                                                >
                                                    <span>
                                                        {item.name ||
                                                            item.menuItemId?.name ||
                                                            item.menuItem?.name ||
                                                            'Menu Item'}
                                                        {' × '}
                                                        {item.quantity || 1}
                                                    </span>
                                                    <span>
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
                                            className="mt-5 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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