import { useState } from "react"
import { Search, Shield, Building2, User, Clock, AlertCircle, Download, Eye, ArrowUpDown, Filter } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import { usePlatformGovernance, type GovernanceSession, type GovernanceRole, type InterventionCategory, type GovernanceRiskLevel } from "../../contexts/PlatformGovernanceContext"

const MOCK_SESSIONS: GovernanceSession[] = [
  { id: "GS-A3F8-K2B1", organizationId: "org-1", organizationName: "LunarDAO", platformUser: "Sarah Chen", platformRole: "platform_owner", startTime: "2026-07-29T09:15:00Z", endTime: "2026-07-29T10:45:00Z", duration: "1h 30m", mode: "Inspection", category: null, reason: null, status: "Completed", actionsCount: 5, riskLevel: "Low", isEmergency: false },
  { id: "GS-B7C2-M9X4", organizationId: "org-2", organizationName: "MeritSphere", platformUser: "James Wilson", platformRole: "platform_administrator", startTime: "2026-07-29T08:00:00Z", endTime: null, duration: "4h 12m", mode: "Intervention", category: "Technical Support", reason: "Server migration assistance", status: "Active", actionsCount: 12, riskLevel: "Medium", isEmergency: false },
  { id: "GS-D4E1-P8Q5", organizationId: "org-3", organizationName: "GreenVote", platformUser: "Sarah Chen", platformRole: "platform_owner", startTime: "2026-07-28T14:30:00Z", endTime: "2026-07-28T15:00:00Z", duration: "30m", mode: "Inspection", category: null, reason: null, status: "Completed", actionsCount: 2, riskLevel: "Low", isEmergency: false },
  { id: "GS-F9G3-R2H7", organizationId: "org-4", organizationName: "EduVote", platformUser: "Maria Garcia", platformRole: "security_officer", startTime: "2026-07-28T11:00:00Z", endTime: "2026-07-28T13:20:00Z", duration: "2h 20m", mode: "Intervention", category: "Security Investigation", reason: "Unauthorized access attempt investigation", status: "Completed", actionsCount: 18, riskLevel: "High", isEmergency: false },
  { id: "GS-H5J2-K8L1", organizationId: "org-5", organizationName: "HealthVote", platformUser: "Alex Thompson", platformRole: "compliance_officer", startTime: "2026-07-27T16:00:00Z", endTime: "2026-07-27T16:45:00Z", duration: "45m", mode: "Inspection", category: null, reason: null, status: "Completed", actionsCount: 3, riskLevel: "Low", isEmergency: false },
  { id: "GS-M4N8-P2Q6", organizationId: "org-6", organizationName: "CityVote", platformUser: "Sarah Chen", platformRole: "platform_owner", startTime: "2026-07-27T09:30:00Z", endTime: "2026-07-27T11:00:00Z", duration: "1h 30m", mode: "Intervention", category: "Emergency", reason: "Election recovery - vote tally system failure", status: "Completed", actionsCount: 25, riskLevel: "Critical", isEmergency: true },
  { id: "GS-R1T3-V7W9", organizationId: "org-7", organizationName: "ArtVote", platformUser: "James Wilson", platformRole: "platform_administrator", startTime: "2026-07-26T13:00:00Z", endTime: "2026-07-26T14:30:00Z", duration: "1h 30m", mode: "Intervention", category: "Billing", reason: "Invoice discrepancy resolution", status: "Completed", actionsCount: 8, riskLevel: "Medium", isEmergency: false },
  { id: "GS-X2Y5-Z8A3", organizationId: "org-8", organizationName: "UniVote", platformUser: "Maria Garcia", platformRole: "security_officer", startTime: "2026-07-25T10:00:00Z", endTime: null, duration: "3d 2h", mode: "Intervention", category: "Fraud Investigation", reason: "Suspicious voter registration patterns", status: "Active", actionsCount: 32, riskLevel: "High", isEmergency: false },
  { id: "GS-B4C7-D9E2", organizationId: "org-9", organizationName: "LaborVote", platformUser: "David Kim", platformRole: "finance_officer", startTime: "2026-07-24T15:00:00Z", endTime: "2026-07-24T15:30:00Z", duration: "30m", mode: "Inspection", category: null, reason: null, status: "Completed", actionsCount: 1, riskLevel: "Low", isEmergency: false },
  { id: "GS-F1G4-H7J2", organizationId: "org-1", organizationName: "LunarDAO", platformUser: "Sarah Chen", platformRole: "platform_owner", startTime: "2026-07-23T08:00:00Z", endTime: "2026-07-23T08:45:00Z", duration: "45m", mode: "Inspection", category: null, reason: null, status: "Completed", actionsCount: 4, riskLevel: "Low", isEmergency: false },
]

