export default function Card({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  contentClassName = '',
  as: Component = 'div',
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || headerAction)

  if (!hasHeader && !footer) {
    return (
      <Component
        className={`rounded-2xl border border-border bg-surface p-6 text-text shadow-sm ${className}`.trim()}
        {...props}
      >
        {children}
      </Component>
    )
  }

  return (
    <Component
      className={`rounded-2xl border border-border bg-surface text-text shadow-sm ${className}`.trim()}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          {title && (
            <h3 className="text-lg font-bold text-text">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-muted-text">
              {subtitle}
            </p>
          )}
        </div>
        {headerAction && (
          <div className="shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      {children && (
        <div className={`p-6 ${contentClassName}`.trim()}>
          {children}
        </div>
      )}

      {footer && (
        <div className="border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </Component>
  )
}

