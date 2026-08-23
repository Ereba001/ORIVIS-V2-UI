import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Clock, Loader2 } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'

interface TimingDeviation {
  field: string
  configured: string
  requested: string
  isEarlier: boolean
  differenceMinutes: number
  message: string
}

interface TimingDeviationModalProps {
  open: boolean
  deviations: TimingDeviation[]
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading?: boolean
}

const fieldLabels: Record<string, string> = {
  voting_starts_at: 'Voting start time',
  voting_ends_at: 'Voting end time',
  registration_starts_at: 'Registration start time',
  registration_ends_at: 'Registration end time',
}

export default function TimingDeviationModal({
  open,
  deviations,
  onConfirm,
  onCancel,
  loading = false,
}: TimingDeviationModalProps) {
  const { branding } = useOrgBranding()
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    onConfirm(reason.trim())
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
          onClick={loading ? undefined : onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--org-surface, #0d0d14)',
              borderColor: 'var(--org-border, #1e1e2e)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-status-warning/10">
                  <AlertTriangle size={16} className="text-status-warning" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--org-text, #e4e4ef)' }}>
                  Schedule Deviation Detected
                </h3>
              </div>
              {!loading && (
                <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <X size={14} style={{ color: 'var(--org-muted, #6b6b80)' }} />
                </button>
              )}
            </div>

            {/* Deviation Details */}
            <div className="space-y-3 mb-4">
              {deviations.map((dev, i) => (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: 'var(--org-border, #1e1e2e)', backgroundColor: 'var(--org-surface-elevated, #14141f)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={12} className="text-status-warning" />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                      {fieldLabels[dev.field] ?? dev.field}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--org-text, #e4e4ef)' }}>
                    {dev.message}
                  </p>
                  <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                    <span>Scheduled: {new Date(dev.configured).toLocaleString()}</span>
                    <span>Changed to: {new Date(dev.requested).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div className="p-3 rounded-xl bg-status-warning/10 border border-status-warning/20 mb-4">
              <p className="text-[10px] text-status-warning">
                This action deviates from the configured schedule and will be recorded in the audit trail.
              </p>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                Reason (required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this change is needed..."
                disabled={loading}
                className="w-full rounded-xl border px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 transition-all placeholder:opacity-40"
                style={{
                  backgroundColor: 'var(--org-surface-elevated, #14141f)',
                  borderColor: 'var(--org-border, #1e1e2e)',
                  color: 'var(--org-text, #e4e4ef)',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
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
                disabled={loading || !reason.trim()}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
