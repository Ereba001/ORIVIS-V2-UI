import { useCallback, useEffect, useRef, useState } from "react"
import { orgService } from "../services/org-service"
import type { NotificationPreferences, OrgNotification } from "../org/types"

const POLL_INTERVAL_MS = 25_000

/** A toast surfaced from a newly arrived notification. */
export interface NotificationToast {
  id: string
  title: string
  body: string
  priority: OrgNotification["priority"]
  actionPath?: string
}

const PRIORITY_SOUND = new Map<OrgNotification["priority"], number>([
  ["info", 660],
  ["success", 880],
  ["warning", 440],
  ["critical", 220],
])

/**
 * Play a short, unobtrusive two-note chime through the Web Audio API. No asset
 * file is required and it respects the user's sound preference.
 */
function playChime(priority: OrgNotification["priority"]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const base = PRIORITY_SOUND.get(priority) ?? 660
    const notes = priority === "critical" ? [base, base * 0.75] : [base, base * 1.25]

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + i * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.09)
      osc.stop(ctx.currentTime + i * 0.09 + 0.4)
    })

    // Release the context shortly after the notes finish.
    window.setTimeout(() => { void ctx.close().catch(() => {}) }, 1200)
  } catch {
    // Sound is a nice-to-have; never let it break the notification flow.
  }
}

/**
 * Tenancy-aware notification state for an org-scoped user. Polls the backend
 * for new notifications, keeps an unread count, surfaces toasts for new items
 * (with priority styling + optional sound), and exposes read/dismiss actions.
 *
 * Polling (not websockets) is the production delivery mechanism here: ORIVIS
 * runs on shared cPanel hosting with no persistent worker or socket server, and
 * the 25s poll keeps the bell fresh without holding connections open.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<OrgNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<NotificationPreferences>({ soundEnabled: true, toastEnabled: true })
  const [toasts, setToasts] = useState<NotificationToast[]>([])
  const lastSeenId = useRef(0)
  const seenIds = useRef<Set<string>>(new Set())

  const pushToast = useCallback((n: OrgNotification) => {
    setToasts((prev) => {
      const next = [...prev, {
        id: n.id,
        title: n.title,
        body: n.preview,
        priority: n.priority,
        actionPath: n.actionPath,
      }]
      // Cap the stack so a burst never floods the screen.
      return next.slice(-3)
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refresh = useCallback(async (showToasts: boolean) => {
    try {
      const result = await orgService.pollNotifications(lastSeenId.current)
      const incoming = result.items.filter((n) => !seenIds.current.has(n.id))

      if (incoming.length > 0) {
        // Keep newest first in the list.
        setNotifications((prev) => {
          const merged = [...incoming, ...prev]
          const deduped = merged.filter((n, i) => merged.findIndex((m) => m.id === n.id) === i)
          return deduped.slice(0, 50)
        })

        incoming.forEach((n) => seenIds.current.add(n.id))
        lastSeenId.current = result.maxId

        if (showToasts) {
          incoming.forEach((n) => {
            if (n.priority === "info" && !preferences.toastEnabled) return
            if (preferences.soundEnabled && (n.priority === "warning" || n.priority === "critical")) {
              playChime(n.priority)
            }
            pushToast(n)
          })
        }
      }

      setUnreadCount(result.unread)
    } catch {
      // A transient poll failure must never take the page down; the next tick
      // retries. Real errors surface through the initial load.
    }
  }, [preferences, pushToast])

  // Initial load: full inbox, then poll incrementally.
  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const [list, unread, prefs] = await Promise.all([
          orgService.getNotifications({ perPage: 50 }),
          orgService.getUnreadCount(),
          orgService.getNotificationPreferences(),
        ])
        if (cancelled) return
        setNotifications(list.items)
        setUnreadCount(unread)
        setPreferences(prefs)
        list.items.forEach((n) => seenIds.current.add(n.id))
        const maxId = Math.max(0, ...list.items.map((n) => Number(n.id ?? 0)).filter((v) => Number.isFinite(v)))
        lastSeenId.current = maxId
      } catch {
        // Initial load failure surfaces through the bell's empty/error state.
      }
    }

    void bootstrap()

    const timer = window.setInterval(() => { void refresh(true) }, POLL_INTERVAL_MS)
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
      await orgService.markNotificationRead(id)
    } catch {
      // Optimistic update; backend will reconcile on next poll.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await orgService.markAllRead()
    } catch {
      // Optimistic; reconciled on next poll.
    }
  }, [])

  const updatePreferences = useCallback(async (patch: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }))
    try {
      setPreferences(await orgService.updateNotificationPreferences(patch))
    } catch {
      // Keep optimistic value on failure.
    }
  }, [])

  return {
    notifications,
    unreadCount,
    toasts,
    preferences,
    refresh,
    markRead,
    markAllRead,
    updatePreferences,
    dismissToast,
  }
}
