import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from './components/Card'
import Button from './components/Button'
import Badge from './components/Badge'
import Input from './components/Input'
import CheckoutSummary from './components/CheckoutSummary'
import UPIPaymentForm from './components/UPIPaymentForm'
import RazorpayPaymentButton from './components/RazorpayPaymentButton'
import RazorpayModal from './components/RazorpayModal'
import PaymentProcessingView from './components/PaymentProcessingView'
import PaymentSuccessView from './components/PaymentSuccessView'
import PaymentFailureView from './components/PaymentFailureView'
import { useOrderNotifications } from './context/OrderNotificationContext'
import {
  calculateOrderPricing,
  formatCurrency,
  generatePaymentReference,
  PAYMENT_METHODS,
} from './utils/checkoutPayment'

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

function Cart({ onBack = () => {} }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyItemId, setBusyItemId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  // Checkout & Payment flow states: 'cart' | 'checkout' | 'processing' | 'success' | 'failed'
  const [checkoutStage, setCheckoutStage] = useState('cart')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay_all')
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false)
  const [processingRefId, setProcessingRefId] = useState('')
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [paymentFailureReason, setPaymentFailureReason] = useState('generic')
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [completedItems, setCompletedItems] = useState([])

  let notifyOrderStatus = null
  let refreshOrders = null
  try {
    const notifCtx = useOrderNotifications()
    notifyOrderStatus = notifCtx.notifyOrderStatus
    refreshOrders = notifCtx.refreshOrders
  } catch {
    // fallback if outside context
  }

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

  const clearCartItems = async () => {
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

  // Pricing calculations
  const pricing = useMemo(
    () => calculateOrderPricing(cartItems),
    [cartItems],
  )

  const { itemsCount, totalAmount } = pricing

  // Places order from finalized cart, then transitions to payment step
  const handlePlaceOrder = async () => {
    setActionError('')
    setSubmittingOrder(true)

    try {
      const result = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          notes: orderNotes.trim() || undefined,
        }),
      })

      const placedOrder = result.data || {}
      setOrderSuccess(placedOrder)
      setCartItems([])
      setCheckoutStage('payment')

      if (notifyOrderStatus && placedOrder._id) {
        notifyOrderStatus(placedOrder)
      }
      if (refreshOrders) {
        refreshOrders()
      }
    } catch (err) {
      setActionError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Initiates Razorpay payment UI
  const handleInitiateRazorpay = () => {
    setActionError('')
    setIsRazorpayModalOpen(true)
  }

  // Executes order placement after payment confirmation
  const handlePaymentSuccess = async (paymentData) => {
    setIsRazorpayModalOpen(false)
    setSubmittingOrder(true)
    setCheckoutStage('processing')
    const ref = generatePaymentReference('RZP')
    setProcessingRefId(ref)
    setCompletedItems([...cartItems])

    try {
      const result = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          notes: orderNotes.trim() || undefined,
        }),
      })

      const placedOrder = result.data || { success: true }
      setOrderSuccess(placedOrder)
      setPaymentDetails({
        ...paymentData,
        amount: totalAmount,
      })
      setCartItems([])
      setCheckoutStage('success')

      if (notifyOrderStatus && placedOrder._id) {
        notifyOrderStatus(placedOrder)
      }
      if (refreshOrders) {
        refreshOrders()
      }
    } catch (err) {
      setActionError(
        err.message || 'Payment was recorded but order placement encountered an error.',
      )
      setPaymentFailureReason('network_error')
      setCheckoutStage('failed')
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Handles payment cancellation or modal dismissal
  const handlePaymentCancel = (reason = 'user_cancelled') => {
    setIsRazorpayModalOpen(false)
    setPaymentFailureReason(reason)
    setCheckoutStage('failed')
  }

  // Handles payment failure from gateway or bank
  const handlePaymentFailure = (reason = 'bank_declined') => {
    setIsRazorpayModalOpen(false)
    setPaymentFailureReason(reason)
    setCheckoutStage('failed')
  }

  // Action: Retry payment
  const handleRetryPayment = () => {
    setCheckoutStage('checkout')
    setIsRazorpayModalOpen(true)
  }

  // Action: Return to cart from checkout/failure
  const handleBackToCart = () => {
    setCheckoutStage('cart')
    setActionError('')
  }

  // Action: Start new order
  const handleOrderMore = () => {
    setCheckoutStage('cart')
    setOrderSuccess(null)
    setPaymentDetails(null)
    setCompletedItems([])
    loadCart()
  }

  return (
    <main className="min-h-full bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Navigation back to Dashboard if handler provided */}
        {onBack && checkoutStage !== 'processing' && (
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

        {/* Global Action Error Alert */}
        {actionError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">⚠️</span>
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError('')}
              className="cursor-pointer text-xs font-bold uppercase tracking-wider text-danger hover:underline"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <h3 className="text-base font-bold text-text">
              Loading your cart...
            </h3>
            <p className="mt-1 text-xs text-muted-text">
              Fetching your current order items and totals.
            </p>
          </Card>
        )}

        {/* Fetch Error State */}
        {!loading && error && (
          <Card className="border-danger/30 bg-danger/5 p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-2xl mb-3 text-danger">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-danger">
              Unable to load your cart
            </h3>
            <p className="mt-1 text-sm text-muted-text max-w-md mx-auto">
              {error}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
              >
                Try Again
              </Button>
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                >
                  Back to Dashboard
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Empty Cart State (when not in success/failure view) */}
        {!loading &&
          !error &&
          checkoutStage === 'cart' &&
          cartItems.length === 0 && (
            <Card className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl mb-4">
                🛒
              </div>
              <h2 className="font-serif text-2xl font-bold text-text">
                Your cart is empty
              </h2>
              <p className="mt-2 text-sm text-muted-text max-w-md mx-auto">
                Looks like you haven't added any dishes or beverages yet. Explore
                campus outlets to add your favorite items.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={onBack}
                >
                  Explore Campus Outlets
                </Button>
              </div>
            </Card>
          )}

        {/* 1. Payment Success View */}
        {!loading && checkoutStage === 'success' && orderSuccess && (
          <PaymentSuccessView
            order={orderSuccess}
            paymentDetails={paymentDetails || {}}
            items={completedItems}
            onBack={onBack}
            onReset={handleOrderMore}
          />
        )}

        {/* 2. Payment Processing View */}
        {!loading && checkoutStage === 'processing' && (
          <PaymentProcessingView
            amount={totalAmount}
            referenceId={processingRefId}
            onCancel={() => handlePaymentCancel('user_cancelled')}
          />
        )}

        {/* 3. Payment Failure / Cancelled View */}
        {!loading && checkoutStage === 'failed' && (
          <PaymentFailureView
            amount={totalAmount}
            reason={paymentFailureReason}
            itemsCount={itemsCount}
            onRetry={handleRetryPayment}
            onBackToCart={handleBackToCart}
            onBackToDashboard={onBack}
          />
        )}

        {/* 4. Cart View & 5. Checkout View */}
        {!loading &&
          !error &&
          (checkoutStage === 'cart' || checkoutStage === 'checkout') &&
          cartItems.length > 0 && (
            <div className="space-y-6">
              {/* Checkout Progress Stepper */}
              <nav aria-label="Checkout Progress" className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
                <ol className="flex items-center justify-between max-w-xl mx-auto text-xs sm:text-sm font-semibold">
                  <li className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBackToCart}
                      className={`cursor-pointer flex items-center gap-2 ${
                        checkoutStage === 'cart'
                          ? 'text-primary font-bold'
                          : 'text-muted-text hover:text-text'
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        checkoutStage === 'cart' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        1
                      </span>
                      <span>Review Cart</span>
                    </button>
                  </li>

                  <li className="text-border font-bold">——</li>

                  <li className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 ${
                      checkoutStage === 'checkout' ? 'text-primary font-bold' : 'text-muted-text'
                    }`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        checkoutStage === 'checkout' ? 'bg-primary text-white' : 'border border-border text-muted-text'
                      }`}>
                        2
                      </span>
                      <span>Review & Place</span>
                    </div>
                  </li>

                  <li className="text-border font-bold">——</li>

                  <li className="flex items-center gap-2 text-muted-text/60">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      checkoutStage === 'payment' ? 'bg-primary text-white font-bold' : 'border border-border'
                    }`}>
                      3
                    </span>
                    <span className="hidden sm:inline">Payment</span>
                  </li>
                </ol>
              </nav>

              {/* View 1: Review Cart Mode */}
              {checkoutStage === 'cart' && (
                <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                  {/* Left Column: Cart Items List */}
                  <section aria-labelledby="cart-items-heading" className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2
                          id="cart-items-heading"
                          className="text-xl font-bold text-text"
                        >
                          Selected Items
                        </h2>
                        <p className="text-xs text-muted-text">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in your cart
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={clearing || busyItemId !== null || submittingOrder}
                        onClick={clearCartItems}
                        className="text-danger border-danger/30 hover:bg-danger hover:text-white"
                      >
                        {clearing ? 'Clearing...' : 'Clear Cart'}
                      </Button>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <Card
                          key={item.id}
                          className="transition-all hover:border-primary/40 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Item Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-text truncate">
                                  {item.name}
                                </h3>
                                {item.category && (
                                  <Badge variant="default" size="sm">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-text">
                                {formatCurrency(item.price)} each
                              </p>
                            </div>

                            {/* Item Stepper & Price & Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                              {/* Quantity Stepper */}
                              <div className="flex items-center rounded-xl border border-border bg-background">
                                <button
                                  type="button"
                                  disabled={
                                    busyItemId === item.id ||
                                    clearing ||
                                    submittingOrder
                                  }
                                  onClick={() => decreaseQuantity(item)}
                                  aria-label={`Decrease ${item.name} quantity`}
                                  className="cursor-pointer flex h-8 w-8 items-center justify-center text-base font-bold text-text transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  −
                                </button>

                                <span className="min-w-9 text-center text-sm font-bold text-text">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    busyItemId === item.id ||
                                    clearing ||
                                    submittingOrder
                                  }
                                  onClick={() => increaseQuantity(item)}
                                  aria-label={`Increase ${item.name} quantity`}
                                  className="cursor-pointer flex h-8 w-8 items-center justify-center text-base font-bold text-text transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>

                              {/* Item Total Price */}
                              <div className="min-w-16 text-right font-bold text-primary">
                                {formatCurrency(item.price * item.quantity)}
                              </div>

                              {/* Remove Action */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  busyItemId === item.id ||
                                  clearing ||
                                  submittingOrder
                                }
                                onClick={() => removeItem(item)}
                                className="border-danger/30 text-danger hover:bg-danger hover:text-white"
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Special Instructions Input */}
                    <Card className="mt-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-text">
                            Special Instructions (Optional)
                          </h3>
                          <p className="text-xs text-muted-text">
                            Dietary requests or pickup instructions for the campus
                            outlet staff.
                          </p>
                        </div>
                        <Input
                          id="cart-order-notes"
                          placeholder="e.g., Less spicy, no onions, extra napkins..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          disabled={submittingOrder || clearing}
                        />
                      </div>
                    </Card>
                  </section>

                  {/* Right Column: Order Summary & Proceed to Checkout */}
                  <aside aria-labelledby="order-summary-heading">
                    <div className="sticky top-6">
                      <Card>
                        <h2
                          id="order-summary-heading"
                          className="text-xl font-bold text-text"
                        >
                          Order Summary
                        </h2>

                        <div className="mt-5 space-y-3.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">Items count</span>
                            <span className="font-medium text-text">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">Subtotal</span>
                            <span className="font-medium text-text">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">
                              Campus service fee
                            </span>
                            <span className="font-medium text-success">FREE</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">
                              Packaging & pickup
                            </span>
                            <span className="font-medium text-success">FREE</span>
                          </div>

                          <div className="border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-text">
                                Total
                              </span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(totalAmount)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-text">
                              Inclusive of all campus taxes
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={cartItems.length === 0}
                            onClick={() => setCheckoutStage('checkout')}
                          >
                            Proceed to Checkout →
                          </Button>

                          <p className="text-center text-xs text-muted-text leading-relaxed">
                            Review your items and pay securely with Razorpay in the next step.
                          </p>
                        </div>
                      </Card>
                    </div>
                  </aside>
                </div>
              )}

              {/* View 2: Dedicated Stage 9 Checkout & Payment UI */}
              {checkoutStage === 'checkout' && (
                <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                  {/* Left Column: Checkout Summary & Payment Method Selection */}
                  <div className="space-y-6">
                    {/* Item and Price Breakdown Summary */}
                    <CheckoutSummary
                      items={cartItems}
                      pricing={pricing}
                      orderNotes={orderNotes}
                    />

                    {/* Payment Method Selector Card */}
                    <Card>
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-text">Payment Gateway</h3>
                          <p className="text-xs text-muted-text">
                            Select your preferred online payment method
                          </p>
                        </div>
                        <Badge variant="success" size="sm">
                          Instant Authorization
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        {PAYMENT_METHODS.map((method) => {
                          const isSelected = selectedPaymentMethod === method.id
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`cursor-pointer w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                                  : 'border-border bg-surface hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                                  {method.icon}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-text">
                                      {method.name}
                                    </span>
                                    {method.badge && (
                                      <Badge variant="info" size="sm" className="text-[10px] py-0 px-1.5">
                                        {method.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-text mt-0.5">
                                    {method.description}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 pl-2">
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white text-xs'
                                    : 'border-border'
                                }`}>
                                  {isSelected && '✓'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Razorpay Trust Strip */}
                      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🛡️</span>
                          <span>Razorpay PCI-DSS Level 1 compliant gateway</span>
                        </div>
                        <span className="font-bold tracking-wider uppercase text-[10px]">
                          256-Bit SSL
                        </span>
                      </div>
                    </Card>

                    {/* Navigation: Back to Cart Button */}
                    <div className="flex justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={handleBackToCart}
                        className="gap-2"
                      >
                        ← Back to Cart (Edit items)
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Checkout & Razorpay Payment Action Sidebar */}
                  <aside aria-labelledby="payment-action-heading">
                    <div className="sticky top-6">
                      <Card>
                        <h2
                          id="payment-action-heading"
                          className="text-xl font-bold text-text"
                        >
                          Checkout Summary
                        </h2>

                        <div className="mt-5 space-y-3.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">Items count</span>
                            <span className="font-medium text-text">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">Subtotal</span>
                            <span className="font-medium text-text">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-text">Pickup & Packaging</span>
                            <span className="font-semibold text-success">FREE</span>
                          </div>

                          <div className="border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-text">
                                Total to Pay
                              </span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(totalAmount)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-text">
                              Includes all applicable campus fees
                            </p>
                          </div>
                        </div>

                        {/* Razorpay Payment Button */}
                        <div className="mt-6">
                          <RazorpayPaymentButton
                            amount={totalAmount}
                            loading={submittingOrder}
                            disabled={cartItems.length === 0}
                            onClick={handleInitiateRazorpay}
                          />
                        </div>

                        {/* Help and Back to Cart Links */}
                        <div className="mt-4 pt-4 border-t border-border text-center space-y-2">
                          <button
                            type="button"
                            onClick={handleBackToCart}
                            className="cursor-pointer text-xs text-muted-text hover:text-primary hover:underline font-medium"
                          >
                            ← Need to modify items? Return to Cart
                          </button>
                        </div>
                      </Card>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

        {/* Razorpay Interactive Checkout Modal */}
        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          amount={totalAmount}
          orderNotes={orderNotes}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onFailure={handlePaymentFailure}
        />
      </div>
    </main>
  )
}

export default Cart
