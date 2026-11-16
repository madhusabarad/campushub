import Button from './Button'
import { formatCurrency } from '../utils/checkoutPayment'

export default function RazorpayPaymentButton({
  amount = 0,
  loading = false,
  disabled = false,
  onClick = () => {},
  className = '',
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={disabled || loading || amount <= 0}
        onClick={onClick}
        className="group relative overflow-hidden bg-[#0c2340] hover:bg-[#07172b] text-white shadow-md transition-all active:scale-[0.99]"
      >
        <div className="flex items-center justify-center gap-2.5 font-bold tracking-wide">
          {/* Razorpay Lightning Icon */}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-300">
            ⚡
          </span>
          <span>Pay {formatCurrency(amount)} with Razorpay</span>
          <span className="text-white/60 transition-transform group-hover:translate-x-1">→</span>
        </div>
      </Button>

      {/* Security and Methods Trust Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-muted-text">
        <span className="flex items-center gap-1">
          <span className="text-success">🔒</span>
          <span>100% Secure Checkout</span>
        </span>
        <span>•</span>
        <span>UPI / Cards / NetBanking</span>
        <span>•</span>
        <span className="font-semibold text-text/80">Razorpay</span>
      </div>
    </div>
  )
}

