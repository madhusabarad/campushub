import UPIPaymentForm from './UPIPaymentForm'

export default function UPIPaymentModal({
  order = null,
  shop = null,
  isOpen = false,
  showCounterOption = false,
  onClose = () => {},
  onSuccess = () => {},
}) {
  if (!isOpen || !order) return null

  const resolvedShop = shop || order.shop || order.shopId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="UPI Payment Proof Submission"
    >
      <div
        className="relative w-full max-w-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <UPIPaymentForm
          order={order}
          shop={resolvedShop}
          showCounterOption={showCounterOption}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

