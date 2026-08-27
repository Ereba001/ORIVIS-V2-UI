import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText, CheckCircle, XCircle, AlertTriangle, Shield, Eye, Lock,
  Save, X, Upload, Plus, Loader2,
} from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import ProgressBar from '../../components/ProgressBar'
import RegistrationConfigSection, { createDefaultRegSettings } from '../../components/RegistrationConfigSection'
import CsvMappingModal from '../../components/CsvMappingModal'
import DirectVoteModal from '../../components/DirectVoteModal'
import CapacityUpgradeDialog, { type CapacityUpgradeData } from '../../components/CapacityUpgradeDialog'
import { electionService } from '../../../services/election-service'
import { billingService } from '../../../services/billing-service'
import { API } from '../../../constants/api'
import { getApiClient, unwrapPayload } from '../../../lib/api-client'
import { eventService, type EventParticipantData, type EventVoterSummary, type ImportPreviewResult } from '../../services/event-service'
import ImportReviewModal from '../../components/ImportReviewModal'
import { usePolling } from '../../../hooks/usePolling'
import type { RegistrationSettings } from '../../../types/registration'
import { resolveParticipantFields } from '../../../lib/participant-fields'
import { type OrivisEvent, type EventRegistration, PASS_STYLES } from './_shared'

