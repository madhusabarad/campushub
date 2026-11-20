import { useState } from 'react'
import Button from './Button'
import Badge from './Badge'
import NotificationDropdown from './NotificationDropdown'
import { useOrderNotifications } from '../context/OrderNotificationContext'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  menu: 'Food Outlets & Menu',
  cart: 'Shopping Cart',
  xerox: 'Campus Xerox & Printing',
  'xerox-history': 'Xerox Order History',
  'my-orders': 'My Orders',
}

export default function Topbar({
  currentPage = 'dashboard',
  onNavigate,
  onLogout,
  onOpenCart,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  className = '',
}) {
  const pageTitle = PAGE_TITLES[currentPage] || 'CampusHub'
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Safely consume context if wrapped in OrderNotificationProvider
  let notifications = []
  let unreadCount = 0
  let loadingNotifications = false
  let markAsRead = null
  let markAllAsRead = null
  let clearNotification = null
  let clearAllNotifications = null
  let setSelectedOrderId = null

  try {
    const ctx = useOrderNotifications()
    notifications = ctx.notifications
    unreadCount = ctx.unreadCount
    loadingNotifications = ctx.loadingOrders
    markAsRead = ctx.markAsRead
    markAllAsRead = ctx.markAllAsRead
    clearNotification = ctx.clearNotification
    clearAllNotifications = ctx.clearAllNotifications
    setSelectedOrderId = ctx.setSelectedOrderId
  } catch {
    // Topbar rendered outside provider fallback
  }

  const handleSelectNotification = (item) => {
    if (item.orderId && setSelectedOrderId) {
      setSelectedOrderId(item.orderId)
    }
    setIsNotificationsOpen(false)
    if (currentPage !== 'dashboard' && onNavigate) {
      onNavigate('dashboard')
    }
  }

  return (
    <header
      className={`sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 shadow-xs sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMobileMenuOpen}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile branding */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            C
          </div>
          <span className="font-sans text-lg font-bold text-primary">
            CampusHub
          </span>
        </div>

        {/* Desktop breadcrumb */}
        <div className="hidden items-center gap-2 text-sm lg:flex">
          <span className="text-muted-text">CampusHub</span>
          <span className="text-muted-text">/</span>
          <span className="font-semibold text-text">{pageTitle}</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="default" size="sm" className="hidden sm:inline-flex">
          Student Portal
        </Badge>

        {/* Notification Bell Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isNotificationsOpen
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text hover:bg-background'
            }`}
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>

            {/* Unread badge / dot */}
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-xs"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loadingNotifications}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
            onClearNotification={clearNotification}
            onClearAll={clearAllNotifications}
            onSelectNotification={handleSelectNotification}
          />
        </div>

        {/* Cart Quick Access */}
        <Button
          type="button"
          variant={currentPage === 'cart' ? 'primary' : 'outline'}
          size="sm"
          onClick={onOpenCart || (() => onNavigate?.('cart'))}
          aria-label="View shopping cart"
          className="gap-2"
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
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span className="hidden sm:inline">Cart</span>
        </Button>

        {/* Logout button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          aria-label="Log out"
        >
          Logout
        </Button>
      </div>
    </header>
  )
}
