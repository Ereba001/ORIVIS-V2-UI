import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, Calendar, Users, Vote, Award, BarChart3, ClipboardList,
  Settings, Palette, Activity, CheckCircle, XCircle, AlertTriangle,
  Search, Plus, Edit3, Archive, Shield, Loader2,
  Eye, EyeOff, Globe, Lock, Bell, Clock, User, Mail, Trophy,
  ChevronLeft, ChevronRight, MoreHorizontal, FileText, Send,
  Image, UserCheck, Key, Fingerprint, BadgeCheck,
  Save, X, Upload,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import EventStatusBadge from '../components/EventStatusBadge'
import CandidateCard from '../components/CandidateCard'
import EventTimeline from '../components/EventTimeline'
import SeoHead from "../../components/SeoHead"
import EmptyState from '../components/EmptyState'
import DashboardCard from '../components/DashboardCard'
import WidgetPanel from '../components/WidgetPanel'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import RegistrationConfigSection, { createDefaultRegSettings } from '../components/RegistrationConfigSection'
import CsvMappingModal from '../components/CsvMappingModal'
import { eventService, type EventDetailData, type EventPositionData, type EventParticipantData, type EventActivityData } from '../services/event-service'
import { electionService } from '../../services/election-service'
import type { RegistrationSettings } from '../../types/registration'
import type {
  OrivisEvent, EventPosition, EventParticipant, TimelineActivity,
  EventAnalytics, EventRegistration, PermissionGroup,
} from '../types'

type TabId = 'overview' | 'timeline' | 'registration' | 'candidates' | 'participants' | 'branding' | 'settings' | 'analytics' | 'audit' | 'results' | 'permissions' | 'communication' | 'publishing'

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'registration', label: 'Registration', icon: FileText },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'participants', label: 'Participants', icon: UserCheck },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit', icon: Shield },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'communication', label: 'Communication', icon: Bell },
  { id: 'publishing', label: 'Publishing', icon: CheckCircle },
]

const EVENT_TYPE_ICONS: Record<string, typeof Vote> = {
  governance_election: Vote,
  award_competition: Award,
  poll: BarChart3,
  survey: ClipboardList,
}

const PARTICIPANT_REG_STYLES: Record<string, string> = {
  registered: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  verified: 'bg-status-info/10 text-status-info border-status-info/20',
  approved: 'bg-status-success/10 text-status-success border-status-success/20',
  rejected: 'bg-status-error/10 text-status-error border-status-error/20',
}

const VERIFICATION_STYLES: Record<string, string> = {
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  verified: 'bg-status-success/10 text-status-success border-status-success/20',
  failed: 'bg-status-error/10 text-status-error border-status-error/20',
}

const PASS_STYLES: Record<string, string> = {
  not_issued: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  issued: 'bg-status-info/10 text-status-info border-status-info/20',
  used: 'bg-brand-surface-elevated text-brand-text-disabled border-brand-border',
  expired: 'bg-status-error/10 text-status-error border-status-error/20',
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'draft', READY: 'ready', PUBLISHED: 'published',
  LIVE: 'live', COMPLETED: 'completed', ARCHIVED: 'archived', CANCELLED: 'cancelled',
}

function toEventStatus(s: string): 'draft' | 'ready' | 'published' | 'live' | 'completed' | 'archived' | 'cancelled' {
  return (STATUS_MAP[s] || 'draft') as never
}

function mapElectionToOrivis(e: import('../../types/election').Election): OrivisEvent {
  return {
    id: e.id,
    title: e.title,
    type: mapElectionType(e.type),
    status: toEventStatus(e.status),
    description: e.description ?? '',
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    registrationStartsAt: e.registrationStartsAt ?? e.startsAt,
    registrationEndsAt: e.registrationEndsAt ?? e.endsAt,
    timezone: e.timezone ?? 'UTC',
    organizationId: e.organizationId,
    organizationName: e.organizationName ?? '',
    participantCount: e.participantCount ?? e.totalRegistered ?? 0,
    candidateCount: e.candidateCount ?? 0,
    positionCount: e.positionCount ?? 0,
    registrationProgress: e.registrationProgress ?? 0,
    voterTurnout: e.voterTurnout ?? 0,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    visibility: e.visibility ?? 'public',
    branding: { bannerUrl: null, logoUrl: null, primaryColor: '#FCA311', accentColor: '#3B82F6', theme: 'dark', customUrl: null },
    settings: {
      participationModel: 'imported',
      allowAnonymousVoting: e.isAnonymous ?? false,
      requireEmailVerification: false,
      requireIdVerification: false,
      maxVotesPerParticipant: e.maxVotes ?? 1,
      resultPublication: 'manual',
      resultPublishedAt: null,
      notifyOnRegistration: false,
      notifyOnVote: false,
      allowMultipleVotes: false,
      requireTwoFactor: false,
    },
    publishReadiness: {
      brandingComplete: false, positionsDefined: false, candidatesNominated: false,
      participantsImported: false, votingScheduleSet: true, visibilityConfigured: true, requiredSettingsComplete: false,
    },
  }
}

type OrivisEventType = 'governance_election' | 'award_competition' | 'poll' | 'survey' | 'referendum' | 'agm' | 'recruitment' | 'general_meeting' | 'custom'

function mapElectionType(t: string): OrivisEventType {
  const typeMap: Record<string, OrivisEventType> = {
    ELECTION: 'governance_election',
    APPROVAL: 'poll',
    CONSULTATION: 'survey',
    REFERENDUM: 'referendum',
    SURVEY: 'survey',
  }
  return typeMap[t] || 'governance_election'
}

