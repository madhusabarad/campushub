import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Button from './Button'
import Card from './Card'

const FALLBACK_UPI_ID = '9740531501-q8ba@ybl'

export default function UPIPaymentForm({
  order = {},
  shop = null,
  showCounterOption = false,
  onSuccess = () => {},
  onCancel = null,
  className = '',
}) {
  const [selectedMethod, setSelectedMethod] = useState('upi') // 'upi' | 'counter'
  const [utr, setUtr] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fetchedShop, setFetchedShop] = useState(null)

  const propCandidate =
    shop ||
    order?.shop ||
    (typeof order?.shopId === 'object' ? order.shopId : null)

  const shopId =
    propCandidate?._id ||
    order?.shop?._id ||
    order?.shopId?._id ||
    (typeof order?.shopId === 'string' ? order.shopId : null) ||
    (typeof shop === 'string' ? shop : null)

  // Fetch shop details if upiId is missing from props
  useEffect(() => {
    if (propCandidate?.upiId) return
    if (!shopId) return

    let cancelled = false
    fetch('/api/shops?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.data)) {
          const found = data.data.find((s) => String(s._id) === String(shopId))
          if (found) {
            setFetchedShop(found)
          } else {
            setFetchedShop({})
          }
        } else if (!cancelled) {
          setFetchedShop({})
        }
      })
      .catch((err) => {
        console.error('Error fetching shop UPI ID:', err)
        if (!cancelled) setFetchedShop({})
      })

    return () => {
      cancelled = true
    }
  }, [propCandidate?.upiId, shopId])

  const effectiveShop =
    (propCandidate?.upiId ? propCandidate : null) ||
    (fetchedShop?.upiId ? fetchedShop : null) ||
    propCandidate ||
    fetchedShop ||
    {}

  const upiId =
    effectiveShop?.upiId ||
    propCandidate?.upiId ||
    shop?.upiId ||
    FALLBACK_UPI_ID

  const shopName =
    effectiveShop?.name ||
    propCandidate?.name ||
    shop?.name ||
    order?.shop?.name ||
    order?.shopId?.name ||
    'Campus Outlet'

  const amount = Number(order?.total ?? order?.totalAmount ?? 0)
  const orderId = String(order?._id || order?.id || '')
  const orderCode = orderId ? orderId.slice(-6).toUpperCase() : ''
  const displayCode = orderCode ? `#${orderCode}` : ''

  // UPI deep link: upi://pay?pa={upiId}&pn={shop.name}&am={order.total}&cu=INR&tn=CampusHub {order code}
  const tnValue = orderCode ? `CampusHub ${orderCode}` : 'CampusHub'
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(tnValue)}`

  const handleCopyUpi = async () => {
    if (!upiId) return
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleSubmitProof = async (e) => {
    e.preventDefault()
    if (utr.trim().length !== 12 || !screenshot || isSubmitting) return

    const targetId = order._id || order.id
    if (!targetId) {
      setServerError('Missing order ID. Please try again.')
      return
    }

    setIsSubmitting(true)
    setServerError('')

    try {
      const formData = new FormData()
      formData.append('utr', utr.trim())
      formData.append('screenshot', screenshot)

      const token = localStorage.getItem('campushub_token')

      const res = await fetch(`/api/orders/${targetId}/payment-proof`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Payment proof submission failed.')
      }

      onSuccess(data.data || order)
    } catch (err) {
      setServerError(err.message || 'Server error while submitting payment proof.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayAtCounter = () => {
    // Counter payment: existing flow, no proof upload needed
    onSuccess(order)
  }

  const isSubmitDisabled =
    utr.trim().length !== 12 || !screenshot || isSubmitting

  return (
    <Card className={`space-y-6 ${className}`.trim()}>
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-text">Payment</h2>
            <p className="mt-0.5 text-xs text-muted-text">
              Order {displayCode} • {shopName}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-text block">
              Total Due
            </span>
            <span className="text-2xl font-bold text-primary">₹{amount}</span>
          </div>
        </div>

        {/* Rejection Alert if re-uploading proof */}
        {order.paymentRejectReason && (
          <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <div className="font-bold">Previous proof was rejected:</div>
            <div className="mt-0.5">{order.paymentRejectReason}</div>
            <div className="mt-1 text-[11px] text-danger/80">
              Please check your payment receipt and upload a fresh screenshot with the correct 12-digit UTR.
            </div>
          </div>
        )}
      </div>

      {/* Two payment choices after placing order in Cart */}
      {showCounterOption && (
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
          <button
            type="button"
            role="radio"
            aria-checked={selectedMethod === 'upi'}
            onClick={() => setSelectedMethod('upi')}
            className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
              selectedMethod === 'upi'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                : 'border-border bg-surface hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-base">
                📱
              </span>
              <div>
                <div className="text-sm font-bold text-text">Pay via UPI</div>
                <div className="text-[11px] text-muted-text">Scan QR & upload proof</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedMethod === 'counter'}
            onClick={() => setSelectedMethod('counter')}
            className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
              selectedMethod === 'counter'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                : 'border-border bg-surface hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-base">
                🏪
              </span>
              <div>
                <div className="text-sm font-bold text-text">Pay at Counter</div>
                <div className="text-[11px] text-muted-text">Cash or card at pickup</div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Mode A: Pay at Counter */}
      {showCounterOption && selectedMethod === 'counter' && (
        <div className="space-y-4 rounded-2xl border border-border bg-background/50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            🏪
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Pay Directly at Outlet Counter</h3>
            <p className="mt-1 text-xs text-muted-text max-w-sm mx-auto">
              Your order is placed! You can pay ₹{amount} using cash, card, or UPI directly when picking up your food at {shopName}.
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handlePayAtCounter}
            >
              Confirm & Go to My Orders →
            </Button>
          </div>
        </div>
      )}

      {/* Mode B: Pay via UPI - Always show QR section & payment inputs */}
      {(!showCounterOption || selectedMethod === 'upi') && (
        <form onSubmit={handleSubmitProof} className="space-y-5">
          {/* QR Code and Payment Details */}
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            {/* QR Codes Column: Primary Dynamic QR + Static Fallback QR */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 shadow-xs">
              {/* Primary: Dynamic QR from qrcode.react (always black on white for scannability) */}
              <div className="flex flex-col items-center w-full">
                <div className="rounded-xl bg-white p-2.5 border border-border shadow-xs">
                  <QRCodeSVG
                    value={upiLink}
                    size={170}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-2 text-center text-xs font-bold text-text">
                  Scan with any UPI app
                </p>
                <p className="text-center text-[11px] text-muted-text">
                  Auto-fills amount &amp; order code
                </p>
              </div>

              {/* Static Fallback QR */}
              <div className="mt-4 pt-4 border-t border-border w-full flex flex-col items-center text-center">
                <div className="rounded-xl bg-white p-2 border border-border shadow-xs">
                  <img
                    src="/upi-qr.png"
                    alt="Static UPI QR"
                    className="h-32 w-32 object-contain"
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-muted-text leading-relaxed">
                  Can&apos;t scan? Scan this QR and enter the amount manually: <span className="font-bold text-primary">₹{amount}</span>
                </p>
              </div>
            </div>

            {/* Payment Info & App Link */}
            <div className="space-y-3">
              {/* UPI ID with Copy button */}
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-text">
                  Shop UPI ID
                </span>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-text break-all select-all">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="shrink-0 cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    {copied ? 'Copied! ✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Amount & Order Code */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border bg-background/60 p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-text">
                    Amount
                  </span>
                  <span className="text-base font-bold text-primary">₹{amount}</span>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-text">
                    Order Code
                  </span>
                  <span className="font-mono text-base font-bold text-text">
                    {displayCode || '—'}
                  </span>
                </div>
              </div>

              {/* Open UPI App Button */}
              <a
                href={upiLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <span>📱</span>
                <span>Open UPI App</span>
              </a>
            </div>
          </div>

          {/* Form Inputs: 12-digit UTR & Screenshot */}
          <div className="space-y-3.5 border-t border-border pt-4">
            {/* 12-digit UTR Input */}
            <div>
              <label
                htmlFor="payment-utr"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-text"
              >
                12-Digit UTR / Transaction Reference Number <span className="text-danger">*</span>
              </label>
              <input
                id="payment-utr"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={12}
                placeholder="e.g. 123456789012"
                value={utr}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12)
                  setUtr(cleaned)
                  setServerError('')
                }}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm tracking-wider text-text placeholder:text-muted-text/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-text">
                <span>Digits only (found in Google Pay / PhonePe / Paytm receipt)</span>
                <span className={utr.length === 12 ? 'font-semibold text-success' : ''}>
                  {utr.length}/12 digits
                </span>
              </div>
            </div>

            {/* Screenshot File Input */}
            <div>
              <label
                htmlFor="payment-screenshot"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-text"
              >
                Payment Screenshot Proof <span className="text-danger">*</span>
              </label>
              <input
                id="payment-screenshot"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setScreenshot(file)
                  setServerError('')
                }}
                className="w-full cursor-pointer rounded-xl border border-border bg-surface p-2 text-xs text-muted-text file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                required
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-text">
                <span>Upload JPG or PNG screenshot of completed payment</span>
                {screenshot && (
                  <span className="font-semibold text-success truncate max-w-[200px]">
                    ✓ {screenshot.name}
                  </span>
                )}
              </div>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger"
              >
                <span aria-hidden="true" className="text-sm">⚠️</span>
                <span className="flex-1">{serverError}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitDisabled}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting Proof...' : 'Submit Payment Proof'}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </Card>
  )
}

