import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Building2, BarChart3, CreditCard,
  Activity, ArrowRight, PlusCircle, Target,
  AlertTriangle, Database, Bell, Vote, Users, CheckCircle,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import StatCard from '../../org/components/StatCard'
import NotificationCard from '../../org/components/NotificationCard'
import ActivityTimeline from '../../org/components/ActivityTimeline'
import WidgetPanel from '../../org/components/WidgetPanel'
import ProgressBar from '../../org/components/ProgressBar'
import EmptyState from '../../org/components/EmptyState'
import SkeletonLoader from '../../org/components/SkeletonLoader'
import { platformService } from '../../services/platform-service'
import { useApiResource } from '../../hooks/useApiResource'
import { usePlatformPermissions } from '../../contexts/PlatformPermissionsContext'
import { PLATFORM_PERMISSIONS } from '../../constants/platformPermissions'
import { detectRoleFocus, ROLE_LABELS, ROLE_ICONS, QUICK_ACTIONS_BY_ROLE } from '../../lib/dashboard-role'
import SeoHead from '../../components/SeoHead'
import { formatMoney } from '../../lib/currency'
import TeamActivityFeed from '../../components/platform/TeamActivityFeed'
import type { DashboardStat, ActivityEvent, OrgNotification } from '../../org/types'

// Quick actions are role-specific via lib/dashboard-role.ts

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-brand-surface)',
  border: '1px solid var(--color-brand-border)',
  borderRadius: 10,
  boxShadow: 'var(--shadow-brand-md)',
  color: 'var(--color-brand-text-primary)',
  fontSize: 12,
} as const

const ACTIVITY_TYPE_MAP: Record<string, ActivityEvent['type']> = {
  create: 'create',
  import: 'create',
  publish: 'update',
  system: 'system',
  alert: 'alert',
}

const NOTIF_TYPE_MAP: Record<string, OrgNotification['type']> = {
  alert: 'alert',
  org: 'team',
  election: 'event',
  system: 'system',
}

function renderCollectedRevenue(byCurrency: Record<string, number> | null | undefined): string {
  const entries = byCurrency ? Object.entries(byCurrency).filter(([, v]) => v > 0) : []
  if (entries.length === 0) return '—'
  if (entries.length === 1) return formatMoney(entries[0][1], entries[0][0])
  return `${entries.length} currencies`
}

