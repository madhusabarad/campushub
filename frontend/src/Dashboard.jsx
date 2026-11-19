import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from './components/Card'
import Button from './components/Button'
import Badge from './components/Badge'
import OrderStatusBadge from './components/OrderStatusBadge'
import OrderStatusTimeline from './components/OrderStatusTimeline'
import QRPickupCard from './components/QRPickupCard'
import UPIPaymentModal from './components/UPIPaymentModal'
import { useOrderNotifications } from './context/OrderNotificationContext'

function Dashboard({
  onOpenMenu = () => {},
  onOpenCart = () => {},
  onLogout = () => {},
}) {
  const [localOrders, setLocalOrders] = useState([])
  const [loadingLocalOrders, setLoadingLocalOrders] = useState(true)
  const [orderFilter, setOrderFilter] = useState('all') // 'all' | 'active' | 'completed'
  const [selectedQrOrder, setSelectedQrOrder] = useState(null)
  const [paymentModalOrder, setPaymentModalOrder] = useState(null)

  let contextOrders = null
  let contextLoading = null
  let refreshOrders = null
  let selectedOrderId = null

  try {
    const ctx = useOrderNotifications()
    contextOrders = ctx.orders
    contextLoading = ctx.loadingOrders
    refreshOrders = ctx.refreshOrders
    selectedOrderId = ctx.selectedOrderId
  } catch {
    // fallback if outside provider
  }

  const orders = contextOrders !== null ? contextOrders : localOrders
  const loadingOrders = contextLoading !== null ? contextLoading : loadingLocalOrders

  const [refreshTick, setRefreshTick] = useState(0)

  const triggerLocalRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
  }, [])

  useEffect(() => {
    if (contextOrders !== null) return // Already handled by context

    let ignore = false

    async function loadOrders() {
      try {
        const token = localStorage.getItem('campushub_token')
        if (!token) {
          if (!ignore) setLoadingLocalOrders(false)
          return
        }

        const [ordersRes, shopsRes] = await Promise.all([
          fetch('/api/orders?limit=10', {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('/api/shops?limit=100').catch(() => null),
        ])

        if (!ignore) {
          if (ordersRes.ok) {
            const ordersResult = await ordersRes.json()
            let shopsMap = new Map()
            if (shopsRes && shopsRes.ok) {
              const shopsData = await shopsRes.json().catch(() => ({}))
              if (Array.isArray(shopsData.data)) {
                shopsMap = new Map(shopsData.data.map((s) => [String(s._id), s]))
              }
            }

            const rawList = Array.isArray(ordersResult.data) ? ordersResult.data : []
            const orderList = rawList.map((order) => {
              const shopId = order.shopId?._id || order.shopId
              const fullShop = shopId ? shopsMap.get(String(shopId)) : null
              return {
                ...order,
                shop: fullShop || order.shopId,
                shopId: {
                  ...(typeof order.shopId === 'object' ? order.shopId : {}),
                  ...(fullShop || {}),
                },
              }
            })
            setLocalOrders(orderList)
          } else {
            setLocalOrders([])
          }
          setLoadingLocalOrders(false)
        }
      } catch {
        if (!ignore) {
          setLocalOrders([])
          setLoadingLocalOrders(false)
        }
      }
    }

    loadOrders()

    return () => {
      ignore = true
    }
  }, [contextOrders, refreshTick])

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'active') {
      return orders.filter((o) =>
        ['placed', 'confirmed', 'preparing', 'ready'].includes((o.status || '').toLowerCase())
      )
    }
    if (orderFilter === 'completed') {
      return orders.filter((o) =>
        ['completed', 'cancelled'].includes((o.status || '').toLowerCase())
      )
    }
    return orders
  }, [orders, orderFilter])

  const activeOrdersCount = useMemo(
    () =>
      orders.filter((o) =>
        ['placed', 'confirmed', 'preparing', 'ready'].includes((o.status || '').toLowerCase())
      ).length,
    [orders]
  )

  return (
    <main className="min-h-full bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome / Header Section */}
        <header className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" size="sm">
                  Student Dashboard
                </Badge>
                <Badge variant="success" size="sm">
                  Campus Active
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
                Welcome to CampusHub
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-text sm:text-base">
                Access campus services, explore food outlets and manage your
                campus activities from one place.
              </p>

              <p className="text-xs font-medium text-accent">
                Your campus, connected.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onOpenCart}
                aria-label="View shopping cart"
              >
                Cart
              </Button>

              {onLogout && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onLogout}
                  aria-label="Log out"
                >
                  Logout
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => onOpenMenu('1')}
              >
                Explore Outlets
              </Button>
            </div>
          </div>
        </header>

        {/* Quick Overview Cards */}
        <section className="mb-10" aria-label="Dashboard Overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Dining Outlets */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl" role="img" aria-label="Dining">
                    🍽️
                  </span>
                  <Badge variant="success" size="sm">
                    3 Open
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold text-text">
                  Dining Outlets
                </h3>
                <p className="mt-1 text-xs text-muted-text">
                  Canteen, Food Court & Bakery
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onOpenMenu('1')}
                >
                  View Menus
                </Button>
              </div>
            </Card>

            {/* Card 2: Xerox & Printing */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl" role="img" aria-label="Printer">
                    🖨️
                  </span>
                  <Badge variant="info" size="sm">
                    Available
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold text-text">
                  Xerox & Print
                </h3>
                <p className="mt-1 text-xs text-muted-text">
                  Document printing & copying
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    const el = document.getElementById('xerox-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Print Service
                </Button>
              </div>
            </Card>

            {/* Card 3: Recent Orders */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl" role="img" aria-label="Orders">
                    🛍️
                  </span>
                  <Badge
                    variant={orders.length > 0 ? 'success' : 'default'}
                    size="sm"
                  >
                    {loadingOrders ? 'Loading' : `${orders.length} Placed`}
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold text-text">
                  Recent Orders
                </h3>
                <p className="mt-1 text-xs text-muted-text">
                  {orders.length > 0
                    ? 'Track orders & status'
                    : 'No active orders'}
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    const el = document.getElementById('recent-orders-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Order History
                </Button>
              </div>
            </Card>

            {/* Card 4: Cart */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl" role="img" aria-label="Cart">
                    🛒
                  </span>
                  <Badge variant="default" size="sm">
                    Quick Access
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold text-text">
                  Shopping Cart
                </h3>
                <p className="mt-1 text-xs text-muted-text">
                  Review & place campus orders
                </p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={onOpenCart}
                >
                  Open Cart
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Campus Services / Food Outlets */}
        <section className="mb-12" aria-labelledby="campus-services-heading">
          <div className="mb-6">
            <h3
              id="campus-services-heading"
              className="text-2xl font-bold text-text"
            >
              Campus Services
            </h3>

            <p className="mt-1 text-sm text-muted-text">
              Explore the services available on campus.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Campus Canteen */}
            <Card
              as="article"
              className="group flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  🍽️
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xl font-bold text-text">
                    Campus Canteen
                  </h4>
                  <Badge variant="success" size="sm">
                    Open
                  </Badge>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-text">
                  Browse food and beverages available at the campus canteen.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => onOpenMenu('1')}
                  className="group-hover:bg-primary group-hover:text-white"
                >
                  View Menu →
                </Button>
              </div>
            </Card>

            {/* Akshay Food Court */}
            <Card
              as="article"
              className="group flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  🍛
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xl font-bold text-text">
                    Akshay Food Court
                  </h4>
                  <Badge variant="success" size="sm">
                    Open
                  </Badge>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-text">
                  Explore meals, snacks and drinks from the food court.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => onOpenMenu('2')}
                  className="group-hover:bg-primary group-hover:text-white"
                >
                  View Menu →
                </Button>
              </div>
            </Card>

            {/* Campus Bakery */}
            <Card
              as="article"
              className="group flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  🥐
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xl font-bold text-text">
                    Campus Bakery
                  </h4>
                  <Badge variant="success" size="sm">
                    Open
                  </Badge>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-text">
                  Find bakery items, snacks and refreshments around campus.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => onOpenMenu('3')}
                  className="group-hover:bg-primary group-hover:text-white"
                >
                  View Menu →
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Xerox */}
        <section
          id="xerox-section"
          className="mb-12"
          aria-labelledby="xerox-heading"
        >
          <Card className="border-border bg-surface p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <Badge variant="warning" size="sm" className="mb-2">
                  Campus Service
                </Badge>

                <h3
                  id="xerox-heading"
                  className="mt-1 text-2xl font-bold text-text"
                >
                  Xerox & Printing
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-text">
                  Access printing and Xerox services available around your campus.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="shrink-0"
              >
                Explore Service
              </Button>
            </div>
          </Card>
        </section>

        {/* Recent Orders */}
        <section
          id="recent-orders-section"
          aria-labelledby="recent-orders-heading"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="recent-orders-heading"
                  className="text-2xl font-bold text-text"
                >
                  Recent Orders
                </h3>
                {activeOrdersCount > 0 && (
                  <Badge variant="warning" size="sm">
                    {activeOrdersCount} active
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-text">
                Live order tracking with step-by-step preparation timeline.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter pills */}
              <div className="flex rounded-xl border border-border bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    orderFilter === 'all'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-text hover:text-text'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('active')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    orderFilter === 'active'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-text hover:text-text'
                  }`}
                >
                  Active ({activeOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('completed')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    orderFilter === 'completed'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-text hover:text-text'
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Refresh button */}
              {refreshOrders && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshOrders}
                  aria-label="Refresh orders"
                  className="gap-1.5"
                >
                  <svg
                    className={`h-3.5 w-3.5 ${loadingOrders ? 'animate-spin' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
            </div>
          </div>

          {loadingOrders ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-sm font-medium text-muted-text">
                Loading your recent orders and timeline...
              </p>
            </Card>
          ) : orders.length === 0 ? (
            <Card className="border-dashed border-border bg-surface/60 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background text-2xl">
                🛍️
              </div>

              <h4 className="text-lg font-semibold text-text">
                No recent orders
              </h4>

              <p className="mt-2 text-sm text-muted-text">
                Your placed orders and live preparation updates will appear here.
              </p>

              <div className="mt-5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenMenu('1')}
                >
                  Browse Canteen Menu
                </Button>
              </div>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <h4 className="text-base font-semibold text-text">
                No {orderFilter} orders
              </h4>
              <p className="mt-1 text-xs text-muted-text">
                There are no orders matching the &quot;{orderFilter}&quot; filter.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderFilter('all')}
                >
                  View All Orders
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredOrders.map((order) => {
                const orderId = order._id || order.id || ''
                const shortId = orderId ? `#${orderId.slice(-6).toUpperCase()}` : ''
                const isSelected = selectedOrderId === orderId

                const formattedDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <Card
                    key={orderId}
                    title={order.shopId?.name || 'Campus Outlet'}
                    subtitle={
                      <span className="flex items-center gap-1.5 text-xs text-muted-text">
                        <span>{formattedDate}</span>
                        {shortId && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-semibold text-text">
                              {shortId}
                            </span>
                          </>
                        )}
                      </span>
                    }
                    headerAction={
                      <div className="flex flex-wrap items-center gap-1.5">
                        {order.paymentStatus === 'paid' && (
                          <Badge variant="success" size="sm">
                            Paid ✓
                          </Badge>
                        )}
                        {order.paymentStatus === 'rejected' && (
                          <Badge
                            variant="danger"
                            size="sm"
                            title={order.paymentRejectReason ? `Rejected: ${order.paymentRejectReason}` : 'Rejected'}
                          >
                            Rejected: {order.paymentRejectReason || 'Payment rejected'}
                          </Badge>
                        )}
                        {(order.paymentStatus === 'pending_verification' || order.paymentStatus === 'unpaid' || !order.paymentStatus) && (
                          <Badge variant="warning" size="sm">
                            Payment pending
                          </Badge>
                        )}
                        <OrderStatusBadge
                          status={order.status || 'placed'}
                          size="sm"
                        />
                      </div>
                    }
                    className={`flex flex-col justify-between transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 border-primary shadow-md'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Payment Rejection Alert & Re-upload action */}
                      {order.paymentStatus === 'rejected' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                          <div className="flex-1">
                            <span className="font-bold">Payment Rejected: </span>
                            <span>{order.paymentRejectReason || 'Verification failed. Please re-upload proof.'}</span>
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setPaymentModalOrder(order)}
                            className="gap-1.5"
                          >
                            <span>🔄</span>
                            <span>Re-upload proof</span>
                          </Button>
                        </div>
                      )}

                      {/* 5-Step Order Status Timeline */}
                      <OrderStatusTimeline
                        status={order.status || 'placed'}
                        showCurrentBadge={false}
                      />

                      {/* Ready for pickup alert banner */}
                      {order.status === 'ready' && (
                        <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 p-3 text-xs text-success">
                          <span className="text-base">🔔</span>
                          <span className="font-medium">
                            Ready for pickup! Please collect your order from{' '}
                            <strong>{order.shopId?.name || 'the outlet counter'}</strong>.
                          </span>
                        </div>
                      )}

                      {/* Order items snapshot */}
                      <div className="rounded-xl border border-border bg-background/50 p-3 text-xs">
                        {order.items && order.items.length > 0 ? (
                          <ul className="space-y-1.5 divide-y divide-border/60">
                            {order.items.map((item, idx) => (
                              <li
                                key={idx}
                                className={`flex items-center justify-between ${idx > 0 ? 'pt-1.5' : ''}`}
                              >
                                <span className="truncate pr-2 font-medium text-text">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="font-semibold text-text">
                                  ₹{item.price * item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-text">Order details</p>
                        )}
                      </div>

                      {/* Order footer: Total & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                            Total Amount
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ₹{order.totalAmount}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {order.paymentStatus === 'rejected' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPaymentModalOrder(order)}
                              className="border-danger/30 text-danger hover:bg-danger hover:text-white gap-1.5"
                            >
                              <span>🔄</span>
                              <span>Re-upload proof</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant={order.status === 'ready' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedQrOrder(order)}
                            className="gap-1.5"
                          >
                            <span>🎟️</span>
                            <span>
                              {order.status === 'ready'
                                ? 'Show Pickup Pass (Ready)'
                                : 'Pickup QR'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Digital QR Pickup Pass Modal Dialog */}
        {selectedQrOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
            onClick={() => setSelectedQrOrder(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Digital Pickup QR Pass"
          >
            <div
              className="relative w-full max-w-md my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <QRPickupCard
                order={selectedQrOrder}
                onClose={() => setSelectedQrOrder(null)}
              />
            </div>
          </div>
        )}

        {/* UPI Payment / Re-upload Proof Modal Dialog */}
        {paymentModalOrder && (
          <UPIPaymentModal
            order={paymentModalOrder}
            shop={paymentModalOrder.shop || paymentModalOrder.shopId}
            isOpen={Boolean(paymentModalOrder)}
            showCounterOption={false}
            onClose={() => setPaymentModalOrder(null)}
            onSuccess={() => {
              setPaymentModalOrder(null)
              if (refreshOrders) refreshOrders()
              triggerLocalRefresh()
            }}
          />
        )}
      </div>
    </main>
  )
}

export default Dashboard
