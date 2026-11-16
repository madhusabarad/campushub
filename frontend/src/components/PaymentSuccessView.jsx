import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import OrderStatusBadge from './OrderStatusBadge'
import OrderStatusTimeline from './OrderStatusTimeline'
import QRPickupCard from './QRPickupCard'
import { formatCurrency } from '../utils/checkoutPayment'

export default function PaymentSuccessView({
  order = {},
  paymentDetails = {},
  items = [],
  onBack = () => {},
  onReset = () => {},
  className = '',
}) {
  const totalAmount = order.totalAmount ?? paymentDetails.amount ?? 0
  const paymentId = paymentDetails.razorpay_payment_id || order.paymentId || 'pay_confirmed'
  const paymentMethod = paymentDetails.method || 'Razorpay Online'

  return (
    <div className={`mx-auto max-w-3xl space-y-6 py-4 ${className}`.trim()}>
      <Card className="text-center py-8 px-4 sm:py-12 sm:px-8">
        {/* Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-success/15 text-4xl text-success mb-4 shadow-sm">
          ✓
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <Badge variant="success" size="md">
            Payment Completed
          </Badge>
          <OrderStatusBadge status={order.status || 'placed'} size="md" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text">
          Payment Successful & Order Placed!
        </h1>

        <p className="mt-2 text-sm text-muted-text max-w-md mx-auto">
          Your payment of{' '}
          <strong className="text-primary font-bold">{formatCurrency(totalAmount)}</strong>{' '}
          has been verified via Razorpay. Your campus order has been sent to the kitchen.
        </p>

        {/* Payment Receipt Summary Card */}
        <div className="mx-auto my-6 max-w-md rounded-2xl border border-border bg-background/50 p-4 text-xs space-y-2.5 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold uppercase tracking-wider text-muted-text">
              Payment Receipt
            </span>
            <Badge variant="success" size="sm">
              Razorpay Verified
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Payment ID:</span>
            <span className="font-mono font-semibold text-text">{paymentId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Payment Method:</span>
            <span className="font-medium text-text capitalize">{paymentMethod}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Total Paid:</span>
            <span className="text-sm font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Date & Time:</span>
            <span className="font-medium text-text">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, Today
            </span>
          </div>
        </div>

        {/* Live Order Status Timeline */}
        <div className="my-6 max-w-xl mx-auto text-left">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-text text-center sm:text-left">
            Live Order Status
          </h3>
          <OrderStatusTimeline status={order.status || 'placed'} />
        </div>

        {/* Digital QR Pickup Pass */}
        <div className="my-6 max-w-md mx-auto text-left">
          <QRPickupCard order={order} showDetails={false} />
        </div>

        {/* Purchased Items Accordion / Summary if available */}
        {items.length > 0 && (
          <div className="my-6 max-w-md mx-auto rounded-2xl border border-border bg-surface p-4 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-3">
              Items Ordered ({items.length})
            </h4>
            <div className="divide-y divide-border/60 text-xs">
              {items.map((item) => (
                <div
                  key={item.id || item.menuItemId || item.name}
                  className="flex items-center justify-between py-2"
                >
                  <span className="font-medium text-text">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-text">
                    {formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onBack}
            className="shadow-sm"
          >
            Track in Dashboard →
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onReset}
          >
            Order More Items
          </Button>
        </div>
      </Card>
    </div>
  )
}

