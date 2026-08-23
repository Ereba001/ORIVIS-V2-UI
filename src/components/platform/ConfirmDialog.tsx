import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, X } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: "danger" | "primary"
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Confirm", confirmVariant = "primary",
}: Props) {
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
            className="glass-strong rounded-2xl p-6 w-full max-w-sm shadow-brand-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${confirmVariant === "danger" ? "bg-status-danger/10 text-status-danger" : "bg-brand-gold/10 text-brand-gold"}`}>
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-bold text-brand-text-primary">{title}</h3>
              </div>
              <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-brand-text-muted leading-relaxed mb-6">{message}</p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary bg-brand-surface-interactive rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose() }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer ${
                  confirmVariant === "danger"
                    ? "bg-status-danger text-white hover:bg-status-danger"
                    : "bg-brand-gold text-black hover:bg-brand-gold-hover"
                }`}
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
