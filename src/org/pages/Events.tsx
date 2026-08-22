import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Search, Vote, MoreHorizontal, BarChart3, Activity, Loader2, Eye, Edit3, Globe, X, Copy, Archive, Trash2, AlertTriangle, Play, Square } from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { useAuth } from '../../hooks/useAuth'
import { orgService } from '../../services/org-service'
import { electionService } from '../../services/election-service'
import { ROUTES } from '../../constants/routes'
import SeoHead from "../../components/SeoHead"
import DashboardCard from '../components/DashboardCard'
import EventStatusBadge from '../components/EventStatusBadge'
import OperationProgressModal, { type OperationState } from '../components/OperationProgressModal'
import type { EventSummary, EventStatus } from '../types'

const PUBLISH_STAGES = [
  'Validating election configuration...',
  'Validating participants...',
  'Validating candidates...',
  'Verifying voting configuration...',
  'Preparing election environment...',
  'Publishing election...',
  'Finalizing...',
]

type FilterTab = 'all' | 'live' | 'published' | 'created' | 'ended' | 'draft'

type EventAction = 'view' | 'edit' | 'results' | 'publish' | 'start' | 'stop' | 'close' | 'duplicate' | 'archive' | 'delete'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'published', label: 'Published' },
  { key: 'created', label: 'Created' },
  { key: 'ended', label: 'Ended' },
  { key: 'draft', label: 'Draft' },
]

const AUDIT_ACTION_META: Partial<Record<EventAction, { label: string; verb: string; description: string }>> = {
  start: { label: 'Start Event', verb: 'start', description: 'Start voting for this event.' },
  stop: { label: 'Stop Event', verb: 'stop', description: 'Stop voting for this event. It will be moved to ended.' },
  close: { label: 'Close Event', verb: 'close', description: 'Close voting for this event.' },
}

