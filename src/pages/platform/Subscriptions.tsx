import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CheckCircle2, FlaskConical, Clock, RefreshCw,
  PauseCircle, XCircle, X, Ban, CreditCard,
  Crown, Briefcase, Rocket, Gem, Calendar, Building2,
  FileText, HardDrive, Users, TrendingUp, DollarSign,
  AlertTriangle,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import StatsGrid from "../../components/platform/StatsGrid"
import TabNav from "../../components/platform/TabNav"
import StatusPill from "../../components/platform/StatusPill"
import EmptyState from "../../components/platform/EmptyState"
import { platformService } from "../../services/platform-service"
import type { SubscriptionRecord, SubscriptionStatus } from "../../types/platform"

const PLAN_ICONS: Record<string, typeof Crown> = {
  STARTER: Rocket,
  PROFESSIONAL: Briefcase,
  ENTERPRISE: Crown,
  CUSTOM: Gem,
}

interface PlanInfo {
  name: string
  price: string
  voters: number | string
  events: number | string
  icon: typeof Crown
  color: string
  popular?: boolean
}

const PLANS: PlanInfo[] = [
  { name: "Free", price: "$0", voters: 100, events: 1, icon: Rocket, color: "text-brand-text-muted" },
  { name: "Basic", price: "$99/mo", voters: 500, events: 5, icon: Briefcase, color: "text-blue-400" },
  { name: "Professional", price: "$299/mo", voters: 2500, events: 20, icon: Crown, color: "text-brand-gold", popular: true },
  { name: "Enterprise", price: "Custom", voters: "Unlimited", events: "Unlimited", icon: Gem, color: "text-purple-400" },
]

