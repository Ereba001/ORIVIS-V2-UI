import { motion } from "motion/react"
import { BarChart3, TrendingUp, Users, Vote, Globe, Smartphone, Monitor, Eye, Shield, AlertCircle, Building2, Clock, Activity, AlertTriangle, RefreshCw, Inbox } from "lucide-react"
import SeoHead from "../../components/SeoHead"
import Breadcrumbs from "../../components/platform/Breadcrumbs"
import { platformService } from "../../services/platform-service"
import { useApiResource } from "../../hooks/useApiResource"

const STATS = [
  { label: "Total Votes Cast", value: "1,847,290", change: "+12.5% vs last month", icon: Vote, color: "text-brand-gold" },
  { label: "Active Voters", value: "284,500", change: "+8.3% vs last month", icon: Users, color: "text-blue-400" },
  { label: "Avg. Turnout Rate", value: "71.2%", change: "+3.1% vs last month", icon: TrendingUp, color: "text-green-400" },
  { label: "Elections Completed", value: "1,024", change: "+47 this month", icon: BarChart3, color: "text-purple-400" },
]

const DEVICE_DATA = [
  { label: "Mobile", percentage: 58, icon: Smartphone, color: "bg-blue-400" },
  { label: "Desktop", percentage: 32, icon: Monitor, color: "bg-brand-gold" },
  { label: "Tablet", percentage: 10, icon: Globe, color: "bg-green-400" },
]

const GROWTH_DATA = [
  { month: "Feb", orgs: 98, users: 18200, votes: 120000 },
  { month: "Mar", orgs: 104, users: 19800, votes: 135000 },
  { month: "Apr", orgs: 110, users: 21500, votes: 152000 },
  { month: "May", orgs: 115, users: 22800, votes: 168000 },
  { month: "Jun", orgs: 122, users: 23800, votes: 175000 },
  { month: "Jul", orgs: 128, users: 24580, votes: 184000 },
]

const GOVERNANCE_KPIS = [
  { label: "Total Governance Sessions", value: "1,847", change: "+12.5% vs last month", icon: Activity, color: "text-brand-gold" },
  { label: "Inspection Sessions", value: "1,423", change: "+8.3% vs last month", icon: Eye, color: "text-blue-400" },
  { label: "Intervention Sessions", value: "312", change: "+15.2% vs last month", icon: Shield, color: "text-status-warning" },
  { label: "Emergency Sessions", value: "18", change: "+2 this month", icon: AlertCircle, color: "text-status-error" },
]

const GOVERNANCE_MONTHLY_TRENDS = [
  { month: "Feb", sessions: 120, inspections: 95, interventions: 22, emergencies: 3 },
  { month: "Mar", sessions: 135, inspections: 105, interventions: 27, emergencies: 3 },
  { month: "Apr", sessions: 148, inspections: 112, interventions: 32, emergencies: 4 },
  { month: "May", sessions: 162, inspections: 120, interventions: 38, emergencies: 4 },
  { month: "Jun", sessions: 175, inspections: 128, interventions: 42, emergencies: 5 },
  { month: "Jul", sessions: 190, inspections: 138, interventions: 47, emergencies: 5 },
]

const GOVERNANCE_BY_CATEGORY = [
  { category: "Security Investigation", count: 28, percentage: 25 },
  { category: "Billing", count: 22, percentage: 20 },
  { category: "Technical Support", count: 20, percentage: 18 },
  { category: "Organization Request", count: 15, percentage: 13 },
  { category: "Election Recovery", count: 10, percentage: 9 },
  { category: "Fraud Investigation", count: 8, percentage: 7 },
  { category: "Legal Request", count: 5, percentage: 4 },
  { category: "Other", count: 4, percentage: 4 },
]

export default function Analytics() {
  const { data, loading, error, reload } = useApiResource(platformService.getAnalytics)
  const topOrganizations = data?.topOrganizations ?? []
  const hasOrgs = topOrganizations.length > 0

  return (
    <>
    <SeoHead meta={{ title: "Analytics — Platform | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Analytics" }]} />
      <div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight text-brand-text-primary">Analytics</h1>
        <p className="text-sm text-brand-text-muted mt-1">Platform-wide analytics and insights.</p>
      </div>

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

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-3">Governance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GOVERNANCE_KPIS.map((stat, i) => {
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Governance Monthly Trends</h2>
          <div className="space-y-2">
            {GOVERNANCE_MONTHLY_TRENDS.map((d) => (
              <div key={d.month} className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-brand-text-muted w-8">{d.month}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-3 rounded-sm bg-brand-gold/30" style={{ width: `${(d.sessions / 190) * 100}%` }} title="Total" />
                  <div className="h-3 rounded-sm bg-blue-400/30" style={{ width: `${(d.inspections / 190) * 100}%` }} title="Inspections" />
                  <div className="h-3 rounded-sm bg-status-warning/30" style={{ width: `${(d.interventions / 190) * 100}%` }} title="Interventions" />
                  <div className="h-3 rounded-sm bg-status-error/30" style={{ width: `${(d.emergencies / 190) * 100}%` }} title="Emergencies" />
                </div>
                <span className="text-[9px] font-mono text-brand-text-muted">{d.sessions}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-brand-border text-[9px] font-mono text-brand-text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-gold/60" /> Total</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400/60" /> Inspections</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-status-warning/60" /> Interventions</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-status-error/60" /> Emergencies</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Intervention Categories</h2>
          <div className="space-y-3">
            {GOVERNANCE_BY_CATEGORY.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-brand-text-primary">{cat.category}</span>
                  <span className="text-[10px] font-mono text-brand-text-muted">{cat.count} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-brand-surface-elevated rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }} transition={{ duration: 1 }}
                    className="h-full rounded-full bg-brand-gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Growth Overview</h2>
          <div className="space-y-2">
            {GROWTH_DATA.map((d) => (
              <div key={d.month} className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-brand-text-muted w-8">{d.month}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-3 rounded-sm bg-brand-gold/30" style={{ width: `${(d.orgs / 128) * 100}%` }} />
                  <div className="h-3 rounded-sm bg-blue-400/30" style={{ width: `${(d.users / 24580) * 100}%` }} />
                  <div className="h-3 rounded-sm bg-green-400/30" style={{ width: `${(d.votes / 184000) * 100}%` }} />
                </div>
                <span className="text-[9px] font-mono text-brand-text-muted">{d.orgs}</span>
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-4">Device Distribution</h2>
          <div className="space-y-4">
            {DEVICE_DATA.map((d) => {
              const Icon = d.icon
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
                      className={`h-full rounded-full ${d.color}`} />
                  </div>
                </div>
              )
            })}
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mt-8 mb-4">Top Organizations</h2>
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-brand-surface-elevated animate-pulse rounded-lg" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center gap-2 text-xs text-status-error py-2">
              <AlertTriangle size={14} /> Failed to load organizations
              <button onClick={reload} className="flex items-center gap-1 font-semibold text-brand-gold hover:underline ml-auto">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
          {!loading && !error && !hasOrgs && (
            <div className="flex items-center gap-2 text-xs text-brand-text-muted py-2">
              <Inbox size={14} /> No organizations yet.
            </div>
          )}
          {!loading && !error && hasOrgs && (
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
          )}
        </div>
      </div>
    </div>
    </>
  )
}
