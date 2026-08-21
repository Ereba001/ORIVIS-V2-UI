import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  AlertTriangle, ArrowLeft, BarChart3, Loader2, Radio, RefreshCw, Trophy, Users, Vote,
} from 'lucide-react'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import { resultsService, type ElectionResults } from '../../services/results-service'
import { electionService } from '../../services/election-service'
import type { Election } from '../../types/election'
import SeoHead from '../../components/SeoHead'
import DashboardCard from '../components/DashboardCard'
import EmptyState from '../components/EmptyState'

const POLL_INTERVAL_MS = 8000

export default function LiveResults() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [data, setData] = useState<ElectionResults | null>(null)
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const loadingRef = useRef(false)
  const unavailableRef = useRef(false)

  useEffect(() => {
    if (!id) return
    const electionId = id
    let active = true

    setData(null)
    setLoading(true)
    setError(null)
    setUnavailable(false)
    unavailableRef.current = false

    async function load(force: boolean) {
      if (!force && loadingRef.current) return
      if (unavailableRef.current) return
      loadingRef.current = true
      try {
        const result = await resultsService.getLiveResults(electionId)
        if (!active) return
        setData(result)
        setError(null)
      } catch (err) {
        if (!active) return
        const code = (err as Error & { code?: string | null }).code
        if (code === 'LIVE_RESULTS_UNAVAILABLE') {
          unavailableRef.current = true
          setUnavailable(true)
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load live results')
      } finally {
        loadingRef.current = false
      }
    }

    load(true).then(() => {
      if (active) setLoading(false)
    })

    const intervalId = window.setInterval(() => {
      load(false)
    }, POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [id, reloadKey])

  useEffect(() => {
    if (!id) return
    let active = true
    electionService.getElection(id)
      .then((e) => {
        if (active) setElection(e)
      })
      .catch(() => {
        if (active) setElection(null)
      })
    return () => {
      active = false
    }
  }, [id])

  const isLive = data?.isLive === true
  const statusLabel = election?.status ?? data?.election?.status ?? null

  const policyDisabled = election !== null && election.settings?.live_results !== true

  if (unavailable || policyDisabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={BarChart3}
          title="Live Results are Disabled"
          description="Live results have not been enabled for this event. Enable them in event settings to view tallies as votes are counted."
          action={{ label: 'Back to Event', onClick: () => navigate(`/org/events/${id}`) }}
        />
      </div>
    )
  }
    if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (!data) {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={AlertTriangle}
            title="Failed to Load Live Results"
            description={error}
            action={{ label: 'Retry', onClick: () => setReloadKey((k) => k + 1) }}
          />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={BarChart3}
          title="No Results Available"
          description="Live results are not available for this event."
          action={{ label: 'Retry', onClick: () => setReloadKey((k) => k + 1) }}
        />
      </div>
    )
  }

  const summaryStats = [
    { label: 'Eligible Voters', value: data.summary.eligibleVoters, icon: Users },
    { label: 'Registered Voters', value: data.summary.registeredVoters, icon: Users },
    { label: 'Ballots Cast', value: data.summary.ballotsCast, icon: Vote },
    { label: 'Confirmed Votes', value: data.summary.confirmedVotes, icon: Vote },
    { label: 'Turnout', value: `${data.summary.turnout}%`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-8">
      <SeoHead meta={{ title: `${election?.title ?? 'Live Results'} — Organization | ORIVIS`, noindex: true }} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            onClick={() => navigate(`/org/events/${id}`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl hover:bg-brand-surface-interactive text-brand-text-muted shrink-0"
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] text-brand-text-muted mb-0.5">
              <button onClick={() => navigate('/org/events')} className="hover:underline">Events</button>
              <span>/</span>
              <span className="truncate text-brand-text-primary">{election?.title ?? 'Live Results'}</span>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-brand-text-primary truncate">
                <span className="inline-flex items-center gap-2">
                  <Radio size={18} className="shrink-0" style={{ color: pColor }} />
                  Live Results
                </span>
              </h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-error/10 border border-status-error/20 px-2.5 py-1 text-[10px] font-bold text-status-error whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-error opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-status-error" />
                  </span>
                  Live
                </span>
              ) : statusLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface border border-brand-border px-2.5 py-1 text-[10px] font-bold text-brand-text-muted whitespace-nowrap">
                  {statusLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <motion.button
          onClick={() => setReloadKey((k) => k + 1)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold bg-brand-surface border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors shrink-0"
        >
          <RefreshCw size={12} />
          Refresh
        </motion.button>
      </div>

      {/* SUMMARY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Live Overview</h3>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-brand-text-muted">
            <RefreshCw size={10} />
            Refreshes every 8s
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-brand-surface rounded-xl border border-brand-border shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-brand-text-primary tracking-tight">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}
                  >
                    <Icon size={16} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* LEADERBOARDS */}
      {data.positions.length === 0 ? (
        <DashboardCard hover={false}>
          <EmptyState
            icon={Trophy}
            title="No positions configured yet"
            description="Results will appear once voting begins."
          />
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Leaderboards</h3>
          {data.positions.map((pos, pi) => {
            const sorted = [...pos.candidates].sort((a, b) => b.voteCount - a.voteCount)
            return (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <DashboardCard hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy size={14} className="shrink-0" style={{ color: pColor }} />
                      <h3 className="text-xs font-bold text-brand-text-primary truncate">{pos.title}</h3>
                      <span className="text-[9px] text-brand-text-muted shrink-0">up to {pos.maxSelections} select</span>
                    </div>
                    <span className="text-[9px] text-brand-text-muted shrink-0">{pos.totalVotes.toLocaleString()} votes</span>
                  </div>
                  <div className="space-y-2">
                    {sorted.map((c) => {
                      const share = Math.max(0, Math.min(100, Math.round(c.voteShare)))
                      const isLeader = c.winner || c.rank === 1
                      const isElected = c.elected
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isLeader ? 'bg-status-success/10 border border-status-success/20' : 'bg-brand-surface-elevated/20'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-brand-surface-interactive flex items-center justify-center text-[9px] font-mono font-bold text-brand-text-muted shrink-0">
                            {c.rank || sorted.indexOf(c) + 1}
                          </span>
                          {c.photoUrl && (
                            <img src={c.photoUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-brand-text-primary truncate">{c.name}</span>
                              {isElected && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20 whitespace-nowrap">
                                  Elected
                                </span>
                              )}
                              {!isElected && isLeader && (
                                <span
                                  className="text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                  style={{ backgroundColor: 'color-mix(in srgb, var(--org-primary) 10%, transparent)', color: 'var(--org-primary)' }}
                                >
                                  Leading
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-brand-text-muted">{c.voteCount.toLocaleString()} votes</span>
                              <span className="text-[9px] font-mono font-bold" style={{ color: pColor }}>
                                {share}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-brand-surface-elevated rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${share}%`, backgroundColor: isLeader ? '#22C55E' : pColor }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </DashboardCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
