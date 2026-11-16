/**
 * CampusHub Checkout & Payment Utilities
 * Handles price calculation, Razorpay configuration, formatting,
 * and payment flow lifecycle states.
 */

export const PAYMENT_STATUSES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const PAYMENT_FAILURE_REASONS = {
  user_cancelled: 'The payment was cancelled by you. No amount was deducted from your account.',
  bank_declined: 'Payment was declined by your bank or UPI app. Please check your account balance or limits.',
  gateway_timeout: 'Payment session timed out. Please check your internet connection and try again.',
  network_error: 'Network connectivity error while reaching Razorpay servers.',
  generic: 'The transaction could not be completed. No funds were debited.',
}

export const PAYMENT_METHODS = [
  {
    id: 'razorpay_all',
    name: 'Razorpay Secure Gateway',
    description: 'UPI, Credit/Debit Cards, NetBanking & Wallets',
    badge: 'Recommended',
    icon: '⚡',
    isOnline: true,
  },
  {
    id: 'razorpay_upi',
    name: 'UPI Instant Pay',
    description: 'Google Pay, PhonePe, Paytm, BHIM or any UPI ID',
    badge: 'Instant',
    icon: '📱',
    isOnline: true,
  },
  {
    id: 'razorpay_cards',
    name: 'Cards',
    description: 'Visa, MasterCard, RuPay, Maestro Credit & Debit cards',
    badge: 'Secure',
    icon: '💳',
    isOnline: true,
  },
  {
    id: 'razorpay_netbanking',
    name: 'Net Banking',
    description: 'SBI, HDFC, ICICI, Axis, and 50+ other banks',
    badge: null,
    icon: '🏛️',
    isOnline: true,
  },
]

/**
 * Calculates order pricing breakdown.
 * @param {Array<{ price: number, quantity: number }>} items
 * @param {object} [options]
 * @param {number} [options.serviceFee=0]
 * @param {number} [options.packagingFee=0]
 * @param {number} [options.discount=0]
 * @returns {object} pricing details
 */
export function calculateOrderPricing(items = [], options = {}) {
  const safeItems = Array.isArray(items) ? items : []

  const validItems = safeItems.filter((item) => {
    const price = Number(item?.price)
    const quantity = Number(item?.quantity)
    return Number.isFinite(price) && price >= 0 && Number.isFinite(quantity) && quantity > 0
  })

  const itemsCount = validItems.reduce((acc, item) => acc + Number(item.quantity), 0)

  const subtotal = validItems.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0
  )

  const serviceFee = Math.max(0, Number(options.serviceFee) || 0)
  const packagingFee = Math.max(0, Number(options.packagingFee) || 0)
  const discount = Math.max(0, Number(options.discount) || 0)

  const calculatedTotal = subtotal + serviceFee + packagingFee - discount
  const totalAmount = Math.max(0, Math.round(calculatedTotal * 100) / 100)

  return {
    itemsCount,
    subtotal: Math.round(subtotal * 100) / 100,
    serviceFee,
    packagingFee,
    discount,
    totalAmount,
    formattedSubtotal: formatCurrency(subtotal),
    formattedTotal: formatCurrency(totalAmount),
  }
}

/**
 * Format a numeric amount as Indian Rupees (₹).
 * @param {number} amount
 * @returns {string} e.g. "₹450"
 */
export function formatCurrency(amount) {
  const num = Number(amount)
  if (!Number.isFinite(num)) {
    return '₹0'
  }
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

/**
 * Generate a unique payment simulation reference.
 * @param {string} [prefix='RZP']
 * @returns {string}
 */
export function generatePaymentReference(prefix = 'RZP') {
  const time = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${time}-${random}`
}

/**
 * Generate a mock Razorpay Payment ID.
 * @returns {string} e.g. "pay_k9f83j2a10"
 */
export function generateMockPaymentId() {
  const part1 = Math.random().toString(36).slice(2, 9)
  const part2 = Math.random().toString(36).slice(2, 7)
  return `pay_${part1}${part2}`
}

/**
 * Builds the standard Razorpay configuration options object.
 * @param {object} params
 * @returns {object} options for window.Razorpay
 */
export function buildRazorpayOptions({
  key = 'rzp_test_campushub',
  amount = 0,
  orderId = '',
  user = {},
  notes = '',
  onSuccess = () => {},
  onDismiss = () => {},
  onFailure = () => {},
}) {
  const amountInPaise = Math.round(Math.max(0, Number(amount) || 0) * 100)

  return {
    key: key || 'rzp_test_campushub',
    amount: amountInPaise,
    currency: 'INR',
    name: 'CampusHub Outlets',
    description: `Campus Dining Payment - ${formatCurrency(amount)}`,
    image: '/favicon.ico',
    order_id: orderId || undefined,
    prefill: {
      name: user?.name || 'Campus Student',
      email: user?.email || '',
      contact: user?.phone || user?.collegeId || '',
    },
    notes: {
      campusNotes: notes || 'Campus dining pickup order',
    },
    theme: {
      color: '#7b1e1e', // CampusHub primary brand color
    },
    handler: function (response) {
      if (typeof onSuccess === 'function') {
        onSuccess({
          razorpay_payment_id: response?.razorpay_payment_id || generateMockPaymentId(),
          razorpay_order_id: response?.razorpay_order_id || orderId || generatePaymentReference('ORD'),
          razorpay_signature: response?.razorpay_signature || 'sig_mock_verified',
        })
      }
    },
    modal: {
      ondismiss: function () {
        if (typeof onDismiss === 'function') {
          onDismiss()
        }
      },
      confirm_close: true,
      animation: true,
    },
    error: function (err) {
      if (typeof onFailure === 'function') {
        onFailure(err)
      }
    },
    callback_url: undefined,
  }
}

/**
 * Safe script loader for external Razorpay checkout.js SDK
 * @returns {Promise<boolean>}
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
