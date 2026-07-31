import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight, Users, CheckCircle, Clock, AlertTriangle,
  Activity, BarChart3, PlusCircle, ExternalLink, Shield,
  UserPlus, Settings, Receipt, Sparkles, Calendar,
  Database, HardDrive, Bell, Lock,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import NotificationCard from '../components/NotificationCard'
import ActivityTimeline from '../components/ActivityTimeline'
import WidgetPanel from '../components/WidgetPanel'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'
import SeoHead from "../../components/SeoHead"

type DashboardState = 'loading' | 'loaded' | 'empty' | 'error'

const EVENT_HEALTH = [
  { label: 'System Uptime', value: 99.9, max: 100, color: '#3B82F6' },
  { label: 'Audit Trail', value: 100, max: 100, color: '#22C55E' },
  { label: 'Ballot Integrity', value: 100, max: 100, color: '#22C55E' },
]

const QUICK_ACTIONS = [
  { id: 'qa-1', label: 'Create Event', description: 'Set up a new election, poll or survey', href: '/org/events/create' },
  { id: 'qa-2', label: 'Invite Team Member', description: 'Add administrators or election officers', href: '/org/team' },
  { id: 'qa-3', label: 'Complete Setup', description: 'Configure workspace branding and preferences', href: '/org/workspace' },
  { id: 'qa-4', label: 'View Billing', description: 'Review subscription and payment history', href: '/org/billing' },
]

