import Card from './Card'
import Button from './Button'
import { formatCurrency } from '../utils/checkoutPayment'

export default function PaymentProcessingView({
  amount = 0,
  referenceId = '',
  onCancel = () => {},
  className = '',
}) {
  return (
    <div className={`mx-auto max-w-xl py-8 ${className}`.trim()}>
      <Card className="text-center py-10 px-6 sm:py-14 sm:px-10">
        {/* Animated Processing Indicator */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/25" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c2340] text-3xl text-white shadow-lg">
            ⚡
          </div>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          Processing Payment...
        </h2>

        <p className="mt-2 text-sm text-muted-text max-w-md mx-auto">
          Securely connecting to Razorpay to verify your transaction of{' '}
          <strong className="text-primary font-bold">{formatCurrency(amount)}</strong>.
        </p>

        {/* Transaction Details Box */}
        <div className="mx-auto my-6 max-w-sm rounded-xl border border-border bg-background/60 p-4 text-xs space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-muted-text">Gateway:</span>
            <span className="font-semibold text-text">Razorpay 256-Bit SSL</span>
          </div>
          {referenceId && (
            <div className="flex items-center justify-between">
              <span className="text-muted-text">Reference ID:</span>
              <span className="font-mono font-semibold text-text">{referenceId}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-text">Total Payable:</span>
            <span className="font-bold text-primary">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Security Alert Notice */}
        <div className="mx-auto max-w-md rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-warning flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Please do not refresh, close, or navigate away from this page.</span>
        </div>

        {/* Cancel Button */}
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-muted-text hover:text-text border-border"
          >
            Cancel Transaction
          </Button>
        </div>
      </Card>
    </div>
  )
}

