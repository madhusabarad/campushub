/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { buildStatusNotification } from '../utils/orderTimeline'

const OrderNotificationContext = createContext(null)

const NOTIFICATIONS_STORAGE_KEY = 'campushub_notifications'
const KNOWN_STATUSES_STORAGE_KEY = 'campushub_known_statuses'
const POLL_INTERVAL_MS = 12000

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
    // ignore local storage quota / security errors
  }
}

export function OrderNotificationProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [notifications, setNotifications] = useState(() =>
    loadStoredJson(NOTIFICATIONS_STORAGE_KEY, [])
  )
  const [toasts, setToasts] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const knownStatusesRef = useRef(
    loadStoredJson(KNOWN_STATUSES_STORAGE_KEY, {})
  )

  // Keep localStorage synced when notifications change
  useEffect(() => {
    saveStoredJson(NOTIFICATIONS_STORAGE_KEY, notifications)
  }, [notifications])

  // Toast management
  const addToast = useCallback((toastData) => {
    const id = toastData.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { ...toastData, id }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Notification management
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Explicitly notify about an order update (e.g. right after checkout)
  const notifyOrderStatus = useCallback(
    (order, previousStatus = null) => {
      if (!order || !order._id) return

      const notif = buildStatusNotification(order, previousStatus)
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)])

      // Trigger Toast notification
      addToast({
        title: notif.title,
        message: notif.message,
        status: notif.status,
      })

      // Update known statuses
      knownStatusesRef.current[order._id] = order.status
      saveStoredJson(KNOWN_STATUSES_STORAGE_KEY, knownStatusesRef.current)
    },
    [addToast]
  )

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('campushub_token')
    if (!token) {
      setOrders([])
      setLoadingOrders(false)
      return
    }

    try {
      const [response, shopsRes] = await Promise.all([
        fetch('/api/orders?limit=10', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/shops?limit=100').catch(() => null),
      ])

      if (!response.ok) {
        setLoadingOrders(false)
        return
      }

      const result = await response.json()
      let shopsMap = new Map()
      if (shopsRes && shopsRes.ok) {
        const shopsData = await shopsRes.json().catch(() => ({}))
        if (Array.isArray(shopsData.data)) {
          shopsMap = new Map(shopsData.data.map((s) => [String(s._id), s]))
        }
      }

      const rawList = Array.isArray(result.data) ? result.data : []
      const orderList = rawList.map((order) => {
        const shopId = order.shopId?._id || order.shopId
        const fullShop = shopId ? shopsMap.get(String(shopId)) : null
        return {
          ...order,
          shop: fullShop || order.shopId,
          shopId: {
            ...(typeof order.shopId === 'object' ? order.shopId : {}),
            ...(fullShop || {}),
          },
        }
      })
      setOrders(orderList)

      const known = { ...knownStatusesRef.current }
      let hasChanges = false
      const newNotifications = []
      const newToasts = []

      const isFirstLoad = Object.keys(known).length === 0

      for (const order of orderList) {
        const orderId = order._id
        if (!orderId) continue

        const currentStatus = (order.status || 'placed').toLowerCase()
        const prevStatus = known[orderId]

        if (!prevStatus) {
          // Newly encountered order
          known[orderId] = currentStatus
          hasChanges = true

          // On first load, seed active orders into notifications if empty
          if (isFirstLoad && notifications.length === 0) {
            const seedNotif = buildStatusNotification(order)
            newNotifications.push({ ...seedNotif, read: currentStatus === 'completed' })
          }
        } else if (prevStatus !== currentStatus) {
          // Status has changed!
          known[orderId] = currentStatus
          hasChanges = true

          const statusNotif = buildStatusNotification(order, prevStatus)
          newNotifications.push(statusNotif)
          newToasts.push({
            title: statusNotif.title,
            message: statusNotif.message,
            status: statusNotif.status,
          })
        }
      }

      if (hasChanges) {
        knownStatusesRef.current = known
        saveStoredJson(KNOWN_STATUSES_STORAGE_KEY, known)
      }

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev])
      }

      for (const toast of newToasts) {
        addToast(toast)
      }
    } catch {
      // network/fetch errors handled gracefully
    } finally {
      setLoadingOrders(false)
    }
  }, [addToast, notifications.length])

  // Periodic polling when authenticated
  useEffect(() => {
    let isMounted = true

    const runFetch = async () => {
      if (isMounted) {
        await fetchOrders()
      }
    }

    const timer = setTimeout(() => {
      runFetch()
    }, 0)

    const interval = setInterval(() => {
      const token = localStorage.getItem('campushub_token')
      if (token && isMounted) {
        runFetch()
      }
    }, POLL_INTERVAL_MS)

    return () => {
      isMounted = false
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchOrders])

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
      selectedOrderId,
      setSelectedOrderId,
      addToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      notifyOrderStatus,
      refreshOrders: fetchOrders,
    }),
    [
      orders,
      loadingOrders,
      notifications,
      unreadCount,
      toasts,
      selectedOrderId,
      addToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      notifyOrderStatus,
      fetchOrders,
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
    throw new Error(
      'useOrderNotifications must be used within an OrderNotificationProvider'
    )
  }
  return context
}
