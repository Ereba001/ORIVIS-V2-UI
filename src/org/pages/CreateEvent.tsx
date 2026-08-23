import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Vote, Award, BarChart3, ClipboardList, ArrowLeft, ArrowRight,
  Check, Globe, Eye, EyeOff, Users, Sparkles, Palette, Building2,
  ChevronDown, ChevronUp, Settings, AlertCircle, Lightbulb, Loader2, Clock,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import RegistrationConfigSection, {
  createDefaultRegSettings, resolveLookupFields, getOrgCategory,
  type OrgCategory,
} from '../components/RegistrationConfigSection'
import MediaPicker from '../../components/MediaPicker'
import type { MediaSource } from '../../components/MediaPicker'
import { getApiClient } from '../../lib/api-client'
import { formatMoney } from '../../lib/currency'
import { electionService } from '../../services/election-service'
import { billingService } from '../../services/billing-service'
import type { BillingQuote } from '../../types/billing'
import SeoHead from "../../components/SeoHead"
import { ROUTES } from '../../constants/routes'

import type { EventType } from '../types'
import type { RegistrationSettings, VoterLookupField } from '../../types/registration'

const EVENT_TYPE_OPTIONS = [
  { value: 'governance_election' as const, label: 'Governance Election', description: 'Elect representatives or decide on leadership positions with secure, verifiable voting.', icon: 'Vote' },
  { value: 'award_competition' as const, label: 'Award Competition', description: 'Run awards, competitions, and talent shows with judging, nominations, and public voting.', icon: 'Award' },
  { value: 'poll' as const, label: 'Poll', description: 'Quick opinion polls, feedback collection, or straw votes with instant results.', icon: 'BarChart3' },
  { value: 'survey' as const, label: 'Survey', description: 'Comprehensive surveys with multiple question types and detailed analytics.', icon: 'ClipboardList' },
  { value: 'referendum' as const, label: 'Referendum', description: 'Let members vote directly on specific policy questions or constitutional amendments.', icon: 'Vote' },
  { value: 'agm' as const, label: 'Annual General Meeting', description: 'Manage AGM proceedings including resolutions, board elections, and member voting.', icon: 'Award' },
  { value: 'recruitment' as const, label: 'Recruitment', description: 'Screen and select candidates through structured evaluation and voting workflows.', icon: 'Users' },
  { value: 'general_meeting' as const, label: 'General Meeting', description: 'A general meeting for organizational discussions, resolutions, and member voting.', icon: 'Users' },
  { value: 'custom' as const, label: 'Custom Event', description: 'Define a custom event type with flexible configuration options.', icon: 'ClipboardList' },
]

// Map backend election types to frontend event types
const ELECTION_TYPE_MAP: Record<string, string> = {
  ELECTION: 'governance_election',
  APPROVAL: 'poll',
  CONSULTATION: 'survey',
  REFERENDUM: 'referendum',
  SURVEY: 'survey',
}

const STEP_LABELS = [
  'Choose Event Type',
  'Event Details',
  'Branding',
  'Review & Create',
]

const TITLE_PLACEHOLDERS: Record<OrgCategory, string> = {
  university: "e.g. Students' Union Presidential Election 2026",
  corporate: 'e.g. Annual General Meeting 2026 — Board of Directors Election',
  ngo: 'e.g. Board of Trustees Election 2026',
  government: 'e.g. Constituency Council Election 2026',
  general: 'e.g. Organization Leadership Election 2026',
}

const BASE_TIPS = [
  'Publish your event first, then open registration so voters can verify before voting opens.',
  "Keep the voting window aligned with your members' availability; evenings and weekends work best.",
  'Define positions and approve candidates before publishing to avoid last-minute changes.',
]

const CATEGORY_TIPS: Record<OrgCategory, string> = {
  university: 'Use Student ID as the lookup field so students can self-verify instantly.',
  corporate: 'Use Employee ID as the lookup field so staff can self-verify instantly.',
  ngo: 'Use Membership Number as the lookup field so members can self-verify instantly.',
  government: 'Use Voter ID as the lookup field so voters can self-verify instantly.',
  general: 'Choose a lookup field your members already know, like email or phone, for fast verification.',
}

const EVENT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Vote, Award, BarChart3, ClipboardList, Users, Building2, Sparkles, Globe,
}

function formatDuration(startIso: string, endIso: string): string | null {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  const diffMs = end - start
  const totalMins = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMins / 1440)
  const hrs = Math.floor((totalMins % 1440) / 60)
  const mins = totalMins % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hrs > 0) parts.push(`${hrs}h`)
  if (mins > 0) parts.push(`${mins}m`)
  return parts.length > 0 ? parts.join(' ') : null
}

