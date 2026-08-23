import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, Users, BarChart3, Settings, Palette, Activity, CheckCircle,
  AlertTriangle, Archive, Shield, Loader2, Globe, Bell, Clock, FileText,
  UserCheck, Play, Square, Edit3,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useOrgPermissions } from '../../contexts/OrgPermissionsContext'
import QrCodeModal from '../components/QrCodeModal'
import AuditNoteModal from '../components/AuditNoteModal'
import EventStatusBadge from '../components/EventStatusBadge'
import SeoHead from "../../components/SeoHead"
import EmptyState from '../components/EmptyState'
import { eventService, type EventDetailData } from '../services/event-service'
import { electionService } from '../../services/election-service'
import { usePolling } from '../../hooks/usePolling'
import { ROUTES } from '../../constants/routes'
import type {
  OrivisEvent, EventPosition, EventParticipant, TimelineActivity,
  EventAnalytics, EventRegistration, EventCandidate,
} from '../types'
import {
  OverviewTab, TimelineTab, RegistrationTab, CandidatesTab, ParticipantsTab,
  BrandingTab, SettingsTab, AnalyticsTab, AuditTab, ResultsTab,
  PermissionsTab, CommunicationTab, PublishingTab,
} from './event-detail'

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

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'draft', READY: 'ready', CREATED: 'created', PUBLISHED: 'published',
  LIVE: 'live', ENDED: 'ended', COMPLETED: 'completed', ARCHIVED: 'archived', CANCELLED: 'cancelled',
}

function toEventStatus(s: string): 'draft' | 'ready' | 'created' | 'published' | 'live' | 'ended' | 'completed' | 'archived' | 'cancelled' {
  // Normalize casing (backend sends DRAFT/CREATED/PUBLISHED/LIVE/ENDED/ARCHIVED/CANCELLED).
  // Never fall back to 'draft': an unknown state must not be treated as a draft,
  // otherwise non-draft elections collapse into the create wizard / blank page.
  return (STATUS_MAP[String(s).toUpperCase()] || 'created') as never
}

