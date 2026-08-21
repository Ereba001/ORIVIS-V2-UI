import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, Loader2, AlertTriangle } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { electionService } from '../../services/election-service'
import MediaPicker, { type MediaSource } from '../../components/MediaPicker'
import type { EventPosition, EventCandidate } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  eventId: string
  positions: EventPosition[]
  candidateSlots?: number
  approvedCount: number
  initialPositionId?: string | null
  initialCandidate?: EventCandidate | null
}

interface FormState {
  positionId: string
  name: string
  email: string
  phone: string
  party: string
  partyLogoUrl: string
  slogan: string
  bio: string
  manifesto: string
  manifestoUrl: string
  candidateCode: string
}

const INITIAL: FormState = {
  positionId: '',
  name: '',
  email: '',
  phone: '',
  party: '',
  partyLogoUrl: '',
  slogan: '',
  bio: '',
  manifesto: '',
  manifestoUrl: '',
  candidateCode: '',
}

const inputClass =
  'w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all focus:border-[var(--org-primary)]/50'

export default function CandidateFormModal({ open, onClose, onCreated, eventId, positions, candidateSlots, approvedCount, initialPositionId, initialCandidate }: Props) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const editing = !!initialCandidate

  const [form, setForm] = useState<FormState>({ ...INITIAL, positionId: positions[0]?.id ?? '' })
  const [photo, setPhoto] = useState<MediaSource | null>(null)
  const [campaign, setCampaign] = useState<MediaSource | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initialCandidate) {
      setForm({
        positionId: positions.some((p) => p.id === initialCandidate.positionId)
          ? initialCandidate.positionId
          : (positions[0]?.id ?? ''),
        name: initialCandidate.name || '',
        email: initialCandidate.email || '',
        phone: initialCandidate.phone || '',
        party: initialCandidate.party || '',
        partyLogoUrl: initialCandidate.partyLogoUrl || '',
        slogan: initialCandidate.slogan || '',
        bio: initialCandidate.biography || '',
        manifesto: initialCandidate.manifesto || '',
        manifestoUrl: initialCandidate.manifestoUrl || '',
        candidateCode: initialCandidate.candidateCode || '',
      })
      setPhoto(initialCandidate.photoUrl ? { type: 'url', url: initialCandidate.photoUrl } : null)
      setCampaign(initialCandidate.campaignImageUrl ? { type: 'url', url: initialCandidate.campaignImageUrl } : null)
      return
    }
    setForm((prev) => ({
      ...prev,
      positionId: initialPositionId && positions.some((p) => p.id === initialPositionId)
        ? initialPositionId
        : (positions[0]?.id ?? ''),
    }))
  }, [open, positions, initialPositionId, initialCandidate])

  const remaining = candidateSlots !== undefined && candidateSlots !== null
    ? Math.max(0, candidateSlots - approvedCount)
    : null

  const set = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Candidate name is required.')
      return
    }
    if (!form.positionId) {
      setError('Select a position for this candidate.')
      return
    }
    if (!initialCandidate && remaining !== null && remaining <= 0) {
      setError('Candidate slot limit reached for this election.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      if (form.email.trim()) payload.append('email', form.email.trim())
      if (form.phone.trim()) payload.append('phone', form.phone.trim())
      if (form.party.trim()) payload.append('party', form.party.trim())
      if (form.partyLogoUrl.trim()) payload.append('party_logo_url', form.partyLogoUrl.trim())
      if (form.slogan.trim()) payload.append('slogan', form.slogan.trim())
      if (form.bio.trim()) payload.append('bio', form.bio.trim())
      if (form.manifesto.trim()) payload.append('manifesto', form.manifesto.trim())
      if (form.manifestoUrl.trim()) payload.append('manifesto_url', form.manifestoUrl.trim())
      if (form.candidateCode.trim()) payload.append('candidate_code', form.candidateCode.trim())
      if (photo?.type === 'file') payload.append('photo_url', photo.file)
      if (photo?.type === 'url') payload.append('photo_url', photo.url)
      if (campaign?.type === 'file') payload.append('campaign_image_url', campaign.file)
      if (campaign?.type === 'url') payload.append('campaign_image_url', campaign.url)

      if (initialCandidate) {
        await electionService.updateCandidate(eventId, initialCandidate.positionId, initialCandidate.id, payload)
      } else {
        await electionService.createCandidate(eventId, form.positionId, payload)
      }
      setForm({ ...INITIAL, positionId: positions[0]?.id ?? '' })
      setPhoto(null)
      setCampaign(null)
      setError(null)
      onClose()
      onCreated()
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const apiMessage = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat()[0]
        : e.response?.data?.message
      setError(apiMessage ?? (err instanceof Error ? err.message : (initialCandidate ? 'Failed to update candidate' : 'Failed to add candidate')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { if (!saving) onClose() }}
          role="dialog"
          aria-modal="true"
          aria-label="Candidate Form"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-full max-w-2xl shadow-brand-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pColor}18`, color: pColor }}>
                  <User size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">{editing ? 'Edit Candidate' : 'Add Candidate'}</h3>
                  <p className="text-[10px] text-brand-text-muted">
                    {editing ? 'Save changes to this candidate' : (remaining !== null ? `${remaining} of ${candidateSlots} candidate slot${candidateSlots === 1 ? '' : 's'} remaining` : 'Upload a candidate to a position')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                aria-label="Close dialog"
                className="text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {remaining !== null && remaining <= 3 && !editing && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-status-warning/30 bg-status-warning/10 text-status-warning">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[10px] leading-relaxed">
                  {remaining === 0
                    ? 'All candidate slots for this election are filled. Raise the candidate slot cap from event settings to add more.'
                    : `Only ${remaining} candidate slot${remaining === 1 ? '' : 's'} left. The cap is shared across all positions.`}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-position">Position <span className="text-status-error">*</span></label>
                <select
                  id="cand-position"
                  value={form.positionId}
                  onChange={(e) => set('positionId')(e.target.value)}
                  className={inputClass}
                >
                  {positions.length === 0 && <option value="">No positions configured</option>}
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-name">Full Name <span className="text-status-error">*</span></label>
                  <input id="cand-name" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Ada Obi" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-email">Email</label>
                  <input id="cand-email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="candidate@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-phone">Phone</label>
                  <input id="cand-phone" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+234..." className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-party">Party / Affiliation</label>
                  <input id="cand-party" value={form.party} onChange={(e) => set('party')(e.target.value)} placeholder="e.g. People's Front" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-party-logo">Party Logo URL</label>
                  <input id="cand-party-logo" type="url" value={form.partyLogoUrl} onChange={(e) => set('partyLogoUrl')(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-slogan">Slogan</label>
                  <input id="cand-slogan" value={form.slogan} onChange={(e) => set('slogan')(e.target.value)} placeholder="e.g. A better tomorrow" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-bio">Short Bio</label>
                <textarea id="cand-bio" value={form.bio} onChange={(e) => set('bio')(e.target.value)} rows={2} placeholder="A brief introduction of the candidate..." className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-manifesto">Manifesto</label>
                <textarea id="cand-manifesto" value={form.manifesto} onChange={(e) => set('manifesto')(e.target.value)} rows={4} placeholder="Policies, goals and pledges..." className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-manifesto-url">Manifesto URL</label>
                  <input id="cand-manifesto-url" type="url" value={form.manifestoUrl} onChange={(e) => set('manifestoUrl')(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text-muted mb-1.5" htmlFor="cand-code">Candidate Code</label>
                  <input id="cand-code" value={form.candidateCode} onChange={(e) => set('candidateCode')(e.target.value)} placeholder="Auto-generated if empty" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <MediaPicker
                    label="Profile Photo"
                    accept=".jpg,.jpeg,.png,.webp"
                    hint="Supports file upload or image URL."
                    value={photo}
                    onChange={setPhoto}
                  />
                </div>
                <div>
                  <MediaPicker
                    label="Campaign Image"
                    accept=".jpg,.jpeg,.png,.webp"
                    hint="Supports file upload or image URL."
                    value={campaign}
                    onChange={setCampaign}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[10px] leading-relaxed">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-all cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={saving || (!editing && remaining !== null && remaining <= 0)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: pColor }}
              >
                {saving && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Candidate'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
