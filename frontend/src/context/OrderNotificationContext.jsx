import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

const OrderNotificationContext = createContext(null)

const NOTIFICATIONS_STORAGE_KEY = 'campushub_notifications'
const KNOWN_STATUSES_STORAGE_KEY = 'campushub_known_statuses'
const POLL_INTERVAL_MS = 12000

function getStoredRole() {
  try {
    const directRole = localStorage.getItem('campushub_role')
    if (directRole) return directRole

    const userRaw = localStorage.getItem('campushub_user')
    if (userRaw) {
      const parsed = JSON.parse(userRaw)
      if (parsed?.role) return parsed.role
    }

    const token = localStorage.getItem('campushub_token')
    if (token) {
      const payload = token.split('.')[1]
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = JSON.parse(atob(base64))
      if (decoded?.role) return decoded.role
    }
  } catch {
    // ignore
  }
  return null
}

function loadStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveStoredJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore quota errors
  }
}

export function OrderNotificationProvider({ children, role: roleProp }) {
  const initialRole = roleProp || getStoredRole()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(initialRole === 'student')
  const [notifications, setNotifications] = useState(() =>
    loadStoredJson(NOTIFICATIONS_STORAGE_KEY, [])
  )
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((notification) => {
    const toastId = `${notification.id}-${Date.now()}`
    setToasts((prev) => [...prev, { ...notification, toastId }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
    }, 6000)
  }, [])

  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
  }, [])

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
      saveStoredJson(NOTIFICATIONS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      saveStoredJson(NOTIFICATIONS_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    saveStoredJson(NOTIFICATIONS_STORAGE_KEY, [])
  }, [])

  const createNotification = useCallback(
    (order, newStatus) => {
      const id = `${order._id || order.id}-${newStatus}-${Date.now()}`
      const shopName = order.shopId?.name || order.shopName || 'Shop'
      const token = order.orderToken ? `(#${order.orderToken})` : ''

      const statusMessages = {
        preparing: `Your order from ${shopName} ${token} is now being prepared!`,
        ready: `Your order from ${shopName} ${token} is READY for pickup!`,
        completed: `Your order from ${shopName} ${token} has been completed. Enjoy!`,
        cancelled: `Your order from ${shopName} ${token} was cancelled.`,
      }

      const message =
        statusMessages[newStatus] ||
        `Your order from ${shopName} ${token} status changed to ${newStatus}.`

      const notification = {
        id,
        orderId: order._id || order.id,
        orderToken: order.orderToken,
        shopName,
        status: newStatus,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      }

      setNotifications((prev) => {
        const updated = [notification, ...prev].slice(0, 50)
        saveStoredJson(NOTIFICATIONS_STORAGE_KEY, updated)
        return updated
      })

      addToast(notification)
    },
    [addToast]
  )

  // Fetch orders from API - strictly only when role is 'student'
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('campushub_token')
    const currentRole = roleProp || getStoredRole()

    if (!token || currentRole !== 'student') {
      setOrders([])
      setLoadingOrders(false)
      return
    }

    try {
      const response = await fetch('/api/orders?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401 || response.status === 403) {
        setOrders([])
        setLoadingOrders(false)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      const fetchedOrders = data.data || data.orders || []

      const knownStatuses = loadStoredJson(KNOWN_STATUSES_STORAGE_KEY, {})
      const updatedStatuses = { ...knownStatuses }
      const isFirstLoad = Object.keys(knownStatuses).length === 0 && notifications.length === 0

      fetchedOrders.forEach((order) => {
        const orderId = order._id || order.id
        const currentStatus = order.status
        const previousStatus = knownStatuses[orderId]

        if (!isFirstLoad && previousStatus && previousStatus !== currentStatus) {
          createNotification(order, currentStatus)
        }

        updatedStatuses[orderId] = currentStatus
      })

      saveStoredJson(KNOWN_STATUSES_STORAGE_KEY, updatedStatuses)
      setOrders(fetchedOrders)
    } catch {
      // Background polling failures are silent
    } finally {
      setLoadingOrders(false)
    }
  }, [addToast, notifications.length, roleProp, createNotification])

  // Periodic polling when authenticated as student
  useEffect(() => {
    const currentRole = roleProp || getStoredRole()
    if (currentRole !== 'student') {
      return
    }

    let isMounted = true

    const runFetch = async () => {
      const activeRole = roleProp || getStoredRole()
      if (isMounted && activeRole === 'student') {
        await fetchOrders()
      }
    }

    const timer = setTimeout(runFetch, 1000)

    const interval = setInterval(() => {
      const token = localStorage.getItem('campushub_token')
      const activeRole = roleProp || getStoredRole()
      if (token && activeRole === 'student' && isMounted) {
        runFetch()
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      isMounted = false
    }
  }, [fetchOrders, roleProp])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const value = useMemo(
    () => ({
      orders,
      loadingOrders,
      notifications,
      unreadCount,
      toasts,
      refetchOrders: fetchOrders,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      removeToast,
    }),
    [
      orders,
      loadingOrders,
      notifications,
      unreadCount,
      toasts,
      fetchOrders,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      removeToast,
    ]
  )

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  )
}

export function useOrderNotifications() {
  const context = useContext(OrderNotificationContext)
  if (!context) {
    return {
      orders: [],
      loadingOrders: false,
      notifications: [],
      unreadCount: 0,
      toasts: [],
      refetchOrders: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAllNotifications: () => {},
      removeToast: () => {},
    }
  }
  return context
}