export default function PlatformDashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApiResource(() => platformService.getDashboard())
  const { permissions, role, staff } = usePlatformPermissions()
  const roleFocus = useMemo(() => detectRoleFocus(permissions, role?.slug), [permissions, role?.slug])
  const staffName = staff?.name ?? 'Administrator'
  const roleLabel = ROLE_LABELS[roleFocus] ?? 'Platform Administrator'
  const RoleIcon = ROLE_ICONS[roleFocus]
  const quickActions = QUICK_ACTIONS_BY_ROLE[roleFocus] ?? QUICK_ACTIONS_BY_ROLE.general
  const hasFinance = useMemo(() => permissions.some(p => ([PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.VIEW_REVENUE, PLATFORM_PERMISSIONS.VIEW_PAYMENTS, PLATFORM_PERMISSIONS.VIEW_BILLING] as string[]).includes(p)), [permissions])
  const hasElections = useMemo(() => permissions.some(p => ([PLATFORM_PERMISSIONS.VIEW_ELECTIONS, PLATFORM_PERMISSIONS.MANAGE_ELECTIONS] as string[]).includes(p)), [permissions])
  const hasOrganizations = permissions.some(p => ([PLATFORM_PERMISSIONS.VIEW_ORGANIZATIONS, PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS] as string[]).includes(p))
  const hasAudit = permissions.includes(PLATFORM_PERMISSIONS.VIEW_AUDIT)


  const stats: DashboardStat[] = useMemo(
    () => (data?.stats ?? []).filter((s) => {
      if (s.id === 'activity' || s.id === 'uptime') return true
      if (s.id === 'revenue' || s.id === 'renewals') return hasFinance
      if (s.id === 'orgs') return hasOrganizations
      if (s.id === 'events') return hasElections
      return true
    }).map((s) => ({
      id: s.id, label: s.label, value: s.value, insight: s.insight, icon: s.icon,
      trend: s.trend ?? 0, trendLabel: s.trendLabel ?? '', prefix: s.prefix, suffix: s.suffix, formattedValue: s.formattedValue,
    })),
    [data, hasFinance, hasElections, hasOrganizations],
  )

  const activities: ActivityEvent[] = useMemo(
    () => (data?.activities ?? []).map((a) => ({
      id: a.id,
      action: a.event,
      time: a.time,
      type: ACTIVITY_TYPE_MAP[a.type] ?? 'system',
    })),
    [data],
  )

  const notifications: OrgNotification[] = useMemo(
    () => (data?.notifications ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      preview: n.preview,
      time: n.time,
      read: n.read,
      type: NOTIF_TYPE_MAP[n.type] ?? 'system',
      priority: 'info',
    })),
    [data],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="animate-pulse h-24 w-full bg-brand-surface-interactive rounded-lg" />
        </div>
        <SkeletonLoader rows={4} variant="card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-brand-border p-5 animate-pulse">
            <div className="h-4 bg-brand-surface-interactive rounded w-32 mb-4" />
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-brand-surface-interactive rounded-lg" />)}</div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5 animate-pulse">
            <div className="h-4 bg-brand-surface-interactive rounded w-24 mb-4" />
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-brand-surface-interactive rounded-lg" />)}</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load Dashboard"
          description={error ?? 'There was an error loading your platform dashboard. Please try again.'}
          action={{ label: 'Retry', onClick: reload }}
        />
      </div>
    )
  }

  const dashboard = data
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening' })()

  const statusDistribution = dashboard.orgStatus.map((d) => ({
    name: d.name.charAt(0).toUpperCase() + d.name.slice(1),
    value: Number(d.value),
    color: d.color,
  }))

  const hasActiveEvents = dashboard.elections.live > 0
  const totalActivity = dashboard.activityTrend.reduce((sum, d) => sum + d.count, 0)
  const totalEvents = dashboard.elections.total
  const pColor = 'var(--org-primary)'
  const newNotifications = dashboard.notifications.filter((n) => !n.read).length

  return (
    <>
      <SeoHead meta={{ title: 'Platform Dashboard | ORIVIS', noindex: true }} />
      <div className="space-y-4 sm:space-y-6 max-w-[1440px] mx-auto pb-20 sm:pb-8">
        {/* ===== PAGE HEADER ===== */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ background: 'radial-gradient(1200px 300px at 20% -10%, var(--org-primary), transparent 60%)' }}
          />
          <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 text-white" style={{ backgroundColor: 'var(--org-primary)' }}>
                  ORIVIS
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-brand-text-primary leading-tight">
                    {greeting}, {staffName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-brand-text-muted">{today}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 12%, transparent)', color: 'var(--org-primary)' }}><RoleIcon size={9} />{roleLabel}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {hasElections && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasActiveEvents ? 'bg-status-success animate-pulse' : 'bg-brand-text-muted'}`} />
                      {hasActiveEvents ? `${dashboard.elections.live} live event${dashboard.elections.live > 1 ? 's' : ''}` : 'No active events'}
                    </span>}
                    {hasOrganizations && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                      <Building2 size={10} />
                      {dashboard.organizations.active} active organizations
                    </span>}
                    {hasElections && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                      <Target size={10} />
                      {totalEvents} total events
                    </span>}
                    {hasFinance && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                      <CreditCard size={10} />
                      {renderCollectedRevenue(dashboard.revenue?.byCurrency)} collected revenue
                    </span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:shrink-0">
                {hasOrganizations && <button
                  onClick={() => navigate('/platform/organizations')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: pColor }}
                >
                  <PlusCircle size={16} />
                  Manage Organizations
                </button>}
                {hasAudit && <button
                  onClick={() => navigate('/platform/analytics')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface-elevated px-4 py-2.5 text-sm font-medium text-brand-text-secondary hover:bg-brand-surface-interactive transition-colors"
                >
                  <BarChart3 size={16} />
                  Reports
                </button>}
              </div>
            </div>
          </div>
        </div>

        {/* ===== STATS ROW ===== */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.slice(0, 4).map((stat, i) => (
            <StatCard key={stat.id} stat={stat} index={i} />
          ))}
        </div>

        {/* ===== ANALYTICS ROW ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Platform Activity */}
          <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm lg:col-span-2">
            <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-brand-text-primary">Platform Activity</h3>
                <p className="text-xs text-brand-text-muted mt-0.5 truncate">{totalActivity} actions in the last 14 days</p>
              </div>
              <button
                onClick={() => navigate('/platform/audit')}
                className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 flex items-center gap-1"
              >
                View Audit Log
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              {totalActivity === 0 ? (
                <EmptyState icon={Activity} title="No Activity Yet" description="Your platform analytics will populate as platform activity is captured." />
              ) : (
                <div className="h-56 sm:h-60 lg:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.activityTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pColor} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={pColor} stopOpacity={0} />
                      </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Inter', fill: 'var(--color-brand-text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Inter', fill: 'var(--color-brand-text-muted)' }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip cursor={{ stroke: pColor, strokeOpacity: 0.4 }} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="count" name="Actions" stroke={pColor} strokeWidth={2} fill="url(#activityGradient)" activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Organizations by Status */}
          {hasOrganizations && <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm">
            <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-brand-text-primary">Organizations</h3>
                <p className="text-xs text-brand-text-muted mt-0.5 truncate">{dashboard.organizations.total} total organizations</p>
              </div>
              <button
                onClick={() => navigate('/platform/organizations')}
                className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 flex items-center gap-1"
              >
                Manage
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-4">
              {statusDistribution.length === 0 ? (
              <EmptyState icon={BarChart3} title="No Organizations to Analyze" description="Organizations you manage will appear here." /> ) : (
              <div className="flex flex-col items-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                        {statusDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full max-w-xs mx-auto">
                  {statusDistribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-brand-text-muted truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold text-brand-text-primary">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        }
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {/* Events Overview */}
          {hasElections && <WidgetPanel
            title="Events Overview"
            subtitle={`${dashboard.elections.active} active · ${dashboard.elections.live} live · ${dashboard.elections.completed} completed`}
            headerAction={
              <button onClick={() => navigate('/platform/elections')} className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center gap-1">
                View Events
                <ArrowRight size={12} />
              </button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: dashboard.elections.total, icon: Vote },
                { label: 'Active', value: dashboard.elections.active, icon: Activity },
                { label: 'Live Now', value: dashboard.elections.live, icon: Users },
                { label: 'Completed', value: dashboard.elections.completed, icon: CheckCircle },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-brand-surface-elevated border border-brand-divider">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-brand-text-primary tabular-nums leading-none">{item.value}</p>
                      <p className="text-xs text-brand-text-muted mt-0.5">{item.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </WidgetPanel>}

          {/* Recent Activity */}
          <WidgetPanel title="Activity Log" subtitle="Latest actions across the platform">
            {activities.length === 0 ? (
              <EmptyState icon={Activity} title="No Recent Activity" description="Your activity feed will populate as platform actions occur." />
            ) : (
              <ActivityTimeline events={activities} />
            )}
          </WidgetPanel>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((qa, i) => {
                const Icon = qa.icon
                return (
                  <motion.button
                    key={qa.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(qa.href)}
                    className="group flex flex-col items-center gap-2 rounded-xl bg-brand-surface border border-brand-border p-4 shadow-sm hover:border-[var(--org-primary)] hover:shadow-brand-sm transition-all cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}>
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-medium text-brand-text-primary leading-tight">{qa.label}</span>
                    <span className="text-[11px] text-brand-text-muted leading-tight">{qa.description}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Subscriptions */}
          {hasFinance && <WidgetPanel title="Subscriptions" subtitle={`${dashboard.subscriptions.active + dashboard.subscriptions.trialing} active plans`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Collected Revenue (per election)</span>
                <span className="text-lg font-bold text-brand-text-primary tabular-nums">{renderCollectedRevenue(dashboard.revenue?.byCurrency)}</span>
              </div>
              {(() => {
                const denom = Math.max(1, dashboard.subscriptions.total)
                const rows = [
                  { label: 'Active', value: dashboard.subscriptions.active, color: 'var(--color-status-success)' },
                   { label: 'Trial —', value: dashboard.subscriptions.trialing, color: 'var(--color-status-warning)' },
                   { label: 'Expired / Churned', value: dashboard.subscriptions.expired, color: 'var(--color-status-danger)' },
                ]
                return (
                  <div className="space-y-3">
                    {rows.filter((r) => r.value > 0).map((r) => (
                      <div key={r.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-brand-text-muted">{r.label}</span>
                          <span className="text-xs font-semibold text-brand-text-primary tabular-nums">{r.value}</span>
                        </div>
                        <ProgressBar value={Math.round((r.value / denom) * 100)} max={100} color={r.color} size="sm" showLabel={false} />
                      </div>
                    ))}
                  </div>
                )
              })()}
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">Renewals Due</p>
                    <p className="text-xs font-medium text-brand-text-primary truncate">{dashboard.subscriptions.upcomingRenewals} / 30 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">New Organizations</p>
                    <p className="text-xs font-medium text-brand-text-primary truncate">{dashboard.organizations.newThisMonth} in 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          </WidgetPanel>}

          {/* Platform Activity */}
          <WidgetPanel title="Platform Activity" subtitle="Live actions across the platform">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity size={12} className="text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-brand-text-muted">Today</p>
                  <p className="text-sm font-semibold text-brand-text-primary tabular-nums">{dashboard.activity.today} actions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Target size={12} className="text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-brand-text-muted">Last 7 days</p>
                  <p className="text-sm font-semibold text-brand-text-primary tabular-nums">{dashboard.activity.last7Days} actions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Vote size={12} className="text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-brand-text-muted">Live Events</p>
                  <p className="text-sm font-semibold text-brand-text-primary tabular-nums">{dashboard.elections.live}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Bell size={12} className="text-brand-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-brand-text-muted">Notifications</p>
                  <p className="text-sm font-semibold text-brand-text-primary tabular-nums">{newNotifications} new</p>
                </div>
              </div>
            </div>
          </WidgetPanel>

          {/* Notifications */}
          <WidgetPanel
            title="Notifications"
            subtitle="Recent updates"
            headerAction={
              <span className="text-[11px] font-semibold" style={{ color: 'var(--org-primary)' }}>
                {newNotifications} new
              </span>
            }
          >
            {notifications.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No Notifications" description="You're all caught up." />
            ) : (
              <div className="space-y-0.5 max-h-72 overflow-y-auto org-scrollbar -mx-1">
                {notifications.slice(0, 5).map((n, i) => (
                  <NotificationCard key={n.id} notification={n} index={i} />
                ))}
              </div>
            )}
          </WidgetPanel>

          {/* Team Activity Feed */}
          <WidgetPanel title="Team Activity" subtitle="Staff actions across the platform">
            <TeamActivityFeed maxItems={6} showHeader={false} />
          </WidgetPanel>
        </div>
      </div>
      </div>
    </>
  )
}