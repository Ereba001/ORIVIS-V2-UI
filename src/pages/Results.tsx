import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { ArrowLeft, ChevronRight, Vote, Users, BarChart3, Award, CheckCircle2, Clock, TrendingUp, Loader2, AlertTriangle } from "lucide-react"
import SeoHead from "../components/SeoHead"
import { getApiClient } from "../lib/api-client"
import { resultsService, type PublicElectionListItem, type ElectionResults, type ResultsPosition } from "../services/results-service"

interface Contestant {
  id: string
  name: string
  votes: number
  percentage: number
}

interface Position {
  id: string
  title: string
  contestants: Contestant[]
  totalVotes: number
}

interface Election {
  id: string
  name: string
  organization: string
  status: "Live" | "Concluded" | "Upcoming"
  positions: Position[]
  totalVoters: number
  turnout: number
  date: string
}

type ViewState = "list" | "positions" | "contestants"

function lifecycleLabel(state: string): Election["status"] {
  const ended = ["ended", "closed", "certified", "archived", "cancelled"]
  const live = ["live", "paused", "published"]
  const s = (state ?? "").toLowerCase()
  if (ended.includes(s)) return "Concluded"
  if (live.includes(s)) return "Live"
  return "Upcoming"
}

function positionToView(pos: ResultsPosition): Position {
  return {
    id: pos.id,
    title: pos.title,
    totalVotes: pos.totalVotes ?? 0,
    contestants: (pos.candidates ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      votes: c.voteCount ?? 0,
      percentage: Math.round(c.voteShare ?? 0),
    })),
  }
}