const ROLE_OPTIONS: { value: GovernanceRole | ""; label: string }[] = [
  { value: "", label: "All Roles" },
  { value: "platform_owner", label: "Platform Owner" },
  { value: "platform_administrator", label: "Platform Administrator" },
  { value: "support_engineer", label: "Support Engineer" },
  { value: "security_officer", label: "Security Officer" },
  { value: "finance_officer", label: "Finance Officer" },
  { value: "compliance_officer", label: "Compliance Officer" },
]

const CATEGORY_OPTIONS: { value: InterventionCategory | ""; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "Technical Support", label: "Technical Support" },
  { value: "Organization Request", label: "Organization Request" },
  { value: "Election Recovery", label: "Election Recovery" },
  { value: "Billing", label: "Billing" },
  { value: "Security Investigation", label: "Security Investigation" },
  { value: "Fraud Investigation", label: "Fraud Investigation" },
  { value: "Legal Request", label: "Legal Request" },
  { value: "Migration", label: "Migration" },
  { value: "Emergency", label: "Emergency" },
  { value: "Other", label: "Other" },
]

const STATUS_OPTIONS = ["All", "Active", "Completed", "Cancelled"] as const
const RISK_OPTIONS = ["All", "Low", "Medium", "High", "Critical"] as const

const RISK_COLORS: Record<GovernanceRiskLevel, string> = {
  Low: "text-green-400 bg-green-400/10",
  Medium: "text-status-warning bg-status-warning/10",
  High: "text-status-error bg-status-error/10",
  Critical: "text-status-error bg-status-error/20 animate-pulse",
}

