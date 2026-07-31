import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Search, Vote, MoreHorizontal, BarChart3, Activity, Loader2 } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useAuth } from '../../hooks/useAuth'
import { electionService } from '../../services/election-service'
import SeoHead from "../../components/SeoHead"
import DashboardCard from '../components/DashboardCard'
import EventStatusBadge from '../components/EventStatusBadge'
import type { Election } from '../../types/election'
import type { EventStatus } from '../types'

const STATUS_MAP: Record<string, EventStatus> = {
  DRAFT: 'draft',
  READY: 'ready',
  PUBLISHED: 'published',
  LIVE: 'live',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled',
}

function mapElectionToSummary(e: Election) {
  const status = STATUS_MAP[e.status] || 'draft'
  return {
    id: e.id,
    title: e.title,
    status,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    voters: e.participantCount ?? e.totalRegistered ?? 0,
    turnout: e.voterTurnout ?? 0,
    positions: e.positionCount ?? 0,
  }
}

type FilterTab = 'all' | 'live' | 'published' | 'completed' | 'draft'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'published', label: 'Published' },
  { key: 'completed', label: 'Completed' },
  { key: 'draft', label: 'Draft' },
]

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  live: 'success',
    published: 'warning',
  completed: 'info',
  draft: 'neutral',
}

export default function OrgEvents() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const { activeOrganization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<ReturnType<typeof mapElectionToSummary>[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    if (!activeOrganization) return
    setLoading(true)
    setError(null)
    electionService.getElectionsByOrg(activeOrganization.organizationId)
      .then((data) => setEvents(data.map(mapElectionToSummary)))
      .catch((err) => setError(err?.message || 'Failed to load events'))
      .finally(() => setLoading(false))
  }, [activeOrganization])

  const filtered = useMemo(() => {
    let result = [...events]
    if (activeTab !== 'all') {
      result = result.filter((e) => e.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((e) => e.title.toLowerCase().includes(q))
    }
    return result
  }, [activeTab, search, events])

  const stats = useMemo(() => ({
    total: events.length,
    live: events.filter((e) => e.status === 'live').length,
    published: events.filter((e) => e.status === 'published').length,
    completed: events.filter((e) => e.status === 'completed').length,
  }), [events])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-4 text-center">
        <p className="text-xs text-status-error font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary underline cursor-pointer">Retry</button>
      </div>
    )
  }

  return (
    <>
      <SeoHead meta={{ title: "Events — Organization | ORIVIS", noindex: true }} />
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-black uppercase tracking-tight text-brand-text-primary">
              Events
            </h1>
            <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
              {stats.total} event{stats.total !== 1 ? 's' : ''} across your organization
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/org/events/create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all"
            style={{ backgroundColor: branding.primaryColor, color: '#FFFFFF' }}
          >
            <Plus size={14} />
            Create Event
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <p className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.total}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-status-success uppercase tracking-wider">Live</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.live}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-status-warning uppercase tracking-wider">Published</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.published}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold font-mono text-brand-text-primary mt-1">{stats.completed}</p>
          </DashboardCard>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === 'all' ? events.length : events.filter((e) => e.status === tab.key).length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--org-primary)]/10 text-[var(--org-primary)] border border-[var(--org-primary)]/20'
                    : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-text-muted/30'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${isActive ? 'bg-[var(--org-primary)]/20' : 'bg-brand-surface-elevated text-brand-text-disabled}'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-elevated">
                  {['Event', 'Status', 'Voters', 'Turnout', 'Positions', 'Duration', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-brand-text-muted font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((el, i) => (
                  <motion.tr
                    key={el.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="border-b border-brand-border last:border-0 hover:bg-brand-surface-interactive/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/org/events/${el.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center shrink-0" style={{ color: 'var(--org-primary)' }}>
                          <Vote size={14} />
                        </div>
                        <span className="text-xs font-semibold text-brand-text-primary">{el.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <EventStatusBadge status={el.status} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-text-primary">{el.voters.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-text-primary">{el.turnout > 0 ? `${el.turnout}%` : '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-brand-text-primary">{el.positions}</td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted font-mono">
                      {new Date(el.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(el.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center mb-3" style={{ color: 'var(--org-primary)' }}>
                <BarChart3 size={24} />
              </div>
              <p className="text-sm font-semibold text-brand-text-primary mb-1">No Events Found</p>
              <p className="text-xs text-brand-text-muted max-w-[240px]">
                {search ? 'Try a different search term.' : 'No events match the selected filter.'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardCard>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-brand-gold" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-primary">Event Activity</h3>
            </div>
            <div className="space-y-3">
              {events.filter((e) => e.status === 'live' || e.status === 'published').slice(0, 3).map((el) => (
                <div key={el.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-brand-text-primary truncate">{el.title}</p>
                    <p className="text-[9px] font-mono text-brand-text-muted">{el.voters.toLocaleString()} voters · {el.positions} positions</p>
                  </div>
                  <EventStatusBadge status={el.status} />
                </div>
              ))}
              {events.filter((e) => e.status === 'live' || e.status === 'published').length === 0 && (
                <p className="text-xs text-brand-text-muted text-center py-4">No active events</p>
              )}
            </div>
          </DashboardCard>
          <DashboardCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-brand-gold" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-primary">Turnout Overview</h3>
            </div>
            <div className="space-y-3">
              {events.filter((e) => e.status === 'completed' || e.status === 'live').slice(0, 3).map((el) => (
                <div key={el.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-brand-text-primary truncate">{el.title}</p>
                    <span className="text-[10px] font-mono font-bold text-brand-text-primary">{el.turnout}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${el.turnout}%`, backgroundColor: 'var(--org-primary)' }}
                    />
                  </div>
                </div>
              ))}
              {events.filter((e) => e.status === 'completed' || e.status === 'live').length === 0 && (
                <p className="text-xs text-brand-text-muted text-center py-4">No turnout data available</p>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </>
  )
}
