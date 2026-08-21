import { useCallback, useEffect, useRef, useState } from "react"
import { platformService } from "../services/platform-service"
import type { PlatformNotification } from "../types/platform"
import type { NotificationPreferences } from "../org/types"
import type { NotificationToast } from "./useNotifications"

const POLL_INTERVAL_MS = 30_000

/**
 * Platform-scoped notification state for platform staff. Polls the platform
 * feed for new notifications and keeps the unread badge fresh. Uses the same
 * delivery model as the org bell (polling — no persistent socket on cPanel).
 */
export function usePlatformNotifications() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<NotificationPreferences>({ soundEnabled: true, toastEnabled: true })
  const [toasts, setToasts] = useState<NotificationToast[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  const pushToast = useCallback((n: PlatformNotification) => {
    setToasts((prev) => [...prev, {
      id: n.id,
      title: n.title,
      body: n.description,
      priority: n.priority,
      actionPath: n.actionPath,
    }].slice(-3))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        platformService.getNotifications({ perPage: 50 }),
        platformService.getPlatformUnreadCount(),
      ])

      const incoming = list.items.filter((n) => !seenIds.current.has(n.id))
      incoming.forEach((n) => seenIds.current.add(n.id))

      if (incoming.length > 0) {
        setNotifications((prev) => {
          const merged = [...incoming, ...prev]
          return merged.filter((n, i) => merged.findIndex((m) => m.id === n.id) === i).slice(0, 50)
        })

        incoming.forEach((n) => {
          if (n.priority === "warning" || n.priority === "critical") pushToast(n)
        })
      }

      setUnreadCount(unread)
    } catch {
      // Transient poll failure; next tick retries.
    }
  }, [pushToast])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const [list, unread] = await Promise.all([
          platformService.getNotifications({ perPage: 50 }),
          platformService.getPlatformUnreadCount(),
        ])
        if (cancelled) return
        setNotifications(list.items)
        setUnreadCount(unread)
        list.items.forEach((n) => seenIds.current.add(n.id))
      } catch {
        // Initial load failure surfaces through the bell's empty state.
      }
    }

    void bootstrap()
    const timer = window.setInterval(() => { void refresh() }, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await platformService.markPlatformNotificationRead(id)
    } catch {
      // Optimistic; reconciled on next poll.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await platformService.markAllNotificationsRead()
    } catch {
      // Optimistic; reconciled on next poll.
    }
  }, [])

  const updatePreferences = useCallback(async (patch: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }))
  }, [])

  return {
    notifications,
    unreadCount,
    toasts,
    preferences,
    markRead,
    markAllRead,
    updatePreferences,
    dismissToast,
  }
}
