import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import EventTimeline from '../../components/EventTimeline'
import { type TimelineActivity } from './_shared'

export function TimelineTab({ activities }: { activities: TimelineActivity[] }) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = filterType === 'all' ? activities : activities.filter((a) => a.type === filterType)
  const activityTypes = ['all', ...Array.from(new Set(activities.map((a) => a.type)))]

  return (
    <DashboardCard hover={false}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[10px] text-brand-text-muted font-bold ">Filter by:</span>
        <div className="flex items-center gap-1">
          {activityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all capitalize ${
                filterType === t ? 'text-white' : 'text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={filterType === t ? { backgroundColor: pColor } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Clock} title="No Timeline Events" description="No activities match the selected filter." />
      ) : (
        <EventTimeline activities={filtered} />
      )}
    </DashboardCard>
  )
}
