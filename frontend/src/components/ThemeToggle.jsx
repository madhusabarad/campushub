import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({
  className = '',
  variant = 'button', // 'button' | 'segmented' | 'compact'
  align = 'right', // 'right' | 'left'
}) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Sun Icon SVG (Light mode)
  const SunIcon = ({ className = 'h-5 w-5' }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      />
    </svg>
  )

  // Moon Icon SVG (Dark mode)
  const MoonIcon = ({ className = 'h-5 w-5' }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  )

  // Monitor/Desktop Icon SVG (System mode)
  const SystemIcon = ({ className = 'h-5 w-5' }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
  )

  if (variant === 'segmented') {
    return (
      <div
        className={`flex items-center rounded-xl border border-border bg-background/60 p-1 ${className}`.trim()}
        role="group"
        aria-label="Theme mode selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted-text hover:text-text'
          }`}
        >
          <SunIcon className="h-4 w-4" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted-text hover:text-text'
          }`}
        >
          <MoonIcon className="h-4 w-4" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-muted-text hover:text-text'
          }`}
        >
          <SystemIcon className="h-4 w-4" />
          <span>System</span>
        </button>
      </div>
    )
  }

  // Active display icon reflects current theme choice
  const CurrentIcon =
    theme === 'system'
      ? resolvedTheme === 'dark'
        ? MoonIcon
        : SunIcon
      : theme === 'dark'
        ? MoonIcon
        : SunIcon

  return (
    <div className={`relative inline-block text-left ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Theme: ${theme} (currently ${resolvedTheme}). Click to choose theme.`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        data-testid="theme-toggle"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text shadow-xs transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CurrentIcon className="h-5 w-5 text-text" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-36 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('light')
              setIsOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'light'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-text hover:bg-background'
            }`}
          >
            <div className="flex items-center gap-2">
              <SunIcon className="h-4 w-4" />
              <span>Light</span>
            </div>
            {theme === 'light' && <span className="text-primary font-bold">✓</span>}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('dark')
              setIsOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-text hover:bg-background'
            }`}
          >
            <div className="flex items-center gap-2">
              <MoonIcon className="h-4 w-4" />
              <span>Dark</span>
            </div>
            {theme === 'dark' && <span className="text-primary font-bold">✓</span>}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('system')
              setIsOpen(false)
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              theme === 'system'
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-text hover:bg-background'
            }`}
          >
            <div className="flex items-center gap-2">
              <SystemIcon className="h-4 w-4" />
              <span>System</span>
            </div>
            {theme === 'system' && <span className="text-primary font-bold">✓</span>}
          </button>
        </div>
      )}
    </div>
  )
}
