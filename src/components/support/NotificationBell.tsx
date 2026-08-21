import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, Eye, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface NotificationItem {
  id: string
  title: string
  body: string | null
  type: string
  read: boolean
  created_at: string
}

interface NotificationBellProps {
  fetchNotifications: () => Promise<NotificationItem[]>
  fetchUnreadCount?: () => Promise<number>
  onMarkRead?: (id: string) => Promise<void>
  onMarkAllRead?: () => Promise<void>
  pollInterval?: number
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell({
  fetchNotifications,
  fetchUnreadCount,
  onMarkRead,
  onMarkAllRead,
  pollInterval = 30000,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadUnread = useCallback(async () => {
    try {
      if (fetchUnreadCount) {
        const count = await fetchUnreadCount()
        setUnread(count)
      }
    } catch { /* ignore */ }
  }, [fetchUnreadCount])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const notifs = await fetchNotifications()
      setItems(notifs.slice(0, 20))
      setUnread(notifs.filter((n) => !n.read).length)
    } catch { /* ignore */ }
    setLoading(false)
  }, [fetchNotifications])

  useEffect(() => {
    loadUnread()
    const interval = setInterval(loadUnread, pollInterval)
    return () => clearInterval(interval)
  }, [loadUnread, pollInterval])

  useEffect(() => {
    if (open) loadItems()
  }, [open, loadItems])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-status-error text-white text-[8px] font-bold px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-2 right-2 top-16 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 w-auto sm:w-80 bg-brand-bg border border-brand-border rounded-2xl shadow-xl z-[200] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <h3 className="text-xs font-bold text-brand-text-primary">Notifications</h3>
              <div className="flex items-center gap-1">
                {unread > 0 && onMarkAllRead && (
                  <button
                    onClick={async () => { await onMarkAllRead(); setUnread(0); setItems((prev) => prev.map((n) => ({ ...n, read: true }))) }}
                    className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-gold transition-colors cursor-pointer"
                    title="Mark all read"
                  >
                    All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-xs text-brand-text-muted">No notifications</div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/30 transition-colors ${
                      !n.read ? 'bg-brand-gold/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-brand-text-primary truncate">{n.title}</p>
                        {n.body && <p className="text-[10px] text-brand-text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[8px] font-mono text-brand-text-disabled mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && onMarkRead && (
                        <button
                          onClick={async (e) => { e.stopPropagation(); await onMarkRead(n.id); setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)); setUnread((u) => Math.max(0, u - 1)) }}
                          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-status-success transition-colors cursor-pointer shrink-0"
                          title="Mark read"
                        >
                          <Eye size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
