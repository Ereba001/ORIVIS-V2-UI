import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Inbox, Loader2, AlertTriangle, RefreshCw, Bell, ExternalLink } from "lucide-react"
import { useOrgBranding } from "../contexts/OrgBrandingContext"
import SeoHead from "../../components/SeoHead"
import { orgService } from "../../services/org-service"
import type { OrgNotification, OrgNotificationLevel } from "../types"

type Tab = "all" | "unread"

const LEVEL_STYLES: Record<OrgNotificationLevel, { chip: string; dot: string; label: string }> = {
  normal: { chip: "bg-brand-surface-interactive text-brand-text-muted", dot: "bg-brand-text-muted/50", label: "Normal" },
  important: { chip: "bg-status-warning/10 text-status-warning-strong", dot: "bg-status-warning", label: "Important" },
  critical: { chip: "bg-status-error/10 text-status-error", dot: "bg-status-error", label: "Critical" },
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

export default function Notifications() {
  const { branding } = useOrgBranding()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<OrgNotification[]>([])
  const [tab, setTab] = useState<Tab>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    orgService.getNotifications({ perPage: 100 })
      .then((result) => {
        setNotifications(result.items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load notifications.")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (tab === "unread") return notifications.filter((n) => !n.read)
    return notifications
  }, [tab, notifications])

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markRead = async (n: OrgNotification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      try { await orgService.markNotificationRead(n.id) } catch { /* reconciled on next load */ }
    }
    if (n.actionPath) navigate(n.actionPath)
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    try { await orgService.markAllRead() } catch { /* reconciled on next load */ }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unread },
  ]

  return (
    <>
      <SeoHead meta={{ title: "Notifications — ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${branding.primaryColor}20` }}>
              <Bell size={18} style={{ color: branding.primaryColor }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-text-primary">Notifications</h1>
              <p className="text-xs text-brand-text-muted">Updates from your events, payments, and team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-2 text-[10px] font-semibold text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-primary transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => load(true)}
              className="flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-2 text-[10px] font-semibold text-brand-text-muted hover:bg-brand-surface-interactive hover:text-brand-text-primary transition-colors"
              aria-label="Refresh notifications"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-brand-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "text-brand-text-primary"
                  : "text-brand-text-muted hover:text-brand-text-secondary border-transparent"
              }`}
              style={tab === t.key ? { borderColor: branding.primaryColor } : undefined}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] font-mono text-brand-text-muted">{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
              <Loader2 size={28} style={{ color: branding.primaryColor }} />
            </motion.div>
            <p className="text-xs text-brand-text-muted mt-4">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={28} className="text-status-error mb-3" />
            <p className="text-brand-text-primary font-semibold">Failed to load notifications</p>
            <p className="text-sm text-brand-text-muted mt-1">{error}</p>
            <button onClick={() => load()} className="mt-4 flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: branding.primaryColor }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-brand-surface border border-brand-border rounded-2xl py-16 flex flex-col items-center justify-center text-center">
            <Inbox size={28} className="text-brand-text-disabled mb-3" />
            <p className="text-sm font-semibold text-brand-text-primary">
              {tab === "unread" ? "You're all caught up" : "No notifications yet"}
            </p>
            <p className="text-xs text-brand-text-muted mt-1">
              {tab === "unread" ? "There are no unread notifications." : "Activity from your events and team will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, i) => {
              const style = LEVEL_STYLES[n.level ?? "normal"]
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => void markRead(n)}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border ${
                    n.read
                      ? "bg-brand-surface border-brand-border"
                      : "border-brand-gold/30 bg-brand-gold/[0.02]"
                  } hover:border-brand-gold/50`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : style.dot}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${style.chip}`}>{style.label}</span>
                        <h3 className="text-xs font-bold text-brand-text-primary">{n.title}</h3>
                      </div>
                      {n.preview && <p className="text-[11px] text-brand-text-muted mt-1 line-clamp-2">{n.preview}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-mono text-brand-text-muted">{timeAgo(n.time)}</span>
                        {n.actionPath && (
                          <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: branding.primaryColor }}>
                            <ExternalLink size={9} /> Open
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
