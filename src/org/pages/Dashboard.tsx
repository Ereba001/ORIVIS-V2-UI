import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Users, CheckCircle, Clock, AlertTriangle,
  Activity, BarChart3, PlusCircle, ExternalLink, Shield,
  UserPlus, Settings, Receipt, Calendar,
  Database, HardDrive, Bell, CalendarPlus,
  Target, TrendingUp, MousePointerClick, ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import NotificationCard from '../components/NotificationCard'
import ActivityTimeline from '../components/ActivityTimeline'
import WidgetPanel from '../components/WidgetPanel'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import { orgService } from '../../services/org-service'
import { formatMoneyFromMinor } from '../../lib/currency'
import { useApiResource } from '../../hooks/useApiResource'
import SeoHead from "../../components/SeoHead"

type DashboardState = 'loading' | 'loaded' | 'empty' | 'error'

const STATUS_COLORS: Record<string, string> = {
  live: '#22C55E',
  published: '#F59E0B',
  ready: '#8B5CF6',
  draft: '#94A3B8',
  completed: '#3B82F6',
}

const QUICK_ACTIONS = [
  { id: 'qa-1', label: 'Create Event', description: 'Set up a new election, poll or survey', href: '/org/events/create', icon: CalendarPlus },
  { id: 'qa-2', label: 'Invite Team Member', description: 'Add administrators or election officers', href: '/org/team', icon: UserPlus },
  { id: 'qa-3', label: 'Complete Setup', description: 'Configure workspace branding and preferences', href: '/org/workspace', icon: Settings },
  { id: 'qa-4', label: 'View Billing', description: 'Review subscription and payment history', href: '/org/billing', icon: Receipt },
]

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-brand-surface)',
  border: '1px solid var(--color-brand-border)',
  borderRadius: 10,
  boxShadow: 'var(--shadow-brand-md)',
  color: 'var(--color-brand-text-primary)',
  fontSize: 12,
} as const

