import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Archive, Search, Filter, Calendar, Clock, Trash2,
  RotateCcw, MoreHorizontal, AlertTriangle, History
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import SeoHead from "../../components/SeoHead"
import type { ArchiveRecord } from '../types'

type ReasonFilter = 'all' | 'completed' | 'cancelled' | 'expired'

interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
}

const MOCK_ARCHIVE_RECORDS: ArchiveRecord[] = [
  {
    id: 'arc-1', eventId: 'evt-10', eventTitle: 'Alumni Mentorship Program Survey',
    archivedAt: '2026-07-01T10:00:00Z',
    reason: 'completed',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-07-01T10:00:00Z', user: 'System' },
      { action: 'Export Created', timestamp: '2026-07-01T10:05:00Z', user: 'System' },
    ],
    canRestore: false, retentionPeriod: '1 year',
  },
  {
    id: 'arc-2', eventId: 'evt-9', eventTitle: 'Campus Facilities Feedback Poll',
    archivedAt: '2026-07-08T10:00:00Z',
    reason: 'completed',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-07-08T10:00:00Z', user: 'System' },
      { action: 'Data Exported', timestamp: '2026-07-08T10:10:00Z', user: 'System' },
      { action: 'Results Published', timestamp: '2026-07-09T08:00:00Z', user: 'Chioma Okafor' },
    ],
    canRestore: false, retentionPeriod: '1 year',
  },
  {
    id: 'arc-3', eventId: 'evt-6', eventTitle: 'Research Grant Allocation Committee Vote',
    archivedAt: '2026-06-18T10:00:00Z',
    reason: 'completed',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-06-18T10:00:00Z', user: 'System' },
    ],
    canRestore: true, retentionPeriod: '2 years',
  },
  {
    id: 'arc-4', eventId: 'evt-7', eventTitle: 'Emergency Student Assembly Vote',
    archivedAt: '2026-06-05T08:00:00Z',
    reason: 'cancelled',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-06-05T08:00:00Z', user: 'System' },
      { action: 'Cancelled Notification Sent', timestamp: '2026-06-05T08:30:00Z', user: 'Chioma Okafor' },
    ],
    canRestore: true, retentionPeriod: '1 year',
  },
  {
    id: 'arc-5', eventId: 'evt-8', eventTitle: 'Faculty Hiring Committee Election',
    archivedAt: '2026-05-20T14:00:00Z',
    reason: 'expired',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-05-20T14:00:00Z', user: 'System' },
      { action: 'Retention Review', timestamp: '2026-06-01T09:00:00Z', user: 'Tunde Bakare' },
    ],
    canRestore: false, retentionPeriod: '6 months',
  },
  {
    id: 'arc-6', eventId: 'evt-5', eventTitle: 'Q2 Financial Audit Election',
    archivedAt: '2026-05-15T11:00:00Z',
    reason: 'completed',
    archiveHistory: [
      { action: 'Archived', timestamp: '2026-05-15T11:00:00Z', user: 'System' },
      { action: 'Final Report Generated', timestamp: '2026-05-15T12:00:00Z', user: 'System' },
      { action: 'Results Certified', timestamp: '2026-05-16T09:00:00Z', user: 'Adaobi Okafor' },
    ],
    canRestore: false, retentionPeriod: '3 years',
  },
]

export default function OrgArchiveCentre() {
  const { branding } = useOrgBranding()
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ open: false, title: '', description: '', onConfirm: () => {} })

  const filtered = useMemo(() => {
    let result = [...MOCK_ARCHIVE_RECORDS]
    if (reasonFilter !== 'all') result = result.filter((r) => r.reason === reasonFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.eventTitle.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    }
    return result
  }, [reasonFilter, search])

  const reasonCounts = useMemo(() => ({
    all: MOCK_ARCHIVE_RECORDS.length,
    completed: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'completed').length,
    cancelled: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'cancelled').length,
    expired: MOCK_ARCHIVE_RECORDS.filter((r) => r.reason === 'expired').length,
  }), [])

  const handleRestore = (record: ArchiveRecord) => {
    setConfirmDialog({
      open: true,
      title: `Restore "${record.eventTitle}"?`,
      description: `This will restore the archived event and make it available again. This action can be undone.`,
      onConfirm: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
    })
  }

  const handlePermanentDelete = (record: ArchiveRecord) => {
    setConfirmDialog({
      open: true,
      title: `Permanently delete "${record.eventTitle}"?`,
      description: 'This action cannot be undone. All archived data will be permanently removed.',
      onConfirm: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
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

  const REASON_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    completed: 'success', cancelled: 'error', expired: 'warning',
  }

  return (
    <>
      <SeoHead meta={{ title: 'Archive Centre — Organization | ORIVIS', noindex: true }} />
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary">
              Archive Centre
            </h1>
            <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
              Manage archived events and data
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-text-muted">
            <Archive size={12} />
            <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived events..."
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-1 bg-brand-surface-elevated rounded-xl p-0.5">
            {(['all', 'completed', 'cancelled', 'expired'] as ReasonFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setReasonFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider transition-all ${
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
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0 mt-0.5" style={{ color: 'var(--org-primary)' }}>
                    <Archive size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-brand-text-primary truncate">{record.eventTitle}</p>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        record.reason === 'completed' ? 'text-status-success border-status-success/20 bg-status-success/10' :
                        record.reason === 'cancelled' ? 'text-status-error border-status-error/20 bg-status-error/10' :
                        'text-status-warning border-status-warning/20 bg-status-warning/10'
                      }`}>
                        {REASON_LABELS[record.reason]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-brand-text-muted">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(record.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {record.retentionPeriod}</span>
                      <span className="flex items-center gap-1"><History size={10} /> {record.archiveHistory.length} actions</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-brand-text-muted">Retention:</span>
                      <ProgressBar value={100} max={100} size="sm" color={record.retentionPeriod === '6 months' ? '#ef4444' : record.retentionPeriod === '1 year' ? '#f59e0b' : record.retentionPeriod === '2 years' ? '#FCA311' : '#10b981'} showLabel={false} />
                      <span className={`text-[9px] font-mono font-bold ${RETENTION_COLORS[record.retentionPeriod] || 'text-brand-text-muted'}`}>{record.retentionPeriod}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {record.canRestore && (
                      <button
                        onClick={() => handleRestore(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-all"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    )}
                    <button
                      onClick={() => handlePermanentDelete(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-brand-text-muted hover:text-status-error hover:bg-status-error/10 transition-all"
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
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">Archive History</span>
                </div>
                <div className="space-y-2">
                  {record.archiveHistory.map((entry, j) => (
                    <div key={j} className="flex items-center gap-3 text-[10px] font-mono text-brand-text-muted">
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
                  <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center" style={{ color: '#ef4444' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-text-primary">{confirmDialog.title}</h3>
                </div>
                <p className="text-xs text-brand-text-muted mb-6">{confirmDialog.description}</p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-brand-text-muted border border-brand-border hover:bg-brand-surface-interactive transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white transition-all bg-status-error hover:bg-status-error/80"
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