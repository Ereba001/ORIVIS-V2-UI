import { useState } from "react"
import { motion } from "motion/react"
import { Activity, Server, Database, HardDrive, Mail, Bell, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, Download } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"

interface HealthMetric {
  label: string
  status: "operational" | "degraded" | "down"
  value: string
  icon: typeof Activity
  uptime: string
}

interface SystemMetric {
  label: string
  value: string
  trend: "up" | "down" | "stable"
  change: string
}

const HEALTH_METRICS: HealthMetric[] = [
  { label: "API Gateway", status: "operational", value: "99.9% uptime", icon: Server, uptime: "99.9%" },
  { label: "Database Cluster", status: "operational", value: "98ms avg latency", icon: Database, uptime: "99.97%" },
  { label: "Storage", status: "operational", value: "1.2 TB / 5 TB", icon: HardDrive, uptime: "99.95%" },
  { label: "Email Delivery", status: "operational", value: "99.8% delivery rate", icon: Mail, uptime: "99.8%" },
  { label: "Notification Queue", status: "operational", value: "0 pending failures", icon: Bell, uptime: "100%" },
  { label: "Background Jobs", status: "degraded", value: "3 jobs in retry", icon: Clock, uptime: "98.5%" },
]

const SYSTEM_METRICS: SystemMetric[] = [
  { label: "Platform Uptime (30d)", value: "99.97%", trend: "up", change: "+0.02%" },
  { label: "Avg Response Time", value: "124ms", trend: "up", change: "-12ms" },
  { label: "Active Sessions", value: "1,847", trend: "up", change: "+12.3%" },
  { label: "Error Rate", value: "0.08%", trend: "down", change: "+0.01%" },
  { label: "Storage Growth", value: "+18.5 GB/mo", trend: "up", change: "+5.2%" },
  { label: "API Requests/min", value: "2,340", trend: "up", change: "+8.1%" },
]

interface Incident {
  id: string
  title: string
  status: "resolved" | "monitoring" | "investigating"
  severity: "critical" | "major" | "minor"
  timestamp: string
  description: string
}

const INCIDENTS: Incident[] = [
  { id: "i1", title: "Elevated Database Latency", status: "resolved", severity: "major", timestamp: "2026-07-27T14:30:00Z", description: "Database query performance degraded for 8 minutes due to unoptimized query pattern." },
  { id: "i2", title: "Email Delivery Delay", status: "resolved", severity: "minor", timestamp: "2026-07-26T09:15:00Z", description: "Transactional email queue backed up for 22 minutes due to SMTP provider throttling." },
  { id: "i3", title: "Background Job Retry Loop", status: "monitoring", severity: "minor", timestamp: "2026-07-28T06:00:00Z", description: "Three voter import jobs entering retry loop. Investigating root cause." },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function PlatformMonitoring() {
  return (
    <>
    <SeoHead meta={{ title: "Platform Health — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Platform Health" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Platform Health</h1>
          <p className="text-sm text-brand-text-muted mt-1">Monitor infrastructure, system metrics, and incidents.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-brand-surface-elevated rounded-xl px-4 py-2 border border-brand-border">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-[10px] font-mono text-brand-text-muted font-bold uppercase tracking-wider">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {HEALTH_METRICS.map((metric, i) => {
          const Icon = metric.icon
          return (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Icon size={16} className="text-brand-text-muted" />
                <div className={`w-2 h-2 rounded-full ${
                  metric.status === "operational" ? "bg-status-success" :
                  metric.status === "degraded" ? "bg-status-warning" : "bg-status-error"
                } ${metric.status === "operational" ? "" : "animate-pulse"}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-text-primary">{metric.label}</p>
                <p className="text-[10px] text-brand-text-muted mt-0.5">{metric.value}</p>
              </div>
              <div className="text-[9px] font-mono text-brand-text-muted">
                Uptime: {metric.uptime}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">System Metrics</h2>
          </div>
          <div className="space-y-3">
            {SYSTEM_METRICS.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                <span className="text-xs text-brand-text-muted">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-text-primary">{m.value}</span>
                  <span className={`text-[9px] font-mono ${
                    m.trend === "up" && m.change.startsWith("+") ? "text-status-success" :
                    m.trend === "down" && m.change.startsWith("+") ? "text-status-error" : "text-brand-text-muted"
                  }`}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-brand-gold" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Incident History</h2>
          </div>
          <div className="space-y-3">
            {INCIDENTS.map((inc) => (
              <div key={inc.id} className="p-3 bg-brand-surface-elevated rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {inc.status === "resolved" ? <CheckCircle size={12} className="text-status-success" /> :
                     inc.status === "monitoring" ? <Clock size={12} className="text-status-warning" /> :
                     <AlertTriangle size={12} className="text-status-error" />}
                    <span className="text-xs font-semibold text-brand-text-primary">{inc.title}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    inc.severity === "critical" ? "bg-status-error/10 text-status-error" :
                    inc.severity === "major" ? "bg-status-warning/10 text-status-warning" :
                    "bg-brand-surface-interactive text-brand-text-muted"
                  }`}>{inc.severity}</span>
                </div>
                <p className="text-[10px] text-brand-text-muted mt-1">{inc.description}</p>
                <p className="text-[9px] font-mono text-brand-text-muted mt-1">{timeAgo(inc.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
