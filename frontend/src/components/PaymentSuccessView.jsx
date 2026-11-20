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
  const isCounter =
    order.paymentMethod === 'counter' ||
    paymentDetails.method?.toLowerCase().includes('counter')
  const isUpi =
    order.paymentMethod === 'upi' ||
    paymentDetails.method?.toLowerCase().includes('upi')

  const paymentId =
    order.paymentUtr ||
    paymentDetails.utr ||
    paymentDetails.razorpay_payment_id ||
    order._id ||
    'confirmed'

  const methodLabel = isCounter
    ? 'Pay at Counter'
    : isUpi
      ? 'UPI Verification'
      : paymentDetails.method || 'Online Payment'

  const badgeVariant = isCounter ? 'warning' : isUpi ? 'warning' : 'success'
  const badgeText = isCounter
    ? 'Pay at Counter'
    : isUpi
      ? 'Verification Pending'
      : 'Payment Completed'

  const titleText = isCounter
    ? 'Order Placed Successfully!'
    : isUpi
      ? 'Order Placed & Proof Submitted!'
      : 'Payment Successful & Order Placed!'

  const descriptionText = isCounter
    ? `Your campus order has been sent to the kitchen. Please pay ${formatCurrency(totalAmount)} directly at the counter upon pickup.`
    : isUpi
      ? `Your UPI payment proof has been submitted for outlet verification. Your campus order has been sent to the kitchen.`
      : `Your payment of ${formatCurrency(totalAmount)} has been verified. Your campus order has been sent to the kitchen.`

  return (
    <div className={`mx-auto max-w-3xl space-y-6 py-4 ${className}`.trim()}>
      <Card className="text-center py-8 px-4 sm:py-12 sm:px-8">
        {/* Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-success/15 text-4xl text-success mb-4 shadow-sm">
          ✓
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <Badge variant={badgeVariant} size="md">
            {badgeText}
          </Badge>
          <OrderStatusBadge status={order.status || 'placed'} size="md" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text">
          {titleText}
        </h1>

        <p className="mt-2 text-sm text-muted-text max-w-md mx-auto">
          {descriptionText}
        </p>

        {/* Order Token & Pickup Token Prominently Displayed */}
        {order.orderToken && (
          <div className="mx-auto my-5 inline-block rounded-2xl border-2 border-dashed border-primary bg-primary/5 px-8 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Your Order Token
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-primary">
              {order.orderToken}
            </p>
          </div>
        )}

        {order.pickupToken && (
          <div className="mx-auto mb-4 max-w-sm rounded-xl border border-border bg-background/60 p-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-text">
              Pickup Token
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-primary break-all">
              {order.pickupToken}
            </p>
          </div>
        )}

        {/* Payment Receipt Summary Card */}
        <div className="mx-auto my-6 max-w-md rounded-2xl border border-border bg-background/50 p-4 text-xs space-y-2.5 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold uppercase tracking-wider text-muted-text">
              Order Receipt
            </span>
            <Badge variant={badgeVariant} size="sm">
              {badgeText}
            </Badge>
          </div>

          {order.orderToken && (
            <div className="flex items-center justify-between">
              <span className="text-muted-text">Order Token:</span>
              <span className="font-mono font-bold text-primary">
                {order.orderToken}
              </span>
            </div>
          )}

          {order.pickupToken && (
            <div className="flex items-center justify-between">
              <span className="text-muted-text">Pickup Token:</span>
              <span className="font-mono font-semibold text-text">
                {order.pickupToken}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Order / Reference:</span>
            <span className="font-mono font-semibold text-text truncate max-w-[200px]">
              {paymentId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Payment Method:</span>
            <span className="font-medium text-text capitalize">{methodLabel}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">{isCounter ? 'Amount Due:' : 'Total Amount:'}</span>
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
