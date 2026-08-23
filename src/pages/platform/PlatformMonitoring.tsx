import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Activity, Database, Layers, RefreshCw, ShieldCheck, AlertTriangle,
  Clock, Cpu, Loader2, Server, Zap, Mail, Globe,
  CheckCircle2, XCircle,
  AlertCircle, TrendingUp, BarChart3, MemoryStick, Wallet,
} from "lucide-react"
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import { platformService } from "../../services/platform-service"
import type {
  EnhancedSystemHealth, SystemServiceHealth, TelemetryMetric,
  HealthIncident, DependencyNode,
} from "../../types/platform"
import SeoHead from "../../components/SeoHead"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusOf(svc: SystemServiceHealth): "healthy" | "unhealthy" | "unknown" {
  if (svc.healthy === true) return "healthy"
  if (svc.healthy === false) return "unhealthy"
  return "unknown"
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

// ---------------------------------------------------------------------------
// Service metadata
// ---------------------------------------------------------------------------

type ServiceKey = "database" | "cache" | "scheduler" | "queue" | "memory"

const SERVICE_META: Record<ServiceKey, { label: string; icon: typeof Database; detail: string }> = {
  database: { label: "Database", icon: Database, detail: "Primary data store" },
  cache: { label: "Cache", icon: Layers, detail: "Read/write round trip" },
  scheduler: { label: "Scheduler", icon: Clock, detail: "Cron heartbeat" },
  queue: { label: "Queue", icon: Activity, detail: "Background jobs" },
  memory: { label: "Memory", icon: MemoryStick, detail: "PHP runtime" },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: "healthy" | "unhealthy" | "unknown" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
        status === "healthy"
          ? "bg-status-success/10 text-status-success border border-status-success/20"
          : status === "unhealthy"
            ? "bg-status-error/10 text-status-error border border-status-error/20"
            : "bg-brand-surface-elevated text-brand-text-muted border border-brand-border"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "healthy" ? "bg-status-success" : status === "unhealthy" ? "bg-status-error" : "bg-brand-text-disabled"
        }`}
      />
      {status === "healthy" ? "Healthy" : status === "unhealthy" ? "Attention" : "Unknown"}
    </span>
  )
}

function MetricCard({ label, value, unit, trend, icon: Icon }: {
  label: string; value: string | number; unit?: string; trend?: "up" | "down" | "neutral"; icon: typeof Database
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-brand-text-disabled" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-brand-text-primary font-mono">{value}</span>
        {unit && <span className="text-xs text-brand-text-muted">{unit}</span>}
        {trend && (
          <TrendingUp
            size={12}
            className={trend === "up" ? "text-status-success" : trend === "down" ? "text-status-error" : "text-brand-text-disabled"}
          />
        )}
      </div>
    </div>
  )
}

function ServiceCard({ serviceKey, svc, meta }: { serviceKey: ServiceKey; svc: SystemServiceHealth; meta: typeof SERVICE_META[ServiceKey] }) {
  const state = statusOf(svc)
  const Icon = meta.icon
  const s = svc as any

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-surface-elevated border border-brand-border flex items-center justify-center">
            <Icon size={17} className="text-brand-text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-brand-text-primary">{meta.label}</div>
            <div className="text-[10px] text-brand-text-muted mt-0.5">{meta.detail}</div>
          </div>
        </div>
        <StatusBadge status={state} />
      </div>

      <dl className="mt-4 space-y-1.5 text-xs">
        {svc.driver && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-brand-text-muted">Driver</dt>
            <dd className="font-mono text-brand-text-primary">{svc.driver}</dd>
          </div>
        )}
        {svc.connection && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-brand-text-muted">Connection</dt>
            <dd className="font-mono text-brand-text-primary">{svc.connection}</dd>
          </div>
        )}
        {s.latencyMs !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-brand-text-muted">Latency</dt>
            <dd className={`font-mono ${s.latencyMs > 100 ? 'text-status-warning' : 'text-brand-text-primary'}`}>{s.latencyMs}ms</dd>
          </div>
        )}
        {serviceKey === "scheduler" && "lastTick" in svc && svc.lastTick && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-brand-text-muted">Last heartbeat</dt>
            <dd className="font-mono text-brand-text-primary">{timeAgo(svc.lastTick)}</dd>
          </div>
        )}
        {serviceKey === "queue" && "pending" in svc && (
          <>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Pending</dt>
              <dd className="font-mono text-brand-text-primary">{svc.pending}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Processing</dt>
              <dd className="font-mono text-brand-text-primary">{svc.processing}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Failed</dt>
              <dd className={`font-mono ${svc.failed && svc.failed > 0 ? "text-status-error" : "text-brand-text-primary"}`}>{svc.failed}</dd>
            </div>
          </>
        )}
        {serviceKey === "memory" && "usagePercent" in svc && (
          <>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Usage</dt>
              <dd className="font-mono text-brand-text-primary">{s.usageFormatted}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Peak</dt>
              <dd className="font-mono text-brand-text-primary">{s.peakFormatted}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-brand-text-muted">Limit</dt>
              <dd className="font-mono text-brand-text-primary">{s.limitFormatted}</dd>
            </div>
            <div className="w-full bg-brand-surface-elevated rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${(s.usagePercent ?? 0) > 80 ? 'bg-status-error' : (s.usagePercent ?? 0) > 60 ? 'bg-status-warning' : 'bg-status-success'}`}
                style={{ width: `${Math.min(s.usagePercent ?? 0, 100)}%` }}
              />
            </div>
          </>
        )}
      </dl>

      {(svc.message || svc.error) && (
        <p className="mt-3 pt-3 border-t border-brand-divider text-[11px] leading-relaxed text-brand-text-muted">
          {svc.message ?? svc.error}
        </p>
      )}
    </motion.div>
  )
}

