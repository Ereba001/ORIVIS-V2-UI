import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Archive, Search, Calendar, Clock, Trash2,
  RotateCcw, MoreHorizontal, AlertTriangle, History
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import SeoHead from "../../components/SeoHead"
import type { ArchiveRecord } from '../types'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'

type ReasonFilter = 'all' | 'completed' | 'cancelled' | 'expired'

interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
}

export default function OrgArchiveCentre() {
  const { branding } = useOrgBranding()
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ open: false, title: '', description: '', onConfirm: () => {} })

  const { data, loading, error, reload } = useApiResource(async () => {
    const result = await orgService.getArchive({ perPage: 100 })
    return result.items.map((e) => {
      const id = String(e.id ?? e.uuid ?? '')
      const archivedAt = String(e.archivedAt ?? e.archived_at ?? e.updatedAt ?? e.updated_at ?? '')
      const lifecycle = String(e.lifecycleState ?? e.lifecycle_state ?? e.status ?? '').toLowerCase()
      return {
        id,
        eventId: id,
        eventTitle: String(e.title ?? ''),
        archivedAt,
        reason: lifecycle === 'cancelled' ? 'cancelled' : lifecycle === 'completed' ? 'completed' : 'expired',
        archiveHistory: [
          { action: 'Archived', timestamp: archivedAt, user: 'System' },
        ],
        canRestore: true,
        retentionPeriod: '1 year',
      }
    })
  })

  const MOCK_ARCHIVE_RECORDS = data ?? []

  const filtered = useMemo(() => {
    let result = [...MOCK_ARCHIVE_RECORDS]
    if (reasonFilter !== 'all') result = result.filter((r) => r.reason === reasonFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.eventTitle.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    }
    return result
  }, [reasonFilter, search, MOCK_ARCHIVE_RECORDS])

  const reasonCounts = useMemo(() => ({
    all: MOCK_ARCHIVE_RECORDS.length,
    completed: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'completed').length,
    cancelled: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'cancelled').length,
    expired: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'expired').length,
  }), [MOCK_ARCHIVE_RECORDS])

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: 'Archive Centre — Organization | ORIVIS', noindex: true }} />
        <div className="space-y-6">
          <div className="animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl" />
          <SkeletonLoader rows={4} variant="card" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SeoHead meta={{ title: 'Archive Centre — Organization | ORIVIS', noindex: true }} />
        <EmptyState
          icon={Archive}
          title="Failed to load archive"
          description={error}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const handleRestore = (record: ArchiveRecord) => {
    setConfirmDialog({
      open: true,
      title: `Restore "${record.eventTitle}"?`,
      description: `This will restore the archived event and make it available again. This action can be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          await orgService.restoreArchived(record.eventId)
          reload()
        } catch {
          setConfirmDialog({ open: true, title: 'Restore failed', description: 'Something went wrong while restoring this event.', onConfirm: () => setConfirmDialog((prev) => ({ ...prev, open: false })) })
        }
      },
    })
  }

  const handlePermanentDelete = (record: ArchiveRecord) => {
    setConfirmDialog({
      open: true,
      title: `Permanently delete "${record.eventTitle}"?`,
      description: 'This action cannot be undone. All archived data will be permanently removed.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          await orgService.permanentlyDeleteArchived(record.eventId)
          reload()
        } catch {
          setConfirmDialog({ open: true, title: 'Delete failed', description: 'Something went wrong while deleting this event.', onConfirm: () => setConfirmDialog((prev) => ({ ...prev, open: false })) })
        }
      },
    })
  }

  const RETENTION_COLORS: Record<string, string> = {
    '6 months': 'text-status-error',
    '1 year': 'text-status-warning',
    '2 years': 'text-brand-gold',
    '3 years': 'text-status-success',
  }

  const REASON_LABELS: Record<string, string> = {
    completed: 'Completed', cancelled: 'Cancelled', expired: 'Expired',
  }

  return (
    <>
      <SeoHead meta={{ title: 'Archive Centre — Organization | ORIVIS', noindex: true }} />
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
              Archive Centre
            </h1>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              Manage archived events and data
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-brand-text-muted">
            <Archive size={12} />
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              placeholder="Search archived events..."
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-brand-surface-elevated rounded-xl p-0.5 max-w-full">
            {(['all', 'completed', 'cancelled', 'expired'] as ReasonFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setReasonFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  reasonFilter === filter
                    ? 'text-white'
                    : 'text-brand-text-muted hover:text-brand-text-primary'
                }`}
                style={reasonFilter === filter ? { backgroundColor: branding.primaryColor } : {}}
              >
                {filter === 'all' ? 'All' : REASON_LABELS[filter]}
                <span className={`ml-1.5 px-1 py-0.5 rounded-full text-[8px] font-bold ${
                  reasonFilter === filter ? 'bg-white/20' : 'bg-brand-surface-elevated text-brand-text-disabled'
                }`}>{reasonCounts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden"
            >
              <div className="p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0 mt-0.5" style={{ color: 'var(--org-primary)' }}>
                    <Archive size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-brand-text-primary truncate">{record.eventTitle}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        record.reason === 'completed' ? 'text-status-success border-status-success/20 bg-status-success/10' :
                        record.reason === 'cancelled' ? 'text-status-error border-status-error/20 bg-status-error/10' :
                        'text-status-warning border-status-warning/20 bg-status-warning/10'
                      }`}>
                        {REASON_LABELS[record.reason]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-brand-text-muted">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(record.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {record.retentionPeriod}</span>
                      <span className="flex items-center gap-1"><History size={10} /> {record.archiveHistory.length} actions</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-brand-text-muted">Retention:</span>
                      <ProgressBar value={100} max={100} size="sm" color={record.retentionPeriod === '6 months' ? 'var(--color-status-danger)' : record.retentionPeriod === '1 year' ? 'var(--color-status-warning)' : record.retentionPeriod === '2 years' ? 'var(--color-status-warning)' : 'var(--color-status-success)'} showLabel={false} />
                      <span className={`text-[9px] font-bold ${RETENTION_COLORS[record.retentionPeriod] || 'text-brand-text-muted'}`}>{record.retentionPeriod}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
                    {record.canRestore && (
                      <button
                        onClick={() => handleRestore(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-all"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    )}
                    <button
                      onClick={() => handlePermanentDelete(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-text-muted hover:text-status-error hover:bg-status-error/10 transition-all"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-divider bg-brand-surface-elevated/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <History size={10} className="text-brand-text-muted" />
                  <span className="text-[10px] text-brand-text-muted font-bold">Archive History</span>
                </div>
                <div className="space-y-2">
                  {record.archiveHistory.map((entry, j) => (
                    <div key={j} className="flex items-center gap-3 text-[10px] text-brand-text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-text-muted/40 shrink-0" />
                      <span className="flex-1">{entry.action}</span>
                      <span className="text-brand-text-disabled">{entry.user}</span>
                      <span className="text-brand-text-disabled">{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={Archive}
              title="No Archived Records"
              description={search || reasonFilter !== 'all' ? 'No records match your search or filter.' : 'Archived events will appear here automatically.'}
            />
          )}
        </div>

        <AnimatePresence>
          {confirmDialog.open && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-brand-surface border border-brand-divider rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-text-primary">{confirmDialog.title}</h3>
                </div>
                <p className="text-xs text-brand-text-muted mb-6">{confirmDialog.description}</p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-brand-text-muted border border-brand-border hover:bg-brand-surface-interactive transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all bg-status-error hover:bg-status-error/80"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}