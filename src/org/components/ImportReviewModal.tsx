import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle, CheckCircle, X, ChevronDown, ChevronRight,
  Users, Copy, AlertCircle, XCircle, Shield, Loader2, ArrowRight,
} from 'lucide-react'
import { eventService, type ImportPreviewResult, type ImportPreviewRow } from '../services/event-service'
import type { OrivisEvent } from '../pages/event-detail/_shared'

interface Props {
  open: boolean
  onClose: () => void
  onCommitted: (result: { successful: number; failed: number }) => void
  event: OrivisEvent
  preview: ImportPreviewResult
  fileName: string
}

type CommittingStep = 'review' | 'committing' | 'done' | 'error'

const CATEGORY_CONFIG = {
  ready: { label: 'Ready to Import', icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-success/10', action: 'Import' },
  duplicate_in_file: { label: 'Duplicates in File', icon: Copy, color: 'text-status-warning', bg: 'bg-status-warning/10', action: 'Skip' },
  duplicate_existing: { label: 'Already Exist', icon: Copy, color: 'text-status-warning', bg: 'bg-status-warning/10', action: 'Skip' },
  incomplete: { label: 'Incomplete Records', icon: AlertCircle, color: 'text-status-warning', bg: 'bg-status-warning/10', action: 'Exclude' },
  conflict: { label: 'Conflicting Data', icon: Shield, color: 'text-status-error', bg: 'bg-status-error/10', action: 'Review' },
  invalid: { label: 'Invalid Records', icon: XCircle, color: 'text-status-error', bg: 'bg-status-error/10', action: 'Exclude' },
} as const

const CATEGORY_ORDER: (keyof typeof CATEGORY_CONFIG)[] = ['ready', 'duplicate_in_file', 'duplicate_existing', 'incomplete', 'conflict', 'invalid']

export default function ImportReviewModal({ open, onClose, onCommitted, event, preview, fileName }: Props) {
  const [step, setStep] = useState<CommittingStep>('review')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [importCategories, setImportCategories] = useState<Set<string>>(new Set(['ready']))
  const [error, setError] = useState<string | null>(null)

  const toggleCategory = (cat: string) => {
    const next = new Set(importCategories)
    if (next.has(cat)) {
      next.delete(cat)
    } else {
      next.add(cat)
    }
    setImportCategories(next)
  }

  const totalWillImport = CATEGORY_ORDER
    .filter((cat) => importCategories.has(cat))
    .reduce((sum, cat) => {
      const key = cat === 'duplicate_in_file' ? 'duplicates_in_file'
        : cat === 'duplicate_existing' ? 'duplicates_existing'
        : cat as keyof ImportPreviewResult
      return sum + (Number(preview[key as keyof ImportPreviewResult]) || 0)
    }, 0)

  const handleCommit = async () => {
    if (totalWillImport === 0) return

    setStep('committing')
    setError(null)

    try {
      const result = await eventService.commitImport(event.id, {
        preview_id: preview.preview_id,
        import_ready: importCategories.has('ready'),
        import_duplicates_in_file: importCategories.has('duplicate_in_file'),
        import_duplicates_existing: importCategories.has('duplicate_existing'),
        import_incomplete: importCategories.has('incomplete'),
        import_conflicts: importCategories.has('conflict'),
      })

      setStep('done')
      onCommitted({ successful: result.successful, failed: result.failed })
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    }
  }

  const rowsByCategory = (cat: string): ImportPreviewRow[] =>
    preview.rows.filter((r) => r.category === cat)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 'review' ? onClose : undefined} />

          <motion.div
            className="relative w-full max-w-2xl bg-brand-bg border border-brand-border rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">Import Review</h3>
                <p className="text-[10px] text-brand-text-muted mt-0.5">{fileName} — {preview.total} rows scanned</p>
              </div>
              {step === 'review' && (
                <button onClick={onClose} className="p-1 rounded-lg text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {step === 'review' && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                    {CATEGORY_ORDER.map((cat) => {
                      const config = CATEGORY_CONFIG[cat]
                      const Icon = config.icon
                      const key = cat === 'duplicate_in_file' ? 'duplicates_in_file'
                        : cat === 'duplicate_existing' ? 'duplicates_existing'
                        : cat as keyof ImportPreviewResult
                      const count = Number(preview[key as keyof ImportPreviewResult]) || 0
                      return (
                        <button
                          key={cat}
                          onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                            importCategories.has(cat)
                              ? 'border-brand-gold bg-brand-gold/5'
                              : 'border-brand-border bg-brand-surface hover:bg-brand-surface-elevated'
                          }`}
                        >
                          <Icon size={14} className={count > 0 ? config.color : 'text-brand-text-disabled'} />
                          <span className="text-sm font-bold text-brand-text-primary">{count}</span>
                          <span className="text-[8px] text-brand-text-muted leading-tight text-center">{config.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Category rows */}
                  {CATEGORY_ORDER.map((cat) => {
                    const config = CATEGORY_CONFIG[cat]
                    const Icon = config.icon
                    const key = cat === 'duplicate_in_file' ? 'duplicates_in_file'
                      : cat === 'duplicate_existing' ? 'duplicates_existing'
                      : cat as keyof ImportPreviewResult
                    const count = Number(preview[key as keyof ImportPreviewResult]) || 0
                    if (count === 0) return null

                    const isExpanded = expandedCategory === cat
                    const rows = rowsByCategory(cat)

                    return (
                      <div key={cat} className="border border-brand-border rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-brand-surface cursor-pointer hover:bg-brand-surface-elevated transition-colors"
                          onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={importCategories.has(cat)}
                              onChange={(e) => { e.stopPropagation(); toggleCategory(cat) }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 rounded border-brand-border accent-[var(--org-primary)] cursor-pointer"
                            />
                            <Icon size={14} className={config.color} />
                            <span className="text-xs font-bold text-brand-text-primary">{config.label}</span>
                            <span className="text-[10px] text-brand-text-muted">({count})</span>
                          </div>
                          {isExpanded ? <ChevronDown size={14} className="text-brand-text-muted" /> : <ChevronRight size={14} className="text-brand-text-muted" />}
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 space-y-1 max-h-48 overflow-y-auto">
                                {rows.slice(0, 50).map((row) => (
                                  <div key={row.row} className="flex items-start gap-2 py-1.5 border-b border-brand-divider last:border-0">
                                    <span className="text-[9px] font-mono text-brand-text-muted w-8 shrink-0">R{row.row}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-brand-text-secondary truncate">
                                        {row.data.name || '(no name)'}
                                        {row.data.email ? ` — ${row.data.email}` : ''}
                                      </p>
                                      {row.problems.length > 0 && (
                                        <p className="text-[9px] text-status-error mt-0.5">{row.problems[0]}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {rows.length > 50 && (
                                  <p className="text-[9px] text-brand-text-muted text-center py-1">… and {rows.length - 50} more rows</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </>
              )}

              {step === 'committing' && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 size={24} className="animate-spin text-[var(--org-primary)]" />
                  <p className="text-xs text-brand-text-muted">Importing {totalWillImport} participants…</p>
                </div>
              )}

              {step === 'done' && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                    <CheckCircle size={20} className="text-status-success" />
                  </div>
                  <p className="text-xs font-bold text-status-success">Import Complete</p>
                </div>
              )}

              {step === 'error' && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-status-error" />
                  </div>
                  <p className="text-xs text-status-error text-center">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'review' && (
              <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
                <p className="text-[10px] text-brand-text-muted">
                  {totalWillImport} record{totalWillImport !== 1 ? 's' : ''} will be imported
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-brand-border text-xs font-bold text-brand-text-secondary hover:bg-brand-surface transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommit}
                    disabled={totalWillImport === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--org-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Users size={14} />
                    Confirm Import
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {(step === 'done' || step === 'error') && (
              <div className="px-6 py-4 border-t border-brand-border flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-brand-surface text-xs font-bold text-brand-text-secondary hover:bg-brand-surface-elevated transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
