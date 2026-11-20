import { useEffect } from 'react'
import Button from './Button'
import Badge from './Badge'
import NavIcon from './NavIcon'
import ThemeToggle from './ThemeToggle'
import { NAV_ITEMS } from './navigation'

export default function MobileNav({
  isOpen = false,
  onClose,
  currentPage = 'dashboard',
  onNavigate,
  onLogout,
}) {
  // Close drawer on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleItemClick = (id) => {
    onNavigate?.(id)
    onClose?.()
  }

  const handleLogoutClick = () => {
    onClose?.()
    onLogout?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shadow-sm">
              C
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold leading-tight text-primary">
                CampusHub
              </h2>
              <p className="text-xs text-muted-text">
                Campus Services
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="cursor-pointer rounded-lg p-1.5 text-muted-text transition-colors hover:bg-background hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav
          className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4"
          aria-label="Mobile Main Navigation"
        >
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-text">
            Navigation
          </p>

          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary font-semibold text-white shadow-sm'
                    : 'font-medium text-text hover:bg-background hover:text-primary'
                }`}
              >
                <NavIcon
                  id={item.id}
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-white' : 'text-muted-text group-hover:text-primary'
                  }`}
                />
                <div className="flex flex-col text-left">
                  <span className="leading-none">{item.label}</span>
                  <span
                    className={`mt-1 text-[11px] ${
                      isActive ? 'text-white/80' : 'text-muted-text'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Theme Preference */}
        <div className="border-t border-border bg-surface px-4 py-3">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-text">
            Theme
          </p>
          <ThemeToggle variant="segmented" />
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              S
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text">
                Student Account
              </p>
              <Badge size="sm" variant="success" className="mt-0.5">
                Active
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleLogoutClick}
            className="mt-3"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
