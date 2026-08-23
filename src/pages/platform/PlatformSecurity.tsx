import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX,
  Activity, AlertOctagon, Bell, BellOff,
  Clock, RefreshCw, Search,
  ChevronRight,
  XCircle, Loader2,
  Building2, Globe, Zap, Ban,
  Crosshair,
} from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import SeoHead from "../../components/SeoHead"
import { useSecuritySSE, type ConnectionStatus } from "../../hooks/useSecuritySSE"
import type {
  SecurityEvent,
  SecurityIncident,
  SecurityAlert,
  SecurityEventSeverity,
  SecurityClassification,
  IncidentStatus,
} from "../../types/platform"

// Severity and classification helpers
const SEVERITY_CONFIG: Record<SecurityEventSeverity, { color: string; bg: string; border: string; icon: typeof Shield }> = {
  INFO: { color: "text-brand-text-muted", bg: "bg-brand-surface-elevated", border: "border-brand-border", icon: Shield },
  LOW: { color: "text-status-info", bg: "bg-status-info/10", border: "border-status-info/20", icon: Shield },
  MEDIUM: { color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/20", icon: ShieldAlert },
  HIGH: { color: "text-status-danger", bg: "bg-status-danger/10", border: "border-status-danger/20", icon: ShieldAlert },
  CRITICAL: { color: "text-status-error", bg: "bg-status-error/10", border: "border-status-error/20", icon: ShieldX },
}

const CLASSIFICATION_CONFIG: Record<SecurityClassification, { color: string; label: string }> = {
  NORMAL: { color: "text-status-success", label: "Normal" },
  SUSPICIOUS: { color: "text-status-warning", label: "Suspicious" },
  MALICIOUS: { color: "text-status-error", label: "Malicious" },
  BLOCKED: { color: "text-status-danger", label: "Blocked" },
}

const INCIDENT_STATUS_CONFIG: Record<IncidentStatus, { color: string; bg: string }> = {
  OPEN: { color: "text-status-error", bg: "bg-status-error/10 border border-status-error/20" },
  INVESTIGATING: { color: "text-status-warning", bg: "bg-status-warning/10 border border-status-warning/20" },
  CONTAINED: { color: "text-status-info", bg: "bg-status-info/10 border border-status-info/20" },
  RESOLVED: { color: "text-status-success", bg: "bg-status-success/10 border border-status-success/20" },
  FALSE_POSITIVE: { color: "text-brand-text-muted", bg: "bg-brand-surface-elevated border border-brand-border" },
}

function riskColor(score: number): string {
  if (score >= 95) return "text-status-error"
  if (score >= 80) return "text-status-danger"
  if (score >= 60) return "text-status-warning"
  if (score >= 20) return "text-status-info"
  return "text-brand-text-muted"
}

function riskBg(score: number): string {
  if (score >= 95) return "bg-status-error"
  if (score >= 80) return "bg-status-danger"
  if (score >= 60) return "bg-status-warning"
  if (score >= 20) return "bg-status-info"
  return "bg-brand-text-muted"
}

function timeAgo(value: string | null | undefined): string {
  if (!value) return "Never"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function ConnectionBadge({ status, lastEventAge }: { status: ConnectionStatus; lastEventAge: number | null }) {
  const config = {
    LIVE: { color: "bg-status-success", text: "LIVE", textColor: "text-status-success" },
    RECONNECTING: { color: "bg-status-warning", text: "RECONNECTING", textColor: "text-status-warning" },
    DEGRADED: { color: "bg-status-danger", text: "DEGRADED", textColor: "text-status-danger" },
    OFFLINE: { color: "bg-status-error", text: "OFFLINE", textColor: "text-status-error" },
  }[status]

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {status === "LIVE" && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`} />
      </span>
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${config.textColor}`}>
        {config.text}
      </span>
      {lastEventAge !== null && (
        <span className="text-[9px] text-brand-text-muted">
          Last event: {lastEventAge < 60 ? `${lastEventAge}s` : `${Math.floor(lastEventAge / 60)}m`} ago
        </span>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = "text-brand-text-primary", pulse = false }: {
  label: string
  value: string | number
  icon: typeof Shield
  color?: string
  pulse?: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">{label}</div>
          <div className={`text-xl font-bold mt-1 ${color} ${pulse ? "animate-pulse" : ""}`}>
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
      </div>
    </motion.div>
  )
}

function ActivityGraph({ buckets, total, periodMinutes }: {
  buckets: Array<{ time: string; timestamp: number; count: number }>
  total: number
  periodMinutes: number
}) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count))
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Platform Activity</div>
          <div className="text-sm font-bold text-brand-text-primary mt-0.5">{formatNumber(total)} events in {periodMinutes}min</div>
        </div>
      </div>
      <div className="flex items-end gap-[2px] h-32">
        {buckets.map((bucket, i) => {
          const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0
          return (
            <div key={i} className="flex-1 min-w-0 group relative" style={{ height: "100%" }}>
              <div className="absolute bottom-0 w-full flex items-end justify-center" style={{ height: "100%" }}>
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    bucket.count > 0
                      ? bucket.count > maxCount * 0.8 ? "bg-status-error" : bucket.count > maxCount * 0.5 ? "bg-status-warning" : "bg-brand-gold"
                      : "bg-brand-surface-elevated"
                  }`}
                  style={{ height: `${Math.max(1, height)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[8px] text-brand-text-muted font-mono">
        <span>{buckets[0]?.time ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.time ?? ""}</span>
      </div>
    </div>
  )
}

function RiskBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const sizeClasses = size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-mono font-bold ${sizeClasses} ${riskColor(score)} bg-brand-surface-elevated border border-brand-border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${riskBg(score)}`} />
      {score}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: SecurityEventSeverity }) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${config.color} ${config.bg} ${config.border}`}>
      {severity}
    </span>
  )
}

