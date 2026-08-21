import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react'

export type OperationState = 'idle' | 'validating' | 'processing' | 'success' | 'error'

interface OperationProgressModalProps {
  open: boolean
  state: OperationState
  title: string
  stages?: string[]
  currentStage?: number
  successTitle?: string
  successMessage?: string
  errorTitle?: string
  errorMessage?: string
  successActionLabel?: string
  errorActionLabel?: string
  onSuccessAction?: () => void
  onErrorAction?: () => void
  onClose: () => void
  brandColor?: string
}

export default function OperationProgressModal({
  open,
  state,
  title,
  stages = [],
  currentStage = 0,
  successTitle = 'Operation Completed',
  successMessage = 'The operation has been completed successfully.',
  errorTitle = 'Operation Failed',
  errorMessage = 'Something went wrong. Please try again.',
  successActionLabel = 'Continue',
  errorActionLabel = 'Try Again',
  onSuccessAction,
  onErrorAction,
  onClose,
  brandColor = '#D4AF37',
}: OperationProgressModalProps) {
  const isProcessing = state === 'validating' || state === 'processing'

  // Auto-close on success after 2 seconds if no action button
  useEffect(() => {
    if (state === 'success' && !onSuccessAction) {
      const timer = setTimeout(onClose, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, onSuccessAction, onClose])

  // Prevent permanent stuck state: allow user to close after 60s of processing
  useEffect(() => {
    if (isProcessing) {
      const timeout = setTimeout(onClose, 60_000)
      return () => clearTimeout(timeout)
    }
  }, [isProcessing, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={isProcessing ? undefined : onClose}
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
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  {state === 'success' ? (
                    <CheckCircle size={16} className="text-status-success" />
                  ) : state === 'error' ? (
                    <AlertCircle size={16} className="text-status-error" />
                  ) : state === 'idle' ? (
                    <Info size={16} style={{ color: brandColor }} />
                  ) : (
                    <Loader2 size={16} className="animate-spin" style={{ color: brandColor }} />
                  )}
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--org-text, #e4e4ef)' }}>
                  {state === 'success' ? successTitle : state === 'error' ? errorTitle : title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={14} style={{ color: 'var(--org-muted, #6b6b80)' }} />
              </button>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="space-y-4">
                {/* Current Stage */}
                <div className="space-y-2">
                  {stages.map((stage, index) => {
                    const isCurrent = index === currentStage
                    const isCompleted = index < currentStage

                    return (
                      <div key={index} className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isCompleted
                              ? '#22C55E20'
                              : isCurrent
                                ? `${brandColor}20`
                                : 'var(--org-surface-elevated, #14141f)',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle size={10} className="text-status-success" />
                          ) : isCurrent ? (
                            <Loader2 size={10} className="animate-spin" style={{ color: brandColor }} />
                          ) : (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--org-muted, #6b6b80)' }} />
                          )}
                        </div>
                        <span
                          className="text-[11px]"
                          style={{
                            color: isCompleted
                              ? 'var(--org-text, #e4e4ef)'
                              : isCurrent
                                ? 'var(--org-text, #e4e4ef)'
                                : 'var(--org-muted, #6b6b80)',
                            fontWeight: isCurrent ? 600 : 400,
                          }}
                        >
                          {stage}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Success State */}
            {state === 'success' && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                  {successMessage}
                </p>
                {onSuccessAction && (
                  <div className="flex justify-end">
                    <button
                      onClick={onSuccessAction}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all"
                      style={{ backgroundColor: brandColor }}
                    >
                      {successActionLabel}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: 'var(--org-muted, #6b6b80)' }}>
                  {errorMessage}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold border transition-colors"
                    style={{
                      borderColor: 'var(--org-border, #1e1e2e)',
                      color: 'var(--org-muted, #6b6b80)',
                    }}
                  >
                    Close
                  </button>
                  {onErrorAction && (
                    <button
                      onClick={onErrorAction}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all"
                      style={{ backgroundColor: brandColor }}
                    >
                      {errorActionLabel}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
