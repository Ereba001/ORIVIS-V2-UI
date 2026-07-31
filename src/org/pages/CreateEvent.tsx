import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Vote, Award, BarChart3, ClipboardList, ArrowLeft, ArrowRight,
  Check, Globe, Eye, EyeOff, Users, Sparkles, Palette, Building2,
  ChevronDown, ChevronUp, Settings, AlertCircle,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import RegistrationConfigSection, { createDefaultRegSettings } from '../components/RegistrationConfigSection'
import { electionService } from '../../services/election-service'
import SeoHead from "../../components/SeoHead"
import type { EventType } from '../types'
import type { RegistrationSettings } from '../../types/registration'

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

const STEP_LABELS = [
  'Choose Event Type',
  'Event Details',
  'Branding',
  'Review & Create',
]

const EVENT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Vote, Award, BarChart3, ClipboardList, Users, Building2, Sparkles, Globe,
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
  primaryColor: string
  accentColor: string
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
  primaryColor: '#FCA311',
  accentColor: '#3B82F6',
  theme: 'dark',
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [form, setForm] = useState<EventForm>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRegConfig, setShowRegConfig] = useState(false)
  const [regConfig, setRegConfig] = useState<RegistrationSettings>(createDefaultRegSettings())

  const selectedOption = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1)
    setStep(s)
  }

  const canGoNext = () => {
    if (step === 1) return eventType !== null
    if (step === 2) {
      return (
        form.title.trim() &&
        form.description.trim() &&
        form.startDate &&
        form.endDate &&
        form.startTime &&
        form.endTime &&
        form.registrationStartDate &&
        form.registrationEndDate
      )
    }
    if (step === 3) return true
    return false
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        title: form.title,
        type: eventType,
        description: form.description,
        startsAt: `${form.startDate}T${form.startTime}:00`,
        endsAt: `${form.endDate}T${form.endTime}:00`,
        registrationStartsAt: `${form.registrationStartDate}T00:00:00`,
        registrationEndsAt: `${form.registrationEndDate}T23:59:59`,
        timezone: form.timezone,
        visibility: form.visibility,
        branding: {
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
          theme: form.theme,
        },
        settings: {
          registration_enabled: regConfig.registration_enabled,
          registration_required: regConfig.registration_required,
          verification_method: regConfig.verification_method,
          pass_required: regConfig.pass_required,
        },
        registrationSettings: regConfig,
      }
      await electionService.createElection(payload)
      navigate('/org/events')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 80, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d: number) => ({ opacity: 0, x: d * -80, filter: 'blur(4px)' }),
  }

  const updateField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
    <SeoHead meta={{ title: "Create Event — Organization | ORIVIS", noindex: true }} />
    <div className="max-w-[900px] mx-auto pb-12 space-y-6">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${branding.primaryColor}18` }}>
              <Sparkles size={28} style={{ color: branding.primaryColor }} className="animate-pulse" />
            </div>
            <p className="text-sm font-bold text-brand-text-primary">Creating Event...</p>
            <p className="text-xs text-brand-text-muted mt-1">Your event is being created as a draft.</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20">
          <AlertCircle size={16} className="text-status-error shrink-0 mt-0.5" />
          <p className="text-xs text-status-error font-medium">{submitError}</p>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary">
            Create Event
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Step {step} of 4 — {STEP_LABELS[step - 1]}
          </p>
        </div>
        <button
          onClick={() => navigate('/org/events')}
          className="text-[10px] font-mono font-semibold hover:underline transition-colors"
          style={{ color: branding.primaryColor }}
        >
          Cancel
        </button>
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1
          const isActive = idx === step
          const isDone = idx < step
          return (
            <div key={idx} className="flex items-center gap-0.5 min-w-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
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
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-brand-text-primary mb-1">
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
                      onClick={() => setEventType(opt.value)}
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
                        >
                          <Check size={11} className="text-white" />
                        </motion.div>
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canGoNext() ? branding.primaryColor : 'var(--color-brand-surface)',
                    color: canGoNext() ? '#FFFFFF' : 'var(--color-brand-text-disabled)',
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
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-brand-text-primary mb-5">
                Event Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Students' Union Presidential Election 2026"
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe the purpose and scope of this event"
                    rows={3}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateField('startTime', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Registration Window
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono text-brand-text-muted mb-1 block">
                        Registration Start
                      </label>
                      <input
                        type="date"
                        value={form.registrationStartDate}
                        onChange={(e) => updateField('registrationStartDate', e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-brand-text-muted mb-1 block">
                        Registration End
                      </label>
                      <input
                        type="date"
                        value={form.registrationEndDate}
                        onChange={(e) => updateField('registrationEndDate', e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
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
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">
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
                            onChange={setRegConfig}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Timezone
                  </label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
                    <select
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
                      <p className="text-[9px] font-mono text-brand-text-muted">
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canGoNext() ? branding.primaryColor : 'var(--color-brand-surface)',
                    color: canGoNext() ? '#FFFFFF' : 'var(--color-brand-text-disabled)',
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
                <h2 className="text-sm font-display font-bold uppercase tracking-tight text-brand-text-primary">
                  Event Branding
                </h2>
              </div>
              <p className="text-[11px] text-brand-text-muted mb-5">
                Customize how your event looks to participants.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer"
                    />
                    <div className="flex-1 h-10 rounded-xl border border-brand-border flex items-center px-3"
                      style={{ backgroundColor: form.primaryColor + '20', borderColor: form.primaryColor + '40' }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: form.primaryColor }}>{form.primaryColor}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-brand-border bg-transparent cursor-pointer"
                    />
                    <div className="flex-1 h-10 rounded-xl border border-brand-border flex items-center px-3"
                      style={{ backgroundColor: form.accentColor + '20', borderColor: form.accentColor + '40' }}>
                      <span className="text-[10px] font-mono font-bold" style={{ color: form.accentColor }}>{form.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-1.5 block">
                  Theme
                </label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateField('theme', t)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        form.theme === t
                          ? 'shadow-sm text-white'
                          : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive'
                      }`}
                      style={{
                        backgroundColor: form.theme === t ? branding.primaryColor : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl border border-brand-border bg-brand-surface/50">
                <p className="text-[9px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: form.primaryColor }}>
                    {selectedOption?.label?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-text-primary">{form.title || 'Event Title'}</p>
                    <p className="text-[9px] text-brand-text-muted">Theme: {form.theme} · {form.primaryColor} / {form.accentColor}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <motion.button
                  type="button"
                  onClick={() => goTo(4)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md"
                  style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}
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
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-brand-text-primary mb-5">
                Review & Create
              </h2>

              <div className="space-y-4">
                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-3">Event Type</h3>
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
                  <h3 className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-3">Event Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    <span className="text-brand-text-muted">Title:</span>
                    <span className="text-brand-text-primary font-semibold">{form.title}</span>
                    <span className="text-brand-text-muted">Visibility:</span>
                    <span className="text-brand-text-primary font-semibold capitalize">{form.visibility}</span>
                    <span className="text-brand-text-muted">Start:</span>
                    <span className="text-brand-text-primary font-semibold">{form.startDate} at {form.startTime}</span>
                    <span className="text-brand-text-muted">End:</span>
                    <span className="text-brand-text-primary font-semibold">{form.endDate} at {form.endTime}</span>
                    <span className="text-brand-text-muted">Timezone:</span>
                    <span className="text-brand-text-primary font-semibold">{form.timezone}</span>
                  </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-3">Branding</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: form.primaryColor }} />
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: form.accentColor }} />
                    </div>
                    <span className="text-[10px] text-brand-text-muted">
                      {form.primaryColor} / {form.accentColor} · {form.theme} theme
                    </span>
                  </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <h3 className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider mb-3">Registration Configuration</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    <span className="text-brand-text-muted">Enabled:</span>
                    <span className="text-brand-text-primary font-semibold">{regConfig.registration_enabled ? 'Yes' : 'No'}</span>
                    <span className="text-brand-text-muted">Required to Vote:</span>
                    <span className="text-brand-text-primary font-semibold">{regConfig.registration_required ? 'Yes' : 'No'}</span>
                    <span className="text-brand-text-muted">Lookup Fields:</span>
                    <span className="text-brand-text-primary font-semibold">{regConfig.lookup_fields.join(', ')}</span>
                    <span className="text-brand-text-muted">Verification:</span>
                    <span className="text-brand-text-primary font-semibold capitalize">{regConfig.verification_method}</span>
                    <span className="text-brand-text-muted">Voting Pass:</span>
                    <span className="text-brand-text-primary font-semibold">{regConfig.pass_required ? 'Required' : 'Not Required'}</span>
                  </div>
                </div>

                <div className="bg-status-info/5 border border-status-info/20 rounded-xl p-3">
                  <p className="text-[10px] text-status-info">
                    Your event will be created as a <strong>Draft</strong>. You can configure candidates, participants, and settings before publishing.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="w-1/3 bg-brand-surface border border-brand-border hover:bg-brand-surface-interactive text-brand-text-primary rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  Edit
                </button>
                <motion.button
                  type="button"
                  onClick={handleCreate}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-2/3 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md"
                  style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}
                >
                  Create Draft
                  <Check size={13} />
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
