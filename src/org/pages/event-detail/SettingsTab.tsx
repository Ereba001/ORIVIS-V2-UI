import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Lock, EyeOff, Mail, Fingerprint, Key, Vote, Bell, BarChart3, Users,
} from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import TimingDeviationModal from '../../components/TimingDeviationModal'
import { electionService } from '../../../services/election-service'
import { type OrivisEvent } from './_shared'

export function SettingsTab({ event, locked, saveSuccess, setSaveSuccess, candidateApprovedCount, onDataChanged }: {
  event: OrivisEvent
  locked?: boolean
  saveSuccess: boolean
  setSaveSuccess: (v: boolean) => void
  candidateApprovedCount?: number
  onDataChanged?: () => void
}) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [timezone, setTimezone] = useState(event.timezone)
  const [visibility, setVisibility] = useState(event.visibility)
  const [regStart, setRegStart] = useState((event.registrationStartsAt ?? '').slice(0, 16))
  const [regEnd, setRegEnd] = useState((event.registrationEndsAt ?? '').slice(0, 16))
  const [voteStart, setVoteStart] = useState((event.startsAt ?? '').slice(0, 16))
  const [voteEnd, setVoteEnd] = useState((event.endsAt ?? '').slice(0, 16))
  const [allowAnonymous, setAllowAnonymous] = useState(event.settings.allowAnonymousVoting)
  const [requireEmail, setRequireEmail] = useState(event.settings.requireEmailVerification)
  const [requireId, setRequireId] = useState(event.settings.requireIdVerification)
  const [require2fa, setRequire2fa] = useState(event.settings.requireTwoFactor)
  const [allowMultiple, setAllowMultiple] = useState(event.settings.allowMultipleVotes)
  const [resultPub, setResultPub] = useState(event.settings.resultPublication)
  const [liveResults, setLiveResults] = useState(event.settings.liveResults)
  const [notifyReg, setNotifyReg] = useState(event.settings.notifyOnRegistration)
  const [notifyVote, setNotifyVote] = useState(event.settings.notifyOnVote)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeviationModal, setShowDeviationModal] = useState(false)
  const [pendingDeviations, setPendingDeviations] = useState<Array<{field: string; configured: string; requested: string; isEarlier: boolean; differenceMinutes: number; message: string}>>([])
  const [slotsInput, setSlotsInput] = useState(event.candidateSlots != null ? String(event.candidateSlots) : '')
  const [slotsSaving, setSlotsSaving] = useState(false)
  const [slotsMsg, setSlotsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setSlotsInput(event.candidateSlots != null ? String(event.candidateSlots) : '')
  }, [event.candidateSlots])

  const handleSlotsSave = async () => {
    setSlotsMsg(null)
    const trimmed = slotsInput.trim()
    const value = trimmed === '' ? null : Number(trimmed)
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 1000)) {
      setSlotsMsg({ type: 'error', text: 'Candidate slots must be a whole number between 0 and 1000. Leave empty for no limit.' })
      return
    }
    setSlotsSaving(true)
    try {
      await electionService.updateCandidateSlots(event.id, value)
      setSlotsMsg({ type: 'success', text: 'Saved!' })
      onDataChanged?.()
    } catch (err) {
      setSlotsMsg({ type: 'error', text: err instanceof Error && err.message ? err.message : 'Failed to update candidate slots.' })
    } finally {
      setSlotsSaving(false)
    }
  }

  // Check for timing deviations from baseline
  const checkTimingDeviations = (): Array<{field: string; configured: string; requested: string; isEarlier: boolean; differenceMinutes: number; message: string}> => {
    const deviations: Array<{field: string; configured: string; requested: string; isEarlier: boolean; differenceMinutes: number; message: string}> = []

    const fieldMap: Record<string, { baseline?: string; current: string; label: string }> = {
      voting_starts_at: { baseline: event.startsAt, current: voteStart, label: 'Voting start time' },
      voting_ends_at: { baseline: event.endsAt, current: voteEnd, label: 'Voting end time' },
      registration_starts_at: { baseline: event.registrationStartsAt, current: regStart, label: 'Registration start time' },
      registration_ends_at: { baseline: event.registrationEndsAt, current: regEnd, label: 'Registration end time' },
    }

    for (const [field, info] of Object.entries(fieldMap)) {
      if (info.baseline && info.current && info.current !== info.baseline) {
        const baselineDate = new Date(info.baseline)
        const currentDate = new Date(info.current)
        const diffMs = currentDate.getTime() - baselineDate.getTime()
        const diffMinutes = Math.round(Math.abs(diffMs) / 60000)
        const isEarlier = diffMs < 0

        deviations.push({
          field,
          configured: info.baseline,
          requested: info.current,
          isEarlier,
          differenceMinutes: diffMinutes,
          message: `${info.label} is being changed from ${baselineDate.toLocaleString()} to ${currentDate.toLocaleString()} (${diffMinutes} minutes ${isEarlier ? 'earlier' : 'later'}).`,
        })
      }
    }

    return deviations
  }

  const performSave = async (auditNote?: string) => {
    setSaveError(null)
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        title,
        description,
        timezone,
        visibility,
        registrationStartsAt: regStart || null,
        registrationEndsAt: regEnd || null,
        votingStartsAt: voteStart || null,
        votingEndsAt: voteEnd || null,
        settings: {
          allowAnonymousVoting: allowAnonymous,
          requireEmailVerification: requireEmail,
          requireIdVerification: requireId,
          requireTwoFactor: require2fa,
          allowMultipleVotes: allowMultiple,
          resultPublication: resultPub,
          liveResults,
          notifyOnRegistration: notifyReg,
          notifyOnVote: notifyVote,
        },
      }
      if (auditNote != null) {
        updateData.auditNote = auditNote
      }
      await electionService.updateElection(event.id, updateData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      onDataChanged?.()
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : 'Failed to save settings. Please check your input.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    const deviations = checkTimingDeviations()
    if (deviations.length > 0) {
      setPendingDeviations(deviations)
      setShowDeviationModal(true)
      return
    }
    await performSave()
  }

  const handleDeviationConfirm = async (reason: string) => {
    setShowDeviationModal(false)
    await performSave(reason)
  }

  return (
    <div className="space-y-6">
      {locked && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-warning/10 border border-status-warning/20">
          <Lock size={14} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-warning font-medium">Settings are locked because this event has been published.</p>
        </div>
      )}
      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold text-brand-text-primary mb-4">General Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="eventTitle" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Event Title</label>
            <input name="title" id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div>
            <label htmlFor="eventDescription" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Description</label>
            <textarea name="description" id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timezone" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Timezone</label>
              <select name="timezone" id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
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
              <label className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Visibility</label>
              <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
                {(['public', 'private'] as const).map((v) => (
                  <button key={v} onClick={() => setVisibility(v)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all capitalize ${
                      visibility === v ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                    }`}
                    style={visibility === v ? { backgroundColor: pColor } : {}}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold text-brand-text-primary mb-4 flex items-center gap-2">
          <Users size={14} style={{ color: pColor }} aria-hidden="true" /> Candidate Slots
        </h3>
        <p className="text-[10px] text-brand-text-muted mb-4">
          Maximum number of candidates allowed on the ballot. Leave empty for no limit. The cap can be raised while the event is published as long as voting has not started.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label htmlFor="candidateSlots" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Slot Cap</label>
            <input
              name="candidateSlots"
              id="candidateSlots"
              type="number"
              min={0}
              max={1000}
              value={slotsInput}
              onChange={(e) => { setSlotsInput(e.target.value); if (slotsMsg) setSlotsMsg(null) }}
              placeholder="No limit"
              className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSlotsSave}
            disabled={slotsSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-50"
            style={{ backgroundColor: pColor }}
          >
            {slotsSaving ? 'Saving...' : 'Update Cap'}
          </motion.button>
        </div>
        {candidateApprovedCount !== undefined && (
          <p className="mt-3 text-[10px] text-brand-text-muted">
            {event.candidateSlots != null
              ? `${candidateApprovedCount} of ${event.candidateSlots} candidate slot${event.candidateSlots === 1 ? '' : 's'} used`
              : `${candidateApprovedCount} candidate${candidateApprovedCount === 1 ? '' : 's'} added, no cap set`}
          </p>
        )}
        {slotsMsg && (
          <p role="alert" className={`mt-2 text-[10px] font-bold ${slotsMsg.type === 'success' ? 'text-status-success' : 'text-status-error'}`}>
            {slotsMsg.text}
          </p>
        )}
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Registration Dates</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="registrationStart" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Registration Start</label>
              <input name="registrationStart" id="registrationStart" type="datetime-local" value={regStart} onChange={(e) => setRegStart(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
            <div>
              <label htmlFor="registrationEnd" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Registration End</label>
              <input name="registrationEnd" id="registrationEnd" type="datetime-local" value={regEnd} onChange={(e) => setRegEnd(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Voting Dates</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="votingStart" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Voting Start</label>
              <input name="votingStart" id="votingStart" type="datetime-local" value={voteStart} onChange={(e) => setVoteStart(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
            <div>
              <label htmlFor="votingEnd" className="block text-[10px] text-brand-text-muted font-bold mb-1.5">Voting End</label>
              <input name="votingEnd" id="votingEnd" type="datetime-local" value={voteEnd} onChange={(e) => setVoteEnd(e.target.value)}
                className="w-full bg-brand-bg-secondary/50 border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-text-primary focus:outline-none transition-all" />
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold text-brand-text-primary mb-4">Security Settings</h3>
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
                  <span className="text-[10px] text-brand-text-primary font-medium">{s.label}</span>
                </div>
                <input name="securitySetting" type="checkbox" checked={s.value} onChange={() => s.set(!s.value)} aria-label="Security setting"
                  className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
              </label>
            )
          })}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Result Publication</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 bg-brand-surface-elevated rounded-xl w-fit">
              {(['immediate', 'scheduled', 'manual'] as const).map((r) => (
                <button key={r} onClick={() => setResultPub(r)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all capitalize ${
                    resultPub === r ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-primary'
                  }`}
                  style={resultPub === r ? { backgroundColor: pColor } : {}}>{r}</button>
              ))}
            </div>
            <label htmlFor="liveResults" className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} style={{ color: pColor }} />
                <div>
                  <span className="block text-[10px] text-brand-text-primary font-medium">Live Results</span>
                  <span className="block text-[8px] text-brand-text-muted">Publicly stream results in real time while voting is open. Requires public access to results.</span>
                </div>
              </div>
              <input name="liveResults" id="liveResults" type="checkbox" checked={liveResults} onChange={() => setLiveResults(!liveResults)}
                className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
          </div>
        </DashboardCard>

        <DashboardCard hover={false}>
          <h3 className="text-xs font-bold text-brand-text-primary mb-4">Notifications</h3>
          <div className="space-y-3">
            <label htmlFor="notifyRegistration" className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: pColor }} />
                <span className="text-[10px] text-brand-text-primary font-medium">Notify on Registration</span>
              </div>
              <input name="notifyRegistration" id="notifyRegistration" type="checkbox" checked={notifyReg} onChange={() => setNotifyReg(!notifyReg)}
                className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
            <label htmlFor="notifyVote" className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20 cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: pColor }} />
                <span className="text-[10px] text-brand-text-primary font-medium">Notify on Vote</span>
              </div>
              <input name="notifyVote" id="notifyVote" type="checkbox" checked={notifyVote} onChange={() => setNotifyVote(!notifyVote)}
                className="w-4 h-4 rounded border-brand-border accent-[var(--org-primary)]" />
            </label>
          </div>
        </DashboardCard>
      </div>

      <div className="flex items-center gap-3">
        {locked ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted/40">
            <Lock size={12} /> Locked (Event Published)
          </span>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white"
            style={{ backgroundColor: pColor }}
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        )}
        {saveSuccess && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] text-status-success font-bold"
          >
            Saved!
          </motion.span>
        )}
        {saveError && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] text-status-error font-bold"
            role="alert"
          >
            {saveError}
          </motion.span>
        )}
      </div>

      {/* Timing Deviation Confirmation Modal */}
      <TimingDeviationModal
        open={showDeviationModal}
        deviations={pendingDeviations}
        onConfirm={handleDeviationConfirm}
        onCancel={() => {
          setShowDeviationModal(false)
          setPendingDeviations([])
        }}
        loading={saving}
      />
    </div>
  )
}