function mapElectionToOrivis(
  e: import('../../types/election').Election,
  positions: EventPosition[],
  participants: EventParticipant[],
): OrivisEvent {
  return {
    id: e.id,
    title: e.title,
    type: mapElectionType(e.type),
    status: toEventStatus(e.status),
    description: e.description ?? '',
    startsAt: e.startsAt ?? e.createdAt ?? '',
    endsAt: e.endsAt ?? e.startsAt ?? e.createdAt ?? '',
    registrationStartsAt: e.registrationStartsAt ?? e.startsAt ?? e.createdAt ?? '',
    registrationEndsAt: e.registrationEndsAt ?? e.endsAt ?? e.createdAt ?? '',
    timezone: e.timezone ?? 'UTC',
    organizationId: e.organizationId,
    organizationName: e.organizationName ?? '',
    participantCount: e.participantCount ?? e.totalRegistered ?? 0,
    registeredCount: e.registeredCount ?? e.totalRegistered,
    candidateCount: e.candidateCount ?? 0,
    positionCount: e.positionCount ?? 0,
    maxVoters: e.maxVoters ?? null,
    candidateSlots: e.candidateSlots,
    isMultiParty: e.isMultiParty,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    scheduledPublishAt: e.scheduledPublishAt ?? null,
    registrationProgress: e.registrationProgress ?? 0,
    voterTurnout: e.voterTurnout ?? 0,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    visibility: e.visibility ?? 'public',
    branding: {
      bannerUrl: e.bannerUrl ?? null,
      logoUrl: e.settings?.logo_url ?? e.branding?.logoUrl ?? null,
      primaryColor: '#FCA311',
      accentColor: '#3B82F6',
      theme: (e.settings?.theme === 'light' || e.settings?.theme === 'dark' || e.settings?.theme === 'system') ? e.settings.theme : 'dark',
      customUrl: e.settings?.custom_url ?? null,
    },
    settings: {
      participationModel: 'imported',
      allowAnonymousVoting: e.settings?.is_anonymous === true || e.settings?.is_anonymous === '1' || (e.isAnonymous ?? false),
      requireEmailVerification: e.settings?.require_email_verification === true || e.settings?.require_email_verification === '1',
      requireIdVerification: e.settings?.require_id_verification === true || e.settings?.require_id_verification === '1',
      maxVotesPerParticipant: e.settings?.max_votes != null ? Number(e.settings.max_votes) : (e.maxVotes ?? 1),
      resultPublication: (['immediate', 'scheduled', 'manual', 'hidden', 'certified'] as const).includes(e.settings?.result_publication as never)
        ? e.settings?.result_publication as OrivisEvent['settings']['resultPublication']
        : 'manual',
      resultPublishedAt: null,
      notifyOnRegistration: e.settings?.notify_on_registration === true || e.settings?.notify_on_registration === '1',
      notifyOnVote: e.settings?.notify_on_vote === true || e.settings?.notify_on_vote === '1',
      allowMultipleVotes: e.settings?.allow_multiple_votes === true || e.settings?.allow_multiple_votes === '1',
      requireTwoFactor: e.settings?.require_two_factor === true || e.settings?.require_two_factor === '1',
      liveResults: e.settings?.live_results === true || e.settings?.live_results === '1',
    },
    publishReadiness: {
      brandingComplete: !!e.bannerUrl || !!e.settings?.logo_url || !!e.settings?.theme || !!e.settings?.custom_url,
      positionsDefined: positions.length > 0,
      candidatesNominated: positions.length > 0 && positions.every((p) => p.candidates.some((c) => c.status === 'published')),
      participantsImported: participants.length > 0,
      votingScheduleSet: !!e.startsAt && !!e.endsAt,
      visibilityConfigured: !!e.visibility,
      requiredSettingsComplete: !!e.settings?.result_publication && (Number(e.maxVotes ?? 1) >= 1),
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
  const { hasPermission: hasOrgPermission, permissionsLoaded } = useOrgPermissions()
  const pColor = branding.primaryColor

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventData, setEventData] = useState<EventDetailData | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [tab, setTab] = useState<TabId>('overview')
  const [, setPage] = useState(1)
  const [, setSelectedIds] = useState<Set<string>>(new Set())
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [lifecycleLoading, setLifecycleLoading] = useState(false)

  const handleStartElection = async (note: string) => {
    if (!id) return
    setLifecycleLoading(true)
    setHeaderError(null)
    try {
      await electionService.startElection(id, note)
      setShowStartModal(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : 'Failed to start election')
    } finally {
      setLifecycleLoading(false)
    }
  }

  const handleEndElection = async (note: string) => {
    if (!id) return
    setLifecycleLoading(true)
    setHeaderError(null)
    try {
      await electionService.stopElection(id, note)
      setShowEndModal(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : 'Failed to end election')
    } finally {
      setLifecycleLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!id || archiving) return
    setArchiving(true)
    setHeaderError(null)
    try {
      await electionService.archiveElection(id)
      navigate(ROUTES.ORG.EVENTS)
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : 'Failed to archive event')
    } finally {
      setArchiving(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    eventService.fetchEventDetail(id)
      .then(setEventData)
      .catch((err) => setError(err?.message || 'Failed to load event'))
      .finally(() => setLoading(false))
  }, [id, reloadKey])

  // Auto-refresh the event detail so the org console reacts to scheduled
  // lifecycle transitions and registration/voting counts (the backend remains
  // the source of truth; this only updates the view).
  usePolling(async () => {
    if (!id) return
    // Lightweight poll: skip the full voter roster (RegistrationTab polls the
    // summary endpoint for live counts). Merge the fresh data over the current
    // state so a roster-skipped refresh never wipes the participant list the
    // table and the publishing readiness check derive from. The 90s roster
    // poll below refreshes the full roster.
    const fresh = await eventService.fetchEventDetail(id, { skipVoters: true })
    setEventData((prev) => (prev ? { ...fresh, participants: prev.participants } : fresh))
  }, 30000, Boolean(id))

  // Slower roster poll: refresh the full participant list so newly registered
  // voters appear in the Participants/Registration tabs without a manual page
  // reload, while the 30s poll above keeps lifecycle state fresh. The roster
  // can be large, hence the longer interval.
  usePolling(async () => {
    if (!id) return
    try {
      const roster = await eventService.fetchVoters(id)
      setEventData((prev) => (prev ? { ...prev, participants: roster } : prev))
    } catch {
      // A transient roster poll failure must not take the page down; the next
      // tick retries.
    }
  }, 90000, Boolean(id))

  // Draft events redirect to the create wizard to continue where they left off
  useEffect(() => {
    if (eventData && toEventStatus(eventData.event.status) === 'draft' && eventData.event.id) {
      navigate(`${ROUTES.ORG.CREATE_EVENT}?draft=${eventData.event.id}`, { replace: true })
    }
  }, [eventData, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (error || !eventData) {
    const notFound = /not found/i.test(error ?? '')
    return (
      <>
      <SeoHead meta={{ title: "Event Not Found — Organization | ORIVIS", noindex: true }} />
      <div className="flex items-center justify-center min-h-[60vh]">
        {notFound ? (
          <div className="text-center max-w-sm px-6">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center bg-status-warning/10 border border-status-warning/20">
              <AlertTriangle size={24} className="text-status-warning" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-brand-text-primary">Event Not Found</h3>
            <p className="mt-1 text-sm text-brand-text-muted max-w-sm">
              {error || "The event you're looking for doesn't exist or has been removed."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/org/events')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary transition-colors cursor-pointer"
              >
                Back to Events
              </button>
              <button
                onClick={() => navigate('/org/events/create')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--org-primary)' }}
              >
                Create Event
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="Something Went Wrong"
            description={error || "Failed to load the event. Please try again."}
            action={{ label: 'Back to Events', onClick: () => navigate('/org/events') }}
          />
        )}
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
      phone: null,
      photoUrl: c.photoUrl,
      party: c.party,
      partyLogoUrl: c.partyLogoUrl,
      campaignImageUrl: c.campaignImageUrl,
      slogan: c.slogan,
      manifesto: c.manifesto,
      manifestoUrl: null,
      candidateCode: c.candidateCode,
      biography: c.biography,
      status: (c.status as EventCandidate['status']) ?? 'pending',
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
    organizationId: rawEvent.organizationId ?? '',
    department: p.department,
    registrationStatus: p.registrationStatus as EventParticipant['registrationStatus'],
    verificationStatus: p.verificationStatus as EventParticipant['verificationStatus'],
    votingPassStatus: p.votingPassStatus as EventParticipant['votingPassStatus'],
    votingPassId: null,
    registeredAt: p.registeredAt,
    verifiedAt: null,
    fields: p.fields ?? {},
  }))

  const activities: TimelineActivity[] = rawActivities.map((a) => ({
    id: a.id,
    action: a.action,
    description: a.description,
    timestamp: a.timestamp,
    type: a.type as TimelineActivity['type'],
    user: a.user,
  }))

  const event = mapElectionToOrivis(rawEvent, positions, participants)
  const registration: EventRegistration | null = eventData.registrationSettings
    ? {
        id: id ?? '',
        eventId: id ?? '',
        isOpen: eventData.registrationSettings.registration_enabled,
        eligibilityRules: [],
        verificationMethods: [eventData.registrationSettings.verification_method ?? 'otp'],
        autoApprove: (eventData.registrationSettings.verification_method as string) === 'none',
        maxParticipants: event.maxVoters ?? 0,
        currentRegistrations: rawEvent.registeredCount ?? participants.length,
        passSettings: {
          expiresInHours: 24,
          singleUse: true,
        },
      }
    : null
  const analytics: EventAnalytics | null = null

  // Count of candidates occupying slots (approved or published), matching the
  // backend's slot accounting so the Settings tab shows real usage.
  const approvedCandidateCount = positions
    .flatMap((p) => p.candidates)
    .filter((c) => c.status === 'approved' || c.status === 'published').length

  const isDraft = event.status === 'draft'
  const canEdit = isDraft || event.status === 'ready' || event.status === 'created'
  const isPublic = event.status === 'published' || event.status === 'live'
  const isLive = event.status === 'live' || event.status === 'ended'
  const isPublished = event.status === 'published'
  const publicUrl = rawEvent.slug ? `${window.location.origin}/elections/${rawEvent.slug}` : null

  // A pre-publish event with a scheduled publish time displays as "Scheduled"
  // (the backend keeps its lifecycle state until the scheduler flips it to
  // PUBLISHED). All internal lifecycle logic keys off the real status.
  const displayStatus = (event.status === 'created' || event.status === 'ready') && event.scheduledPublishAt
    ? 'scheduled'
    : event.status

  if (isDraft) return null

  // Tab visibility by lifecycle stage
  const visibleTabs = (() => {
    const noBrandSettings = TABS.filter((t) => !['branding', 'settings'].includes(t.id))
    const canViewParticipants = !permissionsLoaded || hasOrgPermission('participant.view')
    const filterParticipantTabs = (tabs: typeof TABS) =>
      tabs.filter((t) => t.id !== 'participants' || canViewParticipants)
    if (isLive) {
      // Live/ended: core operational tabs only
      return filterParticipantTabs(noBrandSettings.filter((t) => ['overview', 'timeline', 'registration', 'candidates', 'participants', 'audit', 'results'].includes(t.id)))
    }
    if (isPublished) {
      // Published but not yet live: everything except publishing (already done)
      return filterParticipantTabs(noBrandSettings.filter((t) => t.id !== 'publishing'))
    }
    // Created (draft finalized): full setup surface.
    // Configuration tabs (Settings + Branding) are only available before publication;
    // the pre-publication "Registration" tab is removed — registration is configured
    // via Settings (timing) and participants, then monitored on the Registration tab
    // only after the election is published.
    return filterParticipantTabs(TABS.filter((t) => ['overview', 'timeline', 'candidates', 'participants', 'branding', 'settings', 'publishing'].includes(t.id)))
  })()

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
            <div className="flex items-center gap-2 text-[10px] text-brand-text-muted mb-0.5">
              <button onClick={() => navigate('/org/events')} className="hover:underline">Events</button>
              <span>/</span>
              <span className="truncate text-brand-text-primary">{event.title}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-brand-text-primary truncate">
              {event.title}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <EventStatusBadge status={displayStatus} size="md" />
          {isPublic && publicUrl && (
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive max-w-[220px]"
              title="View election link & QR code"
            >
              <Globe size={12} />
              <span className="truncate">Election URL</span>
            </button>
          )}
          {event.settings.liveResults && (
            <motion.button
              onClick={() => navigate(ROUTES.ORG.EVENT_RESULTS(event.id))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-white"
              style={{ backgroundColor: pColor }}
            >
              <BarChart3 size={12} />
              Live Results
            </motion.button>
          )}
          {event.status === 'published' && (
            <motion.button
              onClick={() => setShowStartModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-white bg-status-success"
            >
              <Play size={12} />
              Start Event
            </motion.button>
          )}
          {event.status === 'live' && (
            <motion.button
              onClick={() => setShowEndModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-white bg-status-danger"
            >
              <Square size={12} />
              End Event
            </motion.button>
          )}
          {event.status === 'ready' && (
            <motion.button
              onClick={() => navigate(ROUTES.ORG.EDIT_EVENT(event.id))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
            >
              <Edit3 size={12} />
              Edit
            </motion.button>
          )}
          {event.status === 'ended' && (
            <motion.button
              onClick={handleArchive}
              disabled={archiving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-50"
            >
              {archiving ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
              Archive
            </motion.button>
          )}
        </div>
      </div>

      {headerError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20">
          <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
          <p className="text-xs text-status-error font-medium">{headerError}</p>
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-1 bg-brand-surface-elevated rounded-xl p-1">
        {visibleTabs.map((t) => {
          const TabIcon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); setSelectedIds(new Set()) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
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
          {tab === 'overview' && <OverviewTab event={event} activities={activities} analytics={analytics} statusOverride={displayStatus} />}
          {tab === 'timeline' && <TimelineTab activities={activities} />}
          {tab === 'registration' && <RegistrationTab event={event} registration={registration} participants={participants} registrationSettings={eventData.registrationSettings} locked={!canEdit} onDataChanged={() => setReloadKey((k) => k + 1)} />}
          {tab === 'candidates' && <CandidatesTab event={event} positions={positions} locked={!canEdit} onDataChanged={() => setReloadKey((k) => k + 1)} />}
          {tab === 'participants' && <ParticipantsTab event={event} participants={participants} registrationSettings={eventData.registrationSettings} locked={isLive} onDataChanged={() => { setTab('participants'); setReloadKey((k) => k + 1) }} />}
          {tab === 'branding' && <BrandingTab event={event} locked={!canEdit} saveSuccess={saveSuccess} setSaveSuccess={setSaveSuccess} />}
          {tab === 'settings' && <SettingsTab event={event} locked={!canEdit} saveSuccess={saveSuccess} setSaveSuccess={setSaveSuccess} candidateApprovedCount={approvedCandidateCount} onDataChanged={() => setReloadKey((k) => k + 1)} />}
          {tab === 'analytics' && <AnalyticsTab event={event} analytics={analytics} />}
          {tab === 'audit' && <AuditTab event={event} />}
          {tab === 'results' && <ResultsTab event={event} positions={positions} />}
          {tab === 'permissions' && <PermissionsTab event={event} />}
          {tab === 'communication' && <CommunicationTab event={event} />}
          {tab === 'publishing' && <PublishingTab event={event} publicUrl={publicUrl} onShowQrModal={() => setShowQrModal(true)} onDataChanged={() => setReloadKey((k) => k + 1)} />}
        </motion.div>
      </AnimatePresence>

      <QrCodeModal open={showQrModal} onClose={() => setShowQrModal(false)} url={publicUrl ?? ''} />
      <AuditNoteModal
        open={showStartModal}
        title="Start Election"
        description="This will immediately open voting for all registered participants. This action is audited."
        confirmLabel="Start Election"
        confirmColor="var(--color-status-success)"
        loading={lifecycleLoading}
        onConfirm={handleStartElection}
        onClose={() => setShowStartModal(false)}
      />
      <AuditNoteModal
        open={showEndModal}
        title="End Election"
        description="This will immediately close voting. No further votes will be accepted. This action is audited."
        confirmLabel="End Election"
        confirmColor="var(--color-status-danger)"
        loading={lifecycleLoading}
        onConfirm={handleEndElection}
        onClose={() => setShowEndModal(false)}
      />
    </div>
  )
}