import { motion } from "motion/react"
import { BarChart3, TrendingUp, Users, Vote, Smartphone, Monitor, Globe, Activity, AlertTriangle, RefreshCw, Inbox } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"

function fmt(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString()
}

export default function Analytics() {
  const { data, loading, error, reload } = useApiResource(() => platformService.getAnalytics())

  const stats = data?.stats
  const breakdown = data?.electionBreakdown
  const activity = data?.activity
  const growth = data?.growth ?? []
  const devices = data?.deviceDistribution ?? []
  const topOrganizations = data?.topOrganizations ?? []
  const hasOrgs = topOrganizations.length > 0

  const voteChange = stats && stats.votes.lastMonth > 0
    ? ((stats.votes.thisMonth - stats.votes.lastMonth) / stats.votes.lastMonth) * 100
    : 0

  const STATS = [
    { label: "Total Votes Cast", value: stats ? fmt(stats.votes.total) : "—", change: `${voteChange >= 0 ? "+" : ""}${voteChange.toFixed(1)}% vs last month`, icon: Vote, color: "text-brand-gold" },
    { label: "Verified Participants", value: stats ? fmt(stats.voters.verified) : "—", change: stats?.voters.total ? `of ${fmt(stats.voters.total)} registered` : "No registered participants", icon: Users, color: "text-blue-400" },
    { label: "Avg. Turnout Rate", value: stats ? `${stats.turnout}%` : "—", change: "cast votes per registered voter", icon: TrendingUp, color: "text-green-400" },
    { label: "Events Completed", value: stats ? fmt(stats.electionsCompleted) : "—", change: breakdown ? `${breakdown.live} live · ${breakdown.active} published` : "", icon: BarChart3, color: "text-purple-400" },
  ]

  const maxGrowth = Math.max(1, ...growth.map((g) => g.organizations), ...growth.map((g) => g.users), ...growth.map((g) => g.votes))
  const maxStatus = Math.max(1, ...(breakdown?.byStatus ?? []).map((s) => s.count))

  return (
    <>
    <SeoHead meta={{ title: "Analytics — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Analytics" }]} />
      <div>
        <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-brand-text-primary">Analytics</h1>
        <p className="text-sm text-brand-text-muted mt-1">Platform wide analytics and insights.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-brand-surface-elevated animate-pulse rounded-2xl" />
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={32} className="text-status-error mb-3" />
          <p className="text-brand-text-primary font-semibold">Failed to load analytics</p>
          <p className="text-sm text-brand-text-muted mt-1">{error}</p>
          <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-gold hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-brand-surface border border-brand-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center ${stat.color} mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold font-mono text-brand-text-primary">{stat.value}</p>
              <p className="text-xs text-brand-text-muted mt-1">{stat.label}</p>
              <p className="text-[10px] font-mono mt-1 text-brand-text-muted/60">{stat.change}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Election Status</h2>
            <Activity size={16} className="text-brand-text-muted" />
          </div>
          <div className="space-y-3">
            {(breakdown?.byStatus ?? []).map((st) => (
              <div key={st.status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-brand-text-primary">{st.status}</span>
                  <span className="text-[10px] font-mono text-brand-text-muted">{st.count}</span>
                </div>
                <div className="w-full h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(st.count / maxStatus) * 100}%` }} transition={{ duration: 1 }}
                    className="h-full rounded-full bg-brand-gold" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-brand-border mt-4 text-[10px] font-mono text-brand-text-muted">
            {breakdown?.total ?? 0} total elections · {fmt(activity?.last30Days ?? 0)} actions in the last 30 days
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Traffic by Device</h2>
            <Smartphone size={16} className="text-brand-text-muted" />
          </div>
          {devices.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-brand-text-muted py-6">
              <Inbox size={14} /> No device signals captured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((d) => {
                const icon = d.label === "Desktop" ? Monitor : d.label === "Tablet" ? Globe : Smartphone
                const color = d.label === "Desktop" ? "bg-brand-gold" : d.label === "Tablet" ? "bg-green-400" : "bg-blue-400"
                const Icon = icon
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-xs text-brand-text-primary">
                        <Icon size={14} className="text-brand-text-muted" />{d.label}
                      </span>
                      <span className="text-[10px] font-mono text-brand-text-muted">{d.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-brand-surface-elevated rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }} transition={{ duration: 1 }}
                        className={`h-full rounded-full ${color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Monthly Growth</h2>
          <div className="space-y-2">
            {growth.map((d) => (
              <div key={d.month} className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-brand-text-muted w-8">{d.month}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-3 rounded-sm bg-brand-gold/30" style={{ width: `${(d.organizations / maxGrowth) * 100}%` }} title={`${d.organizations} organizations`} />
                  <div className="h-3 rounded-sm bg-blue-400/30" style={{ width: `${(d.users / maxGrowth) * 100}%` }} title={`${d.users} users`} />
                  <div className="h-3 rounded-sm bg-green-400/30" style={{ width: `${(d.votes / maxGrowth) * 100}%` }} title={`${d.votes} votes`} />
                </div>
                <span className="text-[9px] font-mono text-brand-text-muted">{d.organizations}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-brand-border text-[9px] font-mono text-brand-text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-gold/60" /> Organizations</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400/60" /> Users</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-400/60" /> Votes</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Top Organizations</h2>
          {hasOrgs ? (
            <div className="space-y-2">
              {topOrganizations.map((org) => (
                <div key={org.name} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                  <span className="text-xs text-brand-text-primary">{org.name}</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-brand-text-muted">
                    <span>{org.users.toLocaleString()} users</span>
                    <span>{org.elections} elections</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-brand-text-muted py-6">
              <Inbox size={14} /> No organizations yet.
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
    </>
  )
}