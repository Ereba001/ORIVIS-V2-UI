import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface AuditNoteModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor?: string
  loading?: boolean
  onConfirm: (note: string) => void
  onClose: () => void
}

export default function AuditNoteModal({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = '#ef4444',
  loading = false,
  onConfirm,
  onClose,
}: AuditNoteModalProps) {
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    if (!note.trim()) return
    onConfirm(note.trim())
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--org-surface, #0d0d14)',
              borderColor: 'var(--org-border, #1e1e2e)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${confirmColor}18` }}
                >
                  <AlertTriangle size={16} style={{ color: confirmColor }} />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--org-text, #e4e4ef)' }}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={14} style={{ color: 'var(--org-muted, #6b6b80)' }} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--org-muted, #6b6b80)' }}>
              {description}
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                Audit Note (required)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Reason for this action..."
                disabled={loading}
                className="w-full rounded-xl border px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 transition-all placeholder:opacity-40"
                style={{
                  backgroundColor: 'var(--org-surface-elevated, #14141f)',
                  borderColor: 'var(--org-border, #1e1e2e)',
                  color: 'var(--org-text, #e4e4ef)',
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-[10px] font-bold border transition-colors"
                style={{
                  borderColor: 'var(--org-border, #1e1e2e)',
                  color: 'var(--org-muted, #6b6b80)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !note.trim()}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: confirmColor }}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
