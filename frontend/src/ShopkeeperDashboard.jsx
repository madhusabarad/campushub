import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './components/ThemeToggle'

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

async function fetchShopkeeperData() {
    const [incomingResult, shopsResult] = await Promise.all([
        apiRequest('/api/orders/shop/incoming?limit=100'),
        apiRequest('/api/shops?limit=100').catch(() => ({ data: [] })),
    ])

    const incomingOrders = incomingResult.data || []
    const currentShopName = incomingResult.shop || ''
    let isOpen = null

    if (Array.isArray(shopsResult.data) && currentShopName) {
        const matchedShop = shopsResult.data.find(
            (shop) => shop.name === currentShopName,
        )
        if (matchedShop) {
            isOpen = Boolean(matchedShop.isOpen)
        }
    }

    return {
        orders: incomingOrders,
        shopName: currentShopName,
        shopIsOpen: isOpen,
    }
}

const statusBadgeStyles = {
    placed: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    preparing: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    ready: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    completed: 'bg-gray-100 dark:bg-surface-muted text-gray-700 dark:text-muted-text border-gray-300 dark:border-border',
    cancelled: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
}

const nextTransitionConfig = {
    placed: {
        nextStatus: 'preparing',
        buttonLabel: 'Accept & Prepare',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    preparing: {
        nextStatus: 'ready',
        buttonLabel: 'Mark Ready',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    ready: {
        nextStatus: 'completed',
        buttonLabel: 'Mark Completed',
        buttonClass: 'bg-primary hover:bg-primary-hover text-white',
    },
}

function ShopkeeperDashboard({ onLogout }) {
    const [orders, setOrders] = useState([])
    const [shopName, setShopName] = useState('')
    const [shopIsOpen, setShopIsOpen] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [actionMessage, setActionMessage] = useState('')
    const [actionError, setActionError] = useState('')
    const [updatingOrderId, setUpdatingOrderId] = useState(null)
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')

    useEffect(() => {
        let ignore = false

        fetchShopkeeperData()
            .then((result) => {
                if (!ignore) {
                    setOrders(result.orders)
                    setShopName(result.shopName)
                    setShopIsOpen(result.shopIsOpen)
                    setLoading(false)
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(err.message || 'Unable to load incoming orders.')
                    setLoading(false)
                }
            })

        return () => {
            ignore = true
        }
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        setError('')
        setActionError('')
        try {
            const result = await fetchShopkeeperData()
            setOrders(result.orders)
            setShopName(result.shopName)
            setShopIsOpen(result.shopIsOpen)
        } catch (err) {
            setError(err.message || 'Unable to refresh incoming orders.')
        } finally {
            setRefreshing(false)
        }
    }

    const handleUpdateStatus = async (orderId, targetStatus, orderToken) => {
        setUpdatingOrderId(orderId)
        setActionError('')
        setActionMessage('')

        try {
            const result = await apiRequest(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: targetStatus }),
            })

            setActionMessage(
                result.message ||
                `Order ${orderToken || ''} updated to "${targetStatus}".`,
            )
            const refreshed = await fetchShopkeeperData()
            setOrders(refreshed.orders)
            setShopName(refreshed.shopName)
            setShopIsOpen(refreshed.shopIsOpen)
        } catch (err) {
            setActionError(err.message || 'Failed to update order status.')
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const handleUpdatePayment = async (orderId, action) => {
        let reason = ''
        if (action === 'reject') {
            reason = window.prompt('Please enter rejection reason (e.g., Invalid screenshot or UTR mismatch):')
            if (reason === null) return
            if (!reason.trim()) reason = 'Invalid payment proof'
        }

        setActionError('')
        setActionMessage('')

        try {
            const result = await apiRequest(`/api/orders/${orderId}/payment`, {
                method: 'PATCH',
                body: JSON.stringify({ action, reason }),
            })
            setActionMessage(result.message || `Payment ${action === 'confirm' ? 'confirmed' : 'rejected'}.`)
            const refreshed = await fetchShopkeeperData()
            setOrders(refreshed.orders)
        } catch (err) {
            setActionError(err.message || 'Failed to update payment status.')
        }
    }

    const orderCounts = useMemo(() => {
        const counts = {
            placed: 0,
            preparing: 0,
            ready: 0,
            completed: 0,
            total: orders.length,
        }

        for (const order of orders) {
            if (counts[order.status] !== undefined) {
                counts[order.status] += 1
            }
        }

        return counts
    }, [orders])

    const filteredOrders = useMemo(() => {
        if (selectedStatusFilter === 'all') {
            return orders
        }
        return orders.filter((order) => order.status === selectedStatusFilter)
    }, [orders, selectedStatusFilter])

    return (
        <main className="min-h-screen bg-background text-text">
            {/* Header */}
            <header className="border-b border-border bg-surface">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">
                            CampusHub
                        </h1>
                        <p className="text-sm text-muted-text">
                            Shopkeeper Portal
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-hover disabled:opacity-50"
                        >
                            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                            {refreshing ? 'Refreshing...' : 'Refresh Orders'}
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Shop Information & Greeting */}
                <section className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                                Shopkeeper Dashboard
                            </p>
                            <h2 className="text-4xl font-bold text-text">
                                {shopName || 'Assigned Shop'}
                            </h2>
                            <p className="mt-2 text-muted-text">
                                Manage incoming student orders, preparation stages, and pickup handoffs.
                            </p>
                        </div>

                        {shopIsOpen !== null && (
                            <div className="self-start sm:self-auto">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
                                        shopIsOpen
                                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                            : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                                    }`}
                                >
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            shopIsOpen ? 'bg-emerald-600' : 'bg-rose-600'
                                        }`}
                                    />
                                    {shopIsOpen ? 'Shop is Open' : 'Shop is Closed'}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Notifications & Error Alerts */}
                {actionMessage && (
                    <div
                        role="status"
                        className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3 text-sm text-emerald-800 dark:text-emerald-300"
                    >
                        <span>✓ {actionMessage}</span>
                        <button
                            type="button"
                            onClick={() => setActionMessage('')}
                            className="ml-3 font-bold hover:underline"
                        >
                            ×
                        </button>
                    </div>
                )}

                {actionError && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center justify-between rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-5 py-3 text-sm text-red-700 dark:text-red-300"
                    >
                        <span>⚠ {actionError}</span>
                        <button
                            type="button"
                            onClick={() => setActionError('')}
                            className="ml-3 font-bold hover:underline"
                        >
                            ×
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-6 py-5">
                        <p className="font-semibold text-red-700 dark:text-red-300">
                            Unable to load orders
                        </p>
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Order Summary Metric Cards */}
                <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('placed')}
                        className={`rounded-2xl border p-5 text-left shadow-sm transition hover:scale-[1.02] ${
                            selectedStatusFilter === 'placed'
                                ? 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300 dark:ring-amber-800'
                                : 'border-border bg-surface text-text hover:bg-surface-hover'
                        }`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Placed Orders
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-text">
                            {orderCounts.placed}
                        </p>
                        <p className="mt-1 text-xs text-muted-text">Awaiting acceptance</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('preparing')}
                        className={`rounded-2xl border p-5 text-left shadow-sm transition hover:scale-[1.02] ${
                            selectedStatusFilter === 'preparing'
                                ? 'border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-300 dark:ring-blue-800'
                                : 'border-border bg-surface text-text hover:bg-surface-hover'
                        }`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                            In Preparation
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-text">
                            {orderCounts.preparing}
                        </p>
                        <p className="mt-1 text-xs text-muted-text">Currently being made</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('ready')}
                        className={`rounded-2xl border p-5 text-left shadow-sm transition hover:scale-[1.02] ${
                            selectedStatusFilter === 'ready'
                                ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-300 dark:ring-emerald-800'
                                : 'border-border bg-surface text-text hover:bg-surface-hover'
                        }`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Ready for Pickup
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-text">
                            {orderCounts.ready}
                        </p>
                        <p className="mt-1 text-xs text-muted-text">Awaiting student collection</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('completed')}
                        className={`rounded-2xl border p-5 text-left shadow-sm transition hover:scale-[1.02] ${
                            selectedStatusFilter === 'completed'
                                ? 'border-gray-400 dark:border-border bg-gray-100 dark:bg-surface-muted ring-2 ring-gray-300 dark:ring-border'
                                : 'border-border bg-surface text-text hover:bg-surface-hover'
                        }`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Completed
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-text">
                            {orderCounts.completed}
                        </p>
                        <p className="mt-1 text-xs text-muted-text">Fulfilled orders</p>
                    </button>
                </section>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'placed', 'preparing', 'ready', 'completed'].map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setSelectedStatusFilter(filter)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                                    selectedStatusFilter === filter
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-surface border border-border text-muted-text hover:bg-surface-hover hover:text-text'
                                }`}
                            >
                                {filter === 'all' ? `All Orders (${orderCounts.total})` : `${filter} (${orderCounts[filter] ?? 0})`}
                            </button>
                        ))}
                    </div>

                    <p className="text-sm font-medium text-muted-text">
                        Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
                        <p className="text-base font-semibold text-muted-text">
                            Loading incoming orders...
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredOrders.length === 0 && (
                    <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-3xl">
                            📋
                        </div>
                        <h3 className="text-2xl font-bold text-text">No orders found</h3>
                        <p className="mx-auto mt-2 max-w-md text-muted-text">
                            {selectedStatusFilter === 'all'
                                ? 'No orders have been placed for this shop yet.'
                                : `There are currently no orders with status "${selectedStatusFilter}".`}
                        </p>
                        {selectedStatusFilter !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setSelectedStatusFilter('all')}
                                className="mt-5 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                            >
                                View all orders
                            </button>
                        )}
                    </div>
                )}

                {/* Orders List */}
                {!loading && !error && filteredOrders.length > 0 && (
                    <div className="space-y-6">
                        {filteredOrders.map((order) => {
                            const config = nextTransitionConfig[order.status]
                            const isUpdating = updatingOrderId === order._id

                            return (
                                <article
                                    key={order._id}
                                    className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md"
                                >
                                    {/* Order Header */}
                                    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-xl border border-dashed border-primary bg-primary/10 px-3.5 py-1.5 font-mono text-lg font-bold text-primary">
                                                {order.orderToken || order._id}
                                            </span>

                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                                    statusBadgeStyles[order.status] || 'bg-surface-muted text-muted-text border-border'
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="text-xs text-muted-text">
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleString([], {
                                                      dateStyle: 'medium',
                                                      timeStyle: 'short',
                                                  })
                                                : ''}
                                        </div>
                                    </div>

                                    {/* Customer & Payment Info */}
                                    <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                                                Customer
                                            </p>
                                            <p className="mt-1 font-semibold text-text">
                                                {order.userId?.name || 'Student'}
                                            </p>
                                            {order.userId?.email && (
                                                <p className="text-xs text-muted-text">
                                                    {order.userId.email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                                                Payment Method
                                            </p>
                                            <p className="mt-1 font-semibold capitalize text-text">
                                                {order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                                                Payment Status
                                            </p>
                                            <span
                                                className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                                                    order.paymentStatus === 'paid'
                                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                                        : order.paymentStatus === 'rejected'
                                                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                                                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                                }`}
                                            >
                                                {order.paymentStatus === 'pending_verification'
                                                    ? 'Pending Verification'
                                                    : order.paymentStatus || 'unpaid'}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                                                Total Amount
                                            </p>
                                            <p className="mt-1 text-xl font-extrabold text-primary">
                                                ₹{order.totalAmount}
                                            </p>
                                        </div>
                                    </div>

                                    {order.paymentMethod === 'upi' && (
                                        <div className="mb-4 rounded-xl border border-border bg-surface-muted/40 p-4 text-xs">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <span className="font-bold text-secondary">UPI UTR:</span>{' '}
                                                    <span className="font-mono font-semibold text-text">{order.paymentUtr || 'Not provided'}</span>
                                                    {order.paymentRejectReason && (
                                                        <p className="mt-1 font-medium text-rose-600 dark:text-rose-400">Rejection Reason: {order.paymentRejectReason}</p>
                                                    )}
                                                </div>
                                                {order.paymentProof && (
                                                    <a
                                                        href={order.paymentProof}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-primary hover:underline"
                                                    >
                                                        View Payment Screenshot ↗
                                                    </a>
                                                )}
                                            </div>

                                            {order.paymentStatus === 'pending_verification' && (
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdatePayment(order._id, 'confirm')}
                                                        className="rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800 text-xs"
                                                    >
                                                        Confirm Payment
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdatePayment(order._id, 'reject')}
                                                        className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white hover:bg-rose-800 text-xs"
                                                    >
                                                        Reject Payment
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Ordered Items Breakdown */}
                                    <div className="rounded-xl bg-surface-muted/30 border border-border/50 p-4">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
                                            Items ({order.items?.length || 0})
                                        </p>
                                        <div className="divide-y divide-border">
                                            {(order.items || []).map((item, idx) => (
                                                <div
                                                    key={item._id || idx}
                                                    className="flex items-center justify-between py-2 text-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-text">
                                                            {item.name}
                                                        </span>
                                                        <span className="rounded bg-surface border border-border px-2 py-0.5 text-xs font-bold text-muted-text">
                                                            × {item.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="font-medium text-muted-text">
                                                        ₹{item.price} each ={' '}
                                                        <span className="font-bold text-text">
                                                            ₹{item.price * item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Transition Action */}
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                                        <div className="text-xs text-muted-text">
                                            Status advances in order: Placed → Preparing → Ready → Completed
                                        </div>

                                        <div>
                                            {config ? (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating || updatingOrderId !== null}
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            order._id,
                                                            config.nextStatus,
                                                            order.orderToken,
                                                        )
                                                    }
                                                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClass}`}
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        config.buttonLabel
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-text">
                                                    ✓ Final State
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}

export default ShopkeeperDashboard
