import { useEffect, useState } from 'react'

export interface OrderNotification {
  id: string
  orderId: string
  message: string
  type: 'new_order' | 'order_completed' | 'order_cancelled'
  timestamp: Date
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to order events via polling or WebSocket
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        if (response.ok) {
          const data = await response.json()
          const newNotifications = data.notifications || []
          
          if (newNotifications.length > 0) {
            const lastNotif = newNotifications[0]
            
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification('DEECHOI - New Order', {
                body: lastNotif.message,
                icon: '/logo-deechoi.png',
                badge: '/logo-deechoi.png',
                tag: 'deechoi-order',
                requireInteraction: true
              })
            }
            
            setNotifications(newNotifications)
            setUnreadCount(newNotifications.filter((n: { read: any }) => !n.read).length)
          }
        }
      } catch (error) {
        console.error('[v0] Notification fetch error:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ))
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAsRead, clearAll }
}
