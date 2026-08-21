import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Eye, Shield, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'

type AccessMode = 'view_only' | 'full_control'

interface WorkspaceAccessDialogProps {
  open: boolean
  organizationName: string
  onClose: () => void
  onAccess: (mode: AccessMode, options?: { reason?: string; category?: string; riskLevel?: string; isEmergency?: boolean }) => void
  loading?: boolean
  canFullControl?: boolean
}

const INTERVENTION_CATEGORIES = [
  'Technical Support',
  'Election Recovery',
  'Security Investigation',
  'Configuration Fix',
  'Data Correction',
  'Compliance Review',
  'Emergency Response',
  'Platform Maintenance',
]

const RISK_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-status-success bg-status-success/10 border-status-success/20' },
  { value: 'medium', label: 'Medium', color: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
  { value: 'high', label: 'High', color: 'text-status-error bg-status-error/10 border-status-error/20' },
  { value: 'critical', label: 'Critical', color: 'text-status-error bg-status-error/10 border-status-error/20' },
]

/**
 * Modal dialog for the Super Administrator to choose how to access
 * an organization workspace: Audit Mode or Full Action Mode.
 *
 * Full Action Mode requires a reason, category, and explicit confirmation.
 */
export default function WorkspaceAccessDialog({
  open,
  organizationName,
  onClose,
  onAccess,
  loading,
  canFullControl = true,
}: WorkspaceAccessDialogProps) {
  const [selected, setSelected] = useState<AccessMode>('view_only')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('')
  const [riskLevel, setRiskLevel] = useState('low')
  const [isEmergency, setIsEmergency] = useState(false)
  const [confirmStep, setConfirmStep] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const reset = () => {
    setSelected('view_only')
    setReason('')
    setCategory('')
    setRiskLevel('low')
    setIsEmergency(false)
    setConfirmStep(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSelect = (mode: AccessMode) => {
    setSelected(mode)
    if (mode === 'view_only') {
      setConfirmStep(false)
    }
  }

  const handleContinue = () => {
    if (selected === 'full_control' && !confirmStep) {
      setConfirmStep(true)
      return
    }
    onAccess(selected, {
      reason: reason.trim() || undefined,
      category: category || undefined,
      riskLevel,
      isEmergency,
    })
  }

  const modes = [
    {
      value: 'view_only' as const,
      label: 'Audit Mode',
      sublabel: 'Read Only',
      icon: Eye,
      description: 'View the workspace, inspect permissions, review activity. No changes are possible.',
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
    {
      value: 'full_control' as const,
      label: 'Full Action Mode',
      sublabel: 'Read & Write',
      icon: Shield,
      description: 'Perform administrative actions within the workspace. All actions are fully audited.',
      color: 'text-status-error',
      bgColor: 'bg-status-error/10',
    },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={confirmStep ? 'Confirm full action mode' : 'Enter workspace'}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-2xl mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-divider">
                <div>
                  <h2 className="text-sm font-bold text-brand-text-primary">
                    {confirmStep ? 'Confirm Full Action Mode' : 'Enter Workspace'}
                  </h2>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {confirmStep
                      ? `You are about to enter ${organizationName} with write access.`
                      : `Choose how to access ${organizationName}`
                    }
                  </p>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-brand-surface-interactive transition-colors cursor-pointer" aria-label="Close">
                  <X size={16} className="text-brand-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto modal-scrollbar">
                {!confirmStep ? (
                  <>
                    {/* Mode selection */}
                    <div className="space-y-3">
                      {modes.map((mode) => {
                        const Icon = mode.icon
                        const isSelected = selected === mode.value
                        const disabled = mode.value === 'full_control' && !canFullControl
                        return (
                          <button
                            key={mode.value}
                            onClick={() => !disabled && handleSelect(mode.value)}
                            disabled={disabled}
                            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              disabled
                                ? 'opacity-40 pointer-events-none border-brand-border bg-brand-surface-elevated/20'
                                : isSelected
                                  ? 'border-brand-primary bg-brand-primary/5'
                                  : 'border-brand-border hover:border-brand-divider bg-brand-surface-elevated/30'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? `${mode.bgColor} ${mode.color}` : 'bg-brand-surface-elevated text-brand-text-muted'
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-brand-text-primary">{mode.label}</span>
                                <span className="text-[9px] font-mono text-brand-text-muted px-1.5 py-0.5 rounded bg-brand-surface-elevated">
                                  {mode.sublabel}
                                </span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center ml-auto">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-brand-text-muted mt-1 leading-relaxed">{mode.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Full Action Mode options */}
                    {selected === 'full_control' && canFullControl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-3 border-t border-brand-divider"
                      >
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
                            Intervention Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                          >
                            <option value="">Select category...</option>
                            {INTERVENTION_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
                            Reason (required for Full Action)
                          </label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe the reason for this intervention..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated border border-brand-border text-xs text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:border-brand-primary transition-colors resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold mb-1.5">
                            Risk Level
                          </label>
                          <div className="flex gap-2">
                            {RISK_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setRiskLevel(level.value)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                  riskLevel === level.value
                                    ? level.color
                                    : 'border-brand-border text-brand-text-muted bg-brand-surface-elevated hover:bg-brand-surface-interactive'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="flex items-center gap-2 p-3 rounded-xl bg-status-error/5 border border-status-error/20 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEmergency}
                            onChange={(e) => setIsEmergency(e.target.checked)}
                            className="rounded border-brand-border"
                          />
                          <div>
                            <span className="text-xs font-bold text-status-error">Emergency Intervention</span>
                            <p className="text-[10px] text-brand-text-muted">Skip normal confirmation steps. Higher audit priority.</p>
                          </div>
                        </label>
                      </motion.div>
                    )}
                  </>
                ) : (
                  /* Confirmation step */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-status-error/5 border border-status-error/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-status-error" />
                        <span className="text-xs font-bold text-status-error">Full Action Mode</span>
                      </div>
                      <p className="text-[11px] text-brand-text-muted leading-relaxed">
                        You will enter <strong className="text-brand-text-primary">{organizationName}</strong> with administrative write access.
                        All actions will be recorded in the platform audit trail with your identity as the actor.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-brand-divider">
                        <span className="text-brand-text-muted">Organization</span>
                        <span className="font-bold text-brand-text-primary">{organizationName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-brand-divider">
                        <span className="text-brand-text-muted">Mode</span>
                        <span className="font-bold text-status-error">Full Action</span>
                      </div>
                      {category && (
                        <div className="flex items-center justify-between py-1.5 border-b border-brand-divider">
                          <span className="text-brand-text-muted">Category</span>
                          <span className="font-bold text-brand-text-primary">{category}</span>
                        </div>
                      )}
                      {reason && (
                        <div className="py-1.5 border-b border-brand-divider">
                          <span className="text-brand-text-muted block mb-1">Reason</span>
                          <p className="text-brand-text-primary text-[11px] leading-relaxed">{reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-status-warning/5 border border-status-warning/20">
                      <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                      <p className="text-[10px] text-brand-text-muted leading-relaxed">
                        This action will be logged with your IP address, device information, and a full session timeline.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-brand-divider">
                {confirmStep ? (
                  <button
                    onClick={() => setConfirmStep(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-brand-text-secondary hover:bg-brand-surface-interactive transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-brand-text-secondary hover:bg-brand-surface-interactive transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  disabled={loading || (selected === 'full_control' && !confirmStep && !reason.trim())}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    selected === 'full_control'
                      ? 'bg-status-error hover:bg-status-error/90'
                      : 'bg-status-success hover:bg-status-success/90'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : confirmStep ? (
                    <>
                      <Shield size={14} />
                      Confirm & Enter
                    </>
                  ) : selected === 'full_control' ? (
                    <>
                      Continue
                      <ChevronRight size={14} />
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      Enter Audit Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
