export const TIMELINE_STEPS = [
  {
    key: 'placed',
    label: 'Placed',
    description: 'Order submitted',
    icon: '📝',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    description: 'Outlet accepted',
    icon: '✓',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Kitchen is preparing',
    icon: '🍳',
  },
  {
    key: 'ready',
    label: 'Ready',
    description: 'Ready for pickup',
    icon: '🔔',
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Order fulfilled',
    icon: '🎉',
  },
]

export const STATUS_BADGE_CONFIG = {
  placed: {
    label: 'Placed',
    variant: 'warning',
    dotColor: 'bg-warning',
    description: 'Order received by outlet',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'info',
    dotColor: 'bg-blue-500',
    description: 'Order confirmed by outlet',
  },
  preparing: {
    label: 'Preparing',
    variant: 'warning',
    dotColor: 'bg-amber-500',
    description: 'Food is being prepared',
  },
  ready: {
    label: 'Ready for Pickup',
    variant: 'success',
    dotColor: 'bg-success',
    description: 'Ready at outlet counter',
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    dotColor: 'bg-success',
    description: 'Order collected',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'danger',
    dotColor: 'bg-danger',
    description: 'Order was cancelled',
  },
}

/**
 * Returns the numerical index (0-4) of the order's progress in the 5-step timeline.
 * If cancelled, returns -1.
 */
export function getTimelineStepIndex(status) {
  const normalized = (status || '').toLowerCase().trim()

  switch (normalized) {
    case 'placed':
      return 0
    case 'confirmed':
      return 1
    case 'preparing':
      return 2
    case 'ready':
      return 3
    case 'completed':
      return 4
    case 'cancelled':
      return -1
    default:
      return 0
  }
}

/**
 * Determines whether a given step in the timeline is completed, current (active), or upcoming.
 *
 * @param {string} stepKey - 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed'
 * @param {string} currentStatus - order's current status string
 * @returns {'completed' | 'current' | 'upcoming' | 'cancelled'}
 */
export function getStepState(stepKey, currentStatus) {
  const currentIdx = getTimelineStepIndex(currentStatus)
  if (currentIdx === -1) {
    return 'cancelled'
  }

  const stepIdx = TIMELINE_STEPS.findIndex((s) => s.key === stepKey)
  if (stepIdx === -1) return 'upcoming'

  if (currentIdx === 4) {
    // If completed, all 5 steps are completed!
    return 'completed'
  }

  if (stepIdx < currentIdx) {
    return 'completed'
  }

  if (stepIdx === currentIdx) {
    return 'current'
  }

  return 'upcoming'
}

/**
 * Returns badge configuration for any status.
 */
export function getStatusBadge(status) {
  const normalized = (status || '').toLowerCase().trim()
  return (
    STATUS_BADGE_CONFIG[normalized] || {
      label: status || 'Unknown',
      variant: 'default',
      dotColor: 'bg-muted-text',
      description: 'Order status unknown',
    }
  )
}

/**
 * Generates user-facing notification details for an order status update.
 */
export function buildStatusNotification(order) {
  const orderId = order?._id || order?.id || ''
  const shortId = orderId ? `#${orderId.slice(-6).toUpperCase()}` : 'Order'
  const shopName = order?.shopId?.name || 'Campus Outlet'
  const status = (order?.status || 'placed').toLowerCase()

  switch (status) {
    case 'ready':
      return {
        id: `notif-${orderId}-ready-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} is Ready for Pickup!`,
        message: `Your food from ${shopName} is hot and ready at the counter.`,
        type: 'ready',
        timestamp: new Date().toISOString(),
      }
    case 'preparing':
      return {
        id: `notif-${orderId}-prep-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} is Preparing`,
        message: `${shopName} kitchen has started preparing your order.`,
        type: 'preparing',
        timestamp: new Date().toISOString(),
      }
    case 'confirmed':
      return {
        id: `notif-${orderId}-conf-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} Confirmed`,
        message: `${shopName} accepted your order and will begin preparation shortly.`,
        type: 'confirmed',
        timestamp: new Date().toISOString(),
      }
    case 'completed':
      return {
        id: `notif-${orderId}-comp-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} Completed`,
        message: `Order fulfilled. Enjoy your meal from ${shopName}!`,
        type: 'completed',
        timestamp: new Date().toISOString(),
      }
    case 'cancelled':
      return {
        id: `notif-${orderId}-canc-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} Cancelled`,
        message: `Your order from ${shopName} has been cancelled.`,
        type: 'cancelled',
        timestamp: new Date().toISOString(),
      }
    case 'placed':
    default:
      return {
        id: `notif-${orderId}-placed-${Date.now()}`,
        orderId,
        shortId,
        shopName,
        status,
        title: `Order ${shortId} Placed`,
        message: `Order sent to ${shopName}. You will receive updates as it progresses.`,
        type: 'placed',
        timestamp: new Date().toISOString(),
      }
  }
}