function ClassificationBadge({ classification }: { classification: SecurityClassification }) {
  const config = CLASSIFICATION_CONFIG[classification]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${config.color}`}>
      {config.label}
    </span>
  )
}

function EventRow({ event, onSelect }: { event: SecurityEvent; onSelect: (e: SecurityEvent) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 px-4 py-3 border-b border-brand-divider hover:bg-brand-surface-elevated/50 cursor-pointer transition-colors"
      onClick={() => onSelect(event)}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        event.severity === "CRITICAL" ? "bg-status-error animate-pulse" :
        event.severity === "HIGH" ? "bg-status-danger" :
        event.severity === "MEDIUM" ? "bg-status-warning" :
        event.severity === "LOW" ? "bg-status-info" : "bg-brand-text-disabled"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-brand-text-primary truncate max-w-[200px]">{event.event_type}</span>
          <SeverityBadge severity={event.severity} />
          <ClassificationBadge classification={event.classification} />
          <RiskBadge score={event.risk_score} />
        </div>
        <div className="flex items-center gap-3 mt-1 text-[9px] text-brand-text-muted">
          {event.organization_id && (<span className="flex items-center gap-1"><Building2 size={10} />{event.organization_name ?? `Org #${event.organization_id}`}</span>)}
          {event.ip_address && (<span className="flex items-center gap-1"><Globe size={10} />{event.ip_address}</span>)}
          <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(event.created_at)}</span>
        </div>
      </div>
      <ChevronRight size={12} className="text-brand-text-disabled shrink-0 mt-1.5" />
    </motion.div>
  )
}

