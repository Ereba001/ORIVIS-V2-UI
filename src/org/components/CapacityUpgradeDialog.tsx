import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, ArrowUpCircle, Loader2, X, CheckCircle, Minus } from 'lucide-react'
import { billingService } from '../../services/billing-service'
import { formatMoney } from '../../lib/currency'

export interface CapacityUpgradeData {
  ceiling: number
  current_participants: number
  incoming: number
  projected_participants: number
  excess: number
  currency: string
  required_tier?: { name: string; max_participants: number; price: number } | null
  regular_tier_name?: string | null
  regular_amount?: number | null
  new_amount?: number | null
  additional_amount?: number | null
  paid_amount?: number | null
  is_free?: boolean
  upgrade_possible?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onUpgraded: () => void
  electionId: string
  data: CapacityUpgradeData
  /** Called when the import should be retried after a successful upgrade. */
  onRetryImport: () => void
  /** Called when user chooses to keep current tier and import truncated set. */
  onTruncatedImport?: (trimTo: number) => void
}

type Step = 'choose' | 'upgrade_processing' | 'upgrade_payment' | 'truncate_confirm' | 'truncate_processing' | 'success' | 'error'

const PENDING_IMPORT_KEY = 'orivis_pending_capacity_upgrade'

export default function CapacityUpgradeDialog({ open, onClose, onUpgraded, electionId, data, onRetryImport, onTruncatedImport }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [error, setError] = useState<string | null>(null)

  const storePendingImport = useCallback(() => {
    try {
      sessionStorage.setItem(PENDING_IMPORT_KEY, JSON.stringify({ electionId, retry: true }))
    } catch { /* noop */ }
  }, [electionId])

  const clearPendingImport = useCallback(() => {
    try { sessionStorage.removeItem(PENDING_IMPORT_KEY) } catch { /* noop */ }
  }, [])

  // Auto-close after showing success for 2 seconds.
  const upgradedRef = useRef(false)
  useEffect(() => {
    if (step !== 'success') { upgradedRef.current = false; return }
    if (upgradedRef.current) return
    upgradedRef.current = true
    const timer = setTimeout(() => onUpgraded(), 2000)
    return () => clearTimeout(timer)
  }, [step, onUpgraded])

  // --- Upgrade flow (spec §4) ---
  const handleUpgrade = useCallback(async () => {
    setStep('upgrade_processing')
    setError(null)

    try {
      await billingService.recordCapacityConsent(electionId, {
        decision: 'upgrade_and_continue',
        capacity: data.projected_participants,
        projected_participants: data.projected_participants,
        reason: 'capacity_upload_upgrade',
      })

      await billingService.upgradeCapacity(electionId, data.projected_participants, 'capacity_upload_upgrade')

      if (data.additional_amount != null && data.additional_amount > 0) {
        const callbackUrl = `${window.location.origin}/events/${electionId}/participants`
        const { authorizationUrl } = await billingService.initializePayment(electionId, callbackUrl)

        storePendingImport()

        if (authorizationUrl) {
          setStep('upgrade_payment')
          window.location.assign(authorizationUrl)
          return
        }
      }

      // Retry the import now that capacity has been upgraded.
      // Await it so the dialog stays open during processing and
      // errors are surfaced properly instead of being silently lost.
      try {
        await onRetryImport()
      } catch (importErr) {
        // Import failed after a successful upgrade — surface the error
        // but still close the dialog since the tier is already upgraded.
        console.error('Import failed after capacity upgrade:', importErr)
      }
      clearPendingImport()
      setStep('success')
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    }
  }, [electionId, data, onUpgraded, onRetryImport, storePendingImport, clearPendingImport])

  // --- Keep Current Tier flow (spec §5) ---
  const handleKeepCurrentTier = useCallback(async () => {
    setStep('truncate_processing')
    setError(null)

    try {
      await billingService.recordCapacityConsent(electionId, {
        decision: 'keep_current_tier',
        capacity: data.ceiling,
        projected_participants: data.projected_participants,
        trimmed_to: data.ceiling - data.current_participants,
        reason: 'user_declined_tier_upgrade',
      })

      clearPendingImport()
      setStep('choose')
      onTruncatedImport?.(data.ceiling - data.current_participants)
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Could not record your decision. Please try again.')
    }
  }, [electionId, data, clearPendingImport, onTruncatedImport])

  const handleCancel = useCallback(() => {
    clearPendingImport()
    setStep('choose')
    setError(null)
    onClose()
  }, [onClose, clearPendingImport])

  const remainingSlots = Math.max(0, data.ceiling - data.current_participants)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />

          <motion.div
            className="relative w-full max-w-md bg-brand-bg border border-brand-border rounded-2xl shadow-xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1 rounded-lg text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="p-6">
              {/* === CHOOSE STEP === */}
              {step === 'choose' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-status-warning" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-text-primary">Participant Capacity Exceeded</h3>
                      <p className="text-[10px] text-brand-text-muted">Action required to continue</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      Your current event capacity allows <span className="font-bold text-brand-text-primary">{data.ceiling.toLocaleString('en-NG')} participants</span>.
                    </p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      This upload contains <span className="font-bold text-brand-text-primary">{data.incoming.toLocaleString('en-NG')} participants</span>.
                    </p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      Continuing will move this event to the next applicable subscription tier.
                    </p>
                  </div>

                  {data.required_tier && (
                    <div className="bg-brand-surface rounded-xl p-4 mb-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Current Tier</span>
                        <span className="text-[10px] text-brand-text-secondary">{data.ceiling.toLocaleString('en-NG')} participants</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">New Tier</span>
                        <span className="text-xs font-bold text-brand-text-primary">
                          {data.required_tier.name} — up to {data.required_tier.max_participants.toLocaleString('en-NG')}
                        </span>
                      </div>
                      {data.additional_amount != null && data.additional_amount > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                          <span className="text-[10px] text-brand-text-muted">Amount due</span>
                          <span className="text-xs font-bold text-brand-text-primary">{formatMoney(data.additional_amount, data.currency)}</span>
                        </div>
                      )}
                      {data.is_free && (
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                          <span className="text-[10px] text-status-success font-bold">Free event — no payment required</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!data.upgrade_possible && (
                    <div className="bg-status-warning/5 border border-status-warning/20 rounded-xl p-4 mb-5">
                      <p className="text-xs text-status-warning">
                        No pricing tier is configured for {data.projected_participants.toLocaleString('en-NG')} participants. Please contact support to arrange a custom upgrade.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* === TRUNCATE CONFIRM STEP (spec §5) === */}
              {step === 'truncate_confirm' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center">
                      <Minus size={20} className="text-brand-text-muted" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-text-primary">Keep Current Tier?</h3>
                      <p className="text-[10px] text-brand-text-muted">Confirm limited import</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      Your current tier allows only <span className="font-bold text-brand-text-primary">{data.ceiling.toLocaleString('en-NG')} participants</span>.
                    </p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      This file contains <span className="font-bold text-brand-text-primary">{data.incoming.toLocaleString('en-NG')} participants</span>.
                    </p>
                    <div className="bg-status-warning/5 border border-status-warning/20 rounded-xl p-4">
                      <p className="text-xs text-brand-text-secondary leading-relaxed">
                        If you continue with the current tier: <span className="font-bold text-brand-text-primary">Only the first {remainingSlots.toLocaleString('en-NG')} valid participants from this upload will be imported.</span> The remaining participants will not be added.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* === PROCESSING STATES === */}
              {(step === 'upgrade_processing' || step === 'truncate_processing') && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={24} className="animate-spin text-[var(--org-primary)]" />
                  <p className="text-xs text-brand-text-muted">
                    {step === 'upgrade_processing' ? 'Processing upgrade…' : 'Recording decision…'}
                  </p>
                </div>
              )}

              {step === 'upgrade_payment' && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={24} className="animate-spin text-[var(--org-primary)]" />
                  <p className="text-xs text-brand-text-muted">Redirecting to payment…</p>
                  <p className="text-[10px] text-brand-text-muted">Complete the payment to activate your upgraded capacity.</p>
                </div>
              )}

              {step === 'error' && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-status-error" />
                  </div>
                  <p className="text-xs text-status-error text-center">{error}</p>
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                    <CheckCircle size={20} className="text-status-success" />
                  </div>
                  <p className="text-xs font-bold text-status-success">Upgrade & import complete</p>
                  <p className="text-[10px] text-brand-text-muted">{data.incoming.toLocaleString('en-NG')} participants imported. Closing shortly…</p>
                </div>
              )}
            </div>

            {/* === BUTTONS === */}
            {step === 'choose' && (
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setStep('truncate_confirm')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-text-secondary hover:bg-brand-surface transition-colors cursor-pointer"
                >
                  Keep Current Tier
                </button>
                {data.upgrade_possible !== false ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--org-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <ArrowUpCircle size={14} />
                    Move to Next Tier
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-surface text-xs font-bold text-brand-text-secondary hover:bg-brand-surface-elevated transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            )}

            {step === 'truncate_confirm' && (
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-text-secondary hover:bg-brand-surface transition-colors cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleKeepCurrentTier}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--org-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Continue With {remainingSlots.toLocaleString('en-NG')}
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-text-secondary hover:bg-brand-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setStep('choose')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--org-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
