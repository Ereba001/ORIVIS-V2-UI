import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, Volume2, VolumeX, Inbox } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { NotificationPreferences } from "../org/types"

type NotificationPriority = "info" | "success" | "warning" | "critical"

/** A minimal notification shape both the org and platform mappers satisfy. */
export interface BellNotification {
  id: string
  title: string
  preview?: string
  description?: string
  time?: string
  createdAt?: string
  read: boolean
  priority?: NotificationPriority
  actionPath?: string
}

const PRIORITY_DOT: Record<NotificationPriority, string> = {
  info: "bg-brand-text-muted/50",
  success: "bg-status-success",
  warning: "bg-status-warning",
  critical: "bg-status-error",
}

interface NotificationBellProps {
  notifications: BellNotification[]
  unreadCount: number
  preferences: NotificationPreferences
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onToggleSound: () => void
  viewAllPath: string
  accentColor?: string
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

/**
 * Notification bell + inbox dropdown used in both the org and platform headers.
 * Clicking a row marks it read and navigates to the action path when present.
 */
export default function NotificationBell({
  notifications,
  unreadCount,
  preferences,
  onMarkRead,
  onMarkAllRead,
  onToggleSound,
  viewAllPath,
  accentColor,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const handleClick = (n: BellNotification) => {
    if (!n.read) onMarkRead(n.id)
    setOpen(false)
    if (n.actionPath) navigate(n.actionPath)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: accentColor ?? "#FCA311" }}
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] origin-top-right"
          >
            <div className="glass-strong rounded-lg shadow-lg border border-brand-divider overflow-hidden">
              <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Notifications</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onToggleSound}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                    aria-label={preferences.soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
                    title={preferences.soundEnabled ? "Sounds on" : "Sounds muted"}
                  >
                    {preferences.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-secondary transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto org-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Inbox size={20} className="mx-auto text-brand-text-disabled" />
                    <p className="text-xs text-brand-text-muted mt-2">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 transition-colors ${n.read ? "" : "bg-brand-surface-elevated/30"}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : (n.priority ? PRIORITY_DOT[n.priority] : "bg-brand-gold")}`}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate ${n.read ? "text-brand-text-secondary" : "text-brand-text-primary font-semibold"}`}>{n.title}</p>
                          </div>
                          {(n.preview || n.description) && (
                            <p className="text-[10px] text-brand-text-muted mt-0.5 line-clamp-2">{n.preview ?? n.description}</p>
                          )}
                          {(n.time || n.createdAt) && (
                            <p className="text-[9px] font-mono text-brand-text-disabled mt-1">{timeAgo(n.time ?? n.createdAt!)}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-brand-divider">
                <button
                  onClick={() => { setOpen(false); navigate(viewAllPath) }}
                  className="w-full text-center text-[11px] font-semibold text-brand-text-muted hover:text-brand-text-primary transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