export default function GovernanceSessions() {
  const { currentSession, timeline, getDuration } = usePlatformGovernance()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [riskFilter, setRiskFilter] = useState<string>("All")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<GovernanceSession | null>(null)
  const [sortField, setSortField] = useState<string>("startTime")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const allSessions = [
    ...(currentSession ? [currentSession] : []),
    ...MOCK_SESSIONS.filter((s) => s.id !== currentSession?.id),
  ]

  const filtered = allSessions.filter((s) => {
    if (statusFilter !== "All" && s.status !== statusFilter) return false
    if (riskFilter !== "All" && s.riskLevel !== riskFilter) return false
    if (roleFilter && s.platformRole !== roleFilter) return false
    if (categoryFilter && s.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.organizationName.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q) &&
          !s.platformUser.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    return a.startTime.localeCompare(b.startTime) * dir
  })

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  return (
    <>
      <SeoHead meta={{ title: "Governance Sessions — Platform | ORIVIS", noindex: true }} />
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Governance Sessions" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Governance Sessions</h1>
            <p className="text-sm text-brand-text-muted mt-1">Master governance history — every workspace visit, inspection, and intervention.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer" title="CSV Export">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sessions, organizations, staff..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none focus:border-brand-gold transition-all" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            {STATUS_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            {RISK_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            {ROLE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-[10px] font-mono text-brand-text-primary focus:outline-none focus:border-brand-gold cursor-pointer">
            {CATEGORY_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
          <button className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-brand-border text-[10px] font-mono text-brand-text-muted hover:border-brand-gold/30 transition-all cursor-pointer">
            <Filter size={12} /> More Filters
          </button>
        </div>

        {/* Sessions Table */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border">
                  {["Session ID", "Organization", "Staff", "Role", "Mode", "Category", "Duration", "Risk", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold cursor-pointer hover:text-brand-text-primary" onClick={() => toggleSort(h)}>
                      <div className="flex items-center gap-1">
                        {h}
                        {sortField === h && <ArrowUpDown size={10} />}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((session) => (
                  <tr key={session.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono text-brand-text-primary">{session.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-brand-text-muted" />
                        <span className="text-xs text-brand-text-primary">{session.organizationName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-brand-text-primary">{session.platformUser}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-mono text-brand-text-muted">
                        {session.platformRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        session.mode === 'Intervention' ? 'text-status-error bg-status-error/10' : 'text-brand-gold bg-brand-gold/10'
                      }`}>
                        {session.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">
                      {session.category || '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">
                      {session.duration || getDuration(session.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${RISK_COLORS[session.riskLevel]}`}>
                        {session.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        session.status === 'Active'
                          ? 'text-green-400 bg-green-400/10'
                          : session.status === 'Completed'
                          ? 'text-brand-text-muted bg-brand-surface-elevated'
                          : 'text-status-warning bg-status-warning/10'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-brand-text-muted">
                      {new Date(session.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 text-[9px] font-mono text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedSession(selectedSession?.id === session.id ? null : session) }}>
                        <Eye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Detail Panel */}
        {selectedSession && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">
                Session {selectedSession.id}
              </h2>
              <button onClick={() => setSelectedSession(null)}
                className="text-[9px] font-mono text-brand-text-muted hover:text-brand-text-primary cursor-pointer">
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Organization", value: selectedSession.organizationName },
                    { label: "Platform Staff", value: selectedSession.platformUser },
                    { label: "Role", value: selectedSession.platformRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
                    { label: "Mode", value: selectedSession.mode },
                    { label: "Category", value: selectedSession.category || 'N/A' },
                    { label: "Reason", value: selectedSession.reason || 'N/A' },
                    { label: "Risk Level", value: selectedSession.riskLevel },
                    { label: "Status", value: selectedSession.status },
                    { label: "Duration", value: selectedSession.duration || getDuration(selectedSession.startTime) },
                    { label: "Actions Count", value: String(selectedSession.actionsCount) },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">{field.label}</p>
                      <p className="text-xs text-brand-text-primary mt-0.5">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-3">Session Timeline</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {(selectedSession.id === currentSession?.id ? timeline : MOCK_TIMELINE_ENTRIES).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        entry.severity === 'critical' ? 'bg-status-error' :
                        entry.severity === 'warning' ? 'bg-status-warning' : 'bg-brand-text-muted'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-brand-text-muted">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}</p>
                        <p className="text-xs text-brand-text-primary">{entry.action}</p>
                        <p className="text-[9px] text-brand-text-muted">{entry.target}</p>
                      </div>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                        entry.severity === 'critical' ? 'text-status-error bg-status-error/10' :
                        entry.severity === 'warning' ? 'text-status-warning bg-status-warning/10' : 'text-brand-text-muted bg-brand-surface-elevated'
                      }`}>
                        {entry.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] font-mono text-brand-text-disabled text-center">{filtered.length} governance sessions</p>
      </div>
    </>
  )
}

const MOCK_TIMELINE_ENTRIES = [
  { id: "tl-1", timestamp: "2026-07-29T09:15:00Z", actor: "Sarah Chen", action: "Entered Workspace", target: "LunarDAO", severity: "info" as const },
  { id: "tl-2", timestamp: "2026-07-29T09:20:00Z", actor: "Sarah Chen", action: "Viewed Dashboard", target: "Overview", severity: "info" as const },
  { id: "tl-3", timestamp: "2026-07-29T09:30:00Z", actor: "Sarah Chen", action: "Opened Events", target: "Active elections", severity: "info" as const },
  { id: "tl-4", timestamp: "2026-07-29T09:45:00Z", actor: "Sarah Chen", action: "Viewed Audit", target: "System logs", severity: "info" as const },
  { id: "tl-5", timestamp: "2026-07-29T10:00:00Z", actor: "Sarah Chen", action: "Exited Workspace", target: "LunarDAO", severity: "info" as const },
]
