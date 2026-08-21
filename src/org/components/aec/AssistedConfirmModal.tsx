import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'

interface AssistedConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  brandColor?: string
}

export default function AssistedConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  brandColor = '#D4AF37',
}: AssistedConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel, loading])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={loading ? undefined : onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="glass-strong rounded-2xl shadow-brand-lg flex flex-col w-full max-w-md"
          >
            <div className="flex items-start justify-between gap-3 p-6 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  <AlertTriangle size={18} style={{ color: brandColor }} />
                </div>
                <h2 className="text-sm font-bold text-brand-text-primary leading-tight">{title}</h2>
              </div>
              {!loading && (
                <button
                  onClick={onCancel}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="px-6 pb-4">
              <p className="text-xs text-brand-text-muted leading-relaxed">{description}</p>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t border-brand-border">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: brandColor }}
              >
                {loading ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
