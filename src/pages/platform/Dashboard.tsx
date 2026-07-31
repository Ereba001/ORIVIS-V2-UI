import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Shield, Activity, Server, Wifi, AlertTriangle, Inbox, RefreshCw } from "lucide-react"
import StatCard from "../../components/StatCard"
import SectionHeader from "../../components/SectionHeader"
import ActivityItem from "../../components/ActivityItem"
import NotificationItem from "../../components/NotificationItem"
import QuickActionCard from "../../components/QuickActionCard"
import RevenueChart from "../../components/RevenueChart"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"
import SeoHead from "../../components/SeoHead"

export default function PlatformDashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApiResource(platformService.getDashboard)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-brand-surface-elevated animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-brand-surface-elevated animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-brand-surface-elevated animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-brand-text-muted mt-1">{error ?? "No data available."}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <SeoHead meta={{ title: "Platform Dashboard | ORIVIS", noindex: true }} />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">
            Platform Dashboard
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">{today}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-brand-surface-elevated rounded-xl px-4 py-2 border border-brand-border">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-[10px] font-mono text-brand-text-muted font-bold uppercase tracking-wider">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {data.stats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <SectionHeader
              title="Platform Health"
              actionLabel="Details"
              onAction={() => navigate("/platform/system-health")}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-brand-surface-elevated rounded-xl p-4 border border-brand-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-status-success" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Uptime</span>
                </div>
                <p className="text-lg font-display font-bold text-brand-text-primary">99.8%</p>
                <p className="text-[10px] text-status-success font-mono">▲ 0.1% improvement</p>
              </div>
              <div className="bg-brand-surface-elevated rounded-xl p-4 border border-brand-border">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi size={14} className="text-status-success" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Response</span>
                </div>
                <p className="text-lg font-display font-bold text-brand-text-primary">124ms</p>
                <p className="text-[10px] text-status-success font-mono">▲ 12ms avg</p>
              </div>
              <div className="bg-brand-surface-elevated rounded-xl p-4 border border-brand-border">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={14} className="text-brand-text-muted" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Nodes</span>
                </div>
                <p className="text-lg font-display font-bold text-brand-text-primary">8/8</p>
                <p className="text-[10px] text-status-success font-mono">All healthy</p>
              </div>
              <div className="bg-brand-surface-elevated rounded-xl p-4 border border-brand-border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-brand-text-muted" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Requests</span>
                </div>
                <p className="text-lg font-display font-bold text-brand-text-primary">2.4k</p>
                <p className="text-[10px] text-status-success font-mono">▲ 8% today</p>
              </div>
            </div>
          </div>

          <RevenueChart />

          <div className="glass-card rounded-2xl p-6">
            <SectionHeader
              title="Recent Activity"
              actionLabel="View Full Log"
              onAction={() => navigate("/platform/audit")}
            />
            <div className="space-y-1">
              {data.activities.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-brand-text-muted py-4">
                  <Inbox size={16} /> No activity yet.
                </div>
              )}
              {data.activities.map((evt, i) => (
                <ActivityItem key={evt.id} event={evt} index={i} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-1 gap-3">
              {data.quickActions.map((action) => (
                <QuickActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <SectionHeader
              title="Notifications"
              actionLabel="View All"
              onAction={() => navigate("/platform/notifications")}
            />
            <div className="space-y-1">
              {data.notifications.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-brand-text-muted py-4">
                  <Inbox size={16} /> No notifications.
                </div>
              )}
              {data.notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  )
}