const STATUS_VARIANT: Record<SubscriptionStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  ACTIVE: "success",
  TRIALING: "info",
  EXPIRING: "warning",
  RENEWED: "info",
  SUSPENDED: "danger",
  CANCELLED: "neutral",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function PlatformSubscriptions() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null)
  const [records, setRecords] = useState<SubscriptionRecord[]>([])
  const [orgs, setOrgs] = useState<{ organizationId: string; storageUsed: number; storageTotal: number; members: number; activeEvents: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([platformService.getSubscriptions({ perPage: 100 }), platformService.getOrganizations({ perPage: 100 })])
      .then(([subRes, orgRes]) => {
        setRecords(subRes.items)
        setOrgs(orgRes.items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const r = records
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    return {
      all: r.length,
      active: r.filter((s) => s.status === "ACTIVE").length,
      trial: r.filter((s) => s.status === "TRIALING").length,
      expiring: r.filter((s) => s.status === "EXPIRING").length,
      renewed: r.filter((s) => {
        if (!s.renewedAt) return false
        const d = new Date(s.renewedAt)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      }).length,
      suspended: r.filter((s) => s.status === "SUSPENDED").length,
      cancelled: r.filter((s) => s.status === "CANCELLED").length,
    }
  }, [records])

  const forecast = useMemo(() => {
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 86400000)
    const in90 = new Date(now.getTime() + 90 * 86400000)
    const next30 = records.filter((s) => {
      const d = new Date(s.expiresAt)
      return d > now && d <= in30 && s.status !== "CANCELLED"
    })
    const next90 = records.filter((s) => {
      const d = new Date(s.expiresAt)
      return d > now && d <= in90 && s.status !== "CANCELLED"
    })
    const parsePrice = (p: string): number => {
      const n = parseFloat(p.replace(/[^0-9.]/g, ""))
      return isNaN(n) ? 0 : n
    }
    return {
      next30Renewals: next30.length,
      next90Renewals: next90.length,
      projectedMonthly: next30.reduce((s, r) => s + parsePrice(r.price), 0),
      projectedQuarterly: next90.reduce((s, r) => s + parsePrice(r.price), 0),
    }
  }, [records])

  const orgHealth = useMemo(() => {
    if (!selectedSub) return null
    return orgs.find((o) => o.organizationId === selectedSub.organizationId) || null
  }, [selectedSub, orgs])

  const filtered = useMemo(() => {
    let list = records
    if (tab !== "all") {
      if (tab === "renewed") {
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        list = list.filter((s) => {
          if (!s.renewedAt) return false
          const d = new Date(s.renewedAt)
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        })
      } else {
        list = list.filter((s) => s.status.toLowerCase() === tab)
      }
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.organizationName.toLowerCase().includes(q) ||
          s.plan.toLowerCase().includes(q) ||
          s.paymentMethod.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, search, records])

  const statsItems = useMemo(
    () => [
      { label: "Active Plans", value: String(counts.active), icon: CheckCircle2, color: "text-status-success" },
      { label: "Trial Organizations", value: String(counts.trial), icon: FlaskConical, color: "text-blue-400" },
      { label: "Expiring This Month", value: String(counts.expiring), icon: Clock, color: "text-status-warning" },
      { label: "Renewals This Month", value: String(counts.renewed), icon: RefreshCw, color: "text-cyan-400" },
      { label: "Suspended", value: String(counts.suspended), icon: PauseCircle, color: "text-status-error" },
      { label: "Cancelled", value: String(counts.cancelled), icon: XCircle, color: "text-brand-text-muted" },
    ],
    [counts]
  )

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "trial", label: "Trial", count: counts.trial },
    { id: "expiring", label: "Expiring", count: counts.expiring },
    { id: "suspended", label: "Suspended", count: counts.suspended },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ]

  const renewals = useMemo(() => {
    if (!selectedSub) return []
    return records.filter(
      (s) => s.organizationId === selectedSub.organizationId && s.renewedAt
    )
  }, [selectedSub, records])

  return (
    <>
    <SeoHead meta={{ title: "Subscriptions — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Subscriptions" }]} />

      <PageHeader
        title="Subscriptions"
        description="Manage platform subscription plans and billing operations."
        search={{ value: search, onChange: setSearch, placeholder: "Search subscriptions..." }}
      />

      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">Plan Catalogue</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`relative glass-card rounded-2xl p-5 border ${p.popular ? "border-brand-gold/40" : "border-brand-border"} hover:border-brand-gold/30 transition-all duration-300`}
              >
                {p.popular && (
                  <span className="absolute -top-2 right-4 px-2 py-0.5 bg-brand-gold text-black text-[8px] font-mono font-bold uppercase tracking-wider rounded-full">
                    Popular
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center mb-3 ${p.color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-lg font-bold text-brand-text-primary">{p.name}</p>
                <p className="text-xs font-mono text-brand-gold mt-1">{p.price}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
                    <Users size={10} />
                    <span>{typeof p.voters === "number" ? p.voters.toLocaleString() : p.voters} voters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
                    <Calendar size={10} />
                    <span>{typeof p.events === "number" ? `${p.events} events` : `${p.events} events`}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <StatsGrid items={statsItems} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-5 border border-brand-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={14} className="text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Renewals Next 30 Days</span>
          </div>
          <p className="text-2xl font-bold font-mono text-brand-text-primary">{forecast.next30Renewals}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-5 border border-brand-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Renewals Next 90 Days</span>
          </div>
          <p className="text-2xl font-bold font-mono text-brand-text-primary">{forecast.next90Renewals}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-5 border border-brand-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Projected Revenue Next Month</span>
          </div>
          <p className="text-2xl font-bold font-mono text-brand-text-primary">${forecast.projectedMonthly.toLocaleString()}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-5 border border-brand-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-brand-gold" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Projected Revenue Next Quarter</span>
          </div>
          <p className="text-2xl font-bold font-mono text-brand-text-primary">${forecast.projectedQuarterly.toLocaleString()}</p>
        </motion.div>
      </div>

      <TabNav tabs={tabs} activeTab={tab} onChange={setTab} />

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-16 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load subscriptions</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={load} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions found"
          description={search ? "Try a different search term." : "No subscriptions match this filter."}
        />
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border">
                {["Organization", "Plan", "Status", "Max Voters", "Price", "Start Date", "Expires / End", "Payment Method"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => {
                const PlanIcon = PLAN_ICONS[sub.plan] || Briefcase
                return (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedSub(sub)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted">
                          <Building2 size={14} />
                        </div>
                        <span className="text-xs font-semibold text-brand-text-primary">{sub.organizationName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                        <PlanIcon size={14} className="text-brand-gold" />
                        <span>{sub.plan.charAt(0) + sub.plan.slice(1).toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={sub.status} variant={STATUS_VARIANT[sub.status]} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-text-primary">{sub.maxVoters.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-text-primary">{sub.price}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">{formatDate(sub.startedAt)}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">{formatDate(sub.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                        <CreditCard size={12} />
                        <span>{sub.paymentMethod}</span>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-[10px] font-mono text-brand-text-muted">
          <span><span className="font-bold text-status-success">{counts.active}</span> Active</span>
          <span className="w-px h-3 bg-brand-border/50" />
          <span><span className="font-bold text-blue-400">{counts.trial}</span> Trial</span>
          <span className="w-px h-3 bg-brand-border/50" />
          <span><span className="font-bold text-status-warning">{counts.expiring}</span> Expiring</span>
          <span className="w-px h-3 bg-brand-border/50" />
          <span><span className="font-bold text-brand-text-muted">{counts.cancelled}</span> Cancelled</span>
          <span className="w-px h-3 bg-brand-border/50" />
          <span className="text-brand-text-muted">{filtered.length} showing</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedSub(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-lg bg-brand-bg border-l border-brand-border overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSub(null)}
                    className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-text-muted">ID: {selectedSub.id}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 size={20} className="text-brand-text-muted" />
                    <h2 className="text-lg font-bold text-brand-text-primary">{selectedSub.organizationName}</h2>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-mono text-brand-gold">
                      {selectedSub.plan.charAt(0) + selectedSub.plan.slice(1).toLowerCase()} Plan
                    </span>
                    <StatusPill status={selectedSub.status} variant={STATUS_VARIANT[selectedSub.status]} />
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                    Subscription Timeline
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Started", date: selectedSub.startedAt, icon: Calendar },
                      { label: "Expires", date: selectedSub.expiresAt, icon: Clock },
                      ...(selectedSub.renewedAt
                        ? [{ label: "Last Renewed", date: selectedSub.renewedAt, icon: RefreshCw }]
                        : []),
                      ...(selectedSub.cancelledAt
                        ? [{ label: "Cancelled", date: selectedSub.cancelledAt, icon: XCircle }]
                        : []),
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center text-brand-text-muted">
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">{item.label}</p>
                            <p className="text-xs font-semibold text-brand-text-primary">{formatDate(item.date)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                    Plan Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Max Voters", value: selectedSub.maxVoters.toLocaleString() },
                      { label: "Price", value: selectedSub.price },
                      { label: "Payment Method", value: selectedSub.paymentMethod },
                      { label: "Status", value: selectedSub.status },
                    ].map((d) => (
                      <div key={d.label}>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">{d.label}</p>
                        <p className="text-xs font-semibold text-brand-text-primary mt-0.5">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                    Usage Metrics
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Storage", used: orgHealth?.storageUsed ?? 0, total: orgHealth?.storageTotal ?? 0, unit: "GB", icon: HardDrive },
                      { label: "Voters", used: selectedSub.maxVoters > 0 ? Math.round((orgHealth?.members ?? 0) / selectedSub.maxVoters * 100) : 0, usedLabel: `${(orgHealth?.members ?? 0).toLocaleString()}`, totalLabel: selectedSub.maxVoters.toLocaleString(), icon: Users },
                      { label: "Events", used: orgHealth?.activeEvents ?? 0, total: 20, usedLabel: `${orgHealth?.activeEvents ?? 0}`, totalLabel: "20", icon: Calendar },
                    ].map((m) => {
                      const Icon = m.icon
                      const pct = m.total > 0 ? Math.min(Math.round((m.used / m.total) * 100), 100) : 0
                      const usedDisplay = m.usedLabel ?? `${m.used}${m.unit ?? ""}`
                      const totalDisplay = m.totalLabel ?? `${m.total}${m.unit ?? ""}`
                      return (
                        <div key={m.label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                              <Icon size={12} />
                              <span>{m.label}</span>
                            </div>
                            <span className="text-[10px] font-mono text-brand-text-primary">
                              {usedDisplay} / {totalDisplay}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-brand-surface-elevated overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full rounded-full ${pct > 90 ? "bg-status-danger" : pct > 70 ? "bg-status-warning" : "bg-brand-gold"}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {renewals.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                      Renewal History
                    </h3>
                    <div className="space-y-2">
                      {renewals.map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                          <div className="flex items-center gap-2">
                            <RefreshCw size={12} className="text-cyan-400" />
                            <span className="text-xs text-brand-text-primary">Renewed</span>
                          </div>
                          <span className="text-[10px] font-mono text-brand-text-muted">
                            {r.renewedAt ? formatDate(r.renewedAt) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Send Invoice", icon: FileText, onClick: () => { const s = selectedSub; if (s) setSelectedSub({ ...s, status: 'ACTIVE' }) } },
                      { label: "Modify Plan", icon: Crown, onClick: () => { const s = selectedSub; if (s) setSelectedSub({ ...s, plan: 'ENTERPRISE' }) } },
                      { label: "Cancel Subscription", icon: Ban, onClick: () => { const s = selectedSub; if (s) setSelectedSub({ ...s, status: 'CANCELLED' }) } },
                    ].map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.label}
                          onClick={action.onClick}
                          className="flex items-center gap-1.5 px-3 py-2 bg-brand-surface-elevated hover:bg-brand-surface-interactive border border-brand-border rounded-xl text-[10px] font-mono font-bold text-brand-text-primary transition-all cursor-pointer"
                        >
                          <Icon size={12} />
                          <span>{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}