import { useCallback, useEffect, useState } from 'react'
import {
  BadgeCheck, Clock, CreditCard, ExternalLink, Loader2, RefreshCw,
  ShieldCheck, TriangleAlert,
} from 'lucide-react'
import { billingService } from '../../services/billing-service'
import { formatMoney } from '../../lib/currency'
import type { EventBillingSnapshot, EventBillingStatus } from '../../types/billing'

const PENDING_PAYMENT_KEY = 'orivis_pending_payment'

interface PendingPayment {
  electionId: string
  paymentUuid: string
}

function readPendingPayment(): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    return raw ? (JSON.parse(raw) as PendingPayment) : null
  } catch {
    return null
  }
}

type StatusTone = 'success' | 'warning' | 'error' | 'neutral'

const STATUS_META: Record<EventBillingStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'No charge', tone: 'neutral' },
  payment_required: { label: 'Payment required', tone: 'warning' },
  payment_pending: { label: 'Payment pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  free_granted: { label: 'Free', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'error' },
  failed: { label: 'Failed', tone: 'error' },
}

const TONE_STYLES: Record<StatusTone, string> = {
  success: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/10 text-status-warning',
  error: 'bg-status-error/10 text-status-error',
  neutral: 'bg-brand-surface-elevated text-brand-text-muted',
}

export function EventBillingPanel({ electionId, onBillingChanged }: { electionId: string; onBillingChanged?: () => void }) {
  const [snapshot, setSnapshot] = useState<EventBillingSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSnapshot(await billingService.getEventBilling(electionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing information.')
    } finally {
      setLoading(false)
    }
  }, [electionId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const pending = readPendingPayment()
    if (!pending || pending.electionId !== electionId) return
    sessionStorage.removeItem(PENDING_PAYMENT_KEY)
    const finish = async () => {
      setVerifying(true)
      setError(null)
      try {
        await billingService.verifyPayment(pending.paymentUuid)
        setNotice('Payment verified. Your event is now billed as paid.')
        await reload()
        onBillingChanged?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment could not be verified yet. It may still be processing.')
      } finally {
        setVerifying(false)
      }
    }
    void finish()
  }, [electionId, reload])

  const handlePay = async () => {
    setPaying(true)
    setError(null)
    setNotice(null)
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}`
      const { payment, authorizationUrl } = await billingService.initializePayment(electionId, callbackUrl)
      if (!authorizationUrl) {
        setError('Payment was initialized but no checkout URL was returned. Please contact support.')
        return
      }
      sessionStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify({ electionId, paymentUuid: payment.uuid }),
      )
      window.location.assign(authorizationUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment.')
    } finally {
      setPaying(false)
    }
  }

  const billing = snapshot?.billing
  const quote = snapshot?.quote
  const owed = billing ? Math.max(0, Number(billing.amount) - Number(billing.paid_amount)) : 0
  const canPay = billing !== undefined && (billing.status === 'payment_required' || billing.status === 'payment_pending') && owed > 0
  // The backend verdict is the source of truth: a ₦0 event is always free and
  // nothing is owed, so it is shown as "Free" (never "Payment required" or an
  // unpaid/blocked state) once the server confirms billing is satisfied.
  const billingSatisfied = snapshot?.billingSatisfied ?? false
  const freeEntitlementAvailable = snapshot?.freeEntitlement.available ?? false
  const isFreeStatus = billing?.status === 'free_granted'
    || (billing !== undefined
        && billingSatisfied
        && Number(billing.amount) === 0
        && (billing.status === 'pending' || billing.status === 'paid'))
  const meta = billing
    ? {
        ...STATUS_META[billing.status],
        label: isFreeStatus ? 'Free' : STATUS_META[billing.status].label,
      }
    : STATUS_META.pending

  return (
    <div className="rounded-xl border border-brand-divider bg-brand-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-divider flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-brand-text-muted" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-text-primary">Event Billing</h3>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={() => void reload()}
            className="flex items-center gap-1 text-[9px] font-bold text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
            aria-label="Refresh billing"
          >
            <RefreshCw size={10} /> Refresh
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 w-40 bg-brand-surface-elevated rounded" />
            <div className="animate-pulse h-4 w-64 bg-brand-surface-elevated rounded" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-error/5 border border-status-error/10">
            <TriangleAlert size={13} className="text-status-error shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] text-status-error font-medium">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="text-[9px] font-bold text-status-error underline underline-offset-2 mt-1 cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : billing ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-brand-text-muted">
                  {isFreeStatus ? 'This event' : 'Amount due'}
                </p>
                <p className="text-lg font-bold text-brand-text-primary mt-0.5">
                  {isFreeStatus ? 'Free' : formatMoney(owed, billing.currency)}
                </p>
                {billing.status === 'paid' && billing.paid_amount > 0 && (
                  <p className="text-[9px] text-brand-text-muted">Paid {formatMoney(billing.paid_amount, billing.currency)}</p>
                )}
                {quote?.tier?.name && !isFreeStatus && (
                  <p className="text-[9px] text-brand-text-muted mt-0.5">
                    {quote.tier.name} tier · up to {quote.tier.max_participants.toLocaleString('en-NG')} participants
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold ${TONE_STYLES[meta.tone]}`}>
                {billing.status === 'paid' || billing.status === 'free_granted' ? (
                  <BadgeCheck size={11} />
                ) : billing.status === 'payment_required' || billing.status === 'payment_pending' ? (
                  <Clock size={11} />
                ) : (
                  <ShieldCheck size={11} />
                )}
                {meta.label}
              </span>
            </div>

            {freeEntitlementAvailable && billing.status === 'pending' && Number(billing.amount) === 0 && (
              <p className="text-[10px] text-status-success bg-status-success/5 border border-status-success/10 rounded-lg p-2.5">
                Your first eligible event is free — this charge will be waived when you publish.
              </p>
            )}

            {canPay && (
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--org-primary)] text-white text-[11px] font-bold uppercase tracking-wider py-3 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {paying ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                {paying ? 'Starting checkout…' : 'Pay with Paystack'}
              </button>
            )}

            {verifying && (
              <p className="flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                <Loader2 size={11} className="animate-spin" /> Verifying payment with Paystack…
              </p>
            )}

            {notice && (
              <p className="flex items-start gap-1.5 text-[10px] text-status-success bg-status-success/5 border border-status-success/10 rounded-lg p-2.5">
                <BadgeCheck size={12} className="shrink-0 mt-0.5" /> {notice}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}