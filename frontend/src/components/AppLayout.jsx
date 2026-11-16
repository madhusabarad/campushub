import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'
import ToastContainer from './ToastContainer'
import { useOrderNotifications } from '../context/OrderNotificationContext'

export default function AppLayout({
  children,
  currentPage = 'dashboard',
  onNavigate,
  onLogout,
  onOpenCart,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  let toasts = []
  let dismissToast = null

  try {
    const ctx = useOrderNotifications()
    toasts = ctx.toasts
    dismissToast = ctx.dismissToast
  } catch {
    // fallback if outside provider
  }

  return (
    <div className="flex min-h-screen bg-background text-text">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        className="hidden lg:flex"
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          currentPage={currentPage}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onOpenCart={onOpenCart}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* Order Status Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