function ExternalServiceCard({ name, svc }: { name: string; svc: { healthy: boolean | null; latencyMs?: number; error?: string; message?: string } }) {
  const state: "healthy" | "unhealthy" | "unknown" = svc.healthy === true ? "healthy" : svc.healthy === false ? "unhealthy" : "unknown"
  const Icon = name === "paystack" ? Wallet : name === "brevo" ? Mail : Globe

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-brand-text-disabled" />
          <span className="text-xs font-bold text-brand-text-primary capitalize">{name}</span>
        </div>
        <StatusBadge status={state} />
      </div>
      {svc.latencyMs !== undefined && (
        <div className="text-[10px] font-mono text-brand-text-muted">{svc.latencyMs}ms</div>
      )}
      {svc.message && (
        <div className="text-[10px] text-brand-text-muted mt-1">{svc.message}</div>
      )}
      {svc.error && (
        <div className="text-[10px] text-status-error mt-1">{svc.error}</div>
      )}
    </div>
  )
}

function IncidentRow({ incident }: { incident: HealthIncident }) {
  const severityColor = incident.severity === "critical" ? "text-status-error" : incident.severity === "warning" ? "text-status-warning" : "text-status-info"
  const StatusIcon = incident.status === "resolved" ? CheckCircle2 : incident.status === "investigating" ? AlertCircle : XCircle

  return (
    <div className="flex items-start gap-3 py-3 border-b border-brand-divider last:border-0">
      <StatusIcon size={16} className={`${severityColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-text-primary">{incident.title}</span>
          <span className={`text-[9px] font-mono uppercase tracking-wider ${severityColor}`}>{incident.severity}</span>
        </div>
        <div className="text-[10px] text-brand-text-muted mt-0.5 capitalize">{incident.service} � {incident.status}</div>
        {incident.description && (
          <div className="text-[10px] text-brand-text-muted mt-1">{incident.description}</div>
        )}
      </div>
      <div className="text-[10px] text-brand-text-muted shrink-0">{timeAgo(incident.started_at)}</div>
    </div>
  )
}

function DependencyNodeCard({ node }: { node: DependencyNode }) {
  const typeColors: Record<string, string> = {
    database: "bg-status-info/10 text-status-info border-status-info/20",
    cache: "bg-status-success/10 text-status-success border-status-success/20",
    queue: "bg-status-danger/10 text-status-danger border-status-danger/20",
    scheduler: "bg-status-info/10 text-status-info border-status-info/20",
    external: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${typeColors[node.type] ?? typeColors.external}`}>
          {node.type}
        </span>
        <span className="text-xs font-bold text-brand-text-primary">{node.name}</span>
      </div>
      <p className="text-[10px] text-brand-text-muted mb-2">{node.description}</p>
      {node.dependencies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {node.dependencies.map((dep) => (
            <span key={dep} className="text-[9px] font-mono text-brand-text-disabled bg-brand-surface-elevated px-1.5 py-0.5 rounded">
              requires: {dep}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlatformMonitoring() {
  const [health, setHealth] = useState<EnhancedSystemHealth | null>(null)
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([])
  const [incidents, setIncidents] = useState<HealthIncident[]>([])
  const [dependencies, setDependencies] = useState<DependencyNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collecting, setCollecting] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "incidents" | "dependencies">("overview")

  const load = useCallback(async () => {
    try {
      const [healthData, metricsData, incidentsData, depsData] = await Promise.allSettled([
        platformService.getMonitoringHealth() as Promise<EnhancedSystemHealth>,
        platformService.getMonitoringMetrics("request", 24),
        platformService.getMonitoringIncidents(20),
        platformService.getMonitoringDependencies(),
      ])

      if (healthData.status === "fulfilled") setHealth(healthData.value)
      if (metricsData.status === "fulfilled") setMetrics(metricsData.value)
      if (incidentsData.status === "fulfilled") setIncidents(incidentsData.value)
      if (depsData.status === "fulfilled") setDependencies(depsData.value.services)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load monitoring data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = window.setInterval(() => { void load() }, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const handleCollect = useCallback(async () => {
    setCollecting(true)
    try {
      await platformService.triggerTelemetryCollection()
      await load()
    } finally {
      setCollecting(false)
    }
  }, [load])

  const services = health?.services
  const allHealthy = services
    ? (["database", "cache", "scheduler", "queue"] as const).every((k) => services[k]?.healthy !== false)
    : false

  // Prepare chart data
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      time: new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: m.value,
    }))
  }, [metrics])

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "metrics" as const, label: "Metrics" },
    { id: "incidents" as const, label: `Incidents${incidents.length > 0 ? ` (${incidents.filter(i => i.status !== 'resolved').length})` : ''}` },
    { id: "dependencies" as const, label: "Dependencies" },
  ]

  return (
    <>
      <SeoHead meta={{ title: "System Health Monitoring | ORIVIS", noindex: true }} />
      <div className="max-w-6xl space-y-6">
        <Breadcrumbs items={[{ label: "System Health" }]} />
        <PageHeader
          title="System Health Monitoring"
          description="Live observability command center for all platform infrastructure."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleCollect}
                disabled={collecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-secondary text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all disabled:opacity-50 cursor-pointer"
              >
                {collecting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Collect
              </button>
              <button
                onClick={() => { setLoading(true); void load() }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-secondary text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
            </div>
          }
        />

        {/* Error banner */}
        {error && (
          <div role="alert" className="flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-xl p-4">
            <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-status-error">Health check failed</p>
              <p className="text-xs text-brand-text-muted mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => { setLoading(true); void load() }}
              className="text-xs font-bold uppercase tracking-wider text-status-error underline underline-offset-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !health && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
            <Loader2 size={22} className="animate-spin text-brand-gold" />
            <span className="mt-3 text-xs text-brand-text-muted font-mono">Checking system health...</span>
          </div>
        )}

        {/* Dashboard */}
        {health && services && (
          <>
            {/* Platform status banner */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allHealthy ? 'bg-status-success/10 border border-status-success/20' : 'bg-status-error/10 border border-status-error/20'}`}>
                    <ShieldCheck size={20} className={allHealthy ? 'text-status-success' : 'text-status-error'} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Platform Status</div>
                    <div className="text-base font-bold uppercase tracking-wider text-brand-text-primary">{allHealthy ? "All Systems Operational" : "Some Systems Degraded"}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="flex items-center gap-1.5 text-brand-text-muted">
                    <Cpu size={13} className="text-brand-text-disabled" /> PHP {health.php.version}
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text-muted">
                    <Clock size={13} className="text-brand-text-disabled" /> Checked {timeAgo(health.timestamp)}
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text-muted">
                    <Server size={13} className="text-brand-text-disabled" /> {health.environment}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${health.debug ? "bg-status-warning/10 text-status-warning border border-status-warning/20" : "bg-status-success/10 text-status-success border border-status-success/20"}`}>
                    Debug {health.debug ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-wrap items-center gap-1 border-b border-brand-divider">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-brand-gold border-b-2 border-brand-gold'
                      : 'text-brand-text-muted hover:text-brand-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {/* Service health grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(SERVICE_META) as ServiceKey[]).filter((key) => key in services).map((key) => (
                      <ServiceCard key={key} serviceKey={key} svc={services[key]!} meta={SERVICE_META[key]} />
                    ))}
                  </div>

                  {/* External services */}
                  {"external" in services && services.external && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-3">External Services</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(services.external).map(([name, svc]) => (
                          <ExternalServiceCard key={name} name={name} svc={svc as any} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard label="Queue Pending" value={services.queue?.pending ?? 0} icon={Activity} />
                    <MetricCard label="Queue Failed" value={services.queue?.failed ?? 0} icon={AlertTriangle} />
                    <MetricCard label="DB Latency" value={`${services.database?.latencyMs ?? 0}`} unit="ms" icon={Database} />
                    <MetricCard label="Cache Latency" value={`${services.cache?.latencyMs ?? 0}`} unit="ms" icon={Layers} />
                  </div>
                </motion.div>
              )}

              {activeTab === "metrics" && (
                <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {chartData.length > 0 ? (
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-4">Request Activity (24h)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-divider)" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--brand-text-muted)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--brand-text-muted)' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--brand-surface)',
                              border: '1px solid var(--brand-border)',
                              borderRadius: '8px',
                              fontSize: '11px',
                            }}
                          />
                          <Area type="monotone" dataKey="value" stroke="var(--brand-gold)" fill="var(--brand-gold)" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl p-12 text-center">
                      <BarChart3 size={22} className="mx-auto text-brand-text-disabled mb-2" />
                      <p className="text-xs text-brand-text-muted">No metrics collected yet. Click "Collect" to gather telemetry data.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "incidents" && (
                <motion.div key="incidents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="glass-card rounded-2xl p-6">
                    {incidents.length > 0 ? (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-4">Recent Incidents</h3>
                        {incidents.map((incident) => (
                          <IncidentRow key={incident.id} incident={incident} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 size={22} className="mx-auto text-status-success mb-2" />
                        <p className="text-xs text-brand-text-muted">No incidents recorded. All clear.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "dependencies" && (
                <motion.div key="dependencies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {dependencies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dependencies.map((node) => (
                        <DependencyNodeCard key={node.name} node={node} />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl p-12 text-center">
                      <Globe size={22} className="mx-auto text-brand-text-disabled mb-2" />
                      <p className="text-xs text-brand-text-muted">Dependency map unavailable.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  )
}
