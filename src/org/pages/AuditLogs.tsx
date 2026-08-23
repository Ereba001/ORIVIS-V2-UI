import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Search, Building, Calendar, ChevronLeft, ChevronRight,
  User, Settings, CreditCard, LogIn, Vote, Shield, Users, ExternalLink,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import { orgService } from '../../services/org-service'
import { useApiResource } from '../../hooks/useApiResource'
import type { AuditEvent } from '../types'
import SeoHead from "../../components/SeoHead"

type AuditTab = 'workspace' | 'event' | 'voting'

const TABS: { key: AuditTab; label: string; icon: typeof Building }[] = [
  { key: 'workspace', label: 'Workspace', icon: Building },
  { key: 'event', label: 'Event', icon: Calendar },
  { key: 'voting', label: 'Voting', icon: Vote },
]

const MODULE_ICONS: Record<string, typeof Shield> = {
  Workspace: Building, Team: Users, Billing: CreditCard, Branding: Settings,
  Settings: Settings, Auth: LogIn, Event: Calendar, Candidate: User,
  Participant: Users, Result: Vote, Voting: Vote, Pass: Shield,
  Receipt: CreditCard, Ballot: Vote,
}

const SEVERITY_STYLES = {
  info: 'bg-status-info/10 text-status-info border-status-info/20',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  critical: 'bg-status-error/10 text-status-error border-status-error/20',
}

const SEVERITY_DOTS = {
  info: 'bg-status-info',
  warning: 'bg-status-warning',
  critical: 'bg-status-error',
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (dDate.getTime() === today.getTime()) return 'Today'
  if (dDate.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

type AnyAudit = AuditEvent

export default function OrgAuditLogs() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [tab, setTab] = useState<AuditTab>('workspace')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all')
  const [page, setPage] = useState(1)
  const perPage = 10

  const { data, loading, error, reload } = useApiResource(async () => {
    const result = await orgService.getAuditLogs({ perPage: 100 })
    return result.items
  })

  const handleExport = () => {
    if (!filtered.length) return
    const headers = ['Timestamp', 'Module', 'Action', 'User', 'Severity', 'IP Address']
    const rows = filtered.map(e => [e.timestamp, e.module, e.action, e.user, e.severity, e.ipAddress ?? ''])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `audit-logs-${tab}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const allLogs: AnyAudit[] = useMemo(() => {
    const logs = data ?? []
    switch (tab) {
      case 'workspace': return logs.filter((e) => ['Team', 'Settings', 'Billing', 'Auth'].includes(e.module))
      case 'event': return logs.filter((e) => ['Event', 'Candidate'].includes(e.module))
      case 'voting': return logs.filter((e) => e.module === 'Voter' || e.action.includes('vote'))
    }
  }, [tab, data])

  const filtered = allLogs.filter((event) => {
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false
    if (search && !event.action.toLowerCase().includes(search.toLowerCase()) && !event.user.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = useMemo(() => {
    const groups: Record<string, AnyAudit[]> = {}
    filtered.forEach((event) => {
      const key = formatDate(event.timestamp)
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
    })
    return groups
  }, [filtered])

  const groupKeys = Object.keys(grouped)

  const allGroupedEntries = useMemo(() => {
    const entries: { date: string; events: AnyAudit[] }[] = []
    groupKeys.forEach((key) => {
      const events = grouped[key]
      for (let i = 0; i < events.length; i += perPage) {
        entries.push({ date: key, events: events.slice(i, i + perPage) })
      }
    })
    return entries
  }, [grouped, groupKeys, perPage])

  if (loading) {
    return (
      <>
        <SeoHead meta={{ title: "Audit Logs — Organization | ORIVIS", noindex: true }} />
        <div className="space-y-6">
          <div className="animate-pulse h-10 w-64 bg-brand-surface-elevated rounded-2xl" />
          <SkeletonLoader rows={8} variant="list" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SeoHead meta={{ title: "Audit Logs — Organization | ORIVIS", noindex: true }} />
        <EmptyState
          icon={Shield}
          title="Failed to load audit logs"
          description={error}
          action={{ label: 'Retry', onClick: reload }}
        />
      </>
    )
  }

  const totalPages = allGroupedEntries.length

  const pagedEntries = allGroupedEntries.slice((page - 1) * perPage, page * perPage)

  return (
    <>
    <SeoHead meta={{ title: "Audit Logs — Organization | ORIVIS", noindex: true }} />
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--org-primary)' }}>Audit Log</h1>
          <p className="text-sm text-brand-text-muted mt-1">Track all administrative actions within your organization.</p>
        </div>
        <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white w-full sm:w-auto"
          style={{ backgroundColor: pColor }}>
          <span>Export</span>
        </button>
      </div>

      {/* === 3-TAB NAVIGATION === */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-brand-surface-elevated/30 w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const TabIcon = t.icon
          const isActive = tab === t.key
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch(''); setSeverityFilter('all') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-white shadow-md' : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
              style={isActive ? { backgroundColor: pColor } : {}}>
              <TabIcon size={12} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* === FILTERS === */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input name="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search audit log..." aria-label="Search"
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-brand-text-primary placeholder-brand-text-disabled focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'info', 'warning', 'critical'] as const).map((s) => (
            <button key={s} onClick={() => { setSeverityFilter(s); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-[9px] font-bold transition-all ${
                severityFilter === s ? 'text-white' : 'border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive'
              }`}
              style={severityFilter === s ? { backgroundColor: pColor } : {}}>{s}</button>
          ))}
        </div>
      </div>

      {/* === AUDIT LIST === */}
      {filtered.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState icon={Shield} title="No audit events found"
            description="Try adjusting your search or filters." />
        </DashboardCard>
      ) : (
        <div className="space-y-6">
          {pagedEntries.map(({ date, events }) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: pColor }} />
                <h3 className="text-xs font-bold " style={{ color: pColor }}>{date}</h3>
                <span className="text-[9px] text-brand-text-muted">({events.length} event{events.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="space-y-1">
                {events.map((event, i) => {
                  const ModIcon = MODULE_ICONS[event.module] || Shield
                  return (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-brand-surface-interactive/30 transition-all group">
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <span className={`w-2.5 h-2.5 rounded-full block ${SEVERITY_DOTS[event.severity]}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-brand-surface-elevated"
                              style={{ color: pColor }}>
                              <ModIcon size={12} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-brand-text-primary font-medium truncate">{event.action}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-brand-text-muted">{event.user}</span>
                                <span className="text-brand-text-disabled">·</span>
                                <span className="text-[9px] text-brand-text-muted">{formatTimeAgo(event.timestamp)}</span>
                                {event.ipAddress !== 'system' && (
                                  <>
                                    <span className="text-brand-text-disabled">·</span>
                                    <span className="text-[9px] text-brand-text-muted">{event.ipAddress}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 text-[9px] text-brand-text-muted border border-brand-divider rounded px-1.5 py-0.5">
                              <ModIcon size={8} />{event.module}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[event.severity]}`}>
                              {event.severity}
                            </span>
                            {event.eventId && (
                              <button
                                onClick={() => navigate(`/org/events/${event.eventId}`)}
                                title="Open event"
                                className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-brand-divider text-brand-text-muted hover:text-white transition-all cursor-pointer"
                                style={{ borderColor: pColor, color: pColor }}
                              >
                                <ExternalLink size={8} /> Event
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-brand-divider">
              <span className="text-[9px] text-brand-text-muted">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] text-brand-text-muted px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted disabled:opacity-30">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
