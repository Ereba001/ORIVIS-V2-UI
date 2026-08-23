import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  AlertTriangle, CheckCircle, XCircle, Globe, Send, Clock, CalendarClock, X,
} from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import ProgressBar from '../../components/ProgressBar'
import OperationProgressModal, { type OperationState } from '../../components/OperationProgressModal'
import { electionService } from '../../../services/election-service'
import { billingService } from '../../../services/billing-service'
import { EventBillingPanel } from '../../components/EventBillingPanel'
import type { EventBillingSnapshot } from '../../../types/billing'
import { type OrivisEvent } from './_shared'

const PUBLISH_STAGES = [
  'Validating election configuration...',
  'Validating participants...',
  'Validating candidates...',
  'Verifying voting configuration...',
  'Preparing election environment...',
  'Publishing election...',
  'Finalizing...',
]

export function PublishingTab({ event, publicUrl, onShowQrModal, onDataChanged }: { event: OrivisEvent; publicUrl?: string | null; onShowQrModal?: () => void; onDataChanged?: () => void }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishModalState, setPublishModalState] = useState<OperationState>('idle')
  const [publishStage, setPublishStage] = useState(0)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [scheduleConfirmed, setScheduleConfirmed] = useState<string | null>(null)
  const [billingSnapshot, setBillingSnapshot] = useState<EventBillingSnapshot | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)

  const reloadBilling = useCallback(() => {
    billingService.getEventBilling(event.id)
      .then((res) => {
        setBillingSnapshot(res)
        setBillingError(null)
      })
      .catch((err) => {
        setBillingSnapshot(null)
        setBillingError(err instanceof Error ? err.message : 'Failed to load billing status.')
      })
  }, [event.id])

  useEffect(() => {
    reloadBilling()
  }, [reloadBilling])

  const billing = billingSnapshot?.billing
  // The backend is the source of truth for billing readiness (the API recomputes
  // the record against current capacity and free entitlement before answering).
  // The fallback keeps the legacy heuristic for snapshots that predate the flag.
  const freeEntitlementAvailable = billingSnapshot?.freeEntitlement.available ?? false
  const billingReady = billingSnapshot?.billingSatisfied ?? (billing
    ? billing.status === 'paid' ||
      billing.status === 'free_granted' ||
      (billing.status === 'pending' && Number(billing.amount) === 0 && freeEntitlementAvailable)
    : false)

  const isPublished = published || event.status === 'published'
  const isPrePublish = event.status === 'created' || event.status === 'ready'
  const scheduledAt = event.scheduledPublishAt

  const workspaceBranded = !!(branding.logoUrl || (branding.primaryColor && branding.primaryColor !== '#FCA311'))

  const checks = [
    { id: 'org-profile' as const, label: 'Organization Profile', check: !!event.organizationName, detail: 'Organization name, email, and contact details are configured.' },
    { id: 'workspace-branding' as const, label: 'Workspace Branding', check: workspaceBranded, detail: 'Logo, colors, and theme are set in workspace settings.' },
    { id: 'event-branding' as const, label: 'Event Branding', check: event.publishReadiness.brandingComplete, detail: 'Event banner, logo, and color scheme are configured.' },
    { id: 'positions' as const, label: 'Positions', check: event.publishReadiness.positionsDefined, detail: 'At least one position must be defined for the event.' },
    { id: 'candidates' as const, label: 'Candidates', check: event.publishReadiness.candidatesNominated, detail: 'All positions must have at least one candidate nominated.' },
    { id: 'participants' as const, label: 'Participants', check: event.publishReadiness.participantsImported, detail: 'Participant list must be imported or manually entered.' },
    { id: 'schedule' as const, label: 'Schedule', check: event.publishReadiness.votingScheduleSet, detail: 'Voting start and end times must be set.' },
    { id: 'visibility' as const, label: 'Visibility', check: event.publishReadiness.visibilityConfigured, detail: 'Event visibility must be set to public or private.' },
    { id: 'settings' as const, label: 'Required Settings', check: event.publishReadiness.requiredSettingsComplete, detail: 'All required event settings must be configured.' },
    { id: 'billing' as const, label: 'Event Billing', check: billingReady, detail: billingError ?? 'Billing for this event is settled (free or paid). Events requiring payment must be paid before publishing.' },
  ]

  const completedCount = checks.filter(c => c.check).length
  const totalCount = checks.length
  const percentage = Math.round((completedCount / totalCount) * 100)
  const allComplete = completedCount === totalCount

  const failedItems = checks.filter(c => !c.check)
  const groupedFailed = failedItems.reduce<Record<string, typeof failedItems>>((acc, item) => {
    const group = item.id === 'org-profile' || item.id === 'workspace-branding' || item.id === 'billing' ? 'Organization' :
      item.id === 'event-branding' ? 'Branding' :
      item.id === 'positions' || item.id === 'candidates' ? 'Candidates' :
      item.id === 'participants' ? 'Participants' :
      item.id === 'schedule' || item.id === 'visibility' || item.id === 'settings' ? 'Configuration' : 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  const handlePublish = async () => {
    setPublishing(true)
    setPublishError(null)
    setSuccessMessage(null)
    setShowPublishModal(true)
    setPublishModalState('processing')
    setPublishStage(0)
    try {
      // Simulate staged progress while the actual API call runs
      const stageInterval = setInterval(() => {
        setPublishStage((prev) => Math.min(prev + 1, PUBLISH_STAGES.length - 1))
      }, 800)
      await electionService.publishElection(event.id)
      clearInterval(stageInterval)
      setPublishStage(PUBLISH_STAGES.length - 1)
      setPublishModalState('success')
      setPublished(true)
      setSuccessMessage('Event published successfully.')
      onDataChanged?.()
    } catch (err) {
      setPublishModalState('error')
      setPublishError(err instanceof Error ? err.message : 'Failed to publish the event. Please review the validation checks below.')
    } finally {
      setPublishing(false)
    }
  }

  const handleSchedulePublish = async () => {
    if (!scheduleDate || !scheduleTime) {
      setScheduleError('Please select both date and time.')
      return
    }
    const publishAt = `${scheduleDate}T${scheduleTime}:00`
    const selectedMs = new Date(publishAt).getTime()
    if (Number.isNaN(selectedMs) || selectedMs <= Date.now()) {
      setScheduleError('Scheduled time must be in the future.')
      return
    }

    setScheduling(true)
    setScheduleError(null)
    setPublishError(null)
    setSuccessMessage(null)
    try {
      await electionService.schedulePublishElection(event.id, publishAt)
      setShowSchedule(false)
      setScheduleDate('')
      setScheduleTime('')
      setScheduleConfirmed(formatScheduledAt(`${scheduleDate}T${scheduleTime}:00`))
      onDataChanged?.()
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Failed to schedule publish.')
    } finally {
      setScheduling(false)
    }
  }

  const handleCancelSchedule = async () => {
    try {
      await electionService.cancelScheduledPublish(event.id)
      setSuccessMessage('Scheduled publish cancelled.')
      onDataChanged?.()
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to cancel the scheduled publish.')
    }
  }

  const expiryInfo = (() => {
    if (event.status !== 'ended' || !event.endedAt) return null
    const endedAtMs = new Date(event.endedAt).getTime()
    if (Number.isNaN(endedAtMs)) return null
    const expiresAtMs = endedAtMs + 24 * 60 * 60 * 1000
    const hoursLeft = (expiresAtMs - Date.now()) / (60 * 60 * 1000)
    const dateLabel = new Date(expiresAtMs).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
    return { expiresAtMs, hoursLeft, dateLabel }
  })()

  const formatScheduledAt = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-success/10 border border-status-success/20">
          <CheckCircle size={16} className="text-status-success shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-success font-medium">{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-brand-text-muted hover:text-brand-text-primary" aria-label="Dismiss message">
            <X size={12} />
          </button>
        </div>
      )}
      {expiryInfo && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
          expiryInfo.hoursLeft < 0
            ? 'bg-status-error/10 border-status-error/20'
            : expiryInfo.hoursLeft < 12
              ? 'bg-status-warning/10 border-status-warning/20'
              : 'bg-brand-surface-elevated border-brand-border'
        }`}>
          <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${
            expiryInfo.hoursLeft < 0 ? 'text-status-error' : expiryInfo.hoursLeft < 12 ? 'text-status-warning' : 'text-brand-text-muted'
          }`} />
          <div>
            <p className={`text-[10px] font-bold ${
              expiryInfo.hoursLeft < 0 ? 'text-status-error' : expiryInfo.hoursLeft < 12 ? 'text-status-warning' : 'text-brand-text-primary'
            }`}>
              {expiryInfo.hoursLeft < 0
                ? 'Public event URL has expired'
                : `Public event URL expires in ${Math.max(1, Math.round(expiryInfo.hoursLeft))}h`}
            </p>
            <p className="text-[10px] text-brand-text-muted mt-0.5 leading-relaxed">
              {expiryInfo.hoursLeft < 0
                ? `This event ended more than 24 hours ago. The public results URL (${expiryInfo.dateLabel}) is no longer accessible.`
                : `This event has ended. Its public URL will be inaccessible after ${expiryInfo.dateLabel}. Export results before then if you need a permanent archive.`}
            </p>
          </div>
        </div>
      )}

      <DashboardCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-brand-text-primary">Publish Readiness</h2>
            <p className="text-[11px] text-brand-text-muted mt-0.5">Complete all checks before publishing this event to participants.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: allComplete ? 'var(--color-status-success)' : pColor }}>{percentage}%</p>
            <p className="text-[9px] text-brand-text-muted ">{completedCount} of {totalCount} checks passed</p>
          </div>
        </div>

        <ProgressBar value={completedCount} max={totalCount} color={allComplete ? 'var(--color-status-success)' : pColor} showLabel={false} />

        {Object.keys(groupedFailed).length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-status-warning/10 border border-status-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-status-warning" />
              <span className="text-[10px] font-bold text-status-warning ">Validation Summary</span>
            </div>
            {Object.entries(groupedFailed).map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="text-[9px] font-bold text-brand-text-muted mb-1">{group}</p>
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 ml-2 mb-1">
                    <XCircle size={10} className="text-status-error shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-brand-text-primary font-medium">{item.label}</span>
                      <p className="text-[8px] text-brand-text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <EventBillingPanel
        electionId={event.id}
        onBillingChanged={() => {
          // Re-check readiness immediately after a verified payment so Publish /
          // Schedule Publish unlock without a manual page refresh.
          reloadBilling()
          onDataChanged?.()
        }}
      />

      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold text-brand-text-primary mb-4">Validation Checks</h3>
        <div className="space-y-1">
          {checks.map((item) => (
            <div key={item.id}
              className="relative group"
              onMouseEnter={() => setShowDetails(item.id)}
              onMouseLeave={() => setShowDetails(null)}
            >
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                item.check ? 'bg-brand-surface-elevated/20' : 'bg-status-error/5 border border-status-error/10'
              }`}>
                {item.check ? (
                  <CheckCircle size={16} className="text-status-success shrink-0" />
                ) : (
                  <XCircle size={16} className="text-status-error shrink-0" />
                )}
                <span className={`text-xs font-medium ${item.check ? 'text-brand-text-primary' : 'text-brand-text-muted'}`}>
                  {item.label}
                </span>
                {!item.check && (
                  <span className="ml-auto text-[8px] text-status-error ">Required</span>
                )}
              </div>
              {showDetails === item.id && (
                <div className="absolute left-8 -bottom-8 z-10 px-3 py-2 rounded-xl bg-brand-surface border border-brand-border shadow-lg text-[10px] text-brand-text-muted whitespace-nowrap">
                  {item.detail}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-brand-divider">
          {isPublished ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-status-success/10 border border-status-success/20">
                <CheckCircle size={20} className="text-status-success" />
                <div>
                  <p className="text-xs font-bold text-status-success">Event Published</p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">This event is live to the public and can no longer be edited.</p>
                </div>
              </div>
              {publicUrl && (
                <button
                  onClick={() => onShowQrModal?.()}
                  className="flex items-center gap-2 w-full p-3 rounded-xl bg-brand-surface-elevated/20 border border-brand-divider text-left hover:bg-brand-surface-interactive transition-colors cursor-pointer"
                  title="View election link & QR code"
                >
                  <Globe size={14} className="text-brand-text-muted shrink-0" />
                  <span className="text-[10px] text-brand-text-primary font-medium truncate">{publicUrl}</span>
                  <span className="ml-auto text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-surface text-brand-text-muted shrink-0">Show QR</span>
                </button>
              )}
            </div>
          ) : isPrePublish && scheduledAt ? (
            <div className="space-y-3">
              {publishError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-status-error/10 border border-status-error/20">
                  <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                  <p className="text-[10px] text-status-error font-medium">{publishError}</p>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-status-info/10 border border-status-info/20">
                <CalendarClock size={20} className="text-status-info" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-status-info">Publish Scheduled</p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">This event will be automatically published at {formatScheduledAt(scheduledAt)}.</p>
                </div>
                <button onClick={handleCancelSchedule} className="p-1.5 rounded-lg hover:bg-status-info/10 text-status-info" title="Cancel schedule">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-50"
                  style={{ backgroundColor: pColor }}
                >
                  {publishing ? 'Publishing...' : <><Send size={12} /> Publish Now Instead</>}
                </motion.button>
                <button onClick={() => { setShowSchedule(true); setScheduleDate(''); setScheduleTime('') }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive">
                  <Clock size={12} /> Reschedule
                </button>
              </div>
            </div>
          ) : isPrePublish ? (
            <div className="space-y-3">
              {publishError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-status-error/10 border border-status-error/20">
                  <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                  <p className="text-[10px] text-status-error font-medium">{publishError}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePublish}
                  disabled={publishing || !billingReady}
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-[10px] font-bold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pColor }}
                >
                  {publishing ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Publishing...</>
                  ) : (
                    <><Send size={14} /> Publish Now</>
                  )}
                </motion.button>
                <button
                  onClick={() => { setShowSchedule(true); setScheduleDate(''); setScheduleTime('') }}
                  disabled={!billingReady}
                  title={billingReady ? 'Schedule this event for automatic publishing' : 'Settle event billing to schedule publishing'}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-[10px] font-bold transition-all border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                  <Clock size={14} /> Schedule Publish
                </button>
              </div>
              <p className="text-[9px] text-brand-text-muted">
                Publishing makes the event available according to its configured schedule and voting settings. Review all event details before publishing.
              </p>
              {!allComplete && (
                <p className="text-[10px] text-brand-text-muted">
                  {completedCount} of {totalCount} readiness checks passed. Publishing runs a final validation on the server; any remaining blockers will be shown above.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-status-warning/10 text-status-warning">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold ">
                {failedItems.length} validation {failedItems.length === 1 ? 'check' : 'checks'} {failedItems.length === 1 ? 'has' : 'have'} not passed
              </span>
            </div>
          )}
        </div>
      </DashboardCard>

      {showSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-text-primary">Schedule Publish</h3>
              <button onClick={() => setShowSchedule(false)} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted"><X size={14} /></button>
            </div>
            <p className="text-[10px] text-brand-text-muted mb-4">Choose a date and time when this election will be automatically published.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-brand-text-muted block mb-1">Date *</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider text-[10px] text-brand-text-primary outline-none focus:border-brand-primary transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-text-muted block mb-1">Time *</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider text-[10px] text-brand-text-primary outline-none focus:border-brand-primary transition-colors" />
              </div>
              {scheduleDate && scheduleTime && (
                <div className="p-3 rounded-xl bg-brand-surface-elevated/20 border border-brand-divider">
                  <p className="text-[9px] text-brand-text-muted">Will publish at:</p>
                  <p className="text-[10px] text-brand-text-primary font-bold mt-0.5">
                    {formatScheduledAt(`${scheduleDate}T${scheduleTime}:00`)}
                  </p>
                </div>
              )}
              {scheduleError && (
                <p className="text-[10px] text-status-error">{scheduleError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowSchedule(false)}
                className="px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-border text-brand-text-muted hover:bg-brand-surface-interactive transition-all">
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSchedulePublish}
                disabled={scheduling || !scheduleDate || !scheduleTime}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: pColor }}>
                {scheduling ? 'Scheduling...' : 'Schedule'}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {scheduleConfirmed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center mb-3">
                <CheckCircle size={24} className="text-status-success" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">Event Scheduled</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">Your event will be automatically published at the time below.</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 border border-brand-divider mb-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-muted shrink-0">Event</span>
                <span className="text-[10px] font-bold text-brand-text-primary truncate">{event.title}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-muted shrink-0">Publish time</span>
                <span className="text-[10px] font-bold shrink-0" style={{ color: pColor }}>{scheduleConfirmed}</span>
              </div>
            </div>
            <p className="text-[9px] text-brand-text-muted text-center mb-5">You can reschedule or cancel anytime from the publishing tab.</p>
            <button
              onClick={() => setScheduleConfirmed(null)}
              className="w-full py-2.5 rounded-xl text-[10px] font-bold text-white transition-all"
              style={{ backgroundColor: pColor }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <OperationProgressModal
        open={showPublishModal}
        state={publishModalState}
        title="Publishing Election"
        stages={PUBLISH_STAGES}
        currentStage={publishStage}
        successTitle="Election Published Successfully"
        successMessage="Your election is now live according to its configured schedule."
        errorTitle="Election Publication Failed"
        errorMessage={publishError || 'We could not publish this election. Please review the validation checks and try again.'}
        successActionLabel="Go to Event"
        errorActionLabel="Review & Fix"
        onSuccessAction={() => { setShowPublishModal(false); onShowQrModal?.() }}
        onErrorAction={() => setShowPublishModal(false)}
        onClose={() => setShowPublishModal(false)}
        brandColor={pColor}
      />
    </div>
  )
}
