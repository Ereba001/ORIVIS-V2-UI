import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft, Save, Loader2, AlertTriangle, Globe, Eye, EyeOff,
  Calendar, Building2, FileEdit,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import SeoHead from "../../components/SeoHead"
import { electionService } from '../../services/election-service'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { eventCategoryOptions } from '../constants/form'

const TIMEZONES = [
  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Africa/Johannesburg',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

function toLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Form {
  title: string
  description: string
  start: string
  end: string
  registrationStart: string
  registrationEnd: string
  timezone: string
  visibility: 'public' | 'private'
  category: string
  customCategory: string
  candidateSlots: string
  isMultiParty: boolean
  auditNote: string
}

export default function EditEvent() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const { activeOrganization } = useAuth()

  const categoryOptions = useMemo(
    () => eventCategoryOptions(branding.electionCategories),
    [branding.electionCategories],
  )

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<Form>({
    title: '',
    description: '',
    start: '',
    end: '',
    registrationStart: '',
    registrationEnd: '',
    timezone: 'UTC',
    visibility: 'public',
    category: 'university',
    customCategory: '',
    candidateSlots: '',
    isMultiParty: false,
    auditNote: '',
  })

  useEffect(() => {
    if (!id || !activeOrganization) return
    let active = true
    electionService.getElection(id)
      .then((election) => {
        if (!active) return
        setForm({
          title: election.title ?? '',
          description: election.description ?? '',
          start: toLocalDateTimeInput(election.startsAt ?? null),
          end: toLocalDateTimeInput(election.endsAt ?? null),
          registrationStart: toLocalDateTimeInput(election.registrationStartsAt ?? null),
          registrationEnd: toLocalDateTimeInput(election.registrationEndsAt ?? null),
          timezone: election.timezone ?? 'UTC',
          visibility: election.visibility === 'private' ? 'private' : 'public',
          category: election.customCategory ? 'custom' : election.category ?? 'university',
          customCategory: election.customCategory ?? '',
          candidateSlots: election.candidateSlots != null ? String(election.candidateSlots) : '',
          isMultiParty: election.isMultiParty ?? false,
          auditNote: '',
        })
      })
      .catch((err) => {
        if (!active) return
        const status = err?.response?.status ?? err?.status
        if (status === 404) setLoadError('Event not found')
        else if (status === 403) setLoadError('You do not have permission to view this event')
        else setLoadError(err instanceof Error ? err.message : 'Failed to load event')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, activeOrganization])

  const canSave = form.title.trim().length > 0 && form.start.length > 0 && form.end.length > 0 && form.auditNote.trim().length > 0

  const handleSave = async () => {
    if (!id || !canSave) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        timezone: form.timezone,
        visibility: form.visibility,
        category: form.category === 'custom' ? 'custom' : form.category,
        customCategory: form.category === 'custom' ? form.customCategory : null,
        candidateSlots: form.candidateSlots ? Number(form.candidateSlots) : null,
        isMultiParty: form.isMultiParty,
        votingStartsAt: form.start ? `${form.start}:00` : null,
        votingEndsAt: form.end ? `${form.end}:00` : null,
        registrationStartsAt: form.registrationStart ? `${form.registrationStart}:00` : null,
        registrationEndsAt: form.registrationEnd ? `${form.registrationEnd}:00` : null,
        auditNote: form.auditNote,
      }
      await electionService.updateElection(id, payload)
      setSaved(true)
      window.setTimeout(() => navigate(ROUTES.ORG.EVENT_DETAIL(id), { replace: true }), 700)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: pColor }} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center bg-status-warning/10 border border-status-warning/20">
            <AlertTriangle size={22} className="text-status-warning" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-brand-text-primary">Event Not Found</h3>
          <p className="mt-1 text-xs text-brand-text-muted">{loadError}</p>
          <button
            onClick={() => navigate(ROUTES.ORG.EVENTS)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: pColor }}
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled/50 outline-none focus:border-[var(--org-primary)] transition-colors [color-scheme:dark]"
  const labelClass = "text-[10px] font-bold text-brand-text-muted mb-1.5 block"

  return (
    <>
      <SeoHead meta={{ title: "Edit Event — Organization | ORIVIS", noindex: true }} />
      <div className="max-w-[900px] mx-auto pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(id ? ROUTES.ORG.EVENT_DETAIL(id) : ROUTES.ORG.EVENTS)}
              className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">Edit Event</h1>
              <p className="text-[10px] text-brand-text-muted mt-0.5">Update the details of this event</p>
            </div>
          </div>
          <motion.button
            onClick={handleSave}
            disabled={!canSave || saving || saved}
            whileHover={canSave ? { scale: 1.02 } : {}}
            whileTap={canSave ? { scale: 0.98 } : {}}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-40"
            style={{ backgroundColor: pColor }}
          >
            {saved ? null : <Save size={14} />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </motion.button>
        </div>

        {saveError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20">
            <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
            <p className="text-xs text-status-error font-medium">{saveError}</p>
          </div>
        )}

        <DashboardCard hover={false}>
          <div className="space-y-5">
            <div>
              <label htmlFor="editTitle" className={labelClass}>Event Title</label>
              <input
                name="title"
                id="editTitle"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="editDescription" className={labelClass}>Description</label>
              <textarea
                name="description"
                id="editDescription"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editStart" className={labelClass}>Voting Starts</label>
                <input
                  name="start"
                  id="editStart"
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="editEnd" className={labelClass}>Voting Ends</label>
                <input
                  name="end"
                  id="editEnd"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="editRegStart" className={labelClass}>Registration Starts</label>
                <input
                  name="registrationStart"
                  id="editRegStart"
                  type="datetime-local"
                  value={form.registrationStart}
                  onChange={(e) => setForm((f) => ({ ...f, registrationStart: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="editRegEnd" className={labelClass}>Registration Ends</label>
                <input
                  name="registrationEnd"
                  id="editRegEnd"
                  type="datetime-local"
                  value={form.registrationEnd}
                  onChange={(e) => setForm((f) => ({ ...f, registrationEnd: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editTimezone" className={labelClass}>Timezone</label>
                <div className="relative">
                  <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
                  <select
                    name="timezone"
                    id="editTimezone"
                    value={form.timezone}
                    onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                    className={`${inputClass} pl-9 appearance-none`}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Visibility</label>
                <div
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ backgroundColor: `${pColor}08`, border: '1px solid var(--color-brand-border, #2a2a3a)' }}
                  onClick={() => setForm((f) => ({ ...f, visibility: f.visibility === 'public' ? 'private' : 'public' }))}
                >
                  <div className="flex items-center gap-2.5">
                    {form.visibility === 'public' ? (
                      <Eye size={14} className="text-status-success" />
                    ) : (
                      <EyeOff size={14} className="text-brand-text-muted" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary capitalize">{form.visibility}</p>
                      <p className="text-[9px] text-brand-text-muted">
                        {form.visibility === 'public' ? 'Anyone can view and participate' : 'Only invited participants'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editCategory" className={labelClass}>Category</label>
                <select
                  name="category"
                  id="editCategory"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={`${inputClass} appearance-none`}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editCandidateSlots" className={labelClass}>Candidate Slots</label>
                <input
                  name="candidateSlots"
                  id="editCandidateSlots"
                  type="number"
                  min={0}
                  max={1000}
                  value={form.candidateSlots}
                  onChange={(e) => setForm((f) => ({ ...f, candidateSlots: e.target.value }))}
                  placeholder="Total cap across all positions"
                  className={inputClass}
                />
              </div>
            </div>

            {form.category === 'custom' && (
              <div>
                <label htmlFor="editCustomCategory" className={labelClass}>Custom Category Name <span className="text-status-error">*</span></label>
                <input
                  name="customCategory"
                  id="editCustomCategory"
                  type="text"
                  value={form.customCategory}
                  onChange={(e) => setForm((f) => ({ ...f, customCategory: e.target.value }))}
                  placeholder="e.g. Guild Elections"
                  maxLength={120}
                  className={inputClass}
                />
              </div>
            )}

            <div
              className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
              style={{ backgroundColor: `${pColor}08`, border: '1px solid var(--color-brand-border, #2a2a3a)' }}
              onClick={() => setForm((f) => ({ ...f, isMultiParty: !f.isMultiParty }))}
            >
              <div className="flex items-center gap-2.5">
                <Building2 size={14} style={{ color: form.isMultiParty ? pColor : 'var(--color-brand-text-muted)' }} />
                <div>
                  <p className="text-xs font-semibold text-brand-text-primary">Multi-Party</p>
                  <p className="text-[9px] text-brand-text-muted">
                    {form.isMultiParty ? 'Candidates can be grouped by party with logos' : 'Candidates run as independents'}
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

            <div>
              <label htmlFor="editAuditNote" className={labelClass}>
                Audit Note <span className="text-status-error">*</span>
              </label>
              <div className="relative">
                <FileEdit size={13} className="absolute left-3 top-3 text-brand-text-muted pointer-events-none" />
                <textarea
                  name="auditNote"
                  id="editAuditNote"
                  rows={3}
                  maxLength={1000}
                  value={form.auditNote}
                  onChange={(e) => setForm((f) => ({ ...f, auditNote: e.target.value }))}
                  placeholder="Describe why you are making this change. This is recorded in the audit log."
                  className={`${inputClass} pl-9 resize-none`}
                />
              </div>
              <p className="text-[9px] text-brand-text-muted mt-1">
                Every change to an event is tracked. This note explains the reason for this update.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-status-info/5 border border-status-info/20">
              <Calendar size={14} className="text-status-info shrink-0 mt-0.5" />
              <p className="text-[10px] text-status-info">
                Changes are saved immediately and recorded with your audit note. Define positions, candidates, and settings from the event detail page.
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  )
}
