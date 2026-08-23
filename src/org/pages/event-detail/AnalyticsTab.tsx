import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { BarChart3 } from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import WidgetPanel from '../../components/WidgetPanel'
import ProgressBar from '../../components/ProgressBar'
import { type OrivisEvent, type EventAnalytics } from './_shared'

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  critical: 'var(--color-status-danger)',
}

export function AnalyticsTab({ event, analytics }: { event: OrivisEvent; analytics?: EventAnalytics | null }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  if (!analytics) {
    return (
      <DashboardCard hover={false}>
        <EmptyState icon={BarChart3} title="Analytics Not Available" description="Analytics data is not available for this event yet." />
      </DashboardCard>
    )
  }

  const maxRegCount = Math.max(...analytics.registrationTrend.map((d) => d.count), 1)
  const maxGrowthTotal = Math.max(...analytics.participantGrowth.map((d) => d.total), 1)

  return (
    <div className="space-y-6">
      {/* Event Health */}
      <DashboardCard hover={false}>
        <h3 className="text-xs font-bold text-brand-text-primary mb-4">Event Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.eventHealth.map((h) => (
            <div key={h.label} className="p-4 rounded-xl bg-brand-surface-elevated/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-brand-text-muted">{h.label}</span>
                <span className={`w-2 h-2 rounded-full ${h.status === 'healthy' ? 'bg-status-success' : h.status === 'warning' ? 'bg-status-warning' : 'bg-status-error'}`} />
              </div>
              <ProgressBar value={h.value} max={h.max} color={HEALTH_COLORS[h.status]} size="sm" />
            </div>
          ))}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trend */}
        <WidgetPanel title="Registration Trend" subtitle="Daily registrations" className="lg:col-span-2">
          <div className="flex items-end gap-1 h-32">
            {analytics.registrationTrend.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max((d.count / maxRegCount) * 100, 4)}%`,
                    backgroundColor: pColor,
                    opacity: 0.4 + (i / analytics.registrationTrend.length) * 0.6,
                  }}
                />
                <span className="text-[7px] text-brand-text-disabled mt-1 truncate w-full text-center">{d.date}</span>
              </div>
            ))}
          </div>
        </WidgetPanel>

        {/* Participant Growth */}
        <WidgetPanel title="Participant Growth" subtitle="Cumulative totals">
          <div className="flex items-end gap-1 h-32">
            {analytics.participantGrowth.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{
                    height: `${Math.max((d.total / maxGrowthTotal) * 100, 4)}%`,
                    backgroundColor: branding.accentColor,
                    opacity: 0.4 + (i / analytics.participantGrowth.length) * 0.6,
                  }}
                />
                <span className="text-[7px] text-brand-text-disabled mt-1 truncate w-full text-center">{d.date}</span>
              </div>
            ))}
          </div>
        </WidgetPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Stats */}
        <WidgetPanel title="Candidate Stats" subtitle="Approval breakdown">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Total</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.candidateStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-success/10">
              <span className="text-[10px] text-status-success">Approved</span>
              <span className="text-xs font-bold text-status-success">{analytics.candidateStats.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-warning/10">
              <span className="text-[10px] text-status-warning">Pending</span>
              <span className="text-xs font-bold text-status-warning">{analytics.candidateStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-status-error/10">
              <span className="text-[10px] text-status-error">Rejected</span>
              <span className="text-xs font-bold text-status-error">{analytics.candidateStats.rejected}</span>
            </div>
          </div>
        </WidgetPanel>

        {/* Turnout Projection */}
        <WidgetPanel title="Turnout Projection" subtitle="Current vs projected">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 text-center">
              <p className="text-[10px] text-brand-text-muted mb-1">Current Turnout</p>
              <p className="text-2xl font-bold" style={{ color: pColor }}>{analytics.turnoutProjection.current}%</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-surface-elevated/20 text-center">
              <p className="text-[10px] text-brand-text-muted mb-1">Projected Turnout</p>
              <p className="text-2xl font-bold text-brand-text-primary">{analytics.turnoutProjection.projected}%</p>
            </div>
            <ProgressBar value={analytics.turnoutProjection.percentage} max={100} color={pColor} label="Progress toward projected" />
          </div>
        </WidgetPanel>

        {/* Key Metrics */}
        <WidgetPanel title="Key Metrics" subtitle="Event performance">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Total Participants</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.participantGrowth[analytics.participantGrowth.length - 1]?.total.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Total Candidates</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.candidateStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Reg. Rate</span>
              <span className="text-xs font-bold text-brand-text-primary">{event.registrationProgress}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Verification Rate</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.eventHealth.find((h) => h.label === 'Verification Rate')?.value || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-elevated/20">
              <span className="text-[10px] text-brand-text-muted">Pass Utilization</span>
              <span className="text-xs font-bold text-brand-text-primary">{analytics.eventHealth.find((h) => h.label === 'Pass Utilization')?.value || 0}%</span>
            </div>
          </div>
        </WidgetPanel>
      </div>
    </div>
  )
}
