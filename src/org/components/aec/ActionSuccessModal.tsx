import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, X } from 'lucide-react'

interface ActionSuccessModalProps {
  open: boolean
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  brandColor?: string
}

export default function ActionSuccessModal({
  open,
  title = 'Action Completed',
  message,
  actionLabel,
  onAction,
  onClose,
  brandColor = '#D4AF37',
}: ActionSuccessModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || onAction) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [open, onAction, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/18">
                  <CheckCircle size={18} className="text-emerald-500" />
                </div>
                <h2 className="text-sm font-bold text-brand-text-primary leading-tight">{title}</h2>
              </div>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 pb-4">
              <p className="text-xs text-brand-text-muted leading-relaxed">{message}</p>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t border-brand-border">
              {actionLabel && onAction && (
                <button
                  onClick={onAction}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white rounded-xl transition-all cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  {actionLabel}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
