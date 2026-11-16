import Badge from './Badge'
import OrderStatusBadge from './OrderStatusBadge'
import {
  TIMELINE_STEPS,
  getStepState,
  getTimelineStepIndex,
} from '../utils/orderTimeline'

export default function OrderStatusTimeline({
  status = 'placed',
  showCurrentBadge = true,
  className = '',
}) {
  const currentStepIdx = getTimelineStepIndex(status)
  const isCancelled = currentStepIdx === -1

  // Calculate progress percentage for progress bar
  const progressPercent = isCancelled
    ? 0
    : Math.min(100, Math.max(0, (currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100))

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs ${className}`.trim()}
      role="region"
      aria-label="Order Status Progress"
    >
      {/* Header with current status summary */}
      {showCurrentBadge && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-text">
              Order Status
            </span>
            <OrderStatusBadge status={status} size="sm" />
          </div>

          <div className="text-xs text-muted-text">
            {isCancelled ? (
              <Badge variant="danger" size="sm">
                Cancelled
              </Badge>
            ) : status === 'completed' ? (
              <span className="font-medium text-success">
                ✓ Order Completed
              </span>
            ) : (
              <span>
                Step {Math.max(1, currentStepIdx + 1)} of {TIMELINE_STEPS.length}
              </span>
            )}
          </div>
        </div>
      )}

      {isCancelled ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger text-lg font-bold">
            ✕
          </div>
          <h4 className="mt-2 text-sm font-bold text-danger">
            Order Was Cancelled
          </h4>
          <p className="mt-1 text-xs text-muted-text">
            This order is no longer in progress. If you need assistance, please contact the campus outlet.
          </p>
        </div>
      ) : (
        <div>
          {/* Desktop & Tablet: Horizontal Flow */}
          <div className="hidden sm:block">
            {/* Steps Row */}
            <div className="relative flex items-center justify-between">
              {/* Background Connecting Line */}
              <div
                className="absolute top-4 left-6 right-6 h-1 bg-border -translate-y-1/2"
                aria-hidden="true"
              >
                {/* Active Progress Fill */}
                <div
                  className="h-full bg-success transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {TIMELINE_STEPS.map((step, idx) => {
                const state = getStepState(step.key, status)
                const isCompleted = state === 'completed'
                const isCurrent = state === 'current'

                return (
                  <div
                    key={step.key}
                    className="relative z-10 flex flex-col items-center text-center"
                    style={{ flex: 1 }}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {/* Circle Node */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                        isCompleted
                          ? 'bg-success text-white shadow-xs'
                          : isCurrent
                            ? 'bg-primary text-white ring-4 ring-primary/25 shadow-sm scale-110'
                            : 'border-2 border-border bg-surface text-muted-text'
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="h-4 w-4 stroke-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isCurrent ? (
                        <span>{step.icon}</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`mt-2 text-xs transition-colors ${
                        isCurrent
                          ? 'font-bold text-primary'
                          : isCompleted
                            ? 'font-semibold text-text'
                            : 'font-medium text-muted-text/70'
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* Step Subtitle */}
                    <span
                      className={`text-[10px] hidden md:block max-w-[90px] leading-tight ${
                        isCurrent
                          ? 'text-primary/80 font-medium'
                          : 'text-muted-text/60'
                      }`}
                    >
                      {step.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: Horizontal Step Ribbon / Compact Stacking */}
          <div className="block sm:hidden">
            {/* Step Pills Row */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              {TIMELINE_STEPS.map((step, idx) => {
                const state = getStepState(step.key, status)
                const isCompleted = state === 'completed'
                const isCurrent = state === 'current'

                return (
                  <div
                    key={step.key}
                    className="flex flex-1 items-center"
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-success text-white'
                            : isCurrent
                              ? 'bg-primary text-white ring-2 ring-primary/30'
                              : 'border border-border bg-background text-muted-text'
                        }`}
                      >
                        {isCompleted ? '✓' : isCurrent ? step.icon : idx + 1}
                      </div>
                      <span
                        className={`mt-1 text-[10px] text-center truncate w-full ${
                          isCurrent
                            ? 'font-bold text-primary'
                            : isCompleted
                              ? 'font-medium text-text'
                              : 'text-muted-text/70'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-2 shrink-0 ${
                          idx < currentStepIdx ? 'bg-success' : 'bg-border'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Current Step Banner for Mobile */}
            {currentStepIdx >= 0 && currentStepIdx < TIMELINE_STEPS.length && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs">
                <span className="text-base" role="img" aria-hidden="true">
                  {TIMELINE_STEPS[currentStepIdx].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">
                    Current:{' '}
                    <span className="text-primary">
                      {TIMELINE_STEPS[currentStepIdx].label}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-text truncate">
                    {TIMELINE_STEPS[currentStepIdx].description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
