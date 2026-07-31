import { useState, useMemo, useEffect } from "react"
import { motion } from "motion/react"
import {
  Bell, CheckCircle2, Shield, Building2,
  ScrollText, CreditCard, Megaphone,
  Inbox, Loader2, ChevronDown, AlertTriangle, RefreshCw,
} from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import TabNav from "../../components/platform/TabNav"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import type { PlatformNotification, PlatformNotificationType } from "../../types/platform"
import SeoHead from "../../components/SeoHead"

const TYPE_CONFIG: Record<
  PlatformNotificationType,
  { icon: typeof Bell; color: string; bg: string; label: string }
> = {
  ORG_REGISTRATION: { icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10", label: "Registration" },
  EVENT_PUBLISH_REQUEST: { icon: ScrollText, color: "text-purple-400", bg: "bg-purple-400/10", label: "Event" },
  SUBSCRIPTION_ALERT: { icon: CreditCard, color: "text-cyan-400", bg: "bg-cyan-400/10", label: "Subscription" },
  SECURITY_ALERT: { icon: Shield, color: "text-red-400", bg: "bg-red-400/10", label: "Security" },
  APPROVAL_REQUEST: { icon: ScrollText, color: "text-purple-400", bg: "bg-purple-400/10", label: "Approval" },
  PLATFORM_ANNOUNCEMENT: { icon: Megaphone, color: "text-brand-gold", bg: "bg-brand-gold/10", label: "Announcement" },
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function PlatformNotifications() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [performedActions, setPerformedActions] = useState<Set<string>>(new Set())

  const load = () => {
    setLoading(true)
    setError(null)
    platformService.getNotifications()
      .then((result) => {
        setNotifications(result.items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load notifications.')
        setLoading(false)
      })
  }

  useEffect(() => {
    const timer = setTimeout(load, 600)
    return () => clearTimeout(timer)
  }, [])

  const counts = useMemo(() => {
    const r = notifications
    return {
      all: r.length,
      unread: r.filter((n) => !n.read).length,
      ORG_REGISTRATION: r.filter((n) => n.type === "ORG_REGISTRATION").length,
      EVENT_PUBLISH_REQUEST: r.filter((n) => n.type === "EVENT_PUBLISH_REQUEST").length,
      SUBSCRIPTION_ALERT: r.filter((n) => n.type === "SUBSCRIPTION_ALERT").length,
      SECURITY_ALERT: r.filter((n) => n.type === "SECURITY_ALERT").length,
      PLATFORM_ANNOUNCEMENT: r.filter((n) => n.type === "PLATFORM_ANNOUNCEMENT").length,
    }
  }, [notifications])

  const filtered = useMemo(() => {
    let list = notifications
    if (tab === "unread") {
      list = list.filter((n) => !n.read)
    } else if (tab !== "all") {
      list = list.filter((n) => n.type === tab)
    }
    if (typeFilter !== "all") {
      list = list.filter((n) => n.type === typeFilter)
    }
    return list
  }, [tab, typeFilter, notifications])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setSelectedIds(new Set())
  }

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)))
    }
  }

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "ORG_REGISTRATION", label: "Registrations", count: counts.ORG_REGISTRATION },
    { id: "EVENT_PUBLISH_REQUEST", label: "Events", count: counts.EVENT_PUBLISH_REQUEST },
    { id: "SUBSCRIPTION_ALERT", label: "Subscriptions", count: counts.SUBSCRIPTION_ALERT },
    { id: "SECURITY_ALERT", label: "Security", count: counts.SECURITY_ALERT },
    { id: "PLATFORM_ANNOUNCEMENT", label: "Announcements", count: counts.PLATFORM_ANNOUNCEMENT },
  ]

  const typeFilterOptions = [
    { value: "all", label: "All Types" },
    ...Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ]

  return (
    <>
    <SeoHead meta={{ title: "Notifications — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Notifications" }]} />

      <PageHeader
        title="Notifications"
        description="Platform-wide notifications and alerts."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-brand-surface border border-brand-border rounded-xl pl-3 pr-8 py-2.5 text-[10px] font-mono font-bold text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all cursor-pointer"
              >
                {typeFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
            <button
              onClick={markAllRead}
              className="px-3 py-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer text-brand-text-primary"
            >
              Mark All Read
            </button>
          </div>
        }
      />

      <TabNav tabs={tabs} activeTab={tab} onChange={setTab} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Loader2 size={32} className="text-brand-gold" />
          </motion.div>
          <p className="text-xs text-brand-text-muted mt-4">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load notifications</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications"
          description={tab !== "all" ? "No notifications match this filter." : "You're all caught up!"}
        />
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-mono text-brand-text-muted">
                {selectedIds.size} selected
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2">
              <button
                onClick={toggleSelectAll}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                  selectedIds.size === filtered.length && filtered.length > 0
                    ? "bg-brand-gold border-brand-gold"
                    : "border-brand-border hover:border-brand-gold/50"
                }`}
              >
                {selectedIds.size === filtered.length && filtered.length > 0 && (
                  <CheckCircle2 size={12} className="text-black" />
                )}
              </button>
              <span className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold flex-1">
                Select All
              </span>
            </div>

            {filtered.map((n, i) => {
              const config = TYPE_CONFIG[n.type]
              const Icon = config.icon
              const isSelected = selectedIds.has(n.id)
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`group rounded-2xl p-4 transition-all duration-200 ${
                    n.read
                      ? "bg-brand-surface border border-brand-border"
                      : "bg-brand-surface border border-brand-gold/30 bg-brand-gold/[0.02]"
                  } ${isSelected ? "ring-1 ring-brand-gold/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSelect(n.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-gold border-brand-gold"
                            : "border-brand-border hover:border-brand-gold/50 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={12} className="text-black" />}
                      </button>

                      <div
                        className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ${config.color} shrink-0`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}
                          >
                            {config.label}
                          </span>
                          <h3 className="text-xs font-bold text-brand-text-primary truncate">{n.title}</h3>
                        </div>
                        <p className="text-[11px] text-brand-text-muted mt-1 line-clamp-2">{n.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-mono text-brand-text-muted">{timeAgo(n.createdAt)}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {n.actionable && n.actionLabel && (
                        <button
                          onClick={() => setPerformedActions((prev) => new Set(prev).add(n.id))}
                          className="px-2.5 py-1.5 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          {performedActions.has(n.id) ? 'Done' : n.actionLabel}
                        </button>
                      )}
                      <button
                        onClick={() => toggleRead(n.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          n.read
                            ? "text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive"
                            : "text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20"
                        }`}
                        title={n.read ? "Mark as unread" : "Mark as read"}
                      >
                        {n.read ? <Bell size={12} /> : <CheckCircle2 size={12} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
    </>
  )
}