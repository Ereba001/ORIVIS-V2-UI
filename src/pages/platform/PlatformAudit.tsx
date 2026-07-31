import { useState } from "react"
import { Search, Shield, Activity, Building2, User, Vote, Eye, AlertTriangle, RefreshCw, Inbox } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import EmptyState from "../../components/platform/EmptyState"
import { usePlatformGovernance } from "../../contexts/PlatformGovernanceContext"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  Organization: Building2, Election: Vote, Voter: User, User: User, System: Shield,
  org: Building2, election: Vote, auth: Shield, permissions: Shield, billing: Activity,
  system: Shield, Governance: Eye,
}
const SEVERITY_COLORS: Record<string, string> = {
  Info: "text-blue-400 bg-blue-400/10",
  Warning: "text-status-warning bg-status-warning/10",
  Critical: "text-status-error bg-status-error/10",
}

// Section 19: Governance Audit Entries
const GOVERNANCE_AUDIT_ENTRIES = [
  { id: "gov-audit-1", action: "Workspace Inspection Started — LunarDAO", user: "Sarah Chen", category: "Governance", severity: "Info" as const, timestamp: "2026-07-29T09:15:00Z" },
  { id: "gov-audit-2", action: "Intervention Requested — Technical Support · MeritSphere", user: "James Wilson", category: "Governance", severity: "Warning" as const, timestamp: "2026-07-29T08:00:00Z" },
  { id: "gov-audit-3", action: "Intervention Approved — Security Investigation · EduVote", user: "Maria Garcia", category: "Governance", severity: "Warning" as const, timestamp: "2026-07-28T11:00:00Z" },
  { id: "gov-audit-4", action: "Intervention Completed — Billing · ArtVote", user: "James Wilson", category: "Governance", severity: "Info" as const, timestamp: "2026-07-26T14:30:00Z" },
  { id: "gov-audit-5", action: "Emergency Activated — Election Recovery · CityVote", user: "Sarah Chen", category: "Governance", severity: "Critical" as const, timestamp: "2026-07-27T09:30:00Z" },
  { id: "gov-audit-6", action: "Workspace Exited — GreenVote", user: "Sarah Chen", category: "Governance", severity: "Info" as const, timestamp: "2026-07-28T15:00:00Z" },
  { id: "gov-audit-7", action: "Report Exported — Security Activity Report", user: "Alex Thompson", category: "Governance", severity: "Info" as const, timestamp: "2026-07-27T16:45:00Z" },
  { id: "gov-audit-8", action: "Session Closed — Fraud Investigation · UniVote", user: "Maria Garcia", category: "Governance", severity: "Warning" as const, timestamp: "2026-07-25T16:00:00Z" },
]

const CATEGORY_FILTERS = ["All", "Governance", "Organization", "Election", "Voter", "User", "System", "auth", "permissions", "billing"] as const

export default function PlatformAudit() {
  const { timeline } = usePlatformGovernance()
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<"All" | "Info" | "Warning" | "Critical">("All")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const { data, loading, error, reload } = useApiResource(platformService.getAuditLogs)

  const auditLogs = data?.items ?? []

  const governanceAuditFromTimeline = timeline.map((entry) => ({
    id: `gov-tl-${entry.id}`,
    action: `${entry.action} — ${entry.target}`,
    user: entry.actor,
    category: "Governance",
    severity: entry.severity === 'critical' ? 'Critical' as const : entry.severity === 'warning' ? 'Warning' as const : 'Info' as const,
    timestamp: entry.timestamp,
  }))

  const allLogs = [...governanceAuditFromTimeline, ...GOVERNANCE_AUDIT_ENTRIES, ...auditLogs]

  const filtered = allLogs.filter((log) => {
    if (severity !== "All" && log.severity !== severity) return false
    if (categoryFilter !== "All" && log.category !== categoryFilter) return false
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
    <SeoHead meta={{ title: "Audit Log — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Audit Log" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Audit Log</h1>
          <p className="text-sm text-brand-text-muted mt-1">Platform-wide audit trail including governance events.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
          <span>Export</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit log..."
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
        </div>
        {(["All", "Info", "Warning", "Critical"] as const).map((s) => (
          <button key={s} onClick={() => setSeverity(s)}
            className={`px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
              severity === s ? "bg-brand-gold text-brand-bg-secondary" : "bg-brand-surface border border-brand-border text-brand-text-muted hover:border-brand-gold/30"
            }`}>{s}</button>
        ))}
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
          {CATEGORY_FILTERS.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-brand-border last:border-0 flex items-center gap-4 px-4">
              <div className="w-7 h-7 rounded-lg bg-brand-surface-elevated animate-pulse" />
              <div className="flex-1 h-3 bg-brand-surface-elevated animate-pulse rounded" />
              <div className="w-24 h-3 bg-brand-surface-elevated animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load audit logs</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No audit entries found"
          description={search ? "Try a different search term." : "No audit entries match this filter."}
        />
      ) : (
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border">
              {["Action", "User", "Category", "Severity", "Time"].map((h) => (
                <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const CatIcon = CATEGORY_ICONS[log.category] || Shield
              return (
                <tr key={log.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg bg-brand-surface-elevated flex items-center justify-center ${
                        log.category === 'Governance' ? 'text-brand-gold' : 'text-brand-text-muted'
                      }`}>
                        <CatIcon size={12} />
                      </div>
                      <span className={`text-xs ${
                        log.category === 'Governance' ? 'text-brand-gold font-semibold' : 'text-brand-text-primary'
                      }`}>{log.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-text-muted">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-brand-text-muted">
                      <CatIcon size={10} />{log.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${SEVERITY_COLORS[log.severity]}`}>{log.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">{log.timestamp}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}
      <p className="text-[10px] font-mono text-brand-text-disabled text-center">{filtered.length} audit entries</p>
    </div>
    </>
  )
}
