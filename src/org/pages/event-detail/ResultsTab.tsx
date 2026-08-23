import { useState } from 'react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { Trophy, Users, BarChart3, User, BadgeCheck, Shield, CheckCircle, Eye, EyeOff, Calendar, Loader2, Clock, X } from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import OperationProgressModal, { type OperationState } from '../../components/OperationProgressModal'
import { electionService } from '../../../services/election-service'
import { type OrivisEvent, type EventPosition } from './_shared'

export function ResultsTab({ event, positions }: { event: OrivisEvent; positions: EventPosition[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const totalCandidates = positions.reduce((sum, p) => sum + p.candidates.length, 0)
  const isCertified = event.settings.resultPublication === 'certified'
  // The org console must obey the configured live-results policy: tallies are
  // only shown while live results are enabled, or once voting has concluded.
  const votingConcluded = event.status === 'ended' || event.status === 'archived' || event.status === 'completed'
  const canShowTallies = event.settings.liveResults || votingConcluded || isCertified
  const [publishState, setPublishState] = useState<OperationState>('idle')
  const [publishStage, setPublishStage] = useState(0)
  const [publishError, setPublishError] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleState, setScheduleState] = useState<OperationState>('idle')
  const [scheduleStage, setScheduleStage] = useState(0)
  const [scheduleError, setScheduleError] = useState('')

  const publishStages = ['Validating election...', 'Verifying vote records...', 'Preparing results...', 'Applying publication configuration...', 'Finalizing results...']
  const scheduleStages = ['Validating election...', 'Validating schedule...', 'Preparing publication...', 'Saving schedule...']

  const handlePublishResults = async () => {
    if (!event.id) return
    setPublishState('validating')
    setPublishStage(0)
    setPublishError('')
    try {
      setPublishState('processing')
      setPublishStage(1)
      await electionService.publishResults(event.id, true)
      setPublishStage(4)
      setPublishState('success')
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'We could not publish the results. Please try again.')
      setPublishState('error')
    }
  }

  const handleHideResults = async () => {
    if (!event.id) return
    setPublishState('validating')
    setPublishStage(0)
    setPublishError('')
    try {
      setPublishState('processing')
      setPublishStage(1)
      await electionService.publishResults(event.id, false)
      setPublishStage(4)
      setPublishState('success')
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'We could not update result visibility. Please try again.')
      setPublishState('error')
    }
  }

  const handleSchedulePublish = async () => {
    if (!event.id || !scheduleDate) return
    setScheduleState('validating')
    setScheduleStage(0)
    setScheduleError('')
    try {
      setScheduleState('processing')
      setScheduleStage(1)
      await electionService.scheduleResultsPublish(event.id, new Date(scheduleDate).toISOString())
      setScheduleStage(3)
      setScheduleState('success')
      setShowSchedule(false)
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'We could not schedule the results publication. Please try again.')
      setScheduleState('error')
    }
  }

  return (
    <div className="space-y-6">
      {isCertified && (
        <DashboardCard hover={false} className="border-status-success/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-status-success/10">
              <BadgeCheck size={24} className="text-status-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-status-success ">Certified Results</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">
                These results have been cryptographically certified and verified. The outcome is final and tamper-proof.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[9px] ">
                  <Shield size={10} className="text-status-success" />
                  <span className="text-brand-text-muted">Blockchain verified</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] ">
                  <CheckCircle size={10} className="text-status-success" />
                  <span className="text-brand-text-muted">Cryptographically signed</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {event.settings.liveResults && votingConcluded && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-status-success/10 border border-status-success/20">
          <CheckCircle size={14} className="text-status-success shrink-0" />
          <span className="text-xs text-status-success font-medium">Results are published and visible to participants.</span>
          <button
            onClick={handleHideResults}
            disabled={publishState === 'validating' || publishState === 'processing'}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-status-warning/30 text-status-warning hover:bg-status-warning/10 transition-all cursor-pointer"
          >
            {(publishState === 'validating' || publishState === 'processing') ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />}
            Hide Results
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Voters', value: event.participantCount, icon: Users },
          ...(canShowTallies ? [{ label: 'Turnout', value: `${event.voterTurnout}%`, icon: BarChart3 }] : []),
          { label: 'Positions', value: positions.length, icon: Trophy },
          { label: 'Candidates', value: totalCandidates, icon: User },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 bg-brand-surface-elevated" style={{ color: pColor }}>
                <StatIcon size={16} />
              </div>
              <p className="text-lg font-bold text-brand-text-primary">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-[9px] text-brand-text-muted ">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {!canShowTallies ? (
        <DashboardCard hover={false}>
          <EmptyState
            icon={BarChart3}
            title="Results Not Published Yet"
            description="Live results are turned off for this event. Tallies will appear here once voting concludes and results are published."
          />
          {votingConcluded && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handlePublishResults}
                  disabled={publishState === 'validating' || publishState === 'processing' || publishState === 'success'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: pColor }}
                >
                  {(publishState === 'validating' || publishState === 'processing') ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  {publishState === 'success' ? 'Published' : 'Publish Results Now'}
                </button>
                {!showSchedule && scheduleState !== 'success' && (
                  <button
                    onClick={() => setShowSchedule(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary hover:bg-brand-surface-elevated transition-all cursor-pointer"
                  >
                    <Clock size={14} /> Schedule Publish
                  </button>
                )}
              </div>

              {scheduleState === 'success' && (
                <p className="text-center text-[10px] text-status-success font-medium">Results publication has been scheduled.</p>
              )}

              {showSchedule && (
                <div className="bg-brand-surface-elevated rounded-xl p-4 border border-brand-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-primary">Schedule Results Publication</span>
                    <button onClick={() => setShowSchedule(false)} className="text-brand-text-muted hover:text-brand-text-primary cursor-pointer"><X size={14} /></button>
                  </div>
                  <p className="text-[10px] text-brand-text-muted">Choose when results become visible to participants. The election must have ended before results can be published.</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="flex-1 bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <button
                      onClick={handleSchedulePublish}
                      disabled={!scheduleDate || scheduleState === 'validating' || scheduleState === 'processing'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: pColor }}
                    >
                      {(scheduleState === 'validating' || scheduleState === 'processing') ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                      Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DashboardCard>
      ) : positions.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={Trophy} title="No Positions" description="No positions have been configured for this event." />
        </DashboardCard>
      ) : (
        positions.map((pos) => {
          const sorted = [...pos.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
          const totalVotes = sorted.reduce((sum, c) => sum + (c.voteCount || 0), 0)

          return (
            <DashboardCard key={pos.id} hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isCertified ? (
                    <BadgeCheck size={14} className="text-status-success" />
                  ) : (
                    <Trophy size={14} style={{ color: pColor }} />
                  )}
                   <h3 className="text-xs font-bold " style={isCertified ? { color: 'var(--color-status-success)' } : { color: pColor }}>{pos.title}</h3>
                  {isCertified && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20 ">
                      Certified
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-brand-text-muted">{totalVotes} votes</span>
              </div>
              <div className="space-y-2">
                {sorted.map((c, i) => {
                  const pct = totalVotes > 0 ? Math.round(((c.voteCount || 0) / totalVotes) * 100) : 0
                  const isWinner = i === 0 && totalVotes > 0
                  return (
                    <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isWinner ? 'bg-status-success/10 border border-status-success/20' : 'bg-brand-surface-elevated/20'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: isWinner ? 'var(--color-status-success)' : pColor }}>
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-brand-text-primary">{c.name}</span>
                          {isWinner && <BadgeCheck size={12} className="text-status-success" />}
                        </div>
                        <p className="text-[9px] text-brand-text-muted">{c.voteCount || 0} votes &middot; {pct}%</p>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-brand-surface-elevated overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isWinner ? 'var(--color-status-success)' : pColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </DashboardCard>
          )
        })
      )}

      {/* Publish Results Progress Modal */}
      <OperationProgressModal
        open={publishState !== 'idle'}
        state={publishState}
        title="Publishing Results"
        stages={publishStages}
        currentStage={publishStage}
        successTitle="Results Published"
        successMessage="The election results have been successfully published. Participants can now view the results."
        errorTitle="Results Publication Failed"
        errorMessage={publishError || 'We could not publish the results. Please try again.'}
        successActionLabel="Back to Event"
        errorActionLabel="Try Again"
        onSuccessAction={() => setPublishState('idle')}
        onErrorAction={() => {
          setPublishState('idle')
          setPublishStage(0)
        }}
        onClose={() => setPublishState('idle')}
        brandColor={pColor}
      />

      {/* Schedule Results Progress Modal */}
      <OperationProgressModal
        open={scheduleState !== 'idle'}
        state={scheduleState}
        title="Scheduling Results Publication"
        stages={scheduleStages}
        currentStage={scheduleStage}
        successTitle="Results Publication Scheduled"
        successMessage={`Results will be published on ${scheduleDate ? new Date(scheduleDate).toLocaleString() : 'the scheduled date'}.`}
        errorTitle="Scheduling Failed"
        errorMessage={scheduleError || 'We could not schedule the results publication. Please try again.'}
        successActionLabel="Back to Event"
        errorActionLabel="Try Again"
        onSuccessAction={() => setScheduleState('idle')}
        onErrorAction={() => {
          setScheduleState('idle')
          setScheduleStage(0)
        }}
        onClose={() => setScheduleState('idle')}
        brandColor={pColor}
      />
    </div>
  )
}