export default function Results() {
  const [view, setView] = useState<ViewState>("list")
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getApiClient()
      .get<unknown>("/public/elections?per_page=50")
      .then((res) => {
        if (!active) return
        const body = res.data as { data?: unknown; success?: boolean } | unknown[]
        let raw: unknown[]
        if (Array.isArray(body)) {
          raw = body
        } else if (body && typeof body === "object" && "data" in body) {
          raw = (body as { data: unknown }).data as unknown[]
        } else {
          raw = []
        }
        const list = (raw ?? [])
          .map((item): PublicElectionListItem | null => {
            if (!item || typeof item !== "object") return null
            const e = item as Partial<PublicElectionListItem>
            if (typeof e.slug !== "string" || typeof e.title !== "string") return null
            return {
              id: String(e.id ?? e.uuid ?? ""),
              uuid: String(e.uuid ?? e.id ?? ""),
              slug: e.slug,
              title: e.title,
              subtitle: e.subtitle ?? null,
              description: e.description ?? null,
              type: e.type ?? "election",
              category: e.category ?? null,
              visibility: e.visibility ?? "public",
              status: e.status ?? "Upcoming",
              lifecycleState: e.lifecycleState ?? e.status ?? "",
              startsAt: e.startsAt ?? null,
              endsAt: e.endsAt ?? null,
              totalRegistered: Number(e.totalRegistered ?? 0),
              organizationId: String(e.organizationId ?? ""),
              organizationName: e.organizationName ?? null,
              createdAt: e.createdAt ?? "",
            }
          })
          .filter((e): e is PublicElectionListItem => e !== null)
          .map((e): Election => {
            const status = lifecycleLabel(e.lifecycleState)
            return {
              id: e.uuid || e.slug,
              name: e.title,
              organization: e.organizationName ?? "ORIVIS Election",
              status,
              totalVoters: e.totalRegistered,
              turnout: 0,
              date: e.endsAt ? new Date(e.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Open",
              positions: [],
              _slug: e.slug,
            } as Election & { _slug: string }
          })
        setElections(list)
      })
      .catch(() => {
        if (!active) return
        setError("There was a problem loading published results.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openElection = useCallback((el: Election) => {
    setSelectedElection(el)
    setView("positions")
    setDetailLoading(true)
    setDetailError(null)
    const slug = (el as Election & { _slug?: string })._slug ?? el.id
    resultsService
      .getPublicResults(slug)
      .then((data: ElectionResults | null) => {
        if (data && data.positions && data.positions.length > 0) {
          setSelectedElection({
            ...el,
            turnout: data.summary?.turnout ?? 0,
            totalVoters: data.summary?.registeredVoters ?? el.totalVoters,
            positions: data.positions.map(positionToView),
          })
        } else {
          setDetailError("Results are not available for this election yet.")
        }
      })
      .catch(() => {
        setDetailError("Results are not available for this election yet.")
      })
      .finally(() => setDetailLoading(false))
  }, [])

  const openPosition = (pos: Position) => {
    setSelectedPosition(pos)
    setView("contestants")
  }

  const backToList = () => {
    setView("list")
    setSelectedElection(null)
    setSelectedPosition(null)
    setDetailError(null)
  }

  const backToPositions = () => {
    setView("positions")
    setSelectedPosition(null)
  }

  const maxVotes = (contestants: Contestant[]) =>
    Math.max(...contestants.map((c) => c.votes), 1)

  return (
    <>
      <SeoHead meta={{ title: "Results Centre | ORIVIS" }} />
      <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans antialiased">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
            <Loader2 size={28} className="animate-spin text-brand-gold" />
            <p className="text-xs text-brand-text-muted">Loading published results…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
            <AlertTriangle size={28} className="text-brand-gold" />
            <p className="text-xs text-brand-text-muted">{error}</p>
          </div>
        )}

        {!loading && !error && view === "list" && (
          <motion.div
            key="results-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">Public Verifiable Data</span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase tracking-tight text-brand-text-primary">
                Election Results
              </h1>
              <p className="text-xs text-brand-text-muted max-w-xl mt-1">
                Browse published results from past and active elections. Select an election to view position level breakdowns and individual contestant vote counts.
              </p>
            </div>

            {elections.length === 0 ? (
              <div className="glass-card rounded-[20px] p-8 text-center">
                <p className="text-xs text-brand-text-muted">No published results available yet.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {elections.map((el) => {
                const hasResults = el.status !== "Upcoming"
                return (
                <button
                  key={el.id}
                  onClick={() => hasResults && openElection(el)}
                  className={`glass-card rounded-[20px] p-5 text-left transition-all ${
                    hasResults ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      el.status === "Live"
                        ? "bg-brand-surface-elevated text-brand-text-primary border border-brand-border"
                        : el.status === "Concluded"
                        ? "bg-status-success/10 text-status-success"
                        : "bg-brand-bg-secondary text-brand-text-muted border border-brand-border"
                    }`}>
                      {el.status === "Live" && <span className="w-1 h-1 rounded-full bg-status-error animate-pulse" />}
                      {el.status}
                    </span>
                    <span className="text-[9px] font-mono text-brand-text-muted">{el.date}</span>
                  </div>
                  <h3 className="font-sans font-extrabold text-xs uppercase tracking-tight text-brand-text-primary mb-0.5">{el.name}</h3>
                  <p className="text-[10px] text-brand-text-muted mb-4">{el.organization}</p>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-brand-text-muted border-t border-brand-border pt-3">
                    <span className="flex items-center gap-1"><Users size={11} />{el.totalVoters.toLocaleString()} voters</span>
                    {el.status !== "Upcoming" && <span className="flex items-center gap-1"><BarChart3 size={11} />{el.turnout}% turnout</span>}
                    <span className="flex items-center gap-1 ml-auto"><ChevronRight size={12} className="text-brand-gold" /></span>
                  </div>
                </button>
              )
            })}
            </div>
            )}
          </motion.div>
        )}

        {!loading && !error && view === "positions" && selectedElection && (
          <motion.div
            key="results-positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button onClick={backToList}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer mb-2">
              <ArrowLeft size={13} /> Back to Elections
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">{selectedElection.organization}</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brand-text-primary">{selectedElection.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-brand-text-muted">
                <span className="flex items-center gap-1"><Users size={12} />{selectedElection.totalVoters.toLocaleString()} registered</span>
                <span className="flex items-center gap-1"><TrendingUp size={12} />{selectedElection.turnout}% turnout</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                  selectedElection.status === "Concluded" ? "text-status-success" : "text-status-error"
                }`}>
                  {selectedElection.status === "Live" ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                  {selectedElection.status}
                </span>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 size={20} className="animate-spin text-brand-gold" />
                <span className="text-xs text-brand-text-muted">Loading results…</span>
              </div>
            ) : detailError ? (
              <div className="glass-card rounded-[20px] p-8 text-center">
                <AlertTriangle size={22} className="text-brand-gold mx-auto mb-3" />
                <p className="text-xs text-brand-text-muted">{detailError}</p>
              </div>
            ) : selectedElection.positions.length === 0 ? (
              <div className="glass-card rounded-[20px] p-8 text-center">
                <p className="text-xs text-brand-text-muted">No position level results are available for this election.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedElection.positions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => openPosition(pos)}
                  className="glass-card rounded-[20px] p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans font-extrabold text-xs uppercase tracking-tight text-brand-text-primary">{pos.title}</h3>
                    <Award size={15} className="text-brand-gold" />
                  </div>
                  <div className="space-y-2">
                    {[...pos.contestants].sort((a, b) => b.votes - a.votes).slice(0, 3).map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            i === 0 ? "bg-brand-gold" : i === 1 ? "bg-brand-text-muted" : "bg-brand-text-disabled"
                          }`} />
                          <span className={i === 0 ? "font-bold text-brand-text-primary" : "text-brand-text-muted"}>{c.name}</span>
                        </span>
                        <span className="font-mono font-bold">{c.votes} votes</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-brand-border flex items-center justify-between text-[9px] font-mono text-brand-text-muted">
                    <span>{pos.totalVotes} total votes</span>
                    <ChevronRight size={12} className="text-brand-gold" />
                  </div>
                </button>
              ))}
            </div>
            )}
          </motion.div>
        )}

        {!loading && !error && view === "contestants" && selectedPosition && selectedElection && (
          <motion.div
            key="results-contestants"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button onClick={backToPositions}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-hover transition-colors cursor-pointer mb-2">
              <ArrowLeft size={13} /> Back to Positions
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold font-bold">{selectedElection.organization}</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brand-text-primary">{selectedPosition.title}</h1>
              <p className="text-xs text-brand-text-muted mt-1">
                {selectedElection.name} &mdash; {selectedPosition.totalVotes} ballots cast
              </p>
            </div>

            <div className="space-y-3">
              {[...selectedPosition.contestants]
                .sort((a, b) => b.votes - a.votes)
                .map((c, i) => {
                  const barWidth = c.votes > 0 ? (c.votes / maxVotes(selectedPosition.contestants)) * 100 : 0
                  const isWinner = i === 0 && c.votes > 0
                  return (
                    <div key={c.id} className="glass-card rounded-[20px] p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isWinner && <Award size={14} className="text-brand-gold" />}
                          <h3 className={`font-sans font-extrabold text-xs uppercase tracking-tight ${isWinner ? "text-brand-gold" : "text-brand-text-primary"}`}>
                            {c.name}
                          </h3>
                          {isWinner && <span className="text-[8px] font-mono font-bold uppercase text-status-success bg-status-success/10 px-1.5 py-0.5 rounded">Leading</span>}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-brand-text-primary">{c.votes.toLocaleString()}</span>
                          <span className="text-[9px] font-mono text-brand-text-muted ml-1">votes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2.5 bg-brand-bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${isWinner ? "bg-brand-gold" : "bg-brand-text-muted/40"}`}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-brand-text-primary min-w-[3rem] text-right">{c.percentage}%</span>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="glass-card rounded-[20px] p-5 flex items-center justify-between text-[10px] font-mono text-brand-text-muted">
              <span className="flex items-center gap-2"><Vote size={14} /> Total valid ballots for this position</span>
              <span className="font-bold text-brand-text-primary">{selectedPosition.totalVotes.toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}