export default function OrgDashboard() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const { activeOrganization } = useAuth()
  const { data, loading, error, reload } = useApiResource(() => orgService.getDashboard())

  const state: DashboardState = loading ? 'loading' : error || !data ? 'error' : data.elections.length === 0 && data.team.length === 0 ? 'empty' : 'loaded'

  const statusDistribution = useMemo(() => {
    if (!data) return []
    return Object.entries(STATUS_COLORS)
      .map(([status, color]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: data.elections.filter((e) => e.status === status).length,
        color,
      }))
      .filter((d) => d.value > 0)
  }, [data])

  const activityTrend = useMemo(() => {
    if (!data) return []
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })
    return days.map((d) => {
      const count = data.activity.filter((a) => {
        const t = new Date(a.time)
        return !isNaN(t.getTime()) && t.toDateString() === d.toDateString()
      }).length
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }
    })
  }, [data])

  if (state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="animate-pulse h-24 w-full bg-brand-surface-interactive rounded-lg" />
        </div>
        <SkeletonLoader rows={4} variant="card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-brand-surface rounded-xl border border-brand-border p-5 animate-pulse">
              <div className="h-4 bg-brand-surface-interactive rounded w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-brand-surface-interactive rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border p-5 animate-pulse">
            <div className="h-4 bg-brand-surface-interactive rounded w-24 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-brand-surface-interactive rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!activeOrganization) {
    return (
      <>
        <SeoHead meta={{ title: 'Get Started | ORIVIS', noindex: true }} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={CalendarPlus}
            title="Create Your Organization"
            description="You don't have an organization yet. Create one to start managing events, inviting team members, and running elections."
            action={{ label: 'Create Organization', onClick: () => navigate('/org/register') }}
          />
        </div>
      </>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load Dashboard"
          description={error ?? "There was an error loading your dashboard data. Please try again."}
          action={{ label: 'Retry', onClick: reload }}
        />
      </div>
    )
  }

  const activeElections = data!.elections.filter((e) => e.status === 'live')
  const upcomingElections = data!.elections.filter((e) => e.status === 'published' || e.status === 'ready')
  const activeMembers = data!.team.filter((m) => m.status === 'active')
  const getTimeBasedGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening' }
  const greeting = getTimeBasedGreeting()
  const hasActiveEvents = activeElections.length > 0
  const hasAnyEvents = data!.elections.length > 0
  const needsSetup = data!.pendingTasks.some((t) => t.priority === 'high')

  const totalActivity = activityTrend.reduce((sum, d) => sum + d.count, 0)
  const totalEvents = data!.elections.length
  const pColor = 'var(--org-primary)'

  return (
    <>
    <SeoHead meta={{ title: `${branding.organizationName} Dashboard | ORIVIS`, noindex: true }} />
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
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.organizationName} logo`}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-contain bg-brand-surface-elevated p-1.5 shrink-0 ring-1 ring-brand-border"
                />
              ) : (
                <div
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 text-white"
                  style={{ backgroundColor: 'var(--org-primary)' }}
                >
                  {branding.shortName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-brand-text-primary leading-tight">
                  {greeting}, {branding.organizationName}
                </h1>
                {branding.tagline && <p className="mt-1 text-xs sm:text-sm text-brand-text-muted">{branding.tagline}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasActiveEvents ? 'bg-status-success animate-pulse' : 'bg-brand-text-muted'}`} />
                    {hasActiveEvents
                      ? `${activeElections.length} active event${activeElections.length > 1 ? 's' : ''}`
                      : 'No active events'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                    <Calendar size={10} />
                    {data!.subscription ? data!.subscription.plan : 'Plan unavailable'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                    <Target size={10} />
                    {totalEvents} total events
                  </span>
                  {data!.subscription?.status === 'active' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface-elevated border border-brand-border px-2.5 py-1 text-[11px] text-brand-text-secondary">
                      <Shield size={10} className="text-status-success" />
                      Workspace Active
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:shrink-0">
              <button
                onClick={() => navigate('/org/events/create')}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: pColor }}
              >
                <PlusCircle size={16} />
                {hasAnyEvents ? 'Create an Event' : 'Get Started'}
              </button>
              {hasActiveEvents && (
                <button
                  onClick={() => navigate('/org/events')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface-elevated px-4 py-2.5 text-sm font-medium text-brand-text-secondary hover:bg-brand-surface-interactive transition-colors"
                >
                  <ExternalLink size={16} />
                  View Live
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {needsSetup && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 rounded-xl border border-status-warning/25 bg-status-warning/10 px-4 py-3 text-sm text-brand-text-secondary shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle size={16} className="text-status-warning shrink-0" />
            <span className="text-xs sm:text-sm">
              Pending tasks require your attention.{' '}
              <button onClick={() => navigate('/org/events')} className="underline hover:no-underline font-semibold" style={{ color: pColor }}>
                Review now
              </button>
            </span>
          </div>
        </div>
      )}

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data!.stats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      {/* ===== ANALYTICS ROW ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Activity Trend */}
        <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm lg:col-span-2">
          <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-brand-text-primary">Workspace Activity</h3>
              <p className="text-xs text-brand-text-muted mt-0.5 truncate">{totalActivity} actions in the last 14 days</p>
            </div>
            <button
              onClick={() => navigate('/org/audit-logs')}
              className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 flex items-center gap-1"
            >
              View Audit Logs
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-3 sm:p-4">
            {totalActivity === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Activity Yet"
                description="Your activity analytics will populate as you manage your workspace."
              />
            ) : (
              <div className="h-56 sm:h-60 lg:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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

        {/* Events by Status */}
        <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm">
          <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-brand-text-primary">Events by Status</h3>
              <p className="text-xs text-brand-text-muted mt-0.5 truncate">{hasAnyEvents ? `${totalEvents} total events` : 'No events yet'}</p>
            </div>
            <button
              onClick={() => navigate('/org/events')}
              className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors shrink-0 flex items-center gap-1"
            >
              Manage Events
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4">
            {statusDistribution.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No Events to Analyze"
                description="Create an event to see status analytics here."
                action={{ label: 'Create an Event', onClick: () => navigate('/org/events/create') }}
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {statusDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
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
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* --- LEFT COLUMN (2/3) --- */}
        <div className="lg:col-span-2 space-y-4">

          {/* Get Started / Election Overview */}
          <WidgetPanel
            title={hasAnyEvents ? 'Events' : 'Get Started'}
            subtitle={
              hasAnyEvents
                ? `${activeElections.length} active · ${upcomingElections.length} upcoming · ${data!.elections.length} total`
                : 'Launch your organization on ORIVIS with your first event'
            }
            headerAction={
              hasAnyEvents ? (
                <button
                  onClick={() => navigate('/org/events')}
                  className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center gap-1"
                >
                  Manage Events
                  <ArrowRight size={12} />
                </button>
              ) : undefined
            }
          >
            {data!.elections.length === 0 ? (
              <div>
                <EmptyState
                  icon={CalendarPlus}
                  title="Create Your First Event"
                  description="Set up an election, poll, survey, or AGM in minutes — then invite voters and go live."
                  action={{ label: 'Create an Event', onClick: () => navigate('/org/events/create') }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                  {[
                    { icon: MousePointerClick, title: '3-step setup', text: 'Details, branding, schedule' },
                    { icon: Users, title: 'Invite voters', text: 'Import or invite your roster' },
                    { icon: TrendingUp, title: 'Track turnout', text: 'Live analytics as votes arrive' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="flex items-start gap-2.5 p-3 rounded-lg bg-brand-surface-elevated border border-brand-divider">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-brand-text-primary">{item.title}</p>
                          <p className="text-xs text-brand-text-muted mt-0.5">{item.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {data!.elections.map((el) => (
                  <motion.button
                    key={el.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.005, x: 2 }}
                    onClick={() => navigate(`/org/events/${el.id}`)}
                    className="w-full flex items-center justify-between p-3.5 rounded-lg bg-brand-surface-elevated hover:bg-brand-surface-interactive transition-colors border border-brand-divider text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          el.status === 'live' ? 'bg-status-success' :
                          el.status === 'published' ? 'bg-event-upcoming' :
                          el.status === 'completed' ? 'bg-event-completed' : 'bg-brand-text-disabled'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-brand-text-primary truncate">{el.title}</p>
                        <p className="text-[11px] text-brand-text-muted mt-0.5 truncate">
                          {el.status === 'live' ? 'Live now' : el.status === 'published' ? 'Scheduled' : el.status === 'completed' ? 'Completed' : 'Draft'}
                          {el.startsAt ? ` · ${new Date(el.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                      <StatusBadge status={el.status} />
                      <ExternalLink size={12} className="text-brand-text-muted hidden sm:block" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </WidgetPanel>

          {/* Recent Activity */}
          <WidgetPanel
            title="Activity Log"
            subtitle="Latest actions across workspace"
          >
            {data!.activity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Recent Activity"
                description="Your activity feed will populate as you manage your workspace."
              />
            ) : (
              <ActivityTimeline events={data!.activity} />
            )}
          </WidgetPanel>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((qa, i) => {
                const Icon = qa.icon
                return (
                  <motion.button
                    key={qa.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(qa.href as string)}
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

          {/* Team Summary */}
          <WidgetPanel
            title="Team"
            subtitle={`${activeMembers.length} active · ${data!.team.length} total members`}
            headerAction={
              <button
                onClick={() => navigate('/org/team')}
                className="text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center gap-1"
              >
                Manage Team
                <ArrowRight size={12} />
              </button>
            }
          >
            {data!.team.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Team Members"
                description="Invite team members to collaborate on event management."
                action={{ label: 'Invite Members', onClick: () => navigate('/org/team') }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data!.team.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-surface-elevated border border-brand-divider">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}
                    >
                      {member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-brand-text-primary truncate">{member.displayName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusBadge status={member.status} />
                        <span className="text-[10px] text-brand-text-disabled truncate">{member.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WidgetPanel>
        </div>

        {/* --- RIGHT COLUMN (1/3) --- */}
        <div className="space-y-4">

          {/* What needs attention (storytelling) */}
          <WidgetPanel
            title="Attention Required"
            subtitle={data!.pendingTasks.length > 0 ? `${data!.pendingTasks.length} items need review` : 'All clear'}
          >
            {data!.pendingTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="Everything Looks Good"
                description="No pending tasks. Your workspace is fully configured."
              />
            ) : (
              <div className="space-y-2">
                {data!.pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(task.href)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-brand-surface-elevated hover:bg-brand-surface-interactive transition-colors border border-brand-divider text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'high' ? 'bg-status-warning' :
                          task.priority === 'medium' ? 'bg-event-upcoming' : 'bg-brand-text-muted'
                        }`}
                      />
                      <span className="text-xs text-brand-text-secondary truncate">{task.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ml-2"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}
                    >
                      {task.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </WidgetPanel>

          {/* Workspace Health — enriched */}
          <WidgetPanel title="Workspace Health" subtitle={`Score: ${data!.health.workspaceScore}%`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">Storage</p>
                    <p className="text-xs font-medium text-brand-text-primary truncate">{data!.health.storageUsed} / {data!.health.storageTotal} GB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Activity size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">Events</p>
                    <p className="text-xs font-medium text-brand-text-primary truncate">{data!.health.activeEvents} active / {data!.health.completedEvents} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <HardDrive size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">Pending Tasks</p>
                    <p className="text-xs font-medium text-brand-text-primary tabular-nums">{data!.health.pendingTasks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={12} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-brand-text-muted">Notifications</p>
                    <p className="text-xs font-medium text-brand-text-primary capitalize truncate">{data!.health.notificationStatus.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              {data!.health.systemMessages.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-brand-divider">
                  {data!.health.systemMessages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-status-success shrink-0" />
                      <span className="text-[11px] text-brand-text-muted">{msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </WidgetPanel>

          {/* Notifications */}
          <WidgetPanel
            title="Notifications"
            subtitle="Recent updates"
            headerAction={
              <span className="text-[11px] font-semibold" style={{ color: 'var(--org-primary)' }}>
                {data!.notifications.filter((n) => !n.read).length} new
              </span>
            }
          >
            {data!.notifications.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No Notifications"
                description="You're all caught up."
              />
            ) : (
              <div className="space-y-0.5 max-h-72 overflow-y-auto org-scrollbar -mx-1">
                {data!.notifications.slice(0, 5).map((n, i) => (
                  <NotificationCard key={n.id} notification={n} index={i} />
                ))}
              </div>
            )}
          </WidgetPanel>

          {/* Subscription */}
          <WidgetPanel title="Subscription" subtitle={data!.subscription ? data!.subscription.plan : 'Unavailable'}>
            {data!.subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Status</span>
                <StatusBadge status={data!.subscription.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Team Seats</span>
                <span className="text-xs font-medium text-brand-text-primary tabular-nums">{data!.subscription.seatsUsed} / {data!.subscription.seatsTotal}</span>
              </div>
              <ProgressBar value={data!.subscription.seatsUsed} max={Math.max(1, data!.subscription.seatsTotal)} size="sm" label="Seat usage" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Next billing</span>
                <span className="text-xs font-medium text-brand-text-primary">{data!.subscription.nextBilling}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">Amount</span>
                <span className="text-xs font-semibold text-brand-text-primary tabular-nums">
                  {formatMoneyFromMinor(data!.subscription.amount, data!.subscription.currency)}
                </span>
              </div>
              <div className="pt-3 border-t border-brand-divider">
                <p className="text-[11px] font-semibold text-brand-text-muted mb-2">Feature Eligibility</p>
                <div className="space-y-1.5">
                  {data!.eligibility.slice(0, 5).map((check) => (
                    <div key={check.feature} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-brand-text-muted truncate">{check.feature}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        check.status === 'included' ? 'bg-status-success/10 text-status-success' :
                        check.status === 'upgrade_required' || check.status === 'quota_exceeded' ? 'bg-status-warning/10 text-status-warning' :
                        'bg-brand-surface-interactive text-brand-text-muted'
                      }`}>
                        {check.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs font-semibold text-brand-text-muted">Subscription details unavailable</p>
                <p className="text-[11px] text-brand-text-muted/70 mt-1">Couldn’t load subscription data. Please try again.</p>
              </div>
            )}
          </WidgetPanel>

          {/* Storage */}
          <WidgetPanel title="Storage" subtitle={`${data!.storage.used} ${data!.storage.unit} of ${data!.storage.total} ${data!.storage.unit}`}>
            <ProgressBar value={data!.storage.used} max={Math.max(1, data!.storage.total)} color={data!.storage.total > 0 && data!.storage.used / data!.storage.total > 0.8 ? '#F59E0B' : branding.accentColor} size="sm" />
            <p className="text-xs text-brand-text-muted mt-2">
              {data!.storage.total > 0 && data!.storage.used / data!.storage.total > 0.8 ? 'Storage is running low. Consider upgrading.' : 'Storage is healthy.'}
            </p>
          </WidgetPanel>
        </div>
      </div>

      {/* Mobile FAB */}
      <motion.button
        onClick={() => navigate('/org/events/create')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="sm:hidden fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: 'var(--org-primary)' }}
        aria-label="Create event"
      >
        <PlusCircle size={24} />
      </motion.button>
    </div>
    </>
  )
}
