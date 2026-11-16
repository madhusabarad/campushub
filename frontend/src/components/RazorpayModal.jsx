import { useState, useEffect } from 'react'
import Button from './Button'
import Badge from './Badge'
import Input from './Input'
import {
  formatCurrency,
  generateMockPaymentId,
  generatePaymentReference,
} from '../utils/checkoutPayment'

export default function RazorpayModal({
  isOpen = false,
  amount = 0,
  orderNotes = '',
  user = {},
  onSuccess = () => {},
  onCancel = () => {},
  onFailure = () => {},
}) {
  const [selectedMethod, setSelectedMethod] = useState('upi')
  const [upiId, setUpiId] = useState('student@okaxis')
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [simulatingProcessing, setSimulatingProcessing] = useState(false)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel('user_cancelled')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handlePay = () => {
    setSimulatingProcessing(true)

    // Complete payment after brief interaction simulation
    setTimeout(() => {
      setSimulatingProcessing(false)
      onSuccess({
        razorpay_payment_id: generateMockPaymentId(),
        razorpay_order_id: generatePaymentReference('RZP-ORD'),
        method: selectedMethod,
        amount,
      })
    }, 600)
  }

  const handleSimulateFailure = () => {
    setSimulatingProcessing(true)
    setTimeout(() => {
      setSimulatingProcessing(false)
      onFailure('bank_declined')
    }, 600)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="razorpay-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface text-text shadow-2xl transition-all">
        {/* Header - Razorpay Dark Blue */}
        <div className="bg-[#0c2340] px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500 font-bold text-white text-xs">
                  R
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  Razorpay Trusted Gateway
                </span>
              </div>
              <h3 id="razorpay-modal-title" className="mt-1 text-xl font-bold">
                CampusHub Dining
              </h3>
              <p className="text-xs text-blue-200/80">
                Order for {user.name || 'Campus Student'} {orderNotes ? `• "${orderNotes}"` : ''}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-blue-200">Amount to Pay</span>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-text mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  selectedMethod === 'upi'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background/50 text-text hover:border-primary/40'
                }`}
              >
                <span className="text-lg mb-1">⚡</span>
                <span>UPI / QR</span>
                <Badge variant="success" size="sm" className="mt-1 text-[9px] py-0 px-1">
                  Instant
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cards')}
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  selectedMethod === 'cards'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background/50 text-text hover:border-primary/40'
                }`}
              >
                <span className="text-lg mb-1">💳</span>
                <span>Cards</span>
                <span className="text-[10px] text-muted-text mt-1">Visa/RuPay</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  selectedMethod === 'netbanking'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-background/50 text-text hover:border-primary/40'
                }`}
              >
                <span className="text-lg mb-1">🏛️</span>
                <span>NetBanking</span>
                <span className="text-[10px] text-muted-text mt-1">50+ Banks</span>
              </button>
            </div>
          </div>

          {/* Method Content */}
          <div className="rounded-xl border border-border bg-background/60 p-4">
            {selectedMethod === 'upi' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text">Enter UPI Virtual Payment Address (VPA)</span>
                  <span className="text-muted-text">GPay / PhonePe / Paytm</span>
                </div>
                <Input
                  id="checkout-upi-id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi, name@okhdfcbank"
                  className="bg-surface"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['@okaxis', '@okhdfcbank', '@paytm', '@ybl'].map((suffix) => (
                    <button
                      key={suffix}
                      type="button"
                      onClick={() => setUpiId(`student${suffix}`)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-text hover:border-primary hover:text-primary"
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMethod === 'cards' && (
              <div className="space-y-3">
                <Input
                  label="Card Number"
                  id="checkout-card-num"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="bg-surface font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Valid Thru"
                    id="checkout-card-exp"
                    defaultValue="12/28"
                    className="bg-surface font-mono"
                  />
                  <Input
                    label="CVV"
                    id="checkout-card-cvv"
                    type="password"
                    maxLength={3}
                    defaultValue="•••"
                    className="bg-surface font-mono"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-text">Select Popular Bank</span>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`cursor-pointer rounded-lg border p-2 text-xs text-left transition-colors ${
                        selectedBank === bank
                          ? 'border-primary bg-primary/10 font-bold text-primary'
                          : 'border-border bg-surface text-text hover:border-primary/40'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secure Trust Message */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
            <span>🛡️</span>
            <span>Secured by 256-bit encryption. Authorizing {formatCurrency(amount)} payment.</span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="border-t border-border bg-background/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={simulatingProcessing}
              onClick={() => onCancel('user_cancelled')}
            >
              Cancel Payment
            </Button>
            <button
              type="button"
              onClick={handleSimulateFailure}
              disabled={simulatingProcessing}
              title="Test payment failure handling"
              className="cursor-pointer text-xs text-danger/80 hover:text-danger hover:underline"
            >
              Simulate Failure
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            loading={simulatingProcessing}
            disabled={simulatingProcessing}
            onClick={handlePay}
            className="bg-[#0c2340] hover:bg-[#07172b]"
          >
            Pay {formatCurrency(amount)} →
          </Button>
        </div>
      </div>
    </div>
  )
}