const TIMEZONES = [
  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Africa/Johannesburg',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

interface EventForm {
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  registrationStartDate: string
  registrationEndDate: string
  timezone: string
  visibility: 'public' | 'private'
  candidateSlots: string
  isMultiParty: boolean
  banner: MediaSource | null
  theme: 'light' | 'dark' | 'system'
}

const defaultForm: EventForm = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '18:00',
  registrationStartDate: '',
  registrationEndDate: '',
  timezone: 'Africa/Lagos',
  visibility: 'public',
  candidateSlots: '',
  isMultiParty: false,
  banner: null,
  theme: 'dark',
}

function toLocalDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLocalTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function defaultRegStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function defaultRegEnd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { branding } = useOrgBranding()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [eventType, setEventType] = useState<EventType | null>(() => {
    const type = searchParams.get('type')
    return EVENT_TYPE_OPTIONS.some((o) => o.value === type) ? (type as EventType) : null
  })
  const [form, setForm] = useState<EventForm>(() => {
    const title = searchParams.get('title')
    const base = title ? { ...defaultForm, title } : defaultForm
    // Registration is enabled by default; pre-fill the window (now → +7 days)
    // so a new event opens for registration immediately without an extra step.
    // Drafts are pre-filled by the resume effect below instead.
    return searchParams.get('draft')
      ? base
      : { ...base, registrationStartDate: defaultRegStart(), registrationEndDate: defaultRegEnd() }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRegConfig, setShowRegConfig] = useState(false)
  const [estimatedVoters, setEstimatedVoters] = useState(0)
  const [pricingQuote, setPricingQuote] = useState<BillingQuote | null>(null)
  const [quoteFreeAvailable, setQuoteFreeAvailable] = useState(true)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const category = getOrgCategory(branding.organizationType, branding.organizationContext)
  const lastCategoryRef = useRef<OrgCategory | null>(null)
  const [regConfig, setRegConfig] = useState<RegistrationSettings>(() => createDefaultRegSettings(category))
  const [draftId, setDraftId] = useState<string | null>(() => searchParams.get('draft'))
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInteracted = useRef(false)

  // Resume draft: fetch existing draft data and pre-fill the form
  useEffect(() => {
    const draftParam = searchParams.get('draft')
    if (!draftParam) return
    let active = true
    setLoadingDraft(true)
    electionService.getElection(draftParam)
      .then(async (election) => {
        if (!active) return
        // Pre-fill form from draft
        setForm({
          title: election.title ?? '',
          description: election.description ?? '',
          startDate: toLocalDate(election.startsAt),
          endDate: toLocalDate(election.endsAt),
          startTime: toLocalTime(election.startsAt) || '08:00',
          endTime: toLocalTime(election.endsAt) || '18:00',
          registrationStartDate: toLocalDateTime(election.registrationStartsAt),
          registrationEndDate: toLocalDateTime(election.registrationEndsAt),
          timezone: election.timezone ?? 'Africa/Lagos',
          visibility: election.visibility === 'private' ? 'private' : 'public',
          candidateSlots: election.candidateSlots != null ? String(election.candidateSlots) : '',
          isMultiParty: election.isMultiParty ?? false,
          banner: election.bannerUrl ? { type: 'url', url: election.bannerUrl } : null,
          theme: 'dark',
        })
        // Pre-fill event type
        if (election.type) {
          const mapped = ELECTION_TYPE_MAP[election.type]
          if (mapped && EVENT_TYPE_OPTIONS.some((o) => o.value === mapped)) {
            setEventType(mapped as EventType)
          }
        }
        // Load registration settings from backend
        try {
          const regSettings = await electionService.getRegistrationSettings(draftParam)
          if (regSettings && active) {
            setRegConfig({
              registration_enabled: regSettings.registration_enabled ?? true,
              registration_required: regSettings.registration_required ?? true,
              registration_message: regSettings.registration_message ?? null,
              lookup_fields: regSettings.lookup_fields ?? [],
              verification_method: (regSettings.verification_method as RegistrationSettings['verification_method']) ?? 'otp',
              pass_required: regSettings.pass_required ?? true,
              custom_lookup_fields: regSettings.custom_lookup_fields ?? [],
            })
          }
        } catch {
          // Registration settings not found — use defaults
        }
        hasInteracted.current = true
      })
      .catch(() => {
        // Draft not found — continue with empty form
      })
      .finally(() => {
        if (active) setLoadingDraft(false)
      })
    return () => { active = false }
  }, [searchParams])

  useEffect(() => {
    if (lastCategoryRef.current !== null && lastCategoryRef.current !== category) {
      setRegConfig(createDefaultRegSettings(category))
    }
    lastCategoryRef.current = category
  }, [category])

  const buildDraftPayload = useCallback(() => {
    const payload: Record<string, unknown> = {}
    if (form.title) payload.title = form.title
    if (eventType) payload.type = eventType
    if (form.description) payload.description = form.description
    if (form.candidateSlots) payload.candidateSlots = Number(form.candidateSlots)
    if (form.isMultiParty) payload.isMultiParty = form.isMultiParty
    if (estimatedVoters > 0) payload.estimatedParticipants = estimatedVoters
    if (form.startDate && form.startTime) payload.votingStartsAt = `${form.startDate}T${form.startTime}:00`
    if (form.endDate && form.endTime) payload.votingEndsAt = `${form.endDate}T${form.endTime}:00`
    if (form.registrationStartDate) payload.registrationStartsAt = form.registrationStartDate
    if (form.registrationEndDate) payload.registrationEndsAt = form.registrationEndDate
    if (form.timezone) payload.timezone = form.timezone
    if (form.visibility) payload.visibility = form.visibility
    if (form.banner?.type === 'url' && form.banner.url) payload.bannerUrl = form.banner.url
    payload.theme = form.theme
    return payload
  }, [form, eventType, estimatedVoters])

  const persistDraft = useCallback(async () => {
    if (!hasInteracted.current) return
    try { getApiClient() } catch { return }
    const hasContent = form.title?.trim() || eventType
    if (!hasContent) return
    try {
      const payload = buildDraftPayload()
      let savedId = draftId
      if (savedId) {
        await electionService.updateDraft(savedId, payload)
      } else {
        const created = await electionService.saveDraft(payload)
        savedId = created.id
        setDraftId(created.id)
      }
      // Save registration settings separately (backend requires a separate call)
      if (savedId) {
        const regPayload: RegistrationSettings = {
          ...regConfig,
          lookup_fields: resolveLookupFields(regConfig) as VoterLookupField[],
        }
        await electionService.saveRegistrationSettings(savedId, regPayload)
      }
    } catch {
      // silent — auto-save is best-effort
    }
  }, [form, eventType, draftId, buildDraftPayload, regConfig])

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(persistDraft, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [form, eventType, regConfig, persistDraft])

  const selectedOption = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)
  const titlePlaceholder = TITLE_PLACEHOLDERS[category]
  const tips = [...BASE_TIPS, CATEGORY_TIPS[category]]

  // Live pricing preview from the authoritative per-tier billing quote endpoint.
  // A quote is a pure computation — no billing record is created — and its
  // amount/currency always come from the API (never hardcoded on the client).
  useEffect(() => {
    if (estimatedVoters <= 0) {
      setPricingQuote(null)
      setQuoteError(null)
      return
    }
    let active = true
    billingService
      .getQuote(estimatedVoters)
      .then((res) => {
        if (!active) return
        setPricingQuote(res.quote)
        setQuoteFreeAvailable(res.freeEntitlement.available)
        setQuoteError(null)
      })
      .catch((err) => {
        if (!active) return
        setPricingQuote(null)
        setQuoteError(err instanceof Error ? err.message : 'Pricing could not be loaded. Please try again.')
      })
    return () => {
      active = false
    }
  }, [estimatedVoters])

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1)
    setStep(s)
  }

  const canGoNext = () => {
    if (step === 1) return eventType !== null
    if (step === 2) {
      const regDatesOk = !regConfig.registration_enabled || (form.registrationStartDate && form.registrationEndDate)
      const slotsOk = form.candidateSlots === '' || Number(form.candidateSlots) >= 0
      return (
        form.title.trim() &&
        form.description.trim() &&
        form.startDate &&
        form.endDate &&
        form.startTime &&
        form.endTime &&
        regDatesOk &&
        slotsOk
      )
    }
    if (step === 3) return true
    return false
  }

  const CREATE_STEPS = [
    'Validating details...',
    'Creating election...',
    'Setting up registration...',
    'Finalizing...',
  ]

  const handleCreate = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    setCreateStep(0)
    await new Promise((r) => setTimeout(r, 600))
    try {
      const payload = {
        title: form.title,
        type: eventType,
        description: form.description,
        candidateSlots: form.candidateSlots ? Number(form.candidateSlots) : null,
        estimatedParticipants: estimatedVoters > 0 ? estimatedVoters : null,
        isMultiParty: form.isMultiParty,
        votingStartsAt: `${form.startDate}T${form.startTime}:00`,
        votingEndsAt: `${form.endDate}T${form.endTime}:00`,
        registrationStartsAt: form.registrationStartDate || null,
        registrationEndsAt: form.registrationEndDate || null,
        timezone: form.timezone,
        visibility: form.visibility,
        branding: {
          theme: form.theme,
          ...(form.banner?.type === 'url' ? { bannerUrl: form.banner.url } : {}),
        },
        settings: {
          registration_enabled: regConfig.registration_enabled,
          registration_required: regConfig.registration_required,
          verification_method: regConfig.verification_method,
          pass_required: regConfig.pass_required,
        },
        registrationSettings: {
          ...regConfig,
          lookup_fields: resolveLookupFields(regConfig) as RegistrationSettings['lookup_fields'],
        },
      }

      setCreateStep(1)
      await new Promise((r) => setTimeout(r, 400))
      const result = draftId
        ? await electionService.updateElection(draftId, { ...payload, status: 'created' })
        : await electionService.createElection({ ...payload, status: 'created' })

      setCreateStep(2)
      await new Promise((r) => setTimeout(r, 400))
      if (form.banner?.type === 'file') {
        const fd = new FormData()
        fd.append('file', form.banner.file)
        await electionService.uploadBanner(result.id, fd)
      }

      setCreateStep(3)
      await new Promise((r) => setTimeout(r, 600))
      setCreateSuccess(true)
      await new Promise((r) => setTimeout(r, 1200))
      navigate(ROUTES.ORG.EVENT_DETAIL(result.id), { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
      setCreateStep(0)
      setCreateSuccess(false)
    }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 80, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d: number) => ({ opacity: 0, x: d * -80, filter: 'blur(4px)' }),
  }

  const updateField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    hasInteracted.current = true
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: `${branding.primaryColor}18` }}>
            <Loader2 size={22} style={{ color: branding.primaryColor }} className="animate-spin" />
          </div>
          <p className="text-xs font-bold text-brand-text-primary">Loading draft...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <SeoHead meta={{ title: "Create Event — Organization | ORIVIS", noindex: true }} />
    <div className="max-w-[900px] mx-auto pb-12 space-y-6">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 text-center min-w-[280px]">
            {createSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-status-success/15 border border-status-success/30">
                  <Check size={28} className="text-status-success" />
                </div>
                <p className="text-sm font-bold text-brand-text-primary">Event Created Successfully</p>
                <p className="text-xs text-brand-text-muted mt-1">Redirecting to your event...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${branding.primaryColor}18` }}>
                  <Loader2 size={28} style={{ color: branding.primaryColor }} className="animate-spin" />
                </div>
                <p className="text-sm font-bold text-brand-text-primary">Setting Up Your Event</p>
                <div className="mt-4 space-y-2">
                  {CREATE_STEPS.map((label, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-left">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        i < createStep ? 'bg-status-success/15 text-status-success' :
                        i === createStep ? 'bg-brand-gold/15 text-brand-gold' :
                        'bg-brand-surface-elevated text-brand-text-muted/40'
                      }`}>
                        {i < createStep ? (
                          <Check size={10} />
                        ) : i === createStep ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <span className="text-[8px] font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-[11px] ${
                        i === createStep ? 'text-brand-text-primary font-medium' :
                        i < createStep ? 'text-brand-text-muted' :
                        'text-brand-text-muted/40'
                      }`}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20">
          <AlertCircle size={16} className="text-status-error shrink-0 mt-0.5" />
          <p className="text-xs text-status-error font-medium">{submitError}</p>
        </div>
      )}

      {searchParams.get('notice') === 'notfound' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-warning/10 border border-status-warning/20">
          <AlertCircle size={16} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-xs text-status-warning font-medium">
            The event you were looking for couldn&apos;t be found — it may not have been created yet. Set up
            your event below and you&apos;ll be taken straight to its setup page when it&apos;s ready.
          </p>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
            Create Event
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Step {step} of 4 — {STEP_LABELS[step - 1]}
          </p>
        </div>
        <button
          onClick={() => navigate('/org/events')}
          className="text-[10px] font-semibold hover:underline transition-colors"
          style={{ color: branding.primaryColor }}
        >
          Cancel
        </button>
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="flex items-center gap-0.5 flex-wrap pb-1">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1
          const isActive = idx === step
          const isDone = idx < step
          return (
            <div key={idx} className="flex items-center gap-0.5 min-w-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'shadow-sm'
                    : isDone
                    ? 'opacity-60'
                    : 'opacity-30'
                }`}
                style={{
                  backgroundColor: isActive ? `${branding.primaryColor}18` : 'transparent',
                  color: isActive ? branding.primaryColor : 'var(--color-brand-text-secondary)',
                  borderColor: isActive ? branding.primaryColor : 'transparent',
                  borderWidth: isActive ? 1 : 0,
                }}
              >
                {isDone ? (
                  <Check size={10} />
                ) : (
                  <span>{idx}</span>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {idx < 4 && (
                <div
                  className="w-6 h-px shrink-0"
                  style={{
                    backgroundColor: isDone
                      ? branding.primaryColor
                      : 'var(--color-brand-border, #2a2a3a)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ===== STEP CONTENT ===== */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ========== STEP 1: Choose Event Type ========== */}
          {step === 1 && (
            <DashboardCard hover={false}>
              <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-1">
                What type of event are you creating?
              </h2>
              <p className="text-[11px] text-brand-text-muted mb-5">
                Select the event type that best fits your needs
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EVENT_TYPE_OPTIONS.map((opt) => {
                  const Icon = EVENT_ICONS[opt.icon] || Vote
                  const isSelected = eventType === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => { hasInteracted.current = true; setEventType(opt.value) }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all ${
                        isSelected
                          ? 'glass-card'
                          : 'glass-card opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--org-primary)' : undefined,
                        borderWidth: isSelected ? 1.5 : 1,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: isSelected
                            ? `${branding.primaryColor}20`
                            : 'var(--color-brand-surface-elevated, #1e1e2e)',
                          color: isSelected ? branding.primaryColor : 'var(--color-brand-text-muted)',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-text-primary">{opt.label}</p>
                        <p className="text-[10px] text-brand-text-muted mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: branding.primaryColor }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
              <div className="flex justify-end mt-6">
                <motion.button
                  type="button"
                  onClick={() => goTo(2)}
                  disabled={!canGoNext()}
                  whileHover={canGoNext() ? { scale: 1.01 } : {}}
                  whileTap={canGoNext() ? { scale: 0.99 } : {}}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canGoNext() ? branding.primaryColor : 'var(--color-brand-surface)',
                    color: canGoNext() ? 'var(--color-brand-text-primary)' : 'var(--color-brand-text-disabled)',
                  }}
                >
                  Continue
                  <ArrowRight size={13} />
                </motion.button>
              </div>
            </DashboardCard>
          )}

          {/* ========== STEP 2: Event Details ========== */}
          {step === 2 && (
            <DashboardCard hover={false}>
              <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-5">
                Event Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="eventTitle" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                    Event Title
                  </label>
                  <input
                    name="title"
                    id="eventTitle"
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="eventDescription" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="eventDescription"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe the purpose and scope of this event"
                    rows={3}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                      Start Date
                    </label>
                    <input
                      name="startDate"
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                      End Date
                    </label>
                    <input
                      name="endDate"
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label htmlFor="startTime" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                      Start Time
                    </label>
                    <input
                      name="startTime"
                      id="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateField('startTime', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                      End Time
                    </label>
                    <input
                      name="endTime"
                      id="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
                {form.startDate && form.endDate && (() => {
                  const dur = formatDuration(
                    `${form.startDate}T${form.startTime || '00:00'}:00`,
                    `${form.endDate}T${form.endTime || '23:59'}:00`,
                  )
                  return dur ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider">
                      <Clock size={12} style={{ color: branding.primaryColor }} />
                      <span className="text-[10px] font-bold text-brand-text-primary">Voting Duration: {dur}</span>
                    </div>
                  ) : null
                })()}

                {/* REGISTRATION TOGGLE */}
                <div
                  className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                  style={{ backgroundColor: `${branding.primaryColor}08`, border: '1px solid var(--color-brand-border, #2a2a3a)' }}
                  onClick={() => { hasInteracted.current = true; setRegConfig((prev) => ({ ...prev, registration_enabled: !prev.registration_enabled })); if (!form.registrationStartDate) updateField('registrationStartDate', defaultRegStart()); if (!form.registrationEndDate) updateField('registrationEndDate', defaultRegEnd()) }}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={14} style={{ color: regConfig.registration_enabled ? branding.primaryColor : 'var(--color-brand-text-muted)' }} />
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">Registration</p>
                      <p className="text-[9px] text-brand-text-muted">
                        {regConfig.registration_enabled
                          ? 'Voters can register and verify before voting opens'
                          : 'Registration is disabled for this event'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                      regConfig.registration_enabled ? 'bg-status-success' : 'bg-brand-border'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        regConfig.registration_enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {regConfig.registration_enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-brand-text-muted mb-2">
                            Registration Window
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="registrationStart" className="text-[9px] text-brand-text-muted mb-1 block">
                                Registration Start
                              </label>
                              <input
                                name="registrationStart"
                                id="registrationStart"
                                type="datetime-local"
                                value={form.registrationStartDate}
                                onChange={(e) => updateField('registrationStartDate', e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                              />
                            </div>
                            <div>
                              <label htmlFor="registrationEnd" className="text-[9px] text-brand-text-muted mb-1 block">
                                Registration End
                              </label>
                              <input
                                name="registrationEnd"
                                id="registrationEnd"
                                type="datetime-local"
                                value={form.registrationEndDate}
                                onChange={(e) => updateField('registrationEndDate', e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                              />
                            </div>
                          </div>
                          {form.registrationStartDate && form.registrationEndDate && (() => {
                            const dur = formatDuration(
                              form.registrationStartDate,
                              form.registrationEndDate,
                            )
                            return dur ? (
                              <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider">
                                <Clock size={12} style={{ color: branding.primaryColor }} />
                                <span className="text-[10px] font-bold text-brand-text-primary">Registration Window: {dur}</span>
                              </div>
                            ) : null
                          })()}
                        </div>

                        {/* ADVANCED REGISTRATION CONFIG */}
                        <div className="border border-brand-divider rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowRegConfig(!showRegConfig)}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-surface-interactive transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Settings size={14} style={{ color: branding.primaryColor }} />
                              <span className="text-xs font-bold text-brand-text-primary">
                                Registration Configuration
                              </span>
                            </div>
                            {showRegConfig ? <ChevronUp size={14} className="text-brand-text-muted" /> : <ChevronDown size={14} className="text-brand-text-muted" />}
                          </button>
                          <AnimatePresence initial={false}>
                            {showRegConfig && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5">
                                  <RegistrationConfigSection
                                    config={regConfig}
                                    onChange={(v) => { hasInteracted.current = true; setRegConfig(v) }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="timezone" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                    Timezone
                  </label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
                    <select
                      name="timezone"
                      id="timezone"
                      value={form.timezone}
                      onChange={(e) => updateField('timezone', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors appearance-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="candidateSlots" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                      Candidate Slots
                    </label>
                    <input
                      name="candidateSlots"
                      id="candidateSlots"
                      type="number"
                      min={0}
                      max={1000}
                      value={form.candidateSlots}
                      onChange={(e) => updateField('candidateSlots', e.target.value)}
                      placeholder="Total cap for the whole election"
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors"
                    />
                    <p className="text-[9px] text-brand-text-muted mt-1">
                      Total cap across all positions. Leave empty for no limit.
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{ backgroundColor: `${branding.primaryColor}08`, border: '1px solid var(--color-brand-border, #2a2a3a)' }}
                    onClick={() => updateField('isMultiParty', !form.isMultiParty)}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 size={14} style={{ color: form.isMultiParty ? branding.primaryColor : 'var(--color-brand-text-muted)' }} />
                      <div>
                        <p className="text-xs font-semibold text-brand-text-primary">Multi-Party</p>
                        <p className="text-[9px] text-brand-text-muted">
                          {form.isMultiParty
                            ? 'Candidates can be grouped by party with logos'
                            : 'Candidates run as independents'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                        form.isMultiParty ? 'bg-status-success' : 'bg-brand-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          form.isMultiParty ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="estimatedVoters" className="text-[10px] font-bold text-brand-text-muted mb-1.5 block">
                    Estimated Voters
                  </label>
                  <input
                    name="estimatedVoters"
                    id="estimatedVoters"
                    type="number"
                    min={0}
                    value={estimatedVoters}
                    onChange={(e) => setEstimatedVoters(Math.max(0, Math.floor(Number(e.target.value))))}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors"
                  />
                  <p className="text-[9px] text-brand-text-muted mt-1">
                    Your event tier is based on the participant capacity selected during setup. If the final participant count exceeds the purchased capacity, an upgrade may be required.
                  </p>
                  <div className={`mt-2 p-3 rounded-xl ${pricingQuote?.is_free ? 'bg-status-success/5 border border-status-success/20' : 'bg-status-info/5 border border-status-info/20'}`}>
                    {quoteError ? (
                      <p className="text-[9px] font-bold text-status-danger">{quoteError}</p>
                    ) : estimatedVoters <= 0 ? (
                      <p className="text-[9px] text-status-info">
                        Pricing preview appears once you estimate your participant count. Your first eligible event is free; larger events are billed per-tier after you publish.
                      </p>
                    ) : pricingQuote?.is_free ? (
                      <>
                        <p className="text-[9px] font-bold text-status-success mb-0.5">
                          Free Event — up to {(pricingQuote.tier?.max_participants ?? estimatedVoters).toLocaleString('en-NG')} participants
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[9px] text-brand-text-muted line-through">
                            {formatMoney(pricingQuote.regular_amount ?? 0, pricingQuote.currency)}
                          </span>
                          <span className="text-[9px] font-bold text-status-success">100% discount</span>
                        </div>
                        <p className="text-[10px] font-bold text-status-success mt-0.5">
                          Final amount: {formatMoney(0, pricingQuote.currency)} — no payment required.
                        </p>
                        <p className="text-[9px] text-status-info mt-1">
                          {quoteFreeAvailable
                            ? `Your first eligible event with ${estimatedVoters.toLocaleString('en-NG')} participants is free.`
                            : 'This event is covered by your free-event entitlement. The next eligible event will be billed per-tier.'}
                        </p>
                      </>
                    ) : pricingQuote && pricingQuote.tier ? (
                      <>
                        <p className="text-[9px] font-bold text-brand-text-primary mb-0.5">
                          {pricingQuote.tier.name} tier — up to {pricingQuote.tier.max_participants.toLocaleString('en-NG')} participants
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px]">
                          <span className="text-brand-text-muted">Original: {formatMoney(pricingQuote.regular_amount ?? pricingQuote.amount, pricingQuote.currency)}</span>
                          {pricingQuote.regular_amount > pricingQuote.amount && (
                            <span className="text-status-success font-bold">Discount: {formatMoney(pricingQuote.regular_amount - pricingQuote.amount, pricingQuote.currency)}</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-brand-text-primary mt-0.5">
                          Payment required: {formatMoney(pricingQuote.amount, pricingQuote.currency)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[9px] text-status-info">
                        Your first eligible event is free. Larger events are billed per-tier after you publish.
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                  style={{ backgroundColor: `${branding.primaryColor}08`, border: '1px solid var(--color-brand-border, #2a2a3a)' }}
                  onClick={() => updateField('visibility', form.visibility === 'public' ? 'private' : 'public')}
                >
                  <div className="flex items-center gap-2.5">
                    {form.visibility === 'public' ? (
                      <Eye size={14} className="text-status-success" />
                    ) : (
                      <EyeOff size={14} className="text-brand-text-muted" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">
                        {form.visibility === 'public' ? 'Public' : 'Private'}
                      </p>
                      <p className="text-[9px] text-brand-text-muted">
                        {form.visibility === 'public'
                          ? 'Anyone can view and participate'
                          : 'Only invited participants'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      form.visibility === 'public' ? 'bg-status-success' : 'bg-brand-border'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.visibility === 'public' ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-status-info/5 border border-status-info/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={13} className="text-status-info" />
                    <p className="text-[10px] font-bold text-status-info">Tips for a smooth event</p>
                  </div>
                  <ul className="space-y-1.5">
                    {tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-[10px] text-status-info leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-status-info" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <motion.button
                  type="button"
                  onClick={() => goTo(3)}
                  disabled={!canGoNext()}
                  whileHover={canGoNext() ? { scale: 1.01 } : {}}
                  whileTap={canGoNext() ? { scale: 0.99 } : {}}
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canGoNext() ? branding.primaryColor : 'var(--color-brand-surface)',
                    color: canGoNext() ? 'var(--color-brand-text-primary)' : 'var(--color-brand-text-disabled)',
                  }}
                >
                  Continue
                  <ArrowRight size={13} />
                </motion.button>
              </div>
            </DashboardCard>
          )}

          {/* ========== STEP 3: Branding ========== */}
          {step === 3 && (
            <DashboardCard hover={false}>
              <div className="flex items-center gap-3 mb-5">
                <Palette size={18} style={{ color: branding.primaryColor }} />
                <h2 className="text-sm font-bold tracking-tight text-brand-text-primary">
                  Event Branding
                </h2>
              </div>
              <p className="text-[11px] text-brand-text-muted mb-5">
                Customize how your event looks to participants.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <MediaPicker
                    label="Banner"
                    accept=".jpg,.jpeg,.png,.webp"
                    hint="Recommended: 1200 x 300px, max 2MB. Supports file upload or image URL."
                    value={form.banner}
                    onChange={(source) => updateField('banner', source)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <motion.button
                  type="button"
                  onClick={() => goTo(4)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Review Event
                  <ArrowRight size={13} />
                </motion.button>
              </div>
            </DashboardCard>
          )}

          {/* ========== STEP 4: Review & Create ========== */}
          {step === 4 && (
            <DashboardCard hover={false}>
              <h2 className="text-sm font-bold tracking-tight text-brand-text-primary mb-5">
                Review & Create
              </h2>

              <div className="space-y-4">
                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-bold text-brand-text-muted mb-3">Event Type</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${branding.primaryColor}18`, color: branding.primaryColor }}>
                      {eventType && EVENT_ICONS[EVENT_TYPE_OPTIONS.find(o => o.value === eventType)?.icon || 'Vote'] && (
                        <span>{selectedOption?.label?.charAt(0) || 'E'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text-primary">{selectedOption?.label || 'Not selected'}</p>
                      <p className="text-[10px] text-brand-text-muted">{selectedOption?.description?.slice(0, 60)}...</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-bold text-brand-text-muted mb-3">Event Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    <span className="text-brand-text-muted">Title:</span>
                    <span className="text-brand-text-primary font-semibold">{form.title}</span>
                    <span className="text-brand-text-muted">Visibility:</span>
                    <span className="text-brand-text-primary font-semibold capitalize">{form.visibility}</span>
                    <span className="text-brand-text-muted">Candidate Slots:</span>
                    <span className="text-brand-text-primary font-semibold">{form.candidateSlots ? Number(form.candidateSlots).toLocaleString() : 'No limit'}</span>
                    <span className="text-brand-text-muted">Multi-Party:</span>
                    <span className="text-brand-text-primary font-semibold">{form.isMultiParty ? 'Yes' : 'No'}</span>
                    <span className="text-brand-text-muted">Start:</span>
                    <span className="text-brand-text-primary font-semibold">{form.startDate} at {form.startTime}</span>
                    <span className="text-brand-text-muted">End:</span>
                    <span className="text-brand-text-primary font-semibold">{form.endDate} at {form.endTime}</span>
                    <span className="text-brand-text-muted">Timezone:</span>
                    <span className="text-brand-text-primary font-semibold">{form.timezone}</span>
                  </div>
                  {form.startDate && form.endDate && (() => {
                    const dur = formatDuration(
                      `${form.startDate}T${form.startTime || '00:00'}:00`,
                      `${form.endDate}T${form.endTime || '23:59'}:00`,
                    )
                    return dur ? (
                      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider">
                        <Clock size={12} style={{ color: branding.primaryColor }} />
                        <span className="text-[10px] font-bold text-brand-text-primary">Voting Duration: {dur}</span>
                      </div>
                    ) : null
                  })()}
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-bold text-brand-text-muted mb-3">Registration Configuration</h3>
                  {regConfig.registration_enabled ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                        <span className="text-brand-text-muted">Enabled:</span>
                        <span className="text-brand-text-primary font-semibold">Yes</span>
                        <span className="text-brand-text-muted">Required to Vote:</span>
                        <span className="text-brand-text-primary font-semibold">{regConfig.registration_required ? 'Yes' : 'No'}</span>
                        <span className="text-brand-text-muted">Lookup Fields:</span>
                        <span className="text-brand-text-primary font-semibold">{resolveLookupFields(regConfig).join(', ')}</span>
                        <span className="text-brand-text-muted">Verification:</span>
                        <span className="text-brand-text-primary font-semibold capitalize">{regConfig.verification_method}</span>
                        <span className="text-brand-text-muted">Voting Pass:</span>
                        <span className="text-brand-text-primary font-semibold">{regConfig.pass_required ? 'Required' : 'Not Required'}</span>
                      </div>
                      {form.registrationStartDate && form.registrationEndDate && (() => {
                        const dur = formatDuration(
                          form.registrationStartDate,
                          form.registrationEndDate,
                        )
                        return dur ? (
                          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider">
                            <Clock size={12} style={{ color: branding.primaryColor }} />
                            <span className="text-[10px] font-bold text-brand-text-primary">Registration Window: {dur}</span>
                          </div>
                        ) : null
                      })()}
                    </>
                  ) : (
                    <p className="text-[10px] text-brand-text-muted">Registration: Disabled</p>
                  )}
                </div>

                <div className={`rounded-xl p-3 space-y-1 ${pricingQuote?.is_free ? 'bg-status-success/5 border border-status-success/20' : 'bg-status-info/5 border border-status-info/20'}`}>
                  <p className="text-[10px] text-status-info">
                    Your event will be created as a <strong>Draft</strong>. You can configure candidates, participants, and settings before publishing.
                  </p>
                  {pricingQuote?.is_free ? (
                    <p className="text-[10px] text-status-success">
                      <strong>Billing: FREE</strong> — {formatMoney(pricingQuote.regular_amount ?? 0, pricingQuote.currency)}{' '}
                      crossed out, 100% discount, final {formatMoney(0, pricingQuote.currency)}. No payment required.
                    </p>
                  ) : pricingQuote && pricingQuote.tier ? (
                    <p className="text-[10px] text-status-info">
                      <strong>Billing:</strong> {pricingQuote.tier.name} tier — {formatMoney(pricingQuote.amount, pricingQuote.currency)} required before publishing.
                    </p>
                  ) : (
                    <p className="text-[10px] text-status-info">
                      Billing is determined by your estimated voter count. Your first eligible event is free; larger events are billed per-tier.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  Edit
                </button>
                <motion.button
                  type="button"
                  onClick={handleCreate}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Create Event
                </motion.button>
              </div>
            </DashboardCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </>
  )
}