export default function OrgDashboard() {
  const navigate = useNavigate()
  const { branding, admin } = useOrgBranding()
  const { data, loading, error, reload } = useApiResource(orgService.getDashboard)

  useEffect(() => {
    const setupComplete = localStorage.getItem('orivis_setup_complete')
    if (setupComplete !== 'true') {
      navigate('/org/setup', { replace: true })
    }
  }, [navigate])

  const state: DashboardState = loading ? 'loading' : error || !data ? 'error' : data.elections.length === 0 && data.team.length === 0 ? 'empty' : 'loaded'

  if (state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-24 w-full bg-brand-surface-elevated rounded-2xl" />
        <SkeletonLoader rows={4} variant="card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-brand-surface-elevated rounded w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-brand-surface-elevated rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 animate-pulse">
            <div className="h-4 bg-brand-surface-elevated rounded w-24 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-brand-surface-elevated rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
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
  const upcomingElections = data!.elections.filter((e) => e.status === 'published')
  const activeMembers = data!.team.filter((m) => m.status === 'active')
  const getTimeBasedGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening' }
  const greeting = getTimeBasedGreeting()
  const hasActiveEvents = activeElections.length > 0
  const needsSetup = data!.pendingTasks.some((t) => t.priority === 'high')

  return (
    <>
    <SeoHead meta={{ title: "Dashboard — Organization | ORIVIS", noindex: true }} />
    <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
      {/* ===== HERO SECTION ===== */}
      <DashboardCard hover={false} className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${branding.primaryColor} 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: `${branding.primaryColor}18`, color: branding.primaryColor }}
            >
              {branding.shortName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">{greeting},</p>
              <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary mt-0.5">
                {branding.organizationName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasActiveEvents ? 'bg-status-success animate-pulse' : 'bg-brand-text-muted'}`} />
                  <span className="text-brand-text-muted">
                    {hasActiveEvents
                      ? `${activeElections.length} active election${activeElections.length > 1 ? 's' : ''}`
                      : 'No active elections'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-text-muted">
                  <Calendar size={10} />
                  <span>{branding.eventPackage}</span>
                </div>
                {data!.subscription.status === 'active' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-status-success">
                    <Shield size={10} />
                    <span>Workspace Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-center">
            <motion.button
              onClick={() => navigate('/org/events')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all whitespace-nowrap"
              style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}
            >
              Create Election
            </motion.button>
            {hasActiveEvents && (
              <motion.button
                onClick={() => navigate('/org/events')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}
              >
                View Live
                <ArrowRight size={12} />
              </motion.button>
            )}
          </div>
        </div>
        {needsSetup && (
          <div className="relative mt-4 pt-4 border-t border-brand-divider flex items-center gap-2 text-[10px] font-mono text-status-warning">
            <AlertTriangle size={10} />
            <span>Pending tasks require your attention. <button onClick={() => navigate('/org/events')} className="underline hover:no-underline font-semibold" style={{ color: branding.primaryColor }}>Review now</button></span>
          </div>
        )}
      </DashboardCard>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data!.stats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- LEFT COLUMN (2/3) --- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Election Overview */}
          <WidgetPanel
            title="Elections"
            subtitle={
              hasActiveEvents
                ? `${activeElections.length} active · ${upcomingElections.length} upcoming · ${data!.elections.length} total`
                : 'No active elections'
            }
            headerAction={
              <button
                onClick={() => navigate('/org/events')}
                className="text-[10px] font-mono font-semibold hover:underline transition-colors"
                style={{ color: branding.primaryColor }}
              >
                Manage Elections
              </button>
            }
          >
            {data!.elections.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No Elections Yet"
                description="Create your first election to begin managing votes securely."
                action={{ label: 'Create Election', onClick: () => navigate('/org/events') }}
              />
            ) : (
              <div className="space-y-2">
                {data!.elections.map((el) => (
                  <motion.button
                    key={el.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.005, x: 2 }}
                    onClick={() => navigate('/org/events')}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-brand-surface-elevated/20 hover:bg-brand-surface-elevated/40 transition-all text-left"
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
                        <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                          {el.voters.toLocaleString()} voters · {el.positions} position{el.positions > 1 ? 's' : ''}
                          {el.turnout > 0 ? ` · ${el.turnout}% turnout` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <StatusBadge status={el.status} />
                      <ExternalLink size={12} className="text-brand-text-muted" />
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

          {/* Quick Actions (premium cards) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((qa, i) => (
                <motion.button
                  key={qa.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(qa.href as string)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card hover:border-[var(--org-primary)]/30 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center" style={{ color: 'var(--org-primary)' }}>
                    {qa.label === 'Create Election' ? <PlusCircle size={18} /> :
                     qa.label === 'Invite Team Member' ? <UserPlus size={18} /> :
                     qa.label === 'Complete Setup' ? <Settings size={18} /> :
                     <Receipt size={18} />}
                  </div>
                  <span className="text-[10px] font-semibold text-brand-text-primary leading-tight">{qa.label}</span>
                  <span className="text-[8px] text-brand-text-muted leading-tight">{qa.description}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Team Summary */}
          <WidgetPanel
            title="Team"
            subtitle={`${activeMembers.length} active · ${data!.team.length} total members`}
            headerAction={
              <button
                onClick={() => navigate('/org/team')}
                className="text-[10px] font-mono font-semibold hover:underline transition-colors"
                style={{ color: branding.primaryColor }}
              >
                Manage Team
              </button>
            }
          >
            {data!.team.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Team Members"
                description="Invite team members to collaborate on election management."
                action={{ label: 'Invite Members', onClick: () => navigate('/org/team') }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data!.team.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-surface-elevated/20">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: `${branding.primaryColor}20`, color: branding.primaryColor }}
                    >
                      {member.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-brand-text-primary truncate">{member.displayName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusBadge status={member.status} />
                        <span className="text-[9px] font-mono text-brand-text-disabled">{member.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WidgetPanel>
        </div>

        {/* --- RIGHT COLUMN (1/3) --- */}
        <div className="space-y-6">

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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 hover:bg-brand-surface-elevated/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'high' ? 'bg-status-warning' :
                          task.priority === 'medium' ? 'bg-event-upcoming' : 'bg-brand-text-muted'
                        }`}
                      />
                      <span className="text-[11px] text-brand-text-secondary truncate">{task.label}</span>
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ml-2"
                      style={{ backgroundColor: `${branding.primaryColor}18`, color: branding.primaryColor }}
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-text-muted">Security Score</span>
                <span className="text-[10px] font-mono font-semibold text-brand-text-primary">{data!.health.securityScore}%</span>
              </div>
              <ProgressBar value={data!.health.securityScore} max={100} color={data!.health.securityScore > 80 ? '#22C55E' : data!.health.securityScore > 60 ? '#F59E0B' : '#EF4444'} size="sm" showLabel={false} />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-brand-text-muted" />
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted">Storage</p>
                    <p className="text-[10px] font-mono text-brand-text-primary">{data!.health.storageUsed} / {data!.health.storageTotal} GB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-brand-text-muted" />
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted">Events</p>
                    <p className="text-[10px] font-mono text-brand-text-primary">{data!.health.activeEvents} active / {data!.health.completedEvents} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive size={12} className="text-brand-text-muted" />
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted">Pending Tasks</p>
                    <p className="text-[10px] font-mono text-brand-text-primary">{data!.health.pendingTasks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bell size={12} className="text-brand-text-muted" />
                  <div>
                    <p className="text-[9px] font-mono text-brand-text-muted">Notifications</p>
                    <p className="text-[10px] font-mono text-brand-text-primary capitalize">{data!.health.notificationStatus.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              {data!.health.systemMessages.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-brand-divider">
                  {data!.health.systemMessages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-status-success shrink-0" />
                      <span className="text-[9px] font-mono text-brand-text-muted">{msg}</span>
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
              <span className="text-[9px] font-mono" style={{ color: branding.primaryColor }}>
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

          {/* Election Health */}
          <WidgetPanel title="Election Integrity" subtitle="All elections secured">
            <div className="space-y-3.5">
              {EVENT_HEALTH.map((h) => (
                <div key={h.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-brand-text-muted">{h.label}</span>
                    <span className="text-[10px] font-mono font-semibold text-brand-text-primary">{h.value}%</span>
                  </div>
                  <ProgressBar value={h.value} max={h.max} color={h.color} size="sm" showLabel={false} />
                </div>
              ))}
            </div>
          </WidgetPanel>

          {/* Subscription */}
          <WidgetPanel title="Subscription" subtitle={data!.subscription.plan}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-text-muted">Status</span>
                <StatusBadge status={data!.subscription.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-text-muted">Team Seats</span>
                <span className="text-[10px] font-mono text-brand-text-primary">{data!.subscription.seatsUsed} / {data!.subscription.seatsTotal}</span>
              </div>
              <ProgressBar value={data!.subscription.seatsUsed} max={Math.max(1, data!.subscription.seatsTotal)} size="sm" label="Seat usage" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-text-muted">Next billing</span>
                <span className="text-[10px] font-mono text-brand-text-primary">{data!.subscription.nextBilling}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-text-muted">Amount</span>
                <span className="text-[10px] font-mono font-bold text-brand-text-primary">
                  ${(data!.subscription.amount / 100).toLocaleString()}/{data!.subscription.currency}
                </span>
              </div>
              <div className="pt-3 border-t border-brand-divider">
                <p className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-2">Feature Eligibility</p>
                <div className="space-y-1.5">
                  {data!.eligibility.slice(0, 5).map((check) => (
                    <div key={check.feature} className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-brand-text-muted truncate mr-2">{check.feature}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
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
          </WidgetPanel>

          {/* Storage */}
          <WidgetPanel title="Storage" subtitle={`${data!.storage.used} ${data!.storage.unit} of ${data!.storage.total} ${data!.storage.unit}`}>
            <ProgressBar value={data!.storage.used} max={Math.max(1, data!.storage.total)} color={data!.storage.total > 0 && data!.storage.used / data!.storage.total > 0.8 ? '#F59E0B' : branding.accentColor} size="sm" />
            <p className="text-[9px] font-mono text-brand-text-muted mt-2">
              {data!.storage.total > 0 && data!.storage.used / data!.storage.total > 0.8 ? 'Storage is running low. Consider upgrading.' : 'Storage is healthy.'}
            </p>
          </WidgetPanel>
        </div>
      </div>

      {/* Mobile FAB */}
      <motion.button
        onClick={() => navigate('/org/events')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center z-30"
        style={{ backgroundColor: branding.primaryColor }}
        aria-label="Create election"
      >
        <PlusCircle size={24} className="text-white" />
      </motion.button>
    </div>
    </>
  )
}