export default function EventDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventData, setEventData] = useState<EventDetailData | null>(null)

  const [tab, setTab] = useState<TabId>('overview')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    eventService.fetchEventDetail(id)
      .then(setEventData)
      .catch((err) => setError(err?.message || 'Failed to load event'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <>
      <SeoHead meta={{ title: "Event Not Found — Organization | ORIVIS", noindex: true }} />
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={AlertTriangle}
          title="Event Not Found"
          description={error || "The event you're looking for doesn't exist or has been removed."}
          action={{ label: 'Back to Events', onClick: () => navigate('/org/events') }}
        />
      </div>
      </>
    )
  }

  const { event: rawEvent, positions: rawPositions, participants: rawParticipants, activities: rawActivities } = eventData

  const positions: EventPosition[] = rawPositions.map((p) => ({
    id: p.id,
    eventId: id ?? '',
    title: p.title,
    description: p.description,
    maxSelections: p.maxSelections,
    ballotOrder: p.ballotOrder,
    candidates: p.candidates.map((c) => ({
      id: c.id,
      eventId: id ?? '',
      positionId: p.id,
      name: c.name,
      email: c.email,
      photoUrl: c.photoUrl,
      biography: c.biography,
      manifestoUrl: null,
      status: c.status as 'approved' | 'pending' | 'rejected' | 'withdrawn',
      ballotOrder: c.ballotOrder,
      voteCount: c.voteCount,
      createdAt: '',
    })),
  }))

  const participants: EventParticipant[] = rawParticipants.map((p) => ({
    id: p.id,
    eventId: id ?? '',
    name: p.name,
    email: p.email,
    organizationId: '',
    department: '',
    registrationStatus: p.registrationStatus as EventParticipant['registrationStatus'],
    verificationStatus: p.verificationStatus as EventParticipant['verificationStatus'],
    votingPassStatus: p.votingPassStatus as EventParticipant['votingPassStatus'],
    votingPassId: null,
    registeredAt: p.registeredAt,
    verifiedAt: null,
  }))

  const activities: TimelineActivity[] = rawActivities.map((a) => ({
    id: a.id,
    action: a.action,
    description: a.description,
    timestamp: a.timestamp,
    type: a.type as TimelineActivity['type'],
    user: a.user,
  }))

  const event = mapElectionToOrivis(rawEvent)
  const registration: EventRegistration | null = eventData.registrationSettings
    ? {
        id: id ?? '',
        eventId: id ?? '',
        isOpen: eventData.registrationSettings.registration_enabled,
        eligibilityRules: [],
        verificationMethods: [eventData.registrationSettings.verification_method ?? 'otp'],
        autoApprove: (eventData.registrationSettings.verification_method as string) === 'none',
        maxParticipants: 0,
        currentRegistrations: participants.length,
        passSettings: {
          expiresInHours: 24,
          singleUse: true,
        },
      }
    : null
  const analytics: EventAnalytics | null = null

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
      <SeoHead meta={{ title: `${event.title} — Organization | ORIVIS`, noindex: true }} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            onClick={() => navigate('/org/events')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted shrink-0"
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand-text-muted mb-0.5">
              <button onClick={() => navigate('/org/events')} className="hover:underline">Events</button>
              <span>/</span>
              <span className="truncate text-brand-text-primary">{event.title}</span>
            </div>
            <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary truncate">
              {event.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EventStatusBadge status={event.status} size="md" />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white"
            style={{ backgroundColor: pColor }}
          >
            <Edit3 size={12} />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
          >
            <Archive size={12} />
            Archive
          </motion.button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const TabIcon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); setSelectedIds(new Set()) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold whitespace-nowrap transition-all ${
                tab === t.id ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
              style={tab === t.id ? { backgroundColor: pColor } : {}}
            >
              <TabIcon size={12} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && <OverviewTab event={event} activities={activities} analytics={analytics} />}
          {tab === 'timeline' && <TimelineTab activities={activities} />}
          {tab === 'registration' && <RegistrationTab event={event} registration={registration} />}
          {tab === 'candidates' && <CandidatesTab event={event} positions={positions} />}
          {tab === 'participants' && <ParticipantsTab event={event} participants={participants} />}
          {tab === 'branding' && <BrandingTab event={event} saveSuccess={saveSuccess} setSaveSuccess={setSaveSuccess} />}
          {tab === 'settings' && <SettingsTab event={event} saveSuccess={saveSuccess} setSaveSuccess={setSaveSuccess} />}
          {tab === 'analytics' && <AnalyticsTab event={event} analytics={analytics} />}
          {tab === 'audit' && <AuditTab event={event} activities={activities} />}
          {tab === 'results' && <ResultsTab event={event} positions={positions} />}
          {tab === 'permissions' && <PermissionsTab event={event} />}
          {tab === 'communication' && <CommunicationTab event={event} />}
          {tab === 'publishing' && <PublishingTab event={event} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function OverviewTab({ event, activities, analytics }: { event: OrivisEvent; activities: TimelineActivity[]; analytics?: EventAnalytics }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const TypeIcon = EVENT_TYPE_ICONS[event.type] || Vote

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <DashboardCard hover={false}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-brand-surface-elevated" style={{ color: pColor }}>
              <TypeIcon size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-display font-bold text-brand-text-primary">{event.title}</h2>
              <p className="text-xs text-brand-text-muted mt-1">{event.description}</p>
              <p className="text-[10px] font-mono text-brand-text-muted mt-2">
                <Globe size={10} className="inline mr-1" />
                {event.organizationName} &middot; {event.visibility}
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Status & Schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Current Status</p>
              <EventStatusBadge status={event.status} size="md" />
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Registration Progress</p>
              <ProgressBar value={event.registrationProgress} max={100} />
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Voting Period</p>
              <p className="text-xs font-semibold text-brand-text-primary">{formatDateTime(event.startsAt)}</p>
              <p className="text-xs font-semibold text-brand-text-primary">&rarr; {formatDateTime(event.endsAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Registration</p>
              <p className="text-xs font-semibold text-brand-text-primary">{formatDateTime(event.registrationStartsAt)}</p>
              <p className="text-xs font-semibold text-brand-text-primary">&rarr; {formatDateTime(event.registrationEndsAt)}</p>
            </div>
          </div>
        </DashboardCard>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Participants', value: event.participantCount, icon: Users },
            { label: 'Candidates', value: event.candidateCount, icon: User },
            { label: 'Positions', value: event.positionCount, icon: Trophy },
            { label: 'Voter Turnout', value: `${event.voterTurnout}%`, icon: BarChart3 },
          ].map((stat) => {
            const StatIcon = stat.icon
            return (
              <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
                  <StatIcon size={16} />
                </div>
                <p className="text-lg font-display font-black text-brand-text-primary">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">{stat.label}</p>
              </div>
            )
          })}
        </div>

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
                    <p className="text-[9px] font-mono text-brand-text-muted">{act.user} &middot; {timeAgo(act.timestamp)}</p>
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
              <EventStatusBadge status={event.status} size="md" />
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

        <WidgetPanel title="Event Details">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-brand-text-muted">Timezone</span>
              <span className="text-[10px] font-mono text-brand-text-primary">{event.timezone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-brand-text-muted">Visibility</span>
              <span className="text-[10px] font-mono text-brand-text-primary capitalize">{event.visibility}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-brand-text-muted">Created</span>
              <span className="text-[10px] font-mono text-brand-text-primary">{formatDate(event.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-brand-text-muted">Updated</span>
              <span className="text-[10px] font-mono text-brand-text-primary">{timeAgo(event.updatedAt)}</span>
            </div>
          </div>
        </WidgetPanel>
      </div>
    </div>
  )
}

function TimelineTab({ activities }: { activities: TimelineActivity[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = filterType === 'all' ? activities : activities.filter((a) => a.type === filterType)
  const activityTypes = ['all', ...Array.from(new Set(activities.map((a) => a.type)))]

  return (
    <DashboardCard hover={false}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[10px] font-mono text-brand-text-muted font-bold uppercase tracking-wider">Filter by:</span>
        <div className="flex items-center gap-1">
          {activityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                filterType === t ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={filterType === t ? { backgroundColor: pColor } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Clock} title="No Timeline Events" description="No activities match the selected filter." />
      ) : (
        <EventTimeline activities={filtered} />
      )}
    </DashboardCard>
  )
}

function RegistrationTab({ event, registration }: { event: OrivisEvent; registration?: EventRegistration }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [regSettings, setRegSettings] = useState<RegistrationSettings>(
    createDefaultRegSettings(),
  )

  const handleSave = async () => {
    setValidationErrors({})
    setSaveError(null)
    setSaving(true)
    await electionService.saveRegistrationSettings(event.id, regSettings)
    setSaving(false)
    setEditMode(false)
  }

  if (!registration && !editMode) {
    return (
      <DashboardCard hover={false}>
        <EmptyState
          icon={FileText}
          title="Registration Not Configured"
          description="Registration settings have not been set up for this event."
          action={{ label: 'Configure Registration', onClick: () => setEditMode(true) }}
        />
      </DashboardCard>
    )
  }

  const csvHeaders = ['name', 'email', 'student_id', 'staff_id', 'department']
  const csvRequired = ['name', 'email']

  return (
    <div className="space-y-6">
      {saveError && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-status-error/10 border border-status-error/20">
          <AlertTriangle size={14} className="text-status-error shrink-0" />
          <p className="text-[10px] font-mono text-status-error">{saveError}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Registration</h2>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <motion.button
                onClick={() => { setEditMode(false); setValidationErrors({}) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
                disabled={saving}
              >
                <X size={12} /> Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white disabled:opacity-50"
                style={{ backgroundColor: pColor }}
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => setEditMode(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
            >
              <Edit3 size={12} /> Edit Configuration
            </motion.button>
          )}
        </div>
      </div>

      {editMode ? (
        <RegistrationConfigSection
          config={regSettings}
          onChange={setRegSettings}
          errors={validationErrors}
        />
      ) : (
        <>
          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Registration Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Status</p>
                <p className={`text-xs font-bold flex items-center gap-1.5 ${registration?.isOpen ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  <span className={`w-2 h-2 rounded-full ${registration?.isOpen ? 'bg-status-success' : 'bg-brand-text-muted'}`} />
                  {registration?.isOpen ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Max Participants</p>
                <p className="text-xs font-bold text-brand-text-primary">{registration?.maxParticipants.toLocaleString() ?? '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Current Registrations</p>
                <p className="text-xs font-bold text-brand-text-primary">{registration?.currentRegistrations.toLocaleString() ?? '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Auto Approve</p>
                <p className={`text-xs font-bold ${registration?.autoApprove ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  {registration?.autoApprove ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            {registration && (
              <div className="mt-4">
                <ProgressBar value={registration.currentRegistrations} max={registration.maxParticipants} label="Registration Capacity" />
              </div>
            )}
          </DashboardCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard hover={false}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Eligibility Rules</h3>
              {!registration || registration.eligibilityRules.length === 0 ? (
                <p className="text-[10px] font-mono text-brand-text-muted">No eligibility rules configured.</p>
              ) : (
                <ul className="space-y-2">
                  {registration.eligibilityRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-mono text-brand-text-muted">
                      <CheckCircle size={10} className="text-status-success shrink-0 mt-0.5" />
                      {rule}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>

            <DashboardCard hover={false}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Verification Methods</h3>
              {!registration || registration.verificationMethods.length === 0 ? (
                <p className="text-[10px] font-mono text-brand-text-muted">No verification methods configured.</p>
              ) : (
                <ul className="space-y-2">
                  {registration.verificationMethods.map((method, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-mono text-brand-text-muted">
                      <Shield size={10} className="text-status-info shrink-0 mt-0.5" />
                      {method}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>

          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Voting Pass Settings</h3>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Expires In</p>
                <p className="text-xs font-bold text-brand-text-primary">{registration?.passSettings.expiresInHours ?? '—'} hours</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] font-mono text-brand-text-muted mb-1">Single Use</p>
                <p className={`text-xs font-bold ${registration?.passSettings.singleUse ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  {registration?.passSettings.singleUse ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-3">Quick Actions</h3>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white"
                style={{ backgroundColor: pColor }}
              >
                {registration?.isOpen ? <Lock size={12} /> : <Eye size={12} />}
                {registration?.isOpen ? 'Close Registration' : 'Open Registration'}
              </motion.button>
              <motion.button
                onClick={() => setShowCsvModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
              >
                <Upload size={12} /> Import CSV
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
              >
                Export Registrations
              </motion.button>
            </div>
          </DashboardCard>
        </>
      )}

      <CsvMappingModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onConfirm={(mapping, records) => {
          electionService.bulkImport(event.id, new File([], ''), mapping)
        }}
        expectedHeaders={csvHeaders}
        requiredHeaders={csvRequired}
      />
    </div>
  )
}

function CandidatesTab({ event, positions }: { event: OrivisEvent; positions: EventPosition[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [candSearch, setCandSearch] = useState('')
  const [candFilter, setCandFilter] = useState<string>('all')
  const [reorderedPositions, setReorderedPositions] = useState(positions)

  const allCandidates = reorderedPositions.flatMap((p) => p.candidates)
  const filtered = allCandidates.filter((c) => {
    if (candFilter !== 'all' && c.status !== candFilter) return false
    if (candSearch && !c.name.toLowerCase().includes(candSearch.toLowerCase()) && !c.email.toLowerCase().includes(candSearch.toLowerCase())) return false
    return true
  })

  const candidateStatuses = ['all', ...Array.from(new Set(allCandidates.map((c) => c.status)))]

  const handleReorder = (candidateId: string, direction: 'up' | 'down') => {
    setReorderedPositions((prev) => {
      const next = prev.map((pos) => ({ ...pos, candidates: [...pos.candidates] }))
      for (const pos of next) {
        const idx = pos.candidates.findIndex((c) => c.id === candidateId)
        if (idx === -1) continue
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1
        if (targetIdx < 0 || targetIdx >= pos.candidates.length) continue
        pos.ballotOrder = targetIdx + 1
        ;[pos.candidates[idx], pos.candidates[targetIdx]] = [pos.candidates[targetIdx], pos.candidates[idx]]
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input value={candSearch} onChange={(e) => setCandSearch(e.target.value)} placeholder="Search candidates..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {candidateStatuses.map((s) => (
              <button key={s} onClick={() => setCandFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                  candFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                }`}
                style={candFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive shrink-0"
          >
            <Image size={14} />
            Ballot Preview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive shrink-0"
          >
            <FileText size={14} />
            Import Candidates
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white shrink-0"
            style={{ backgroundColor: pColor }}
          >
            <Plus size={14} />
            Add Candidate
          </motion.button>
        </div>
      </div>

      <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Drag candidates to reorder ballot position</p>

      {filtered.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState
            icon={Users}
            title="No Candidates Found"
            description={candSearch || candFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No candidates have been added to this event yet.'}
            action={candSearch || candFilter !== 'all' ? undefined : { label: 'Add Candidate', onClick: () => {} }}
          />
        </DashboardCard>
      ) : (
        <div className="space-y-8">
          {reorderedPositions.map((pos) => {
            const posCandidates = filtered.filter((c) => c.positionId === pos.id)
            if (posCandidates.length === 0) return null
            return (
              <div key={pos.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={14} style={{ color: pColor }} />
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: pColor }}>{pos.title}</h3>
                  <span className="text-[9px] font-mono text-brand-text-muted">({posCandidates.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {posCandidates.map((candidate, i) => (
                    <CandidateCard key={candidate.id} candidate={candidate} positionTitle={pos.title} index={i} onReorder={handleReorder} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ParticipantsTab({ event, participants }: { event: OrivisEvent; participants: EventParticipant[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [partSearch, setPartSearch] = useState('')
  const [regFilter, setRegFilter] = useState<string>('all')
  const [verFilter, setVerFilter] = useState<string>('all')
  const [passFilter, setPassFilter] = useState<string>('all')
  const [partPage, setPartPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const perPage = 10

  const filtered = participants.filter((p) => {
    if (regFilter !== 'all' && p.registrationStatus !== regFilter) return false
    if (verFilter !== 'all' && p.verificationStatus !== verFilter) return false
    if (passFilter !== 'all' && p.votingPassStatus !== passFilter) return false
    if (partSearch && !p.name.toLowerCase().includes(partSearch.toLowerCase()) && !p.email.toLowerCase().includes(partSearch.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((partPage - 1) * perPage, partPage * perPage)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paged.map((p) => p.id)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input value={partSearch} onChange={(e) => { setPartSearch(e.target.value); setPartPage(1) }} placeholder="Search participants..."
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive">
            Export
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive">
            Import
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-brand-text-muted font-bold uppercase tracking-wider mr-1">Reg:</span>
          {(['all', 'registered', 'verified', 'approved', 'rejected'] as const).map((s) => (
            <button key={s} onClick={() => { setRegFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                regFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={regFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-brand-text-muted font-bold uppercase tracking-wider mr-1">Ver:</span>
          {(['all', 'pending', 'verified', 'failed'] as const).map((s) => (
            <button key={s} onClick={() => { setVerFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                verFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={verFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-brand-text-muted font-bold uppercase tracking-wider mr-1">Pass:</span>
          {(['all', 'not_issued', 'issued', 'used', 'expired'] as const).map((s) => (
            <button key={s} onClick={() => { setPassFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                passFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={passFilter === s ? { backgroundColor: pColor } : {}}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {paged.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={UserCheck} title="No Participants Found"
            description={partSearch || regFilter !== 'all' || verFilter !== 'all' || passFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No participants registered yet.'} />
        </DashboardCard>
      ) : (
        <DashboardCard hover={false}>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-brand-surface-elevated/50">
              <span className="text-[10px] font-mono text-brand-text-muted">{selectedIds.size} selected</span>
              <button className="ml-auto p-1 rounded-lg hover:bg-brand-surface-interactive text-status-success"><CheckCircle size={12} /></button>
              <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error"><XCircle size={12} /></button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-divider">
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" checked={selectedIds.size === paged.length && paged.length > 0} onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                  </th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Name</th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Email</th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Department</th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Registration</th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Verification</th>
                  <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Pass Status</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.id} className="border-b border-brand-divider last:border-0 hover:bg-brand-surface-interactive/30 transition-colors">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)}
                        className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: pColor }}>
                          {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs font-semibold text-brand-text-primary">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[10px] font-mono text-brand-text-muted">{p.email}</td>
                    <td className="px-3 py-3 text-[10px] font-mono text-brand-text-muted">{p.department}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${PARTICIPANT_REG_STYLES[p.registrationStatus] || ''}`}>
                        {p.registrationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${VERIFICATION_STYLES[p.verificationStatus] || ''}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${PASS_STYLES[p.votingPassStatus] || ''}`}>
                        {p.votingPassStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-divider">
              <span className="text-[9px] font-mono text-brand-text-muted">Page {partPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPartPage(Math.max(1, partPage - 1))} disabled={partPage === 1}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPartPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      partPage === i + 1 ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                    }`}
                    style={partPage === i + 1 ? { backgroundColor: pColor } : {}}>{i + 1}</button>
                ))}
                <button onClick={() => setPartPage(Math.min(totalPages, partPage + 1))} disabled={partPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </DashboardCard>
      )}
    </div>
  )
}

function BrandingTab({ event, saveSuccess, setSaveSuccess }: { event: OrivisEvent; saveSuccess: boolean; setSaveSuccess: (v: boolean) => void }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [theme, setTheme] = useState(event.branding.theme)
  const [primaryColor, setPrimaryColor] = useState(event.branding.primaryColor)
  const [accentColor, setAccentColor] = useState(event.branding.accentColor)
  const [customUrl, setCustomUrl] = useState(event.branding.customUrl || '')

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Banner Image</h3>
          <div className="border-2 border-dashed border-brand-divider rounded-2xl p-8 text-center hover:border-[var(--org-primary)]/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated flex items-center justify-center mx-auto mb-3" style={{ color: pColor }}>
              <Image size={24} />
            </div>
            <p className="text-xs text-brand-text-muted">Drop an image here or click to upload</p>
            <p className="text-[9px] font-mono text-brand-text-disabled mt-1">Recommended: 1200 x 300px, max 2MB</p>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Logo</h3>
          <div className="border-2 border-dashed border-brand-divider rounded-2xl p-8 text-center hover:border-[var(--org-primary)]/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-brand-surface-elevated flex items-center justify-center mx-auto mb-3" style={{ color: pColor }}>
              <Image size={24} />
            </div>
            <p className="text-xs text-brand-text-muted">Drop a logo here or click to upload</p>
            <p className="text-[9px] font-mono text-brand-text-disabled mt-1">Recommended: 200 x 200px, max 1MB</p>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl border border-brand-divider shrink-0" style={{ backgroundColor: primaryColor }} />
                <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#000000"
                  className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs font-mono text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl border border-brand-divider shrink-0" style={{ backgroundColor: accentColor }} />
                <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#000000"
                  className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs font-mono text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all uppercase" />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Theme</h3>
          <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                  theme === t ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                }`}
                style={theme === t ? { backgroundColor: pColor } : {}}>{t}</button>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Custom URL</h3>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-brand-text-muted shrink-0" />
            <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://events.myorg.com/event-slug"
              className="flex-1 bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
        </DashboardCard>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white"
            style={{ backgroundColor: pColor }}
          >
            Save Changes
          </motion.button>
          {saveSuccess && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-mono text-status-success font-bold"
            >
              Saved!
            </motion.span>
          )}
        </div>
      </div>

      <div>
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Preview</h3>
          <div className="rounded-2xl overflow-hidden border border-brand-divider">
            <div className="h-20" style={{ backgroundColor: primaryColor }} />
            <div className="p-4 bg-brand-surface">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                  EV
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-text-primary" style={{ color: primaryColor }}>
                    Event Title Preview
                  </p>
                  <p className="text-[9px] font-mono text-brand-text-muted">Organization Name</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-brand-text-muted">
                  <Calendar size={10} /> Oct 15, 2026
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    Live
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-divider">
                <ProgressBar value={65} max={100} size="sm" label="Participation" color={primaryColor} />
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}

function SettingsTab({ event, saveSuccess, setSaveSuccess }: { event: OrivisEvent; saveSuccess: boolean; setSaveSuccess: (v: boolean) => void }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [timezone, setTimezone] = useState(event.timezone)
  const [visibility, setVisibility] = useState(event.visibility)
  const [regStart, setRegStart] = useState(event.registrationStartsAt.slice(0, 16))
  const [regEnd, setRegEnd] = useState(event.registrationEndsAt.slice(0, 16))
  const [voteStart, setVoteStart] = useState(event.startsAt.slice(0, 16))
  const [voteEnd, setVoteEnd] = useState(event.endsAt.slice(0, 16))
  const [allowAnonymous, setAllowAnonymous] = useState(event.settings.allowAnonymousVoting)
  const [requireEmail, setRequireEmail] = useState(event.settings.requireEmailVerification)
  const [requireId, setRequireId] = useState(event.settings.requireIdVerification)
  const [require2fa, setRequire2fa] = useState(event.settings.requireTwoFactor)
  const [allowMultiple, setAllowMultiple] = useState(event.settings.allowMultipleVotes)
  const [resultPub, setResultPub] = useState(event.settings.resultPublication)
  const [notifyReg, setNotifyReg] = useState(event.settings.notifyOnRegistration)
  const [notifyVote, setNotifyVote] = useState(event.settings.notifyOnVote)

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  return (
    <div className="space-y-6">
      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">General Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Event Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all">
                <option>Africa/Lagos</option>
                <option>Africa/Nairobi</option>
                <option>Africa/Cairo</option>
                <option>Africa/Johannesburg</option>
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Visibility</label>
              <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
                {(['public', 'private'] as const).map((v) => (
                  <button key={v} onClick={() => setVisibility(v)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                      visibility === v ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                    }`}
                    style={visibility === v ? { backgroundColor: pColor } : {}}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Registration Dates</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Registration Start</label>
              <input type="datetime-local" value={regStart} onChange={(e) => setRegStart(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Registration End</label>
              <input type="datetime-local" value={regEnd} onChange={(e) => setRegEnd(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Voting Dates</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Voting Start</label>
              <input type="datetime-local" value={voteStart} onChange={(e) => setVoteStart(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Voting End</label>
              <input type="datetime-local" value={voteEnd} onChange={(e) => setVoteEnd(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Security Settings</h3>
        <div className="space-y-3">
          {[
            { label: 'Anonymous Voting', value: allowAnonymous, set: setAllowAnonymous, icon: EyeOff },
            { label: 'Email Verification', value: requireEmail, set: setRequireEmail, icon: Mail },
            { label: 'ID Verification', value: requireId, set: setRequireId, icon: Fingerprint },
            { label: 'Require 2FA for Voters', value: require2fa, set: setRequire2fa, icon: Key },
            { label: 'Allow Multiple Votes', value: allowMultiple, set: setAllowMultiple, icon: Vote },
          ].map((s) => {
            const SIcon = s.icon
            return (
              <label key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
                <div className="flex items-center gap-2">
                  <SIcon size={14} style={{ color: pColor }} />
                  <span className="text-[10px] font-mono text-brand-text-primary font-medium">{s.label}</span>
                </div>
                <input type="checkbox" checked={s.value} onChange={() => s.set(!s.value)}
                  className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
              </label>
            )
          })}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Result Publication</h3>
          <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
            {(['immediate', 'scheduled', 'manual'] as const).map((r) => (
              <button key={r} onClick={() => setResultPub(r)}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all capitalize ${
                  resultPub === r ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                }`}
                style={resultPub === r ? { backgroundColor: pColor } : {}}>{r}</button>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: pColor }} />
                <span className="text-[10px] font-mono text-brand-text-primary font-medium">Notify on Registration</span>
              </div>
              <input type="checkbox" checked={notifyReg} onChange={() => setNotifyReg(!notifyReg)}
                className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: pColor }} />
                <span className="text-[10px] font-mono text-brand-text-primary font-medium">Notify on Vote</span>
              </div>
              <input type="checkbox" checked={notifyVote} onChange={() => setNotifyVote(!notifyVote)}
                className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
          </div>
        </DashboardCard>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white"
          style={{ backgroundColor: pColor }}
        >
          Save
        </motion.button>
        {saveSuccess && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-mono text-status-success font-bold"
          >
            Saved!
          </motion.span>
        )}
      </div>
    </div>
  )
}

function AnalyticsTab({ event, analytics }: { event: OrivisEvent; analytics?: EventAnalytics }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  if (!analytics) {
    return (
      <DashboardCard hover={false}>
        <EmptyState icon={BarChart3} title="Analytics Not Available" description="Analytics data is not available for this event yet." />
      </DashboardCard>
    )
  }

  const maxRegCount = Math.max(...analytics.registrationTrend.map((d) => d.count), 1)
  const maxGrowthTotal = Math.max(...analytics.participantGrowth.map((d) => d.total), 1)

  return (
    <div className="space-y-6">
      {/* Event Health */}
      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Event Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.eventHealth.map((h) => (
            <div key={h.label} className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-brand-text-muted">{h.label}</span>
                <span className={`w-2 h-2 rounded-full ${h.status === 'healthy' ? 'bg-status-success' : h.status === 'warning' ? 'bg-status-warning' : 'bg-status-error'}`} />
              </div>
              <ProgressBar value={h.value} max={h.max} color={HEALTH_COLORS[h.status]} size="sm" />
            </div>
          ))}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trend */}
        <WidgetPanel title="Registration Trend" subtitle="Daily registrations" className="lg:col-span-2">
          <div className="flex items-end gap-1 h-32">
            {analytics.registrationTrend.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max((d.count / maxRegCount) * 100, 4)}%`,
                    backgroundColor: pColor,
                    opacity: 0.4 + (i / analytics.registrationTrend.length) * 0.6,
                  }}
                />
                <span className="text-[7px] font-mono text-brand-text-disabled mt-1 truncate w-full text-center">{d.date}</span>
              </div>
            ))}
          </div>
        </WidgetPanel>

        {/* Participant Growth */}
        <WidgetPanel title="Participant Growth" subtitle="Cumulative totals">
          <div className="flex items-end gap-1 h-32">
            {analytics.participantGrowth.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max((d.total / maxGrowthTotal) * 100, 4)}%`,
                    backgroundColor: branding.accentColor,
                    opacity: 0.4 + (i / analytics.participantGrowth.length) * 0.6,
                  }}
                />
                <span className="text-[7px] font-mono text-brand-text-disabled mt-1 truncate w-full text-center">{d.date}</span>
              </div>
            ))}
          </div>
        </WidgetPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Stats */}
        <WidgetPanel title="Candidate Stats" subtitle="Approval breakdown">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Total</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.candidateStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-success/10">
              <span className="text-[10px] font-mono text-status-success">Approved</span>
              <span className="text-xs font-bold text-status-success">{analytics.candidateStats.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-warning/10">
              <span className="text-[10px] font-mono text-status-warning">Pending</span>
              <span className="text-xs font-bold text-status-warning">{analytics.candidateStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-error/10">
              <span className="text-[10px] font-mono text-status-error">Rejected</span>
              <span className="text-xs font-bold text-status-error">{analytics.candidateStats.rejected}</span>
            </div>
          </div>
        </WidgetPanel>

        {/* Turnout Projection */}
        <WidgetPanel title="Turnout Projection" subtitle="Current vs projected">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 text-center">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Current Turnout</p>
              <p className="text-2xl font-display font-black" style={{ color: pColor }}>{analytics.turnoutProjection.current}%</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 text-center">
              <p className="text-[10px] font-mono text-brand-text-muted mb-1">Projected Turnout</p>
              <p className="text-2xl font-display font-black text-brand-text-primary">{analytics.turnoutProjection.projected}%</p>
            </div>
            <ProgressBar value={analytics.turnoutProjection.percentage} max={100} color={pColor} label="Progress toward projected" />
          </div>
        </WidgetPanel>

        {/* Key Metrics */}
        <WidgetPanel title="Key Metrics" subtitle="Event performance">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Total Participants</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.participantGrowth[analytics.participantGrowth.length - 1]?.total.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Total Candidates</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.candidateStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Reg. Rate</span>
              <span className="text-xs font-bold text-brand-text-primary">{event.registrationProgress}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Verification Rate</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.eventHealth.find((h) => h.label === 'Verification Rate')?.value || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] font-mono text-brand-text-muted">Pass Utilization</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.eventHealth.find((h) => h.label === 'Pass Utilization')?.value || 0}%</span>
            </div>
          </div>
        </WidgetPanel>
      </div>
    </div>
  )
}

function AuditTab({ event, activities: auditActivities }: { event: OrivisEvent; activities: TimelineActivity[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [auditSearch, setAuditSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all')

  const eventActivities = auditActivities

  const filtered = eventActivities.filter((a) => {
    if (severityFilter !== 'all') {
      const severityMap: Record<string, string> = { info: 'create,update,system', warning: 'alert', critical: 'reject' }
      if (!severityMap[severityFilter]?.split(',').includes(a.type)) return false
    }
    if (auditSearch && !a.action.toLowerCase().includes(auditSearch.toLowerCase()) && !a.user.toLowerCase().includes(auditSearch.toLowerCase())) return false
    return true
  })

  return (
    <DashboardCard hover={false}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Search audit log..."
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'info', 'warning', 'critical'] as const).map((s) => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider font-bold transition-all ${
                severityFilter === s ? 'text-white' : 'border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={severityFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No Audit Events" description="No audit events match your filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-divider">
                <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Action</th>
                <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">User</th>
                <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Timestamp</th>
                <th className="px-3 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const typeSeverityMap: Record<string, 'info' | 'warning' | 'critical'> = {
                  create: 'info', update: 'info', approve: 'info', publish: 'info',
                  complete: 'info', system: 'info', alert: 'warning', reject: 'critical',
                }
                const sev = typeSeverityMap[a.type] || 'info'
                return (
                  <tr key={a.id} className="border-b border-brand-divider last:border-0 hover:bg-brand-surface-interactive/30 transition-colors">
                    <td className="px-3 py-3 text-xs text-brand-text-primary font-medium">{a.action}</td>
                    <td className="px-3 py-3 text-[10px] font-mono text-brand-text-muted">{a.user}</td>
                    <td className="px-3 py-3 text-[10px] font-mono text-brand-text-muted">{timeAgo(a.timestamp)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[sev]}`}>
                        {sev}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  )
}

function ResultsTab({ event, positions }: { event: OrivisEvent; positions: EventPosition[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const totalCandidates = positions.reduce((sum, p) => sum + p.candidates.length, 0)
  const isCertified = event.settings.resultPublication === 'certified'

  return (
    <div className="space-y-6">
      {isCertified && (
        <DashboardCard hover={false} className="border-status-success/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#22C55E20' }}>
              <BadgeCheck size={24} className="text-status-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-status-success uppercase tracking-wider">Certified Results</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">
                These results have been cryptographically certified and verified. The outcome is final and tamper-proof.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[9px] font-mono">
                  <Shield size={10} className="text-status-success" />
                  <span className="text-brand-text-muted">Blockchain verified</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono">
                  <CheckCircle size={10} className="text-status-success" />
                  <span className="text-brand-text-muted">Cryptographically signed</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Voters', value: event.participantCount, icon: Users },
          { label: 'Turnout', value: `${event.voterTurnout}%`, icon: BarChart3 },
          { label: 'Positions', value: positions.length, icon: Trophy },
          { label: 'Candidates', value: totalCandidates, icon: User },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
                <StatIcon size={16} />
              </div>
              <p className="text-lg font-display font-black text-brand-text-primary">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {positions.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={Trophy} title="No Positions" description="No positions have been configured for this event." />
        </DashboardCard>
      ) : (
        positions.map((pos) => {
          const sorted = [...pos.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
          const totalVotes = sorted.reduce((sum, c) => sum + (c.voteCount || 0), 0)
          const winner = sorted[0]

          return (
            <DashboardCard key={pos.id} hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isCertified ? (
                    <BadgeCheck size={14} className="text-status-success" />
                  ) : (
                    <Trophy size={14} style={{ color: pColor }} />
                  )}
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={isCertified ? { color: '#22C55E' } : { color: pColor }}>{pos.title}</h3>
                  {isCertified && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20 uppercase tracking-wider">
                      Certified
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-brand-text-muted">{totalVotes} votes</span>
              </div>
              <div className="space-y-2">
                {sorted.map((c, i) => {
                  const pct = totalVotes > 0 ? Math.round(((c.voteCount || 0) / totalVotes) * 100) : 0
                  const isWinner = i === 0 && totalVotes > 0
                  return (
                    <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isWinner ? 'bg-status-success/10 border border-status-success/20' : 'bg-brand-surface-elevated/20'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: isWinner ? '#22C55E' : pColor }}>
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-brand-text-primary">{c.name}</span>
                          {isWinner && <BadgeCheck size={12} className="text-status-success" />}
                        </div>
                        <p className="text-[9px] font-mono text-brand-text-muted">{c.voteCount || 0} votes &middot; {pct}%</p>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-brand-surface-elevated overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isWinner ? '#22C55E' : pColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </DashboardCard>
          )
        })
      )}
    </div>
  )
}

function PermissionsTab({ event }: { event: OrivisEvent }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const PERMISSION_GROUPS = [
    { id: 'pg-event', label: 'Event', permissions: [
      { id: 'p-event-view', label: 'View Event', key: 'view_event', enabled: true },
      { id: 'p-event-edit', label: 'Edit Event', key: 'edit_event', enabled: true },
      { id: 'p-event-delete', label: 'Delete Event', key: 'delete_event', enabled: true },
      { id: 'p-event-publish', label: 'Publish Event', key: 'publish_event', enabled: false },
    ]},
    { id: 'pg-candidates', label: 'Candidates', permissions: [
      { id: 'p-cand-view', label: 'View Candidates', key: 'view_candidates', enabled: true },
      { id: 'p-cand-create', label: 'Create Candidates', key: 'create_candidate', enabled: true },
      { id: 'p-cand-edit', label: 'Edit Candidates', key: 'edit_candidate', enabled: true },
      { id: 'p-cand-delete', label: 'Delete Candidates', key: 'delete_candidate', enabled: false },
    ]},
    { id: 'pg-voters', label: 'Voters', permissions: [
      { id: 'p-voter-view', label: 'View Voters', key: 'view_voters', enabled: true },
      { id: 'p-voter-import', label: 'Import Voters', key: 'import_voters', enabled: true },
      { id: 'p-voter-remove', label: 'Remove Voters', key: 'remove_voter', enabled: false },
    ]},
  ]

  return (
    <div className="space-y-6">
      {PERMISSION_GROUPS.map((group) => (
        <DashboardCard key={group.id} hover={false}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">{group.label}</h3>
          <div className="space-y-2">
            {group.permissions.map((perm) => (
              <label key={perm.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: pColor }} />
                  <span className="text-[10px] font-mono text-brand-text-primary font-medium">{perm.label}</span>
                  <span className="text-[8px] font-mono text-brand-text-disabled">{perm.key}</span>
                </div>
                <input type="checkbox" checked={perm.enabled} readOnly
                  className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)] pointer-events-none" />
              </label>
            ))}
          </div>
        </DashboardCard>
      ))}
    </div>
  )
}

function CommunicationTab({ event }: { event: OrivisEvent }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Notification Settings</h3>
        <div className="space-y-3">
          {[
            { label: 'New Registration', desc: 'Notify when a participant registers' },
            { label: 'Vote Cast', desc: 'Notify when a vote is cast' },
            { label: 'Candidate Changes', desc: 'Notify when candidate details change' },
            { label: 'Event Updates', desc: 'Notify when event settings change' },
            { label: 'Results Published', desc: 'Notify when results are published' },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div>
                <span className="text-[10px] font-mono text-brand-text-primary font-medium">{n.label}</span>
                <p className="text-[8px] font-mono text-brand-text-disabled">{n.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Send Notification</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Subject</label>
            <input placeholder="Notification subject..."
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">Message</label>
            <textarea rows={4} placeholder="Type your notification message..."
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white"
            style={{ backgroundColor: pColor }}
          >
            <Bell size={12} />
            Send to All Participants
          </motion.button>
        </div>
      </DashboardCard>
    </div>
  )
}

function PublishingTab({ event }: { event: OrivisEvent }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const checks = [
    { id: 'org-profile' as const, label: 'Organization Profile', check: true, detail: 'Organization name, email, and contact details are configured.' },
    { id: 'workspace-branding' as const, label: 'Workspace Branding', check: true, detail: 'Logo, colors, and theme are set in workspace settings.' },
    { id: 'event-branding' as const, label: 'Event Branding', check: event.publishReadiness.brandingComplete, detail: 'Event banner, logo, and color scheme are configured.' },
    { id: 'positions' as const, label: 'Positions', check: event.publishReadiness.positionsDefined, detail: 'At least one position must be defined for the event.' },
    { id: 'candidates' as const, label: 'Candidates', check: event.publishReadiness.candidatesNominated, detail: 'All positions must have at least one candidate nominated.' },
    { id: 'participants' as const, label: 'Participants', check: event.publishReadiness.participantsImported, detail: 'Participant list must be imported or manually entered.' },
    { id: 'schedule' as const, label: 'Schedule', check: event.publishReadiness.votingScheduleSet, detail: 'Voting start and end times must be set.' },
    { id: 'visibility' as const, label: 'Visibility', check: event.publishReadiness.visibilityConfigured, detail: 'Event visibility must be set to public or private.' },
    { id: 'settings' as const, label: 'Required Settings', check: event.publishReadiness.requiredSettingsComplete, detail: 'All required event settings must be configured.' },
    { id: 'subscription' as const, label: 'Subscription Status', check: true, detail: 'Organization has an active subscription.' },
  ]

  const completedCount = checks.filter(c => c.check).length
  const totalCount = checks.length
  const percentage = Math.round((completedCount / totalCount) * 100)
  const allComplete = completedCount === totalCount

  const failedItems = checks.filter(c => !c.check)
  const groupedFailed = failedItems.reduce<Record<string, typeof failedItems>>((acc, item) => {
    const group = item.id === 'org-profile' || item.id === 'workspace-branding' || item.id === 'subscription' ? 'Organization' :
      item.id === 'event-branding' ? 'Branding' :
      item.id === 'positions' || item.id === 'candidates' ? 'Candidates' :
      item.id === 'participants' ? 'Participants' :
      item.id === 'schedule' || item.id === 'visibility' || item.id === 'settings' ? 'Configuration' : 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await eventService.publishEvent(event.id)
      setPublished(true)
    } catch {
      setPublished(false)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-display font-bold uppercase tracking-tight text-brand-text-primary">Publish Readiness</h2>
            <p className="text-[11px] text-brand-text-muted mt-0.5">Complete all checks before publishing this event to participants.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-black" style={{ color: allComplete ? '#22C55E' : pColor }}>{percentage}%</p>
            <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">{completedCount} of {totalCount} checks passed</p>
          </div>
        </div>

        <ProgressBar value={completedCount} max={totalCount} color={allComplete ? '#22C55E' : pColor} showLabel={false} />

        {Object.keys(groupedFailed).length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-status-warning/10 border border-status-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-status-warning" />
              <span className="text-[10px] font-mono font-bold text-status-warning uppercase tracking-wider">Validation Summary</span>
            </div>
            {Object.entries(groupedFailed).map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1">{group}</p>
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 ml-2 mb-1">
                    <XCircle size={10} className="text-status-error shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-brand-text-primary font-medium">{item.label}</span>
                      <p className="text-[8px] text-brand-text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary mb-4">Validation Checks</h3>
        <div className="space-y-1">
          {checks.map((item) => (
            <div key={item.id}
              className="relative group"
              onMouseEnter={() => setShowDetails(item.id)}
              onMouseLeave={() => setShowDetails(null)}
            >
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                item.check ? 'bg-brand-surface-elevated/20' : 'bg-status-error/5 border border-status-error/10'
              }`}>
                {item.check ? (
                  <CheckCircle size={16} className="text-status-success shrink-0" />
                ) : (
                  <XCircle size={16} className="text-status-error shrink-0" />
                )}
                <span className={`text-xs font-medium ${item.check ? 'text-brand-text-primary' : 'text-brand-text-muted'}`}>
                  {item.label}
                </span>
                {!item.check && (
                  <span className="ml-auto text-[8px] font-mono text-status-error uppercase tracking-wider">Required</span>
                )}
              </div>
              {showDetails === item.id && (
                <div className="absolute left-8 -bottom-8 z-10 px-3 py-2 rounded-xl bg-brand-surface border border-brand-border shadow-lg text-[10px] text-brand-text-muted whitespace-nowrap">
                  {item.detail}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-brand-divider">
          {published ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-status-success/10 border border-status-success/20">
              <CheckCircle size={20} className="text-status-success" />
              <div>
                <p className="text-xs font-bold text-status-success">Event Published Successfully</p>
                <p className="text-[10px] text-brand-text-muted mt-0.5">Participants can now view and register for this event.</p>
              </div>
            </div>
          ) : allComplete ? (
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all text-white disabled:opacity-50"
                style={{ backgroundColor: pColor }}
              >
                {publishing ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Publishing...</>
                ) : (
                  <><Send size={14} /> Publish Now</>
                )}
              </motion.button>
              <p className="text-[10px] text-brand-text-muted">Event status will change from <strong>Draft</strong> to <strong>Published</strong></p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-status-warning/10 text-status-warning">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {failedItems.length} validation {failedItems.length === 1 ? 'check' : 'checks'} {failedItems.length === 1 ? 'has' : 'have'} not passed
              </span>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  )
}