export default function OrgEvents() {
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const { activeOrganization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<EventSummary | null>(null)
  const [auditTarget, setAuditTarget] = useState<{ event: EventSummary; action: EventAction } | null>(null)
  const [auditNote, setAuditNote] = useState('')
  const [auditBusy, setAuditBusy] = useState(false)

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishModalState, setPublishModalState] = useState<OperationState>('idle')
  const [publishStage, setPublishStage] = useState(0)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishEventTitle, setPublishEventTitle] = useState('')

  const loadEvents = useCallback(() => {
    if (!activeOrganization) return
    setLoading(true)
    setError(null)
    orgService.getElections({ perPage: 100 })
      .then((result) => setEvents(result.items))
      .catch((err) => setError(err?.message || 'Failed to load events'))
      .finally(() => setLoading(false))
  }, [activeOrganization])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const closeMenu = () => {
    setMenuOpenId(null)
    setMenuPos(null)
  }

  useEffect(() => {
    if (!menuOpenId) return
    const close = () => { setMenuOpenId(null); setMenuPos(null) }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menuOpenId])

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
    completed: events.filter((e) => e.status === 'completed' || e.status === 'ended').length,
  }), [events])

  // An event with a scheduled publish time but not yet published shows as
  // "Scheduled" (the backend keeps the lifecycle state until the scheduler
  // flips it to PUBLISHED). Actions and filters still key off the raw status.
  const displayStatus = (el: EventSummary): EventStatus =>
    (el.status === 'created' || el.status === 'ready') && el.scheduledPublishAt ? 'scheduled' : el.status

  const handleAction = async (event: EventSummary, action: EventAction) => {
    closeMenu()
    setActionError(null)
    if (action === 'view') {
      navigate(ROUTES.ORG.EVENT_DETAIL(event.id))
      return
    }
    if (action === 'edit') {
      // Drafts resume in the create wizard; others go to the edit form
      if (event.status === 'draft') {
        navigate(`${ROUTES.ORG.CREATE_EVENT}?draft=${event.id}`)
      } else {
        navigate(ROUTES.ORG.EVENT_DETAIL(event.id))
      }
      return
    }
    if (action === 'results') {
      navigate(ROUTES.ORG.EVENT_RESULTS(event.id))
      return
    }
    if (action === 'delete') {
      setConfirmDelete(event)
      return
    }
    if (action === 'start' || action === 'stop' || action === 'close') {
      setAuditNote('')
      setAuditTarget({ event, action })
      return
    }
    setBusyId(event.id)
    try {
      if (action === 'publish') {
        setPublishEventTitle(event.title)
        setPublishModalOpen(true)
        setPublishModalState('processing')
        setPublishStage(0)
        setPublishError(null)
        const stageInterval = setInterval(() => {
          setPublishStage((prev) => Math.min(prev + 1, PUBLISH_STAGES.length - 1))
        }, 800)
        try {
          await electionService.publishElection(event.id)
          clearInterval(stageInterval)
          setPublishStage(PUBLISH_STAGES.length - 1)
          setPublishModalState('success')
          await loadEvents()
        } catch (err) {
          clearInterval(stageInterval)
          setPublishModalState('error')
          setPublishError(err instanceof Error ? err.message : 'Failed to publish event')
        }
        return
      }
      else if (action === 'archive') await electionService.archiveElection(event.id)
      else if (action === 'duplicate') {
        const copy = await electionService.duplicateElection(event.id)
        await loadEvents()
        navigate(ROUTES.ORG.EVENT_DETAIL(copy.id), { replace: true })
        return
      }
      await loadEvents()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} event`)
    } finally {
      setBusyId(null)
    }
  }

  const handleAuditAction = async () => {
    if (!auditTarget) return
    const { event, action } = auditTarget
    const note = auditNote.trim()
    if (!note) {
      setActionError('An audit note describing the change is required.')
      return
    }
    setAuditBusy(true)
    setActionError(null)
    try {
      if (action === 'start') await electionService.startElection(event.id, note)
      else if (action === 'stop') await electionService.stopElection(event.id, note)
      else if (action === 'close') await electionService.closeElection(event.id, note)
      setAuditTarget(null)
      await loadEvents()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} event`)
    } finally {
      setAuditBusy(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    const target = confirmDelete
    setConfirmDelete(null)
    setActionError(null)
    setBusyId(target.id)
    try {
      await electionService.deleteElection(target.id)
      await loadEvents()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setBusyId(null)
    }
  }

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
        <button onClick={loadEvents} className="mt-2 text-[10px] text-brand-text-muted hover:text-brand-text-primary underline cursor-pointer">Retry</button>
      </div>
    )
  }

  return (
    <>
      <SeoHead meta={{ title: "Events — Organization | ORIVIS", noindex: true }} />
      <div className="space-y-6 max-w-[1440px] mx-auto pb-8">
        {actionError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20">
            <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
            <p className="text-xs text-status-error font-medium">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="ml-auto text-status-error hover:underline text-[10px] font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-text-primary">
              Events
            </h1>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              {stats.total} event{stats.total !== 1 ? 's' : ''} across your organization
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/org/events/create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all w-full sm:w-auto text-white"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus size={14} />
            Create Event
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard>
            <p className="text-[10px] text-brand-text-muted ">Total Events</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.total}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-success ">Live</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.live}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-status-warning ">Published</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.published}</p>
          </DashboardCard>
          <DashboardCard>
            <p className="text-[10px] text-brand-text-muted ">Completed</p>
            <p className="text-2xl font-bold text-brand-text-primary mt-1">{stats.completed}</p>
          </DashboardCard>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          <input
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
            placeholder="Search events..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-brand-surface border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': branding.primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === 'all' ? events.length : events.filter((e) => e.status === tab.key).length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--org-primary)]/10 text-[var(--org-primary)] border border-[var(--org-primary)]/20'
                    : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-text-muted/30'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${isActive ? 'bg-[var(--org-primary)]/20' : 'bg-brand-surface-elevated text-brand-text-disabled'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-elevated">
                  {['Event', 'Status', 'Participants', 'Turnout', 'Positions', 'Duration', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[9px] text-brand-text-muted font-bold">
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
                    onClick={() => navigate(el.status === 'draft' ? `${ROUTES.ORG.CREATE_EVENT}?draft=${el.id}` : `/org/events/${el.id}`)}
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
                      <EventStatusBadge status={displayStatus(el)} />
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text-primary">{el.voters.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-brand-text-primary">{el.turnout > 0 ? `${el.turnout}%` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-brand-text-primary">{el.positions}</td>
                    <td className="px-4 py-3 text-xs text-brand-text-muted ">
                      {el.startsAt ? new Date(el.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} — {el.endsAt ? new Date(el.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (menuOpenId === el.id) {
                              closeMenu()
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                              setMenuOpenId(el.id)
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                          aria-label={`Actions for ${el.title}`}
                          disabled={busyId === el.id}
                        >
                          {busyId === el.id ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                        </button>
                        {menuOpenId === el.id && menuPos && createPortal(
                          <>
                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeMenu() }} />
                            <div className="fixed z-50 w-44 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
                              {([
                                { label: 'View Details', value: 'view' as EventAction, icon: Eye },
                                ...(['ready', 'created'].includes(el.status) ? [{ label: 'Edit Event', value: 'edit' as EventAction, icon: Edit3 }] : []),
                                ...(el.status === 'draft' ? [{ label: 'Continue Setup', value: 'edit' as EventAction, icon: Edit3 }] : []),
                                ...(el.status === 'published' ? [{ label: 'Start Event', value: 'start' as EventAction, icon: Play }] : []),
                                ...(el.status === 'live' ? [{ label: 'Stop Event', value: 'stop' as EventAction, icon: Square }] : []),
                                ...(el.status === 'live' ? [{ label: 'Close Event', value: 'close' as EventAction, icon: X }] : []),
                                ...(['draft', 'ready', 'created'].includes(el.status) ? [{ label: 'Publish', value: 'publish' as EventAction, icon: Globe }] : []),
                                { label: 'Live Results', value: 'results' as EventAction, icon: BarChart3 },
                                { label: 'Duplicate', value: 'duplicate' as EventAction, icon: Copy },
                                { label: 'Archive', value: 'archive' as EventAction, icon: Archive },
                                ...(el.status === 'draft' ? [{ label: 'Delete', value: 'delete' as EventAction, icon: Trash2 }] : []),
                              ]).map((a) => {
                                const ActionIcon = a.icon
                                const danger = a.value === 'delete'
                                return (
                                  <button
                                    key={a.value}
                                    onClick={(e) => { e.stopPropagation(); handleAction(el, a.value) }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono transition-colors ${danger ? 'text-status-error hover:bg-status-error/10' : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive'}`}
                                  >
                                    <ActionIcon size={12} />
                                    {a.label}
                                  </button>
                                )
                              })}
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden bg-brand-surface border border-brand-border rounded-2xl divide-y divide-brand-border overflow-hidden">
          {filtered.map((el, i) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="px-4 py-3 cursor-pointer active:bg-brand-surface-interactive/50 transition-colors"
              onClick={() => navigate(el.status === 'draft' ? `${ROUTES.ORG.CREATE_EVENT}?draft=${el.id}` : `/org/events/${el.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated flex items-center justify-center shrink-0" style={{ color: 'var(--org-primary)' }}>
                    <Vote size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand-text-primary truncate">{el.title}</p>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">
                      {el.voters.toLocaleString()} participants · {el.positions} positions
                    </p>
                  </div>
                </div>
                <div className="shrink-0 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (menuOpenId === el.id) {
                        closeMenu()
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                        setMenuOpenId(el.id)
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted cursor-pointer"
                    aria-label={`Actions for ${el.title}`}
                    disabled={busyId === el.id}
                  >
                    {busyId === el.id ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                  </button>
                  {menuOpenId === el.id && menuPos && createPortal(
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeMenu() }} />
                      <div className="fixed z-50 w-44 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
                        {([
                          { label: 'View Details', value: 'view' as EventAction, icon: Eye },
                          ...(['ready', 'created'].includes(el.status) ? [{ label: 'Edit Event', value: 'edit' as EventAction, icon: Edit3 }] : []),
                          ...(el.status === 'draft' ? [{ label: 'Continue Setup', value: 'edit' as EventAction, icon: Edit3 }] : []),
                          ...(el.status === 'published' ? [{ label: 'Start Event', value: 'start' as EventAction, icon: Play }] : []),
                          ...(el.status === 'live' ? [{ label: 'Stop Event', value: 'stop' as EventAction, icon: Square }] : []),
                          ...(el.status === 'live' ? [{ label: 'Close Event', value: 'close' as EventAction, icon: X }] : []),
                          ...(['draft', 'ready', 'created'].includes(el.status) ? [{ label: 'Publish', value: 'publish' as EventAction, icon: Globe }] : []),
                          { label: 'Live Results', value: 'results' as EventAction, icon: BarChart3 },
                          { label: 'Duplicate', value: 'duplicate' as EventAction, icon: Copy },
                          { label: 'Archive', value: 'archive' as EventAction, icon: Archive },
                          ...(el.status === 'draft' ? [{ label: 'Delete', value: 'delete' as EventAction, icon: Trash2 }] : []),
                        ]).map((a) => {
                          const ActionIcon = a.icon
                          const danger = a.value === 'delete'
                          return (
                            <button
                              key={a.value}
                              onClick={(e) => { e.stopPropagation(); handleAction(el, a.value) }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono transition-colors ${danger ? 'text-status-error hover:bg-status-error/10' : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive'}`}
                            >
                              <ActionIcon size={12} />
                              {a.label}
                            </button>
                          )
                        })}
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pl-11">
                <EventStatusBadge status={displayStatus(el)} />
                <span className="text-[10px] text-brand-text-muted">
                  {el.startsAt ? new Date(el.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} — {el.endsAt ? new Date(el.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-surface-elevated flex items-center justify-center mb-3" style={{ color: 'var(--org-primary)' }}>
              <BarChart3 size={24} />
            </div>
            <p className="text-sm font-semibold text-brand-text-primary mb-1">No Events Found</p>
            <p className="text-xs text-brand-text-muted max-w-[240px]">
              {search ? 'Try a different search term.' : 'No events match the selected filter.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardCard>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-brand-gold" />
              <h3 className="text-[10px] font-bold text-brand-text-primary">Event Activity</h3>
            </div>            <div className="space-y-3">
              {events.filter((e) => e.status === 'live' || e.status === 'published').slice(0, 3).map((el) => (
                <div key={el.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-brand-text-primary truncate">{el.title}</p>
                    <p className="text-[9px] text-brand-text-muted">{el.voters.toLocaleString()} voters · {el.positions} positions</p>
                  </div>
                  <EventStatusBadge status={displayStatus(el)} />
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
              <h3 className="text-[10px] font-bold text-brand-text-primary">Turnout Overview</h3>
            </div>
            <div className="space-y-3">
              {events.filter((e) => e.status === 'completed' || e.status === 'live').slice(0, 3).map((el) => (
                <div key={el.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-brand-text-primary truncate">{el.title}</p>
                    <span className="text-[10px] font-bold text-brand-text-primary">{el.turnout}%</span>
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

      {auditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-surface-interactive border border-brand-border mb-4" style={{ color: 'var(--org-primary)' }}>
              {auditTarget.action === 'stop' ? <Square size={22} /> : <Play size={22} />}
            </div>
            <h3 className="text-base font-semibold text-brand-text-primary text-center">
              {AUDIT_ACTION_META[auditTarget.action]?.label ?? 'Confirm action'}
            </h3>
            <p className="mt-1 text-xs text-brand-text-muted text-center">
              &quot;{auditTarget.event.title}&quot; — {AUDIT_ACTION_META[auditTarget.action]?.description ?? 'This action is recorded in the audit log.'}
            </p>
            <div className="mt-5">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-brand-text-muted mb-1.5">
                Audit note <span className="text-status-error">*</span>
              </label>
              <textarea
                name="auditNote"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Describe why you are making this change..."
                className="w-full rounded-xl text-xs bg-brand-surface-elevated border border-brand-border text-brand-text-primary placeholder:text-brand-text-disabled focus:outline-none focus:ring-2 px-3 py-2.5 resize-none"
                style={{ '--tw-ring-color': 'var(--org-primary)' } as React.CSSProperties}
              />
            </div>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setAuditTarget(null)}
                disabled={auditBusy}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-surface-interactive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAuditAction}
                disabled={auditBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--org-primary)' }}
              >
                {auditBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {AUDIT_ACTION_META[auditTarget.action]?.verb ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center bg-status-error/10 border border-status-error/20 mb-4">
              <Trash2 size={22} className="text-status-error" />
            </div>
            <h3 className="text-base font-semibold text-brand-text-primary text-center">Delete this event?</h3>
            <p className="mt-1 text-xs text-brand-text-muted text-center">
              &quot;{confirmDelete.title}&quot; will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-surface-interactive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={busyId === confirmDelete.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-status-error hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {busyId === confirmDelete.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <OperationProgressModal
        open={publishModalOpen}
        state={publishModalState}
        title={`Publishing ${publishEventTitle}`}
        stages={PUBLISH_STAGES}
        currentStage={publishStage}
        successTitle="Election Published Successfully"
        successMessage="Your election is now live according to its configured schedule."
        errorTitle="Election Publication Failed"
        errorMessage={publishError || 'We could not publish this election. Please review and try again.'}
        successActionLabel="Done"
        errorActionLabel="Close"
        onSuccessAction={() => setPublishModalOpen(false)}
        onErrorAction={() => setPublishModalOpen(false)}
        onClose={() => setPublishModalOpen(false)}
      />
    </>
  )
}
