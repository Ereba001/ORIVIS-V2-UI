import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Info } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  variant = 'danger',
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-brand-surface border border-brand-border rounded-2xl p-6 w-full max-w-sm mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                variant === 'danger' ? 'bg-status-error/10' : 'bg-[var(--org-primary)]/10'
              }`}>
                {variant === 'danger' ? (
                  <AlertTriangle size={18} className="text-status-error" />
                ) : (
                  <Info size={18} style={{ color: 'var(--org-primary)' }} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">{title}</h3>
                {message && <p className="text-[10px] text-brand-text-muted mt-0.5">{message}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-brand-text-muted hover:bg-brand-surface-interactive transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all ${
                  variant === 'danger'
                    ? 'bg-status-error hover:opacity-90'
                    : 'hover:opacity-90'
                }`}
                style={variant === 'primary' ? { backgroundColor: 'var(--org-primary)' } : undefined}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
