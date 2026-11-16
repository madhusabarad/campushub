import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import {
  formatCurrency,
  PAYMENT_FAILURE_REASONS,
} from '../utils/checkoutPayment'

export default function PaymentFailureView({
  amount = 0,
  reason = 'generic',
  itemsCount = 0,
  onRetry = () => {},
  onBackToCart = () => {},
  onBackToDashboard = null,
  className = '',
}) {
  const reasonMessage =
    PAYMENT_FAILURE_REASONS[reason] || PAYMENT_FAILURE_REASONS.generic

  return (
    <div className={`mx-auto max-w-xl py-6 ${className}`.trim()}>
      <Card className="text-center py-8 px-6 sm:py-12 sm:px-10 border-danger/30 bg-surface">
        {/* Warning / Failure Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 text-4xl text-danger mb-4 shadow-sm">
          ✕
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <Badge variant="danger" size="md">
            Payment Incomplete
          </Badge>
          {itemsCount > 0 && (
            <Badge variant="default" size="md">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} in Cart
            </Badge>
          )}
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          Payment Cancelled or Declined
        </h2>

        <p className="mt-2 text-sm text-muted-text max-w-md mx-auto">
          {reasonMessage}
        </p>

        {/* Pending Order Summary Box */}
        <div className="mx-auto my-6 max-w-md rounded-2xl border border-danger/20 bg-danger/5 p-4 text-xs space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-muted-text">Pending Total:</span>
            <span className="text-base font-bold text-danger">{formatCurrency(amount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Account Debit Status:</span>
            <span className="font-semibold text-success">₹0 Debited (Safe)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Cart Items:</span>
            <span className="font-medium text-text">Preserved in your cart</span>
          </div>
        </div>

        {/* Action Buttons: Retry and Back to Cart */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onRetry}
            className="w-full sm:w-auto bg-[#0c2340] hover:bg-[#07172b]"
          >
            ⚡ Retry Payment with Razorpay
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onBackToCart}
            className="w-full sm:w-auto"
          >
            ← Back to Cart
          </Button>

          {onBackToDashboard && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto text-muted-text"
            >
              Dashboard
            </Button>
          )}
        </div>

        {/* Reassurance Footer */}
        <p className="mt-6 text-[11px] text-muted-text">
          Having trouble? You can select another UPI VPA, card, or visit the outlet counter.
        </p>
      </Card>
    </div>
  )
}