function IncidentRow({ incident, onSelect }: { incident: SecurityIncident; onSelect: (inc: SecurityIncident) => void }) {
  const statusConfig = INCIDENT_STATUS_CONFIG[incident.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 border-b border-brand-divider hover:bg-brand-surface-elevated/50 cursor-pointer transition-colors"
      onClick={() => onSelect(incident)}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        incident.status === "OPEN" ? "bg-status-error animate-pulse" :
        incident.status === "INVESTIGATING" ? "bg-status-warning" :
        incident.status === "CONTAINED" ? "bg-status-info" :
        incident.status === "RESOLVED" ? "bg-status-success" : "bg-brand-text-disabled"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-brand-text-primary truncate max-w-[250px]">{incident.title ?? `Incident #${incident.id}`}</span>
          <SeverityBadge severity={incident.severity} />
          <RiskBadge score={incident.risk_score} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${statusConfig.color} ${statusConfig.bg}`}>{incident.status}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[9px] text-brand-text-muted">
          {incident.organization && (<span className="flex items-center gap-1"><Building2 size={10} />{incident.organization.name}</span>)}
          <span>{incident.event_count} events</span>
          <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(incident.created_at)}</span>
        </div>
      </div>
      <ChevronRight size={12} className="text-brand-text-disabled shrink-0 mt-1.5" />
    </motion.div>
  )
}

function AlertRow({ alert, onAction }: { alert: SecurityAlert; onAction: (id: number, action: string) => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-brand-divider">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
        alert.severity === "CRITICAL" ? "bg-status-error animate-pulse" :
        alert.severity === "HIGH" ? "bg-status-danger" :
        alert.severity === "MEDIUM" ? "bg-status-warning" : "bg-brand-text-disabled"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-brand-text-primary truncate max-w-[200px]">{alert.title}</span>
          <SeverityBadge severity={alert.severity} />
          {alert.count > 1 && (<span className="text-[9px] font-mono text-brand-text-muted">x{alert.count}</span>)}
          <span className="text-[9px] text-brand-text-muted">{timeAgo(alert.created_at)}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {alert.status === "OPEN" && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onAction(alert.id, "acknowledge") }} className="text-[9px] px-2 py-1 rounded-lg bg-status-info/10 border border-status-info/20 text-status-info hover:bg-status-info/20 transition-all cursor-pointer">Ack</button>
            <button onClick={(e) => { e.stopPropagation(); onAction(alert.id, "false-positive") }} className="text-[9px] px-2 py-1 rounded-lg bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive transition-all cursor-pointer">FP</button>
          </>
        )}
      </div>
    </div>
  )
}

function EventDetailDrawer({ event, onClose }: { event: SecurityEvent; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-lg bg-brand-bg border-l border-brand-divider overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-brand-bg border-b border-brand-divider px-5 py-4 flex items-center justify-between z-10">
          <div><div className="text-xs font-bold text-brand-text-primary">Security Event Detail</div><div className="text-[9px] font-mono text-brand-text-muted mt-0.5">{event.uuid}</div></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-surface-elevated transition-colors cursor-pointer"><XCircle size={16} className="text-brand-text-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap"><SeverityBadge severity={event.severity} /><ClassificationBadge classification={event.classification} /><RiskBadge score={event.risk_score} size="md" /></div>
          {event.risk_factors && event.risk_factors.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-2">Risk Factors</div>
              <div className="space-y-1.5">{event.risk_factors.map((f, i) => (<div key={i} className="flex items-start gap-2 text-[10px]"><span className="text-status-warning font-mono font-bold">+{f.contribution}</span><span className="text-brand-text-primary">{f.reason}</span></div>))}</div>
            </div>
          )}
          <div className="glass-card rounded-xl p-4 space-y-2.5">
            <div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-1">Event Details</div>
            {[['Event Type', event.event_type], ['Action', event.action], ['Result', event.result], ['Source', event.source], ['HTTP', `${event.http_method ?? ''} ${event.endpoint ?? ''}`], ['Status', event.http_status?.toString()], ['IP', event.ip_address]].filter(([,v]) => v).map(([l, v]) => (
              <div key={l as string} className="flex items-start justify-between gap-2"><span className="text-[9px] text-brand-text-muted shrink-0">{l}</span><span className="text-[10px] font-mono text-brand-text-primary text-right">{v as string}</span></div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function IncidentDetailDrawer({ incident, onClose }: { incident: SecurityIncident; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-xl bg-brand-bg border-l border-brand-divider overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-brand-bg border-b border-brand-divider px-5 py-4 flex items-center justify-between z-10">
          <div><div className="text-xs font-bold text-brand-text-primary">Incident Investigation</div><div className="text-[9px] font-mono text-brand-text-muted mt-0.5">{incident.uuid}</div></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-surface-elevated transition-colors cursor-pointer"><XCircle size={16} className="text-brand-text-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap"><SeverityBadge severity={incident.severity} /><RiskBadge score={incident.risk_score} size="md" /><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${INCIDENT_STATUS_CONFIG[incident.status].color} ${INCIDENT_STATUS_CONFIG[incident.status].bg}`}>{incident.status}</span></div>
          <div className="text-sm font-bold text-brand-text-primary">{incident.title}</div>
          {incident.description && <div className="text-[10px] text-brand-text-muted leading-relaxed">{incident.description}</div>}
          {incident.detection_rules && incident.detection_rules.length > 0 && (
            <div className="glass-card rounded-xl p-4"><div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-2">Detection Rules</div><div className="flex flex-wrap gap-1.5">{incident.detection_rules.map((r, i) => (<span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-status-warning/10 border border-status-warning/20 text-status-warning">{r}</span>))}</div></div>
          )}
          <div className="glass-card rounded-xl p-4 space-y-2.5">
            <div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold mb-1">Details</div>
            {[['Organization', incident.organization?.name], ['ORIVIS ID', incident.organization?.orivis_id], ['Events', incident.event_count?.toString()], ['Source IP', incident.source_ip], ['Auto Response', incident.auto_response]].filter(([,v]) => v).map(([l, v]) => (
              <div key={l as string} className="flex items-start justify-between gap-2"><span className="text-[9px] text-brand-text-muted shrink-0">{l}</span><span className="text-[10px] font-mono text-brand-text-primary text-right">{v as string}</span></div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PlatformSecurity() {
  const { connectionStatus, lastEventAge, dashboard, realtime, activityGraph, events, alerts, incidents, loading, refresh } = useSecuritySSE()
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null)
  const [activeTab, setActiveTab] = useState<"stream" | "incidents" | "alerts" | "organizations">("stream")
  const [streamFilter, setStreamFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")

  const filteredEvents = useMemo(() => {
    let result = events
    if (streamFilter) {
      const lower = streamFilter.toLowerCase()
      result = result.filter((e) => e.event_type.toLowerCase().includes(lower) || (e.endpoint ?? "").toLowerCase().includes(lower) || (e.ip_address ?? "").toLowerCase().includes(lower))
    }
    if (severityFilter) result = result.filter((e) => e.severity === severityFilter)
    return result
  }, [events, streamFilter, severityFilter])

  const handleAlertAction = async (alertId: number, action: string) => {
    try {
      const { getApiClient } = await import("../../lib/api-client")
      const { API } = await import("../../constants/api")
      if (action === "acknowledge") await getApiClient().put(API.ENDPOINTS.PLATFORM.SECURITY_ALERT_ACKNOWLEDGE(String(alertId)))
      else if (action === "false-positive") await getApiClient().put(API.ENDPOINTS.PLATFORM.SECURITY_ALERT_FALSE_POSITIVE(String(alertId)), { note: "Marked false positive from SOC" })
      refresh()
    } catch { /* ignore */ }
  }

  return (
    <>
      <SeoHead meta={{ title: "Security Operations Center | ORIVIS", noindex: true }} />
      <div className="max-w-7xl space-y-5">
        <Breadcrumbs items={[{ label: "Security Operations Center" }]} />
        <PageHeader
          title="Security Operations Center"
          description="Real-time platform security monitoring, threat detection, and incident response."
          actions={<div className="flex items-center gap-3"><ConnectionBadge status={connectionStatus} lastEventAge={lastEventAge} /><button onClick={() => refresh()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-secondary text-[10px] font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all cursor-pointer"><RefreshCw size={12} />Refresh</button></div>}
        />
        {loading && !dashboard && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center"><Loader2 size={22} className="animate-spin text-brand-gold" /><span className="mt-3 text-xs text-brand-text-muted font-mono">Initializing Security Center...</span></div>
        )}
        {dashboard && (
          <>
            <div className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${dashboard.security_status === "ALERT" ? "border border-status-error/30" : "border border-status-success/30"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dashboard.security_status === "ALERT" ? "bg-status-error/10 border border-status-error/20" : "bg-status-success/10 border border-status-success/20"}`}>
                {dashboard.security_status === "ALERT" ? <ShieldAlert size={20} className="text-status-error" /> : <ShieldCheck size={20} className="text-status-success" />}
              </div>
              <div className="flex-1"><div className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">System Status</div><div className={`text-sm font-bold uppercase tracking-wider ${dashboard.system_status === "OPERATIONAL" ? "text-status-success" : "text-status-warning"}`}>{dashboard.system_status} / Security {dashboard.security_status}</div></div>
              {dashboard.security_status === "ALERT" && <div className="flex items-center gap-2"><span className="text-[10px] font-mono font-bold text-status-error">{dashboard.active_incidents} Active Incident{dashboard.active_incidents !== 1 ? "s" : ""}</span><AlertOctagon size={14} className="text-status-error animate-pulse" /></div>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Actions/sec" value={realtime?.actions_per_second ?? dashboard.actions_per_second} icon={Zap} color="text-brand-gold" />
              <StatCard label="Active Incidents" value={dashboard.active_incidents} icon={AlertOctagon} color={dashboard.active_incidents > 0 ? "text-status-error" : "text-status-success"} pulse={dashboard.active_incidents > 0} />
              <StatCard label="Critical Alerts" value={dashboard.critical_alerts} icon={Bell} color={dashboard.critical_alerts > 0 ? "text-status-error" : "text-brand-text-muted"} />
              <StatCard label="Suspended Orgs" value={dashboard.suspended_organizations} icon={Ban} color={dashboard.suspended_organizations > 0 ? "text-status-error" : "text-status-success"} />
              <StatCard label="Suspicious Sources" value={dashboard.suspicious_sources} icon={Crosshair} color={dashboard.suspicious_sources > 0 ? "text-status-warning" : "text-status-success"} />
              <StatCard label="Active Orgs" value={dashboard.active_organizations} icon={Building2} color="text-status-info" />
            </div>
            {activityGraph && <ActivityGraph buckets={activityGraph.buckets} total={activityGraph.total} periodMinutes={activityGraph.period_minutes} />}
            <div className="flex items-center gap-1 p-1 bg-brand-surface rounded-xl border border-brand-divider">
              {[{ key: "stream" as const, label: "Live Stream", icon: Activity }, { key: "incidents" as const, label: "Incidents", icon: AlertOctagon }, { key: "alerts" as const, label: "Alerts", icon: Bell }, { key: "organizations" as const, label: "Orgs", icon: Building2 }].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab.key ? "bg-brand-bg-elevated text-brand-text-primary shadow-sm" : "text-brand-text-muted hover:text-brand-text-secondary"}`}><tab.icon size={12} />{tab.label}</button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === "stream" && (
                <motion.div key="stream" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-divider flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5"><Search size={12} className="text-brand-text-muted" /><input type="text" placeholder="Filter events..." value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)} className="bg-transparent text-[10px] text-brand-text-primary placeholder:text-brand-text-disabled outline-none w-40" /></div>
                      <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1 text-[10px] text-brand-text-primary outline-none cursor-pointer"><option value="">All Severity</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="INFO">Info</option></select>
                      <div className="flex-1" /><span className="text-[9px] font-mono text-brand-text-muted">{filteredEvents.length} events</span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {filteredEvents.length === 0 ? (
                        <div className="p-8 text-center"><Activity size={24} className="mx-auto text-brand-text-disabled mb-2" /><div className="text-xs text-brand-text-muted">No security events yet</div></div>
                      ) : filteredEvents.map((event) => <EventRow key={event.id} event={event} onSelect={setSelectedEvent} />)}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "incidents" && (
                <motion.div key="incidents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-brand-divider flex items-center gap-2"><AlertOctagon size={14} className="text-brand-gold" /><span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Security Incidents ({incidents.length})</span></div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {incidents.length === 0 ? <div className="p-8 text-center"><ShieldCheck size={24} className="mx-auto text-status-success mb-2" /><div className="text-xs text-brand-text-muted">No security incidents</div></div> : incidents.map((inc) => <IncidentRow key={inc.id} incident={inc} onSelect={setSelectedIncident} />)}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "alerts" && (
                <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-brand-divider flex items-center gap-2"><Bell size={14} className="text-brand-gold" /><span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Security Alerts ({alerts.length})</span></div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {alerts.length === 0 ? <div className="p-8 text-center"><BellOff size={24} className="mx-auto text-brand-text-disabled mb-2" /><div className="text-xs text-brand-text-muted">No active alerts</div></div> : alerts.map((al) => <AlertRow key={al.id} alert={al} onAction={handleAlertAction} />)}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "organizations" && (
                <motion.div key="organizations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="glass-card rounded-2xl p-8 text-center"><ShieldCheck size={24} className="mx-auto text-status-success mb-2" /><div className="text-xs text-brand-text-muted">Organizations requiring attention will appear here when anomalies are detected</div></div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      <AnimatePresence>{selectedEvent && <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />}</AnimatePresence>
      <AnimatePresence>{selectedIncident && <IncidentDetailDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}</AnimatePresence>
    </>
  )
}