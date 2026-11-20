import Button from './Button'
import Badge from './Badge'
import NavIcon from './NavIcon'
import { NAV_ITEMS } from './navigation'

export default function Sidebar({
  currentPage = 'dashboard',
  onNavigate,
  onLogout,
  className = '',
}) {
  return (
    <aside
      className={`sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-border bg-surface ${className}`.trim()}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
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

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4" aria-label="Sidebar Navigation">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-text">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
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

      {/* User Section & Logout */}
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
          onClick={onLogout}
          className="mt-3"
        >
          Logout
        </Button>
      </div>
    </aside>
  )
}
