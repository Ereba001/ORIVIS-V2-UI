import { Fragment, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, Download, UserCheck, Eye, Trash2, MoreHorizontal,
  CheckCircle, XCircle, AlertTriangle, X, ChevronLeft, ChevronRight,
  Plus, Upload, Loader2, Lock,
} from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import CsvMappingModal from '../../components/CsvMappingModal'
import CapacityUpgradeDialog, { type CapacityUpgradeData } from '../../components/CapacityUpgradeDialog'
import { API } from '../../../constants/api'
import { getApiClient, unwrapPayload } from '../../../lib/api-client'
import { eventService } from '../../services/event-service'
import { billingService } from '../../../services/billing-service'
import { type OrivisEvent, type EventParticipant, PARTICIPANT_REG_STYLES, VERIFICATION_STYLES, PASS_STYLES } from './_shared'
import { resolveParticipantFields, hasParticipantData, participantFieldValue } from '../../../lib/participant-fields'
import type { RegistrationSettings } from '../../../types/registration'

interface ParticipantsTabProps {
  event: OrivisEvent
  participants: EventParticipant[]
  registrationSettings?: RegistrationSettings | null
  locked?: boolean
  onDataChanged?: () => void
}

export function ParticipantsTab({ event, participants, registrationSettings, locked = false, onDataChanged }: ParticipantsTabProps) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [partSearch, setPartSearch] = useState('')
  const [regFilter, setRegFilter] = useState<string>('all')
  const [verFilter, setVerFilter] = useState<string>('all')
  const [passFilter, setPassFilter] = useState<string>('all')
  const [partPage, setPartPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const perPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const participantFields = resolveParticipantFields(registrationSettings)
  const [addForm, setAddForm] = useState<Record<string, string>>({})
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})

  const [showCsvModal, setShowCsvModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [clearing, setClearing] = useState(false)
  const [capacityUpgradeData, setCapacityUpgradeData] = useState<CapacityUpgradeData | null>(null)
  const [pendingImportParams, setPendingImportParams] = useState<{ mapping: Record<string, string>; records: Record<string, string>[] } | null>(null)
  const [pendingAddPayload, setPendingAddPayload] = useState<Record<string, string> | null>(null)

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
        sessionStorage.removeItem(PENDING_UPGRADE_KEY)
        onDataChanged?.()
      }).catch(() => { /* payment verification failed; user can retry */ })
    } catch { /* malformed storage; ignore */ }
    return () => { cancelled = true }
  }, [event.id])

  const filtered = participants.filter((p) => {
    if (regFilter !== 'all' && p.registrationStatus !== regFilter) return false
    if (verFilter !== 'all' && p.verificationStatus !== verFilter) return false
    if (passFilter !== 'all' && p.votingPassStatus !== passFilter) return false
    if (partSearch && !p.name.toLowerCase().includes(partSearch.toLowerCase()) && !p.email.toLowerCase().includes(partSearch.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((partPage - 1) * perPage, partPage * perPage)
  const pageNumbers = Array.from(new Set([1, totalPages, partPage - 1, partPage, partPage + 1]))
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paged.map((p) => p.id)))
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      const { data } = await getApiClient().delete(API.ENDPOINTS.VOTERS.CLEAR(event.id))
      const payload = unwrapPayload(data) as { message?: string; removed?: number }
      setToast({
        message: payload.message ?? `Removed ${payload.removed ?? 0} participants.`,
        type: 'success',
      })
      setSelectedIds(new Set())
      onDataChanged?.()
    } catch (err) {
      setToast({
        message: err instanceof Error && err.message ? err.message : 'Failed to clear participants.',
        type: 'error',
      })
    } finally {
      setClearing(false)
    }
  }

  const handleAddParticipant = async () => {
    const errors: Record<string, string> = {}
    if (!(addForm.name ?? '').trim()) errors.name = 'Name is required'
    const emailField = participantFields.find((f) => f.key === 'email')
    if (emailField && !(addForm.email ?? '').trim()) errors.email = 'Email is required'
    setAddErrors(errors)
    if (Object.keys(errors).length > 0) return

    setAdding(true)
    let capacityBlocked = false
    try {
      const payload: Record<string, string> = {}
      for (const field of participantFields) {
        const value = (addForm[field.key] ?? '').trim()
        if (value) payload[field.key] = value
      }
      const { data } = await getApiClient().post(API.ENDPOINTS.VOTERS.ADD(event.id), payload)
      unwrapPayload(data)
      setAddForm({})
      setShowAddModal(false)
      setToast({ message: 'Participant added successfully.', type: 'success' })
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

  const handleCsvImport = async (mapping: Record<string, string>, records: Record<string, string>[]) => {
    setImporting(true)
    setImportResult(null)
    setToast(null)
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

      const result = await eventService.importVoters(event.id, csvFile)

      setImportResult({ success: result.successful, failed: result.failed })
      let message = `Import complete: ${result.successful} voter${result.successful !== 1 ? 's' : ''} imported`
      if (result.failed > 0) {
        message += `, ${result.failed} failed`
      }
      setToast({ message, type: 'success' })
      onDataChanged?.()
    } catch (err) {
      const apiErr = err as Error & { code?: string | null; payload?: Record<string, unknown> }
      if (apiErr.code === 'VOTER_CAPACITY_EXCEEDED' && apiErr.payload) {
        setCapacityUpgradeData(apiErr.payload as unknown as CapacityUpgradeData)
        setPendingImportParams({ mapping, records })
        capacityBlocked = true
        setShowCsvModal(false)
      } else {
        setToast({
          message: err instanceof Error && err.message ? err.message : 'CSV import failed. Please check the file format.',
          type: 'error',
        })
      }
    } finally {
      setImporting(false)
      if (!capacityBlocked) setShowCsvModal(false)
    }
  }

  const csvHeaders = participantFields.map((f) => f.key)
  const csvRequired = ['name']

  const hasDepartmentData = participants.some((p) => Boolean(p.department))
  const extraColumns = participantFields
    .filter((f) => f.key !== 'name' && f.key !== 'email' && hasParticipantData(participants, f.key))
    .map((f) => ({ key: f.key, label: f.label }))
  if (hasDepartmentData && !extraColumns.some((c) => c.key === 'department')) {
    extraColumns.push({ key: 'department', label: 'Department' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input name="search" value={partSearch} onChange={(e) => { setPartSearch(e.target.value); setPartPage(1) }} placeholder="Search participants..." aria-label="Search participants"
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              const headers = ['Name', 'Email', 'Department', 'Registration', 'Verification', 'Pass Status']
              const rows = filtered.map((p) => [p.name, p.email, p.department, p.registrationStatus, p.verificationStatus, p.votingPassStatus])
              const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive">
            <Download size={12} />
            Export
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCsvModal(true)}
            disabled={locked}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40 disabled:cursor-not-allowed">
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {importing ? 'Importing...' : 'Import'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            disabled={locked}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: pColor }}>
            <Plus size={12} />
            Add Participant
          </motion.button>
          {!locked && participants.length > 0 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmDialog({
                message: `Remove all ${participants.length} participant${participants.length === 1 ? '' : 's'} from this event? This cannot be undone.`,
                onConfirm: handleClearAll,
              })}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-status-error/30 text-status-error hover:bg-status-error/10 disabled:opacity-40 disabled:cursor-not-allowed">
              {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {clearing ? 'Clearing...' : 'Clear All Imports'}
            </motion.button>
          )}
        </div>
      </div>

      {locked && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-warning/10 border border-status-warning/20">
          <Lock size={14} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-warning font-medium">The participant roster is locked while voting is in progress or after the election has ended.</p>
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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-brand-text-muted font-bold mr-1">Reg:</span>
          {(['all', 'registered', 'verified', 'approved', 'rejected'] as const).map((s) => (
            <button key={s} onClick={() => { setRegFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all capitalize ${
                regFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={regFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-brand-text-muted font-bold mr-1">Ver:</span>
          {(['all', 'pending', 'verified', 'failed'] as const).map((s) => (
            <button key={s} onClick={() => { setVerFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all capitalize ${
                verFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={verFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-brand-text-muted font-bold mr-1">Pass:</span>
          {(['all', 'not_issued', 'issued', 'used', 'expired'] as const).map((s) => (
            <button key={s} onClick={() => { setPassFilter(s); setPartPage(1) }}
              className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all capitalize ${
                passFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={passFilter === s ? { backgroundColor: pColor } : {}}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {paged.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={UserCheck} title="No Participants Found"
            description={partSearch || regFilter !== 'all' || verFilter !== 'all' || passFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No participants registered yet. Add participants manually or import a CSV.'}
            action={!locked ? { label: 'Add Participant', onClick: () => setShowAddModal(true) } : undefined} />
        </DashboardCard>
      ) : (
        <DashboardCard hover={false}>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-brand-surface-elevated/50">
              <span className="text-[10px] text-brand-text-muted">{selectedIds.size} selected</span>
              {!locked && (
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={async () => {
                      const ids = Array.from(selectedIds)
                      await Promise.all(ids.map(id => getApiClient().put(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${id}`, { registrationStatus: 'approved' })))
                      setSelectedIds(new Set())
                      onDataChanged?.()
                    }}
                    className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-success cursor-pointer"
                    title="Approve selected"
                  >
                    <CheckCircle size={12} />
                  </button>
                  <button
                    onClick={async () => {
                      const ids = Array.from(selectedIds)
                      await Promise.all(ids.map(id => getApiClient().put(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${id}`, { registrationStatus: 'rejected' })))
                      setSelectedIds(new Set())
                      onDataChanged?.()
                    }}
                    className="p-1 rounded-lg hover:bg-brand-surface-interactive text-status-error cursor-pointer"
                    title="Reject selected"
                  >
                    <XCircle size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-divider">
                  <th className="px-3 py-3 w-8">
                    <input name="selectAll" type="checkbox" checked={selectedIds.size === paged.length && paged.length > 0} onChange={toggleSelectAll} aria-label="Select all participants"
                      className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                  </th>
                  <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Name</th>
                  <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Email</th>
                  {extraColumns.map((col) => (
                    <th key={col.key} className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">{col.label}</th>
                  ))}
                  <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Registration</th>
                  <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Verification</th>
                  <th className="px-3 py-3 text-[9px] text-brand-text-muted font-bold">Pass Status</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.id} className="border-b border-brand-divider last:border-0 hover:bg-brand-surface-interactive/30 transition-colors">
                    <td className="px-3 py-3">
                      <input name="selectParticipant" type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label="Select participant"
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
                    <td className="px-3 py-3 text-[10px] text-brand-text-muted">{p.email}</td>
                    {extraColumns.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-[10px] text-brand-text-muted">{participantFieldValue(p, col.key)}</td>
                    ))}
                    <td className="px-3 py-3">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${PARTICIPANT_REG_STYLES[p.registrationStatus] || ''}`}>
                        {p.registrationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${VERIFICATION_STYLES[p.verificationStatus] || ''}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${PASS_STYLES[p.votingPassStatus] || ''}`}>
                        {p.votingPassStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => {
                          if (menuOpenId === p.id) { setMenuOpenId(null); setMenuPos(null) }
                          else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                            setMenuOpenId(p.id)
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {menuOpenId === p.id && menuPos && createPortal(
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => { setMenuOpenId(null); setMenuPos(null) }} />
                          <div className="fixed z-50 w-36 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
                            <button
                              onClick={() => { setToast({ message: `Name: ${p.name}\nEmail: ${p.email}\nReg: ${p.registrationStatus}\nVer: ${p.verificationStatus}\nPass: ${p.votingPassStatus}`, type: 'info' }); setMenuOpenId(null); setMenuPos(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                            >
                              <Eye size={12} />
                              View Details
                            </button>
                            {!locked && (
                              <button
                                onClick={async () => { await getApiClient().put(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${p.id}`, { registrationStatus: 'approved' }); setMenuOpenId(null); setMenuPos(null); onDataChanged?.() }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                              >
                                <UserCheck size={12} />
                                Approve
                              </button>
                            )}
                            {!locked && (
                              <button
                                onClick={async () => { setConfirmDialog({ message: `Remove participant "${p.name}"?`, onConfirm: async () => { await getApiClient().delete(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${p.id}`); setMenuOpenId(null); setMenuPos(null); onDataChanged?.() } }) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-error hover:bg-brand-surface-interactive transition-colors"
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            )}
                          </div>
                        </>,
                        document.body
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden divide-y divide-brand-divider">
            {paged.map((p) => (
              <div key={p.id} className="px-3 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input name="selectParticipant" type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label="Select participant"
                      className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)]" />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ backgroundColor: pColor }}>
                      {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-brand-text-primary">{p.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      if (menuOpenId === p.id) { setMenuOpenId(null); setMenuPos(null) }
                      else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                        setMenuOpenId(p.id)
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpenId === p.id && menuPos && createPortal(
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setMenuOpenId(null); setMenuPos(null) }} />
                      <div className="fixed z-50 w-36 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
                        <button
                          onClick={() => { setToast({ message: `Name: ${p.name}\nEmail: ${p.email}\nReg: ${p.registrationStatus}\nVer: ${p.verificationStatus}\nPass: ${p.votingPassStatus}`, type: 'info' }); setMenuOpenId(null); setMenuPos(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                        >
                          <Eye size={12} />
                          View Details
                        </button>
                        {!locked && (
                          <button
                            onClick={async () => { await getApiClient().put(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${p.id}`, { registrationStatus: 'approved' }); setMenuOpenId(null); setMenuPos(null); onDataChanged?.() }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                          >
                            <UserCheck size={12} />
                            Approve
                          </button>
                        )}
                        {!locked && (
                          <button
                            onClick={async () => { setConfirmDialog({ message: `Remove participant "${p.name}"?`, onConfirm: async () => { await getApiClient().delete(API.ENDPOINTS.VOTERS.BASE(event.id) + `/${p.id}`); setMenuOpenId(null); setMenuPos(null); onDataChanged?.() } }) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-error hover:bg-brand-surface-interactive transition-colors"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        )}
                      </div>
                    </>,
                    document.body
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div>
                    <span className="text-[8px] text-brand-text-muted font-bold block">Email</span>
                    <span className="text-[10px] text-brand-text-primary truncate block">{p.email}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-brand-text-muted font-bold block">Registration</span>
                    <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full border ${PARTICIPANT_REG_STYLES[p.registrationStatus] || ''}`}>
                      {p.registrationStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-brand-text-muted font-bold block">Verification</span>
                    <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full border ${VERIFICATION_STYLES[p.verificationStatus] || ''}`}>
                      {p.verificationStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-brand-text-muted font-bold block">Pass Status</span>
                    <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full border ${PASS_STYLES[p.votingPassStatus] || ''}`}>
                      {p.votingPassStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-brand-divider">
              <span className="text-[9px] text-brand-text-muted">Page {partPage} of {totalPages}</span>
              <div className="flex flex-wrap items-center gap-1 max-w-full">
                <button onClick={() => setPartPage(Math.max(1, partPage - 1))} disabled={partPage === 1}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                {pageNumbers.map((n, idx, arr) => {
                  const prev = arr[idx - 1]
                  return (
                    <Fragment key={n}>
                      {prev !== undefined && n - prev > 1 && (
                        <span className="w-7 h-7 flex items-center justify-center text-[10px] text-brand-text-muted">…</span>
                      )}
                      <button onClick={() => setPartPage(n)}
                        className={`w-7 h-7 min-w-7 rounded-lg text-[10px] font-bold transition-all ${
                          partPage === n ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                        }`}
                        style={partPage === n ? { backgroundColor: pColor } : {}}>{n}</button>
                    </Fragment>
                  )
                })}
                <button onClick={() => setPartPage(Math.min(totalPages, partPage + 1))} disabled={partPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </DashboardCard>
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
          // spec §5: import only the permitted number of valid participants
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
                {participantFields.map((field) => {
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium ${toast.type === 'error' ? 'bg-status-danger/10 border-status-danger/30 text-status-danger' : toast.type === 'success' ? 'bg-status-success/10 border-status-success/30 text-status-success' : 'bg-status-info/10 border-status-info/30 text-status-info'}`}>
            {toast.type === 'error' ? <XCircle size={14} /> : toast.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span className="whitespace-pre-line">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 p-0.5 rounded hover:bg-black/5"><X size={12} /></button>
          </div>
        </div>
      )}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <p className="text-xs text-brand-text-primary mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive transition-all">Cancel</button>
              <button onClick={async () => { const action = confirmDialog.onConfirm; setConfirmDialog(null); await action(); }} className="px-4 py-2 rounded-xl text-[10px] font-bold bg-status-danger text-white hover:bg-status-danger-strong transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
