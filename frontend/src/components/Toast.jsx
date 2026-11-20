import { useEffect } from 'react'
import OrderStatusBadge from './OrderStatusBadge'

export default function Toast({
  id,
  title,
  message,
  status = 'placed',
  onDismiss,
  duration = 5000,
}) {
  useEffect(() => {
    if (!duration || duration <= 0) return

    const timer = setTimeout(() => {
      onDismiss?.(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  const getStatusIcon = (st) => {
    switch (st) {
      case 'ready':
        return '🔔'
      case 'preparing':
        return '🍳'
      case 'confirmed':
        return '✓'
      case 'completed':
        return '🎉'
      case 'cancelled':
        return '✕'
      case 'placed':
      default:
        return '📝'
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex w-full transform items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Icon Badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
        {getStatusIcon(status)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-text truncate">
            {title || 'Order Update'}
          </p>
          <OrderStatusBadge status={status} size="sm" showDot={false} />
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted-text">
          {message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss?.(id)}
        aria-label="Dismiss toast"
        className="shrink-0 rounded-lg p-1 text-muted-text hover:bg-background hover:text-text transition-colors cursor-pointer"
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
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

