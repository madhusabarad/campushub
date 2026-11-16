import { useEffect, useRef } from 'react'
import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import OrderStatusBadge from './OrderStatusBadge'

function formatNotificationTime(isoString) {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkAllAsRead,
  onMarkAsRead,
  onClearNotification,
  onClearAll,
  onSelectNotification,
}) {
  const panelRef = useRef(null)

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.()
      }
    }

    // Delay slightly to avoid catching the toggle button click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

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
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="fixed inset-x-3 top-18 z-50 sm:absolute sm:right-0 sm:top-full sm:inset-auto sm:mt-2 sm:w-96"
        role="dialog"
        aria-label="Order Notifications"
      >
        <Card
          className="border-border bg-surface shadow-2xl p-0 overflow-hidden"
          title={
            <div className="flex items-center gap-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="warning" size="sm">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          }
          headerAction={
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && onMarkAllAsRead && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs py-1 px-2"
                >
                  Mark all read
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close notification panel"
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
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          }
        >
          {/* Panel Content */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-xs font-medium text-muted-text">
                  Checking order updates...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-2xl text-muted-text">
                  🔔
                </div>
                <h4 className="text-sm font-semibold text-text">
                  No notifications yet
                </h4>
                <p className="mt-1 text-xs text-muted-text max-w-xs mx-auto">
                  You will receive live status updates here as your food orders are prepared.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70" role="list">
                {notifications.map((item) => {
                  const isUnread = !item.read

                  return (
                    <li
                      key={item.id}
                      onClick={() => {
                        if (isUnread && onMarkAsRead) {
                          onMarkAsRead(item.id)
                        }
                        if (onSelectNotification) {
                          onSelectNotification(item)
                        }
                      }}
                      className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                        isUnread
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-background/80'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-base shadow-2xs">
                        {getStatusIcon(item.status)}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs truncate ${
                              isUnread
                                ? 'font-bold text-text'
                                : 'font-medium text-muted-text'
                            }`}
                          >
                            {item.title}
                          </p>
                          <span className="text-[10px] text-muted-text shrink-0">
                            {formatNotificationTime(item.timestamp)}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-muted-text leading-snug line-clamp-2">
                          {item.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <OrderStatusBadge
                            status={item.status}
                            size="sm"
                            className="text-[11px]"
                          />

                          {onClearNotification && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onClearNotification(item.id)
                              }}
                              aria-label="Remove notification"
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] text-muted-text hover:text-danger transition-all cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && onClearAll && (
            <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-2.5">
              <span className="text-xs text-muted-text">
                {notifications.length}{' '}
                {notifications.length === 1 ? 'notification' : 'notifications'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-xs py-1 px-2.5"
              >
                Clear all
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

