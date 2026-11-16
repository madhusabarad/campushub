import { useId } from 'react'

export default function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className={`w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted-text/60 outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60 ${
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
            : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
        } ${className}`.trim()}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-muted-text">
          {helperText}
        </p>
      )}
    </div>
  )
}

