import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Search, Plus, Lock, Image, Trophy, XCircle, CheckCircle, AlertTriangle, X, GripVertical,
} from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import CandidateCard from '../../components/CandidateCard'
import CandidateFormModal from '../../components/CandidateFormModal'
import { eventService } from '../../services/event-service'
import { electionService } from '../../../services/election-service'
import { ROUTES } from '../../../constants/routes'
import { type OrivisEvent, type EventPosition, type EventCandidate } from './_shared'

function PositionFormModal({ open, onClose, onCreated, eventId }: {
  open: boolean; onClose: () => void; onCreated: () => void; eventId: string
}) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxSelections, setMaxSelections] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (!open) { setTitle(''); setDescription(''); setMaxSelections(1); setError(null) } }, [open])

  const handleSave = async () => {
    if (!title.trim()) { setError('Position title is required'); return }
    setSaving(true); setError(null)
    try {
      await eventService.createPosition(eventId, { title: title.trim(), description: description.trim() || undefined, maxSelections })
      onCreated(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create position')
    } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-brand-text-primary">Add Position</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><X size={14} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted block mb-1">Position Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. President, Treasurer"
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted block mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description or responsibilities..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-text-muted block mb-1">Max Selections (winners)</label>
            <input type="number" min={1} max={20} value={maxSelections} onChange={(e) => setMaxSelections(Number(e.target.value) || 1)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text-primary focus:outline-none transition-all" />
          </div>
          {error && <p className="text-[10px] text-status-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: pColor }}>
            {saving ? 'Saving...' : 'Create Position'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function CandidatesTab({ event, positions, locked, onDataChanged }: { event: OrivisEvent; positions: EventPosition[]; locked?: boolean; onDataChanged: () => void }) {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [candSearch, setCandSearch] = useState('')
  const [candFilter, setCandFilter] = useState<string>('all')
  const [reorderedPositions, setReorderedPositions] = useState(positions)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [candidatePositionId, setCandidatePositionId] = useState<string | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<EventCandidate | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)

  useEffect(() => { setReorderedPositions(positions) }, [positions])

  const allCandidates = reorderedPositions.flatMap((p) => p.candidates)
  const approvedCount = allCandidates.filter((c) => c.status === 'approved' || c.status === 'published').length
  const filtered = allCandidates.filter((c) => {
    if (candFilter !== 'all' && c.status !== candFilter) return false
    if (candSearch && !c.name.toLowerCase().includes(candSearch.toLowerCase()) && !c.email.toLowerCase().includes(candSearch.toLowerCase())) return false
    return true
  })

  const candidateStatuses = ['all', ...Array.from(new Set(allCandidates.map((c) => c.status)))]

  const handleReorder = async (candidateId: string, direction: 'up' | 'down') => {
    setReorderedPositions((prev) => {
      const next = prev.map((pos) => ({ ...pos, candidates: [...pos.candidates] }))
      for (const pos of next) {
        const idx = pos.candidates.findIndex((c) => c.id === candidateId)
        if (idx === -1) continue
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1
        if (targetIdx < 0 || targetIdx >= pos.candidates.length) continue
        ;[pos.candidates[idx], pos.candidates[targetIdx]] = [pos.candidates[targetIdx], pos.candidates[idx]]
        pos.candidates.forEach((c, i) => { c.ballotOrder = i + 1 })
        void persistReorder(event.id, pos.id, pos.candidates.map((c) => c.id))
      }
      return next
    })
  }

  const persistReorder = async (electionId: string, positionId: string, orderedIds: string[]) => {
    try {
      await electionService.reorderCandidates(electionId, positionId, orderedIds)
      setToast({ message: 'Candidate order saved.', type: 'success' })
      onDataChanged()
    } catch {
      setToast({ message: 'Failed to save candidate order.', type: 'error' })
      onDataChanged()
    }
  }

  const openEditCandidate = (candidate: EventCandidate) => {
    setEditingCandidate(candidate)
    setShowAddCandidate(true)
  }

  const closeCandidateModal = () => {
    setShowAddCandidate(false)
    setCandidatePositionId(null)
    setEditingCandidate(null)
  }

  const openAddCandidateForPosition = (positionId: string) => {
    setEditingCandidate(null)
    setCandidatePositionId(positionId)
    setShowAddCandidate(true)
  }

  const openAddCandidateGlobal = () => {
    setEditingCandidate(null)
    setCandidatePositionId(null)
    setShowAddCandidate(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input name="search" value={candSearch} onChange={(e) => setCandSearch(e.target.value)} placeholder="Search candidates..." aria-label="Search candidates"
              className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {candidateStatuses.map((s) => (
              <button key={s} onClick={() => setCandFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all capitalize ${
                  candFilter === s ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
                }`}
                style={candFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button onClick={() => navigate(ROUTES.ORG.EVENT_RESULTS(event.id))} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive shrink-0">
            <Image size={14} /> Ballot Preview
          </motion.button>
          {!locked && (
            <>
              <motion.button onClick={() => setShowAddPosition(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive shrink-0">
                <Trophy size={14} /> Add Position
              </motion.button>
              <motion.button onClick={openAddCandidateGlobal} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white shrink-0"
                style={{ backgroundColor: pColor }}>
                <Plus size={14} /> Add Candidate
              </motion.button>
            </>
          )}
        </div>
      </div>

      {locked && (
        <p className="text-[9px] text-brand-text-muted/50 flex items-center gap-1.5">
          <Lock size={10} /> Candidate management is locked because this event has been published.
        </p>
      )}

      {reorderedPositions.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={Trophy} title="No Positions Defined"
            description="Add a position (e.g. President, Treasurer) before adding candidates."
            action={locked ? undefined : { label: 'Add Position', onClick: () => setShowAddPosition(true) }} />
        </DashboardCard>
      ) : (
        <div className="space-y-8">
          {reorderedPositions.map((pos) => {
            const posCandidates = filtered.filter((c) => c.positionId === pos.id)
            return (
              <div key={pos.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {!locked && <GripVertical size={14} className="text-brand-text-muted" />}
                    <Trophy size={14} style={{ color: pColor }} />
                    <h3 className="text-xs font-bold" style={{ color: pColor }}>{pos.title}</h3>
                    <span className="text-[9px] text-brand-text-muted">({pos.candidates.length} candidate{pos.candidates.length !== 1 ? 's' : ''})</span>
                  </div>
                  {!locked && (
                    <button onClick={() => openAddCandidateForPosition(pos.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all text-white hover:opacity-90"
                      style={{ backgroundColor: pColor }}>
                      <Plus size={10} /> Add
                    </button>
                  )}
                </div>
                {pos.candidates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {posCandidates.map((candidate, i) => (
                      <CandidateCard key={candidate.id} candidate={candidate} positionTitle={pos.title} index={i}
                        onReorder={locked ? undefined : handleReorder}
                        onView={(c) => setToast({ message: `Candidate: ${c.name}\nEmail: ${c.email}\nPosition: ${pos.title}\nStatus: ${c.status}\nVote Count: ${c.voteCount}`, type: 'info' })}
                        onEdit={(c) => openEditCandidate(c)}
                        onRemove={async (c) => { setConfirmDialog({ message: `Remove candidate "${c.name}"?`, onConfirm: async () => { await electionService.deleteCandidate(event.id, pos.id, c.id); onDataChanged() } }) }}
                        onPhotoUpload={async (c, file) => { const fd = new FormData(); fd.append('photo', file); await electionService.updateCandidate(event.id, pos.id, c.id, fd as unknown as Record<string, unknown>); onDataChanged() }}
                        onManifestoUpload={async (c, file) => { const fd = new FormData(); fd.append('manifesto', file); await electionService.updateCandidate(event.id, pos.id, c.id, fd as unknown as Record<string, unknown>); onDataChanged() }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-brand-surface-elevated/20 border border-dashed border-brand-border text-center">
                    <p className="text-[10px] text-brand-text-muted">No candidates added to this position yet.</p>
                    {!locked && (
                      <button onClick={() => openAddCandidateForPosition(pos.id)}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold text-white hover:opacity-90"
                        style={{ backgroundColor: pColor }}>
                        <Plus size={10} /> Add Candidate
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CandidateFormModal
        open={showAddCandidate}
        onClose={closeCandidateModal}
        onCreated={() => { onDataChanged(); setCandidatePositionId(null); setEditingCandidate(null) }}
        eventId={event.id}
        positions={reorderedPositions}
        candidateSlots={event.candidateSlots}
        approvedCount={approvedCount}
        initialPositionId={candidatePositionId}
        initialCandidate={editingCandidate}
      />

      <PositionFormModal open={showAddPosition} onClose={() => setShowAddPosition(false)} onCreated={onDataChanged} eventId={event.id} />

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
