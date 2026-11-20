import Card from './Card'
import Badge from './Badge'
import { formatCurrency } from '../utils/checkoutPayment'

export default function CheckoutSummary({
  items = [],
  pricing = {},
  orderNotes = '',
  className = '',
}) {
  const {
    itemsCount = 0,
    subtotal = 0,
    serviceFee = 0,
    packagingFee = 0,
    discount = 0,
    totalAmount = 0,
  } = pricing

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-text">Order Items Summary</h2>
            <p className="text-xs text-muted-text">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} ready for campus preparation
            </p>
          </div>
          <Badge variant="default" size="sm">
            Pickup Counter
          </Badge>
        </div>

        {/* Item List */}
        <div className="divide-y divide-border/60 py-2">
          {items.map((item) => {
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 1)
            return (
              <div
                key={item.id || item.menuItemId || item.name}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text truncate">{item.name}</span>
                    {item.category && (
                      <Badge variant="default" size="sm" className="hidden sm:inline-flex text-[10px]">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-text">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right font-semibold text-text">
                  {formatCurrency(lineTotal)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Special Instructions Preview if entered */}
        {orderNotes && (
          <div className="mt-2 rounded-xl border border-border/80 bg-background/60 p-3 text-xs">
            <span className="font-semibold text-text">Kitchen Note: </span>
            <span className="text-muted-text italic">"{orderNotes}"</span>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="mt-4 border-t border-border pt-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-text">Items Subtotal</span>
            <span className="font-medium text-text">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Campus Service Fee</span>
            {serviceFee > 0 ? (
              <span className="font-medium text-text">{formatCurrency(serviceFee)}</span>
            ) : (
              <span className="font-semibold text-success text-xs uppercase tracking-wider">FREE</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-text">Packaging & Counter Pickup</span>
            {packagingFee > 0 ? (
              <span className="font-medium text-text">{formatCurrency(packagingFee)}</span>
            ) : (
              <span className="font-semibold text-success text-xs uppercase tracking-wider">FREE</span>
            )}
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-success">
              <span className="font-medium">Student Discount</span>
              <span className="font-bold">-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-text">Total Payable</span>
                <p className="text-[11px] text-muted-text">Inclusive of all campus taxes</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

