import { useNavigate } from 'react-router-dom'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import {
  Globe, Vote, Award, BarChart3, ClipboardList, Users, User, Trophy, Activity,
  CheckCircle, XCircle, AlertTriangle, Eye,
} from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'
import WidgetPanel from '../../components/WidgetPanel'
import EmptyState from '../../components/EmptyState'
import ProgressBar from '../../components/ProgressBar'
import EventStatusBadge from '../../components/EventStatusBadge'
import { type OrivisEvent, type TimelineActivity, type EventAnalytics, type EventStatus, formatDate, formatDateTime, timeAgo } from './_shared'

const EVENT_TYPE_ICONS: Record<string, typeof Vote> = {
  governance_election: Vote, award_competition: Award, poll: BarChart3, survey: ClipboardList,
}

interface ReadinessCheck {
  key: string
  label: string
  ok: boolean
}

interface OverviewTabProps {
  event: OrivisEvent
  activities: TimelineActivity[]
  analytics?: EventAnalytics | null
  readinessChecks?: ReadinessCheck[]
  readinessPercent?: number
  statusOverride?: EventStatus
}

export function OverviewTab({ event, activities, analytics: _analytics, readinessChecks, readinessPercent, statusOverride }: OverviewTabProps) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const navigate = useNavigate()
  const TypeIcon = EVENT_TYPE_ICONS[event.type] || Vote

  // Badges can show a derived status (e.g. "Scheduled" once a publish time is
  // set) while the rest of the tab logic keys off the real lifecycle status.
  const badgeStatus = statusOverride ?? event.status

  const isPrePublish = event.status === 'created' || event.status === 'ready'
  const isLive = event.status === 'live' || event.status === 'ended'
  const isPublished = event.status === 'published' || isLive

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Event header card */}
        <DashboardCard hover={false}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-brand-surface-elevated" style={{ color: pColor }}>
              <TypeIcon size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-brand-text-primary">{event.title}</h2>
              <p className="text-xs text-brand-text-muted mt-1">{event.description}</p>
              <p className="text-[10px] text-brand-text-muted mt-2">
                <Globe size={10} className="inline mr-1" />
                {event.organizationName} &middot; {event.visibility}
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Publish Readiness — only for created/ready */}
        {isPrePublish && readinessChecks && (
          <DashboardCard hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-brand-text-primary">Publish Readiness</h3>
              <span className="text-lg font-bold" style={{ color: pColor }}>{readinessPercent ?? 0}%</span>
            </div>
            <ProgressBar value={readinessPercent ?? 0} max={100} />
            <div className="mt-4 space-y-2">
              {readinessChecks.map((check) => (
                <div key={check.key} className="flex items-center gap-2 text-xs">
                  {check.ok ? (
                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <span className={check.ok ? 'text-brand-text-primary' : 'text-brand-text-muted'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Status & Schedule */}
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Status & Schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] text-brand-text-muted mb-1">Current Status</p>
              <EventStatusBadge status={badgeStatus} size="md" />
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] text-brand-text-muted mb-1">Registration Progress</p>
              <ProgressBar value={event.registrationProgress} max={100} />
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] text-brand-text-muted mb-1">Voting Period</p>
              <p className="text-xs font-semibold text-brand-text-primary">{formatDateTime(event.startsAt)}</p>
              <p className="text-xs font-semibold text-brand-text-primary">&rarr; {formatDateTime(event.endsAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] text-brand-text-muted mb-1">Registration</p>
              <p className="text-xs font-semibold text-brand-text-primary">{formatDateTime(event.registrationStartsAt)}</p>
              <p className="text-xs font-semibold text-brand-text-primary">&rarr; {formatDateTime(event.registrationEndsAt)}</p>
            </div>
          </div>
        </DashboardCard>

        {/* Stats row — adapt by lifecycle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
              <Users size={16} />
            </div>
            <p className="text-lg font-bold text-brand-text-primary">
              {(event.registeredCount ?? event.participantCount).toLocaleString()}
              {event.maxVoters != null && event.maxVoters > 0 && (
                <span className="text-xs font-semibold text-brand-text-muted"> / {event.maxVoters.toLocaleString()}</span>
              )}
            </p>
            <p className="text-[9px] text-brand-text-muted">Registered{event.maxVoters != null && event.maxVoters > 0 ? ' · Max Voters' : ''}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
              <User size={16} />
            </div>
            <p className="text-lg font-bold text-brand-text-primary">{event.candidateCount.toLocaleString()}</p>
            <p className="text-[9px] text-brand-text-muted">Candidates</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
              <Trophy size={16} />
            </div>
            <p className="text-lg font-bold text-brand-text-primary">{event.positionCount.toLocaleString()}</p>
            <p className="text-[9px] text-brand-text-muted">Positions</p>
          </div>
          {isPublished ? (
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
                <BarChart3 size={16} />
              </div>
              <p className="text-lg font-bold text-brand-text-primary">{event.voterTurnout}%</p>
              <p className="text-[9px] text-brand-text-muted">Voter Turnout</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: '#a3a3a3' }}>
                <AlertTriangle size={16} />
              </div>
              <p className="text-lg font-bold text-brand-text-muted">N/A</p>
              <p className="text-[9px] text-brand-text-muted">Not Published Yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <WidgetPanel title="Recent Activity" subtitle="Last 3 actions">
          {activities.length === 0 ? (
            <EmptyState icon={Activity} title="No Activity Yet" description="Event activity will appear here." />
          ) : (
            <div className="space-y-2">
              {activities.slice(-3).reverse().map((act) => (
                <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface-elevated/20">
                  <div className="w-2 h-2 rounded-full bg-brand-text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-brand-text-primary font-medium truncate">{act.action}</p>
                    <p className="text-[9px] text-brand-text-muted">{act.user} &middot; {timeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetPanel>
      </div>

      <div className="space-y-6">
        <WidgetPanel title="Event Info" subtitle="Key details">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Status</span>
              <EventStatusBadge status={badgeStatus} size="md" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Type</span>
              <span className="text-brand-text-primary font-semibold capitalize">{event.type.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Visibility</span>
              <span className="text-brand-text-primary font-semibold capitalize">{event.visibility}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Created</span>
              <span className="text-brand-text-primary font-semibold">{formatDate(event.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-text-muted">Timezone</span>
              <span className="text-brand-text-primary font-semibold">{event.timezone}</span>
            </div>
          </div>
        </WidgetPanel>

        {/* Live Results — only for published/live */}
        {isPublished && (
          <WidgetPanel title="Live Results" subtitle="Real time tallies">
            <button
              onClick={() => navigate(`/org/events/${event.id}/results`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-transform hover:scale-[1.01] cursor-pointer"
              style={{ backgroundColor: pColor }}
            >
              <BarChart3 size={14} />
              View Live Results
            </button>
            <p className="text-[9px] text-brand-text-muted mt-2">
              Live vote tallies by position, turnout, and leading candidates.
            </p>
          </WidgetPanel>
        )}

        {/* Preview hint for pre-publish */}
        {isPrePublish && (
          <WidgetPanel title="Preview Election" subtitle="See how it looks to voters">
            <p className="text-[10px] text-brand-text-muted mb-3">
              Preview the voter-facing experience before publishing. Available after the election is published.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-surface-elevated/20 border border-brand-divider opacity-50">
              <Eye size={14} className="text-brand-text-muted" />
              <span className="text-[10px] text-brand-text-muted">Preview available after publish</span>
            </div>
          </WidgetPanel>
        )}

        <WidgetPanel title="Event Details">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-text-muted">Timezone</span>
              <span className="text-[10px] text-brand-text-primary">{event.timezone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-text-muted">Visibility</span>
              <span className="text-[10px] text-brand-text-primary capitalize">{event.visibility}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-text-muted">Created</span>
              <span className="text-[10px] text-brand-text-primary">{formatDate(event.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-text-muted">Updated</span>
              <span className="text-[10px] text-brand-text-primary">{timeAgo(event.updatedAt)}</span>
            </div>
          </div>
        </WidgetPanel>
      </div>
    </div>
  )
}
