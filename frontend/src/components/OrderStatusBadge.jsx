import Badge from './Badge'
import { getStatusBadge } from '../utils/orderTimeline'

export default function OrderStatusBadge({
  status = 'placed',
  size = 'sm',
  showDot = true,
  className = '',
  ...props
}) {
  const config = getStatusBadge(status)
  const isPulsing = status === 'preparing' || status === 'ready'

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={`inline-flex items-center gap-1.5 font-semibold ${className}`.trim()}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {isPulsing && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotColor}`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${config.dotColor}`}
          />
        </span>
      )}
      <span>{config.label}</span>
    </Badge>
  )
}

