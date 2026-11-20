import { useId, useMemo, useState } from 'react'
import Badge from './Badge'
import OrderStatusBadge from './OrderStatusBadge'
import {
  encodeQr,
  getPickupInstruction,
  getShortOrderId,
  matrixToSvgPath,
} from '../utils/qrCode'

/**
 * Reusable QR Pickup Card for Student Orders
 *
 * Renders an accessible, responsive digital pickup pass containing:
 * - Scannable SVG QR code encoding the real order ID
 * - Order ID (full & short #... with 1-click copy)
 * - Outlet name & category
 * - Live Order Status Badge
 * - Clear "Show at counter" instruction banner
 * - Dynamic Ready (pulsing beacon) & Completed (watermarked) states
 * - Skeleton loading state and graceful empty state
 */
export default function QRPickupCard({
  order = null,
  orderId = '',
  outletName = '',
  status = '',
  items = [],
  totalAmount = null,
  loading = false,
  compact = false,
  showDetails = true,
  onClose = null,
  className = '',
  ...props
}) {
  const cardId = useId()
  const [copied, setCopied] = useState(false)

  // Resolve effective data from order object or direct props
  const effectiveOrderId = order?._id || order?.id || orderId || ''
  const shortId = getShortOrderId(effectiveOrderId)
  const effectiveOutletName =
    order?.shopId?.name || outletName || 'Campus Outlet'
  const effectiveCategory = order?.shopId?.category || ''
  const effectiveStatus = (order?.status || status || 'placed').toLowerCase()
  const effectiveItems = order?.items || items || []
  const effectiveTotal = order?.totalAmount ?? totalAmount
  const effectiveCreatedAt = order?.createdAt

  const instruction = useMemo(
    () => getPickupInstruction(effectiveStatus),
    [effectiveStatus]
  )

  // Generate QR code for the real order ID
  const qrData = useMemo(() => {
    if (!effectiveOrderId) return null
    return encodeQr(effectiveOrderId, 'M')
  }, [effectiveOrderId])

  const qrSvgPath = useMemo(() => {
    if (!qrData?.matrix) return ''
    return matrixToSvgPath(qrData.matrix, 4)
  }, [qrData])

  const handleCopyId = async () => {
    if (!effectiveOrderId) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(effectiveOrderId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // fallback if clipboard api restricted
    }
  }

  // ── 1. Loading Skeleton State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-border bg-surface p-6 shadow-sm text-text ${className}`.trim()}
        aria-busy="true"
        aria-label="Loading digital pickup card"
        {...props}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md bg-border/60" />
              <div className="h-3 w-20 rounded-md bg-border/40" />
            </div>
            <div className="h-6 w-24 rounded-full bg-border/50" />
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-48 w-48 rounded-2xl bg-border/40 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />
            </div>
            <div className="mt-4 h-4 w-28 rounded-md bg-border/50" />
          </div>

          <div className="h-16 w-full rounded-xl bg-border/30" />
        </div>
      </div>
    )
  }

  // ── 2. Empty State ────────────────────────────────────────────────────────
  if (!order && !effectiveOrderId) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border bg-surface/80 p-8 text-center text-text ${className}`.trim()}
        role="region"
        aria-label="Empty pickup card"
        {...props}
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
          🎟️
        </div>
        <h4 className="text-base font-bold text-text">No Pickup Order Found</h4>
        <p className="mt-1 text-xs text-muted-text max-w-xs mx-auto">
          Place or select a food order to view its digital counter pickup pass and QR code.
        </p>
      </div>
    )
  }

  const isReady = instruction.isReady
  const isCompleted = instruction.isCompleted
  const isCancelled = instruction.isCancelled

  const formattedDate = effectiveCreatedAt
    ? new Date(effectiveCreatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const qrTotalSize = (qrData?.size || 25) + 8

  // ── 3. Active / Rendered Pickup Card ──────────────────────────────────────
  return (
    <article
      id={`pickup-card-${cardId}`}
      aria-labelledby={`pickup-title-${cardId}`}
      className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border transition-all duration-200 bg-surface text-text shadow-sm overflow-hidden ${
        isReady
          ? 'border-success/60 ring-2 ring-success/30 shadow-md shadow-success/10'
          : isCompleted
            ? 'border-border/80 bg-surface/95'
            : isCancelled
              ? 'border-danger/40 bg-danger/5'
              : 'border-border hover:shadow-md'
      } ${className}`.trim()}
      {...props}
    >
      {/* Top Banner Accent: Status Dependent */}
      {isReady && (
        <div className="flex items-center justify-between gap-2 bg-success px-4 py-2 text-xs font-semibold text-white shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span>🔔 Ready for Pickup! Collect at Counter</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider opacity-90 hidden sm:inline">
            Show Pass Now
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center justify-between gap-2 bg-border/60 px-4 py-1.5 text-[11px] font-semibold text-muted-text">
          <div className="flex items-center gap-1.5">
            <span>✓</span>
            <span>Order Fulfilled & Collected</span>
          </div>
          <span>Archive</span>
        </div>
      )}

      {/* Header: Outlet Info, Badges & Close action */}
      <div className="flex items-start justify-between gap-4 border-b border-border/80 px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id={`pickup-title-${cardId}`}
              className="text-base sm:text-lg font-bold text-text truncate"
            >
              {effectiveOutletName}
            </h3>
            {effectiveCategory && (
              <Badge variant="default" size="sm" className="hidden sm:inline-flex capitalize">
                {effectiveCategory}
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-text">
            {formattedDate && <span>{formattedDate}</span>}
            {shortId && (
              <>
                <span>•</span>
                <span className="font-mono font-bold text-text">
                  {shortId}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={effectiveStatus} size="sm" />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close pickup card"
              className="rounded-lg p-1.5 text-muted-text hover:bg-background hover:text-text transition-colors cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Body: QR Code & Pickup Action */}
      <div className={`p-4 sm:p-6 space-y-4 ${compact ? 'space-y-3' : ''}`}>
        {/* Token Badges if present */}
        {(order?.orderToken || order?.pickupToken) && (
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            {order?.orderToken && (
              <div className="inline-block rounded-xl border border-primary/20 bg-primary/5 px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                  Order Token:{' '}
                </span>
                <span className="font-mono text-base font-bold text-primary">
                  {order.orderToken}
                </span>
              </div>
            )}
            {order?.pickupToken && (
              <p className="font-mono text-xs text-muted-text">
                Pickup Token: <span className="font-semibold text-text">{order.pickupToken}</span>
              </p>
            )}
          </div>
        )}

        {/* QR Code Presentation Frame */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={`relative rounded-2xl sm:rounded-3xl border p-3 sm:p-4 bg-white shadow-xs transition-transform ${
              isReady
                ? 'border-success/50 ring-4 ring-success/15 scale-102'
                : isCompleted
                  ? 'border-border/60 opacity-85'
                  : isCancelled
                    ? 'border-danger/30 opacity-60'
                    : 'border-border'
            }`}
          >
            {/* Scannable SVG QR Code */}
            {qrSvgPath ? (
              <div
                className={`relative flex items-center justify-center ${
                  compact ? 'h-36 w-36 sm:h-44 sm:w-44' : 'h-44 w-44 sm:h-52 sm:w-52'
                }`}
              >
                <svg
                  viewBox={`0 0 ${qrTotalSize} ${qrTotalSize}`}
                  className="w-full h-full"
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label={`Pickup QR code for order ${effectiveOrderId}`}
                >
                  <rect width="100%" height="100%" fill="#ffffff" rx="2" />
                  <path d={qrSvgPath} fill="#191412" />
                </svg>

                {/* Completed Watermark Overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/90 backdrop-blur-[1px] p-2 text-center animate-fade-in">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success text-2xl font-bold mb-1">
                      ✓
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-success">
                      Order Picked Up
                    </span>
                    <span className="text-[10px] text-muted-text mt-0.5">
                      Fulfilled at counter
                    </span>
                  </div>
                )}

                {/* Cancelled Watermark Overlay */}
                {isCancelled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/90 backdrop-blur-[1px] p-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger text-2xl font-bold mb-1">
                      ✕
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-danger">
                      Order Cancelled
                    </span>
                    <span className="text-[10px] text-muted-text mt-0.5">
                      Not eligible for pickup
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-muted-text">
                QR Unavailable
              </div>
            )}
          </div>

          {/* Order ID & 1-Click Copy Bar */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-text">
              Order ID:
            </span>
            <span className="font-mono text-sm font-bold text-text">
              {shortId || effectiveOrderId}
            </span>

            {effectiveOrderId && (
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy full Order ID"
                aria-label="Copy full Order ID"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-text hover:text-text hover:bg-surface transition-colors cursor-pointer"
              >
                {copied ? (
                  <span className="text-success font-semibold">✓ Copied</span>
                ) : (
                  <>
                    <svg
                      className="h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Clear "Show at counter" / Pickup Instruction Banner */}
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 text-xs sm:text-sm ${instruction.boxClasses}`}
          role="note"
          aria-label="Pickup Instruction"
        >
          <div className="flex items-start gap-2.5">
            <span
              className="text-lg shrink-0 leading-none mt-0.5"
              role="img"
              aria-hidden="true"
            >
              {instruction.icon}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h5 className="font-bold text-xs uppercase tracking-wide">
                  {instruction.title}
                </h5>
                <span className="text-[11px] font-semibold opacity-85">
                  Show at counter
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-95">
                {instruction.instruction}
              </p>
            </div>
          </div>
        </div>

        {/* Optional Order Items Snapshot */}
        {showDetails && effectiveItems.length > 0 && (
          <div className="rounded-xl border border-border bg-background/50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-muted-text text-[11px] font-semibold uppercase tracking-wider">
              <span>Items for Pickup</span>
              <span>
                {effectiveItems.length}{' '}
                {effectiveItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <ul className="space-y-1 divide-y divide-border/60">
              {effectiveItems.map((item, idx) => (
                <li
                  key={idx}
                  className={`flex items-center justify-between ${
                    idx > 0 ? 'pt-1' : ''
                  }`}
                >
                  <span className="truncate pr-2 font-medium text-text">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-text shrink-0">
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </span>
                </li>
              ))}
            </ul>

            {effectiveTotal !== undefined && effectiveTotal !== null && (
              <div className="flex items-center justify-between border-t border-border pt-2 text-xs font-bold">
                <span className="text-muted-text uppercase tracking-wider text-[11px]">
                  Total Paid
                </span>
                <span className="text-primary font-bold text-sm">
                  ₹{effectiveTotal}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Summary / Pickup Helper */}
      <div className="border-t border-border/80 bg-background/40 px-4 py-3 sm:px-6 flex items-center justify-between text-xs text-muted-text">
        <span className="flex items-center gap-1.5">
          <span className="text-sm">📍</span>
          <span>{effectiveOutletName} counter</span>
        </span>
        <span className="font-mono text-[11px] text-muted-text/80">
          ID: {effectiveOrderId ? effectiveOrderId.slice(-8) : 'N/A'}
        </span>
      </div>
    </article>
  )
}

