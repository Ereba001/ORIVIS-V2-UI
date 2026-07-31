import { motion } from "motion/react"
import { AlertTriangle, X } from "lucide-react"

interface VoteConfirmationProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function VoteConfirmation({ open, onClose, onConfirm, loading }: VoteConfirmationProps) {
  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-surface border border-brand-border rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-warning/20 flex items-center justify-center">
              <AlertTriangle size={20} className="text-status-warning" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Confirm Vote</h2>
              <p className="text-xs text-brand-text-muted">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-surface-interactive flex items-center justify-center hover:bg-brand-surface-elevated transition-colors cursor-pointer shrink-0"
          >
            <X size={16} className="text-brand-text-muted" />
          </button>
        </div>

        <div className="bg-brand-bg-secondary/50 border border-brand-border rounded-xl p-5 mb-6">
          <p className="text-sm text-brand-text-primary font-medium text-center">
            Are you sure you want to cast your vote?
          </p>
          <p className="text-xs text-brand-text-muted text-center mt-2">
            Your vote will be recorded immediately and cannot be changed or retracted.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-brand-border text-brand-text-muted text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-brand-surface transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Confirm & Cast Vote"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
