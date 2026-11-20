import { useEffect, useState } from 'react'

const SHOP_ICONS = {
    canteen: '🍽️',
    foodcourt: '🍛',
    bakery: '🥐',
    xerox: '🖨️',
}

const getHeaders = () => {
    const token = localStorage.getItem('campushub_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function apiGet(url) {
    const res = await fetch(url, { headers: getHeaders() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Request failed')
    }
    return data
}

function ShopCard({ shop, onOpenMenu }) {
    return (
        <button
            type="button"
            onClick={() => onOpenMenu(shop._id)}
            className="group rounded-2xl border border-[#eadfd2] bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7e7d5] text-2xl">
                {SHOP_ICONS[shop.category] || '🏪'}
            </div>

            <div className="flex items-start justify-between gap-2">
                <h4 className="text-xl font-bold text-[#3f2720]">{shop.name}</h4>
                <span
                    className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${shop.isOpen
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    {shop.isOpen ? 'Open' : 'Closed'}
                </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-500">
                {shop.description || `Browse items from ${shop.name}.`}
            </p>

            <span className="mt-5 inline-block text-sm font-semibold text-[#7b1e1e] group-hover:underline">
                View Menu →
            </span>
        </button>
    )
}

const STATUS_COLORS = {
    placed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-amber-100 text-amber-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
}

function RecentOrders({ orders, loading, error, onRetry }) {
    if (loading) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd2] bg-white px-6 py-8 shadow-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
                <p className="text-sm text-gray-500">Loading your orders…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
                <p className="text-sm font-semibold text-red-700">Unable to load orders</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 text-sm font-semibold text-red-700 underline"
                >
                    Try again
                </button>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-[#d9cabb] bg-[#fffaf4] px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e3d5] text-2xl">
                    🛍️
                </div>
                <h4 className="text-lg font-semibold">No recent orders</h4>
                <p className="mt-2 text-sm text-gray-500">
                    Your orders will appear here once you place them.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <div
                    key={order._id}
                    className="rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
                                {order.shopId?.name || 'Campus Shop'}
                            </p>
                            <p className="mt-1 font-semibold text-[#3f2720]">
                                {order.orderToken}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {order.items
                                    ?.map((item) => `${item.name} × ${item.quantity}`)
                                    .join(', ')}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {order.status}
                            </span>
                            <span className="font-bold text-[#7b1e1e]">
                                ₹{order.totalAmount}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function Dashboard({ onOpenMenu, onOpenCart, onOpenOrders, onOpenXerox, onLogout, userRole = 'student', userName = '' }) {
    const [shops, setShops] = useState([])
    const [shopsLoading, setShopsLoading] = useState(true)
    const [shopsError, setShopsError] = useState('')

    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(userRole === 'student')
    const [ordersError, setOrdersError] = useState('')

    async function fetchShops() {
        setShopsLoading(true)
        setShopsError('')
        try {
            const data = await apiGet('/api/shops')
            setShops(data.data || [])
        } catch (err) {
            setShopsError(err.message || 'Unable to load shops.')
        } finally {
            setShopsLoading(false)
        }
    }

    async function fetchOrders() {
        if (userRole !== 'student') {
            setOrdersLoading(false)
            return
        }
        setOrdersLoading(true)
        setOrdersError('')
        try {
            const data = await apiGet('/api/orders?limit=5')
            setOrders(data.data || [])
        } catch (err) {
            setOrdersError(err.message || 'Unable to load orders.')
        } finally {
            setOrdersLoading(false)
        }
    }

    useEffect(() => {
        let ignore = false

        apiGet('/api/shops')
            .then((data) => {
                if (!ignore) {
                    setShops(data.data || [])
                    setShopsLoading(false)
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setShopsError(err.message || 'Unable to load shops.')
                    setShopsLoading(false)
                }
            })

        if (userRole === 'student') {
            apiGet('/api/orders?limit=5')
                .then((data) => {
                    if (!ignore) {
                        setOrders(data.data || [])
                        setOrdersLoading(false)
                    }
                })
                .catch((err) => {
                    if (!ignore) {
                        setOrdersError(err.message || 'Unable to load orders.')
                        setOrdersLoading(false)
                    }
                })
        }

        return () => {
            ignore = true
        }
    }, [userRole])

    return (
        <main className="min-h-screen bg-[#f7f0e6] text-[#3f2720]">
            <header className="border-b border-[#eadfd2] bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-[#8b5e3c]">
                            Student Portal
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight">
                            CampusHub
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {userRole === 'student' && onOpenOrders && (
                            <button
                                type="button"
                                onClick={onOpenOrders}
                                className="rounded-xl border border-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-[#7b1e1e] transition hover:bg-[#7b1e1e] hover:text-white"
                            >
                                My Orders
                            </button>
                        )}

                        {userRole === 'student' && (
                            <button
                                type="button"
                                onClick={onOpenCart}
                                className="rounded-xl border border-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-[#7b1e1e] transition hover:bg-[#7b1e1e] hover:text-white"
                            >
                                Cart
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-xl bg-[#7b1e1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#641818]"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-10">

                {/* Hero section */}
                <section className="mb-10">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#8b5e3c]">
                        Dashboard
                    </p>
                    <h2 className="mt-1 text-3xl font-bold md:text-4xl">
                        Welcome{userName ? `, ${userName}` : ''}!
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Explore campus outlets and manage your campus activities from one place.
                    </p>
                </section>

                {/* Campus Shops */}
                <section className="mb-12">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold">Campus Shops</h3>
                        <p className="mt-1 text-gray-500">
                            Browse and order from campus outlets.
                        </p>
                    </div>

                    {shopsLoading && (
                        <div className="flex items-center gap-3 py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#eadfd2] border-t-[#7b1e1e]" />
                            <p className="text-sm text-gray-500">Loading shops…</p>
                        </div>
                    )}

                    {!shopsLoading && shopsError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
                            <p className="text-sm font-semibold text-red-700">Unable to load shops</p>
                            <p className="mt-1 text-sm text-red-600">{shopsError}</p>
                            <button
                                type="button"
                                onClick={fetchShops}
                                className="mt-3 text-sm font-semibold text-red-700 underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!shopsLoading && !shopsError && shops.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#d9cabb] bg-[#fffaf4] px-6 py-12 text-center">
                            <p className="text-sm text-gray-500">No shops are currently available.</p>
                        </div>
                    )}

                    {!shopsLoading && !shopsError && shops.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-3">
                            {shops.map((shop) => (
                                <ShopCard
                                    key={shop._id}
                                    shop={shop}
                                    onOpenMenu={onOpenMenu}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Xerox Service Promo Banner */}
                <section className="mb-12">
                    <div className="rounded-2xl border border-[#eadfd2] bg-white p-7 shadow-sm">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
                                    Campus Service
                                </p>
                                <h3 className="mt-2 text-2xl font-bold">
                                    Xerox &amp; Printing
                                </h3>
                                <p className="mt-2 max-w-2xl text-gray-500">
                                    Access printing and Xerox services available around your campus.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onOpenXerox}
                                className="rounded-xl bg-[#7b1e1e] px-6 py-3 font-semibold text-white transition hover:bg-[#641818]"
                            >
                                Explore Service
                            </button>
                        </div>
                    </div>
                </section>

                {/* Recent Orders — students only */}
                {userRole === 'student' && (
                    <section>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold">Recent Orders</h3>
                            <p className="mt-1 text-gray-500">
                                Your five most recent campus orders.
                            </p>
                        </div>

                        <RecentOrders
                            orders={orders}
                            loading={ordersLoading}
                            error={ordersError}
                            onRetry={fetchOrders}
                        />
                    </section>
                )}

            </div>
        </main>
    )
}

export default Dashboard
