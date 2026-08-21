import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import {
  Activity, Database, Layers, RefreshCw, ShieldCheck, AlertTriangle,
  Clock, Cpu, Loader2,
} from "lucide-react"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import PageHeader from "../../components/platform/PageHeader"
import { platformService } from "../../services/platform-service"
import type { PlatformSystemHealth, SystemServiceHealth } from "../../types/platform"
import SeoHead from "../../components/SeoHead"

type ServiceKey = "database" | "cache" | "scheduler" | "queue"

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

const SERVICE_META: Record<ServiceKey, { label: string; icon: typeof Database; detail: string }> = {
  database: { label: "Database", icon: Database, detail: "Primary data store connection" },
  cache: { label: "Cache", icon: Layers, detail: "Read write round trip health" },
  scheduler: { label: "Scheduler", icon: Clock, detail: "Cron heartbeat for lifecycle jobs" },
  queue: { label: "Queue", icon: Activity, detail: "Background job depth and failures" },
}

export default function PlatformMonitoring() {
  const [health, setHealth] = useState<PlatformSystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await platformService.getMonitoringHealth()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load system health.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Keep the console live so a scheduler or queue regression surfaces without
  // a manual refresh.
  useEffect(() => {
    const timer = window.setInterval(() => { void load() }, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const services = health?.services

  return (
    <>
      <SeoHead meta={{ title: "System Health Monitoring | ORIVIS", noindex: true }} />
      <div className="max-w-4xl space-y-6">
        <Breadcrumbs items={[{ label: "System Health" }]} />
        <PageHeader
          title="System Health Monitoring"
          description="Live health of the platform database, cache, scheduler and background queue."
          actions={
            <button
              onClick={() => { setLoading(true); void load() }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-text-secondary text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          }
        />

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

        {loading && !health && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
            <Loader2 size={22} className="animate-spin text-brand-gold" />
            <span className="mt-3 text-xs text-brand-text-muted font-mono">Checking system health...</span>
          </div>
        )}

        {health && services && (
          <>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Platform Status</div>
                    <div className="text-base font-bold uppercase tracking-wider text-brand-text-primary">Operational</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="flex items-center gap-1.5 text-brand-text-muted">
                    <Cpu size={13} className="text-brand-text-disabled" /> {health.environment}
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text-muted">
                    <Clock size={13} className="text-brand-text-disabled" /> Checked {timeAgo(health.timestamp)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${health.debug ? "bg-status-warning/10 text-status-warning border border-status-warning/20" : "bg-status-success/10 text-status-success border border-status-success/20"}`}>
                    Debug {health.debug ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(SERVICE_META) as ServiceKey[]).map((key) => {
                const svc = services[key]
                const meta = SERVICE_META[key]
                const state = statusOf(svc)
                const Icon = meta.icon
                return (
                  <motion.div
                    key={key}
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          state === "healthy"
                            ? "bg-status-success/10 text-status-success border border-status-success/20"
                            : state === "unhealthy"
                              ? "bg-status-error/10 text-status-error border border-status-error/20"
                              : "bg-brand-surface-elevated text-brand-text-muted border border-brand-border"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            state === "healthy" ? "bg-status-success" : state === "unhealthy" ? "bg-status-error" : "bg-brand-text-disabled"
                          }`}
                        />
                        {state === "healthy" ? "Healthy" : state === "unhealthy" ? "Attention" : "Not Measurable"}
                      </span>
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
                      {key === "scheduler" && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-brand-text-muted">Last heartbeat</dt>
                          <dd className="font-mono text-brand-text-primary">{timeAgo(svc.lastTick)}</dd>
                        </div>
                      )}
                      {key === "queue" && svc.pending !== undefined && (
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
                    </dl>

                    {(svc.message || svc.error) && (
                      <p className="mt-3 pt-3 border-t border-brand-divider text-[11px] leading-relaxed text-brand-text-muted">
                        {svc.message ?? svc.error}
                      </p>
                    )}
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