export function RegistrationTab({ event, registration, registrationSettings, participants, locked, onDataChanged }: { event: OrivisEvent; registration?: EventRegistration | null; registrationSettings?: RegistrationSettings | null; participants?: EventParticipantData[]; locked?: boolean; onDataChanged?: () => void }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState<Record<string, string>>({})
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [showDirectVote, setShowDirectVote] = useState(false)
  const [directVoteVoter, setDirectVoteVoter] = useState<{ uuid: string; name: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [regSettings, setRegSettings] = useState<RegistrationSettings>(
    registrationSettings ?? createDefaultRegSettings(),
  )
  const [summary, setSummary] = useState<EventVoterSummary | null>(null)
  const [showEndModal, setShowEndModal] = useState(false)
  const [endNote, setEndNote] = useState('')
  const [endingReg, setEndingReg] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [startNote, setStartNote] = useState('')
  const [startingReg, setStartingReg] = useState(false)
  const [capacityUpgradeData, setCapacityUpgradeData] = useState<CapacityUpgradeData | null>(null)
  const [pendingImportParams, setPendingImportParams] = useState<{ mapping: Record<string, string>; records: Record<string, string>[] } | null>(null)
  const [pendingAddPayload, setPendingAddPayload] = useState<Record<string, string> | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null)
  const [showImportReview, setShowImportReview] = useState(false)
  const [importFileName, setImportFileName] = useState('import.csv')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const voterList = participants ?? []

  // Live counts come from the lightweight summary endpoint (COUNT queries), not
  // the full roster — so the console reflects registrations/votes as they
  // happen without refetching thousands of rows.
  const refreshSummary = async () => {
    try {
      setSummary(await eventService.fetchVoterSummary(event.id))
    } catch {
      // keep last known summary; the initial fetch below still runs
    }
  }
  usePolling(refreshSummary, 15000, true)
  useEffect(() => { refreshSummary() }, [event.id])

  // Handle payment return after capacity upgrade redirect.
  const PENDING_PAYMENT_KEY = 'orivis_pending_payment'
  const PENDING_UPGRADE_KEY = 'orivis_pending_capacity_upgrade'
  useEffect(() => {
    let cancelled = false
    const pendingRaw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    if (!pendingRaw) return
    try {
      const pending = JSON.parse(pendingRaw) as { electionId: string; paymentUuid: string }
      if (pending.electionId !== event.id) return
      sessionStorage.removeItem(PENDING_PAYMENT_KEY)
      billingService.verifyPayment(pending.paymentUuid).then(() => {
        if (cancelled) return
        const upgradeRaw = sessionStorage.getItem(PENDING_UPGRADE_KEY)
        if (upgradeRaw) {
          sessionStorage.removeItem(PENDING_UPGRADE_KEY)
          onDataChanged?.()
        }
      }).catch(() => { /* payment verification failed; user can retry */ })
    } catch { /* malformed storage; ignore */ }
    return () => { cancelled = true }
  }, [event.id])

  const totalUploaded = summary?.total ?? voterList.length
  const totalRegistered = summary?.registered ?? voterList.filter((v) => v.registrationStatus === 'completed' || v.registrationStatus === 'verified').length
  const totalPassIssued = summary?.passesIssued ?? voterList.filter((v) => v.votingPassStatus === 'issued').length
  const totalVoted = summary?.voted ?? voterList.filter((v) => v.votingPassStatus === 'used').length

  const isLiveOrEnded = event.status === 'live' || event.status === 'ended'
  const isLocked = locked || isLiveOrEnded
  // Ending registration is a lifecycle action: available while published or
  // live (registration stays open through voting), never for terminal states.
  const canEndRegistration = registration?.isOpen && (event.status === 'published' || event.status === 'live')

  const handleEndRegistration = async () => {
    setEndingReg(true)
    setSaveError(null)
    try {
      await electionService.endRegistration(event.id, endNote.trim() || undefined)
      setShowEndModal(false)
      setEndNote('')
      setSuccessMessage('Registration ended. New participants can no longer register.')
      onDataChanged?.()
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : 'Failed to end registration.')
    } finally {
      setEndingReg(false)
    }
  }

  const handleStartRegistration = async () => {
    setStartingReg(true)
    setSaveError(null)
    try {
      await electionService.startRegistration(event.id, startNote.trim() || undefined)
      setShowStartModal(false)
      setStartNote('')
      setSuccessMessage('Registration opened. Participants can register now.')
      onDataChanged?.()
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : 'Failed to open registration.')
    } finally {
      setStartingReg(false)
    }
  }

  const handleSave = async () => {
    setValidationErrors({})
    setSaveError(null)
    setSaving(true)
    try {
      await electionService.saveRegistrationSettings(event.id, regSettings)
      setEditMode(false)
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : 'Failed to save registration settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleCsvImport = async (mapping: Record<string, string>, records: Record<string, string>[]) => {
    setImporting(true)
    setImportResult(null)
    setSaveError(null)
    let capacityBlocked = false
    try {
      const headers = Object.keys(mapping)
      const csvLines = [headers.join(',')]
      for (const row of records) {
        const values = headers.map((h) => {
          const val = row[mapping[h]] ?? ''
          return val.includes(',') ? `"${val}"` : val
        })
        csvLines.push(values.join(','))
      }
      const csvFile = new File([csvLines.join('\n')], 'import.csv', { type: 'text/csv' })

      // Go through the preview pipeline instead of direct import.
      const preview = await eventService.previewImport(event.id, csvFile)
      setImportPreview(preview)
      setImportFileName('import.csv')
      setShowImportReview(true)
    } catch (err) {
      const apiErr = err as Error & { code?: string | null; payload?: Record<string, unknown> }
      if (apiErr.code === 'VOTER_CAPACITY_EXCEEDED' && apiErr.payload) {
        setCapacityUpgradeData(apiErr.payload as unknown as CapacityUpgradeData)
        setPendingImportParams({ mapping, records })
        capacityBlocked = true
        setShowCsvModal(false)
      } else {
        setSaveError(err instanceof Error && err.message ? err.message : 'CSV import failed. Please check the file format.')
      }
    } finally {
      setImporting(false)
      if (!capacityBlocked) setShowCsvModal(false)
    }
  }

  const handleAddParticipant = async () => {
    const errors: Record<string, string> = {}
    if (!(addForm.name ?? '').trim()) errors.name = 'Name is required'
    const emailField = resolveParticipantFields(registrationSettings).find((f) => f.key === 'email')
    if (emailField && !(addForm.email ?? '').trim()) errors.email = 'Email is required'
    setAddErrors(errors)
    if (Object.keys(errors).length > 0) return

    setAdding(true)
    let capacityBlocked = false
    try {
      const payload: Record<string, string> = {}
      for (const field of resolveParticipantFields(registrationSettings)) {
        const value = (addForm[field.key] ?? '').trim()
        if (value) payload[field.key] = value
      }
      const { data } = await getApiClient().post(
        API.ENDPOINTS.VOTERS.ADD(event.id),
        payload,
      )
      unwrapPayload(data)
      setAddForm({})
      setShowAddModal(false)
      onDataChanged?.()
    } catch (err) {
      const apiErr = err as Error & { code?: string | null; payload?: Record<string, unknown> }
      if (apiErr.code === 'VOTER_CAPACITY_EXCEEDED' && apiErr.payload) {
        setCapacityUpgradeData(apiErr.payload as unknown as CapacityUpgradeData)
        setPendingAddPayload(addForm)
        capacityBlocked = true
        setShowAddModal(false)
      } else {
        setAddErrors({ name: err instanceof Error && err.message ? err.message : 'Failed to add participant.' })
      }
    } finally {
      setAdding(false)
      if (!capacityBlocked) setShowAddModal(false)
    }
  }

  if (!registration && !editMode) {
    return (
      <DashboardCard hover={false}>
        <EmptyState
          icon={FileText}
          title="Registration Not Configured"
          description="Registration settings have not been set up for this event."
          action={isLocked ? undefined : { label: 'Configure Registration', onClick: () => setEditMode(true) }}
        />
      </DashboardCard>
    )
  }

  const csvHeaders = resolveParticipantFields(registrationSettings).map((f) => f.key)
  const csvRequired = ['name']

  return (
    <div className="space-y-6">
      {saveError && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-status-error/10 border border-status-error/20">
          <AlertTriangle size={14} className="text-status-error shrink-0" />
          <p className="text-[10px] text-status-error">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="ml-auto text-brand-text-muted hover:text-brand-text-primary">
            <X size={12} />
          </button>
        </div>
      )}

      {importResult && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-status-success/10 border border-status-success/20">
          <CheckCircle size={14} className="text-status-success shrink-0" />
          <p className="text-[10px] text-status-success">
            Import complete: {importResult.success} voter{importResult.success !== 1 ? 's' : ''} imported
            {importResult.failed > 0 && `, ${importResult.failed} failed`}
          </p>
          <button onClick={() => setImportResult(null)} className="ml-auto text-brand-text-muted hover:text-brand-text-primary">
            <X size={12} />
          </button>
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-status-success/10 border border-status-success/20">
          <CheckCircle size={14} className="text-status-success shrink-0" />
          <p className="text-[10px] text-status-success">{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-brand-text-muted hover:text-brand-text-primary">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-brand-text-primary">Registration</h2>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <motion.button
                onClick={() => { setEditMode(false); setValidationErrors({}) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
                disabled={saving}
              >
                <X size={12} /> Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-50"
                style={{ backgroundColor: pColor }}
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </>
          ) : (
            isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted/40">
                <Lock size={12} /> {isLiveOrEnded ? 'Registration Locked' : 'Locked (Event Published)'}
              </span>
            ) : (
              <motion.button
                onClick={() => setEditMode(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
              >
                <FileText size={12} /> Edit Configuration
              </motion.button>
            )
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
            <h3 className="text-xs font-bold text-brand-text-primary mb-4">Registration Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Status</p>
                <p className={`text-xs font-bold flex items-center gap-1.5 ${registration?.isOpen ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  <span className={`w-2 h-2 rounded-full ${registration?.isOpen ? 'bg-status-success' : 'bg-brand-text-muted'}`} />
                  {registration?.isOpen ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Max Voters</p>
                <p className="text-xs font-bold text-brand-text-primary">
                  {registration?.maxParticipants && registration.maxParticipants > 0
                    ? registration.maxParticipants.toLocaleString()
                    : '—'}
                </p>
                <p className="text-[9px] text-brand-text-muted mt-0.5">Plan voter ceiling</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Current Registrations</p>
                <p className="text-xs font-bold text-brand-text-primary">{totalRegistered.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Auto Approve</p>
                <p className={`text-xs font-bold ${registration?.autoApprove ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  {registration?.autoApprove ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            {(event.registrationStartsAt || event.registrationEndsAt) && (
              <div className="mt-4 p-3 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1.5">Registration Window</p>
                <div className="flex items-center gap-2 text-xs text-brand-text-primary">
                  {event.registrationStartsAt && (
                    <span>Opens: {new Date(event.registrationStartsAt).toLocaleString()}</span>
                  )}
                  {event.registrationStartsAt && event.registrationEndsAt && <span className="text-brand-text-muted">→</span>}
                  {event.registrationEndsAt && (
                    <span>Closes: {new Date(event.registrationEndsAt).toLocaleString()}</span>
                  )}
                </div>
                {event.registrationEndsAt && new Date(event.registrationEndsAt) < new Date() && (
                  <p className="text-[10px] text-status-warning mt-1.5">Registration has ended (auto closed by scheduler)</p>
                )}
              </div>
            )}
            {registration && (
              <div className="mt-4">
                <ProgressBar
                  value={registration.maxParticipants > 0 ? registration.currentRegistrations : registration.currentRegistrations}
                  max={registration.maxParticipants > 0 ? registration.maxParticipants : Math.max(registration.currentRegistrations, 1)}
                  label={registration.maxParticipants > 0 ? `Registered ${registration.currentRegistrations.toLocaleString()} of ${registration.maxParticipants.toLocaleString()} (plan limit)` : 'Registered Voters'}
                />
              </div>
            )}
          </DashboardCard>

          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold text-brand-text-primary mb-4">Voter Import Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Uploaded Voters</p>
                <p className="text-lg font-bold text-brand-text-primary">{totalUploaded}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Registered</p>
                <p className="text-lg font-bold text-status-success">{totalRegistered}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Passes Issued</p>
                <p className="text-lg font-bold text-status-info">{totalPassIssued}</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Voted</p>
                <p className="text-lg font-bold text-brand-text-primary">{totalVoted}</p>
              </div>
            </div>
          </DashboardCard>

          {voterList.length > 0 && (
            <DashboardCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-brand-text-primary">Imported Voters ({totalUploaded})</h3>
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand-divider">
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Name</th>
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Email</th>
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Verification</th>
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Pass Status</th>
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Voted</th>
                      <th className="pb-2 text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voterList.slice(0, 50).map((voter) => (
                      <tr key={voter.id} className="border-b border-brand-divider/50">
                        <td className="py-2.5 text-[10px] font-medium text-brand-text-primary">{voter.name}</td>
                        <td className="py-2.5 text-[10px] text-brand-text-muted">{voter.email || '—'}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                            voter.verificationStatus === 'verified'
                              ? 'bg-status-success/10 text-status-success border-status-success/20'
                              : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          }`}>
                            {voter.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                            PASS_STYLES[voter.votingPassStatus] ?? PASS_STYLES.not_issued
                          }`}>
                            {voter.votingPassStatus === 'issued' ? 'Issued' : voter.votingPassStatus === 'used' ? 'Used' : 'Not Issued'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {voter.votingPassStatus === 'used' ? (
                            <CheckCircle size={12} className="text-status-success" />
                          ) : (
                            <XCircle size={12} className="text-brand-text-muted/40" />
                          )}
                        </td>
                        <td className="py-2.5">
                          {voter.votingPassStatus === 'issued' && (
                            <button
                              onClick={() => { setDirectVoteVoter({ uuid: voter.id, name: voter.name }); setShowDirectVote(true) }}
                              className="text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                            >
                              Vote
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {voterList.length > 50 && (
                  <p className="text-[9px] text-brand-text-muted mt-2 text-center">Showing 50 of {totalUploaded} voters</p>
                )}
              </div>

              <div className="lg:hidden divide-y divide-brand-divider">
                {voterList.slice(0, 50).map((voter) => (
                  <div key={voter.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-medium text-brand-text-primary">{voter.name}</span>
                      {voter.votingPassStatus === 'issued' && (
                        <button
                          onClick={() => { setDirectVoteVoter({ uuid: voter.id, name: voter.name }); setShowDirectVote(true) }}
                          className="text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-surface-elevated/30 border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                        >
                          Vote
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-brand-text-muted">Email</span>
                        <p className="text-brand-text-primary truncate">{voter.email || '—'}</p>
                      </div>
                      <div>
                        <span className="text-brand-text-muted">Verification</span>
                        <p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                            voter.verificationStatus === 'verified'
                              ? 'bg-status-success/10 text-status-success border-status-success/20'
                              : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          }`}>
                            {voter.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-brand-text-muted">Pass Status</span>
                        <p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                            PASS_STYLES[voter.votingPassStatus] ?? PASS_STYLES.not_issued
                          }`}>
                            {voter.votingPassStatus === 'issued' ? 'Issued' : voter.votingPassStatus === 'used' ? 'Used' : 'Not Issued'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-brand-text-muted">Voted</span>
                        <p>
                          {voter.votingPassStatus === 'used' ? (
                            <CheckCircle size={12} className="text-status-success" />
                          ) : (
                            <XCircle size={12} className="text-brand-text-muted/40" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {voterList.length > 50 && (
                  <p className="text-[9px] text-brand-text-muted pt-2 text-center">Showing 50 of {totalUploaded} voters</p>
                )}
              </div>
            </DashboardCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard hover={false}>
              <h3 className="text-xs font-bold text-brand-text-primary mb-3">Eligibility Rules</h3>
              {!registration || registration.eligibilityRules.length === 0 ? (
                <p className="text-[10px] text-brand-text-muted">No eligibility rules configured.</p>
              ) : (
                <ul className="space-y-2">
                  {registration.eligibilityRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-brand-text-muted">
                      <CheckCircle size={10} className="text-status-success shrink-0 mt-0.5" />
                      {rule}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>

            <DashboardCard hover={false}>
              <h3 className="text-xs font-bold text-brand-text-primary mb-3">Verification Methods</h3>
              {!registration || registration.verificationMethods.length === 0 ? (
                <p className="text-[10px] text-brand-text-muted">No verification methods configured.</p>
              ) : (
                <ul className="space-y-2">
                  {registration.verificationMethods.map((method, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-brand-text-muted">
                      <Shield size={10} className="text-status-info shrink-0 mt-0.5" />
                      {method}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>

          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold text-brand-text-primary mb-4">Voting Pass Settings</h3>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Expires In</p>
                <p className="text-xs font-bold text-brand-text-primary">{registration?.passSettings.expiresInHours ?? '—'} hours</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-surface-elevated/20">
                <p className="text-[10px] text-brand-text-muted mb-1">Single Use</p>
                <p className={`text-xs font-bold ${registration?.passSettings.singleUse ? 'text-status-success' : 'text-brand-text-muted'}`}>
                  {registration?.passSettings.singleUse ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard hover={false}>
            <h3 className="text-xs font-bold text-brand-text-primary mb-3">Quick Actions</h3>
            <p className="text-[9px] text-brand-text-muted mb-3">
              Registration opens the window for participants to verify their identity and receive a voting pass. Closing registration prevents new sign-ups but does not affect participants who have already registered.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {isLocked ? (
                <>
                  {canEndRegistration && (
                    <motion.button
                      onClick={() => setShowEndModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-status-error/40 text-status-error hover:bg-status-error/10"
                    >
                      <Lock size={12} /> End Registration
                    </motion.button>
                  )}
                  <p className="text-[10px] text-brand-text-muted">
                    {isLiveOrEnded ? 'Registration configuration is locked because the election is live or ended.' : 'Registration configuration is locked because this event has been published.'}
                  </p>
                </>
              ) : (
                <>
                  {registration?.isOpen ? (
                    <motion.button
                      onClick={() => setShowEndModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-status-error/40 text-status-error hover:bg-status-error/10"
                    >
                      <Lock size={12} /> End Registration
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => setShowStartModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white"
                      style={{ backgroundColor: pColor }}
                    >
                      <Eye size={12} /> Open Registration
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setShowCsvModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
                  >
                    {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {importing ? 'Importing...' : 'Import CSV'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAddModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive"
                  >
                    <Plus size={12} /> Add Participant
                  </motion.button>
                </>
              )}
            </div>
          </DashboardCard>
        </>
      )}

      <CsvMappingModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onConfirm={handleCsvImport}
        expectedHeaders={csvHeaders}
        requiredHeaders={csvRequired}
      />

      <CapacityUpgradeDialog
        open={capacityUpgradeData !== null}
        onClose={() => { setCapacityUpgradeData(null); setPendingImportParams(null); setPendingAddPayload(null) }}
        electionId={event.id}
        data={capacityUpgradeData ?? { ceiling: 0, current_participants: 0, incoming: 0, projected_participants: 0, excess: 0, currency: 'NGN' }}
        onUpgraded={() => { setCapacityUpgradeData(null); onDataChanged?.() }}
        onRetryImport={async () => {
          if (pendingImportParams) {
            const { mapping, records } = pendingImportParams
            setPendingImportParams(null)
            await handleCsvImport(mapping, records)
          } else if (pendingAddPayload) {
            setPendingAddPayload(null)
            setShowAddModal(true)
          }
        }}
        onTruncatedImport={async (trimTo) => {
          const data = capacityUpgradeData
          if (pendingImportParams && data) {
            const { mapping, records } = pendingImportParams
            setPendingImportParams(null)
            setCapacityUpgradeData(null)
            const trimmedRecords = records.slice(0, Math.max(0, trimTo))
            await handleCsvImport(mapping, trimmedRecords)
          } else if (pendingAddPayload) {
            setPendingAddPayload(null)
            setCapacityUpgradeData(null)
            setShowAddModal(true)
          } else {
            setCapacityUpgradeData(null)
          }
        }}
      />

      {importPreview && (
        <ImportReviewModal
          open={showImportReview}
          onClose={() => { setShowImportReview(false); setImportPreview(null) }}
          onCommitted={(result) => {
            setShowImportReview(false)
            setImportPreview(null)
            setImportResult({ success: result.successful, failed: result.failed })
            onDataChanged?.()
          }}
          event={event}
          preview={importPreview}
          fileName={importFileName}
        />
      )}

      <DirectVoteModal
        open={showDirectVote}
        onClose={() => { setShowDirectVote(false); setDirectVoteVoter(null) }}
        electionId={event.id}
        voterUuid={directVoteVoter?.uuid}
        voterName={directVoteVoter?.name}
      />

      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowEndModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-brand-surface rounded-2xl border border-brand-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-text-primary">End Registration</h3>
                <button onClick={() => setShowEndModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                  <X size={16} />
                </button>
              </div>

              <p className="text-[10px] text-brand-text-muted leading-relaxed">
                This closes registration for new participants immediately. Participants who already
                registered keep their records, and voting continues on schedule. This action is
                recorded in the audit log.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1">Audit note (optional)</label>
                <textarea
                  value={endNote}
                  onChange={(e) => setEndNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Why are you ending registration?"
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider text-[10px] text-brand-text-primary outline-none focus:border-brand-primary transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowEndModal(false)}
                  disabled={endingReg}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleEndRegistration}
                  disabled={endingReg}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold text-white bg-status-error disabled:opacity-50 transition-colors"
                >
                  {endingReg ? 'Ending...' : 'End Registration'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowStartModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-brand-surface rounded-2xl border border-brand-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-text-primary">Open Registration</h3>
                <button onClick={() => setShowStartModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                  <X size={16} />
                </button>
              </div>

              <p className="text-[10px] text-brand-text-muted leading-relaxed">
                This opens registration for new participants immediately. Anyone who is
                eligible can register until the window closes or you end registration.
                This action is recorded in the audit log.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1">Audit note (optional)</label>
                <textarea
                  value={startNote}
                  onChange={(e) => setStartNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Why are you opening registration early?"
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider text-[10px] text-brand-text-primary outline-none focus:border-brand-primary transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowStartModal(false)}
                  disabled={startingReg}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleStartRegistration}
                  disabled={startingReg}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: pColor }}
                >
                  {startingReg ? 'Opening...' : 'Open Registration'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-brand-surface rounded-2xl border border-brand-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-text-primary">Add Participant</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {resolveParticipantFields(registrationSettings).map((field) => {
                  const isEmail = field.key === 'email'
                  return (
                    <div key={field.key}>
                      <label className="block text-[10px] font-bold text-brand-text-muted mb-1">
                        {field.label}{field.required ? ' *' : ''}
                      </label>
                      <input
                        type={isEmail ? 'email' : 'text'}
                        value={addForm[field.key] ?? ''}
                        onChange={(e) => setAddForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl bg-brand-surface-elevated/30 border text-[10px] text-brand-text-primary outline-none transition-colors ${
                          addErrors[field.key] ? 'border-status-error/50' : 'border-brand-divider focus:border-brand-primary'
                        }`}
                        placeholder={isEmail ? 'Enter email address' : `Enter ${field.label.toLowerCase()}`}
                      />
                      {addErrors[field.key] && <p className="text-[8px] text-status-error mt-1">{addErrors[field.key]}</p>}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleAddParticipant}
                  disabled={adding}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: pColor }}
                >
                  {adding ? 'Adding...' : 'Add Participant'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
