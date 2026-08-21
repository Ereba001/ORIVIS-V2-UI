import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Loader2, Shield, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  PartyPopper, Lock, UserPlus, RotateCcw, BarChart3, RefreshCw,
} from "lucide-react"
import SeoHead from "../../components/SeoHead"
import VotingPassInput from "../../components/VotingPassInput"
import BallotPosition from "../../components/BallotPosition"

import { electionService } from "../../services/election-service"
import { publicVoterService } from "../../services/public-voter-service"
import { resultsService } from "../../services/results-service"
import { useElectionBranding } from "../../hooks/useElectionBranding"
import { usePolling } from "../../hooks/usePolling"
import type { Election, VoterPositionView } from "../../types/election"
import type { VoterBallot, VoterBallotPosition, VoteToken, VoterConsoleStatus, VoterConsoleNextAction } from "../../types/voting-pass"

type Phase = "gate" | "start" | "pass" | "ballot" | "review" | "done" | "results"

// The voter's own pass is kept in per-tab sessionStorage (never the URL) so a
// returning voter who already completed voting is shown the terminal Vote Cast
// / Completed state on reload — never a Cast Vote action.
const PASS_STORAGE_KEY = "orivis_vote_pass"

function toViewPosition(raw: VoterBallotPosition): VoterPositionView {
  return {
    id: String(raw.positionId),
    title: raw.title,
    description: raw.description ?? "",
    maxSelections: raw.maxSelections ?? 1,
    candidates: raw.candidates.map((c) => ({
      id: String(c.candidateId),
      name: c.name,
      party: c.taxpayer ?? undefined,
      photoUrl: c.photoUrl ?? undefined,
    })),
  }
}

type ResultsData = Awaited<ReturnType<typeof resultsService.getPublicResults>>

export default function VoterConsole() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [passCode, setPassCode] = useState("")
  const [passError, setPassError] = useState("")
  const [busy, setBusy] = useState(false)

  const [token, setToken] = useState<VoteToken | null>(null)
  const [ballot, setBallot] = useState<VoterBallot | null>(null)
  const [phase, setPhase] = useState<Phase>("start")
  const [positionIndex, setPositionIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string | null>>({})

  const [status, setStatus] = useState<VoterConsoleStatus | null>(null)

  const branding = useElectionBranding(election)

  const viewPositions = useMemo(
    () => (ballot?.positions ?? []).map(toViewPosition),
    [ballot],
  )

  // Refresh the authoritative election state while the voter is still on the
  // start/pass screens so a scheduled published→live transition (or an end) is
  // picked up without a manual reload. Once a ballot/session is active the
  // console stops polling — the backend enforces the live window anyway.
  const refreshElection = useCallback(async () => {
    if (!id) return
    const data = await electionService.getPublicElection(id)
    if (!data) return
    setElection(data)
    const state = data.lifecycleState ?? data.status?.toLowerCase()
    if (state === "ended" || state === "archived") {
      setPhase("results")
    }
  }, [id])

  // Resolve the single authoritative next action (CP9). The status endpoint is
  // PII-free and never throws for a scoped election; it reports every state
  // (invalid/expired/used pass, already voted, not registered) as data so the
  // console renders a distinct, non-conflicting action instead of an error.
  const refreshStatus = useCallback(async () => {
    if (!id) return
    try {
      const s = await publicVoterService.getStatus(id, passCode.trim() || undefined)
      setStatus(s)
      if (s.nextAction === "results") {
        setPhase("results")
      }
    } catch {
      // Keep the last known status; the election read drives the fallback UI.
    }
  }, [id, passCode])

  const shouldPoll = phase === "start" || phase === "pass" || phase === "ballot"
  usePolling(() => {
    void refreshElection()
    void refreshStatus()
  }, 15000, Boolean(id) && shouldPoll)

  const loadData = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    setError("")
    try {
      const data = await electionService.getPublicElection(id)
      setElection(data)
      const state = data?.lifecycleState ?? data?.status?.toLowerCase()
      if (state === "ended" || state === "archived") {
        setPhase("results")
      }
    } catch {
      setError("Unable to load the voter console. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const saved = sessionStorage.getItem(PASS_STORAGE_KEY)
    if (saved) setPassCode(saved)
    let cancelled = false
    async function load() {
      try {
        const data = await electionService.getPublicElection(id!)
        if (cancelled) return
        setElection(data)
        const state = data?.lifecycleState ?? data?.status?.toLowerCase()
        if (state === "ended" || state === "archived") {
          setPhase("results")
        }
      } catch {
        if (!cancelled) setError("Unable to load the voter console. Check your connection and try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Status depends on the entered (or restored) pass code, so it is re-resolved
  // whenever the pass field changes — an already-voted voter is never left on a
  // Cast Vote action after entering their used pass. Debounced so a typing
  // burst does not trip the pass_validate throttle (30/min/IP) on the endpoint.
  useEffect(() => {
    const timer = setTimeout(() => { void refreshStatus() }, 500)
    return () => clearTimeout(timer)
  }, [refreshStatus])

  const handleStart = useCallback(() => {
    setPhase("pass")
  }, [])

  const handleStartSession = useCallback(async () => {
    if (!id) return
    if (passCode.trim().length === 0) { setPassError("Enter your voting pass to open your ballot."); return }
    setBusy(true)
    setPassError("")
    try {
      const result = await publicVoterService.startSession(id, passCode)
      sessionStorage.setItem(PASS_STORAGE_KEY, passCode.trim())
      setToken(result.token)
      setBallot(result.ballot)
      if (result.ballot && result.ballot.positions.length > 0) {
        setPhase("ballot")
      } else {
        setPhase("results")
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to open your voting session."
      if (/already voted/i.test(message)) {
        // The voter already completed voting — never offer a Cast Vote action.
        // The done phase renders the terminal Vote Cast / Completed state.
        sessionStorage.setItem(PASS_STORAGE_KEY, passCode.trim())
        setPhase("done")
      } else if (/already active|session/i.test(message)) {
        setError(message)
        setPassError("A voting session is already active for this pass. Please wait a moment and try again.")
      } else if (/network|fetch|timeout/i.test(message)) {
        setPassError("Network error. Please check your connection and try again.")
      } else {
        setPassError(message)
      }
    } finally {
      setBusy(false)
    }
  }, [id, passCode])

  const handleSelect = useCallback((candidateId: string | null) => {
    const p = viewPositions[positionIndex]
    if (!p) return
    setSelections((prev) => ({ ...prev, [p.id]: candidateId }))
  }, [viewPositions, positionIndex])

  const goNext = useCallback(() => {
    setPositionIndex((i) => Math.min(i + 1, viewPositions.length - 1))
  }, [viewPositions.length])

  const goPrev = useCallback(() => {
    setPositionIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!id || !ballot || !token) return
    setBusy(true)
    setError("")
    try {
      for (const raw of ballot.positions) {
        const key = String(raw.positionId)
        const chosen = selections[key] ?? null
        if (chosen === null) continue
        const candidate = raw.candidates.find((c) => String(c.candidateId) === chosen)
        if (!candidate) continue
        await publicVoterService.castVote(id, {
          passCode,
          token: token.rawToken ?? "",
          ballotUuid: ballot.uuid,
          positionId: raw.positionId,
          candidateId: candidate.candidateId,
          idempotencyKey: `${ballot.uuid}:${raw.positionId}`.slice(-64),
        })
      }
      // Persist the pass so a reload shows the terminal Vote Cast / Completed
      // state instead of a fresh ballot.
      sessionStorage.setItem(PASS_STORAGE_KEY, passCode.trim())
      setPhase("done")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to submit ballot."
      setError(message)
    } finally {
      setBusy(false)
    }
  }, [id, ballot, token, selections, passCode])

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--org-primary)" }} />
          <span className="text-xs text-brand-text-muted font-mono">Loading voter console...</span>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24 px-6">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle size={34} className="text-brand-text-disabled" />
          <p className="text-sm text-brand-text-muted">{error || "Election not found."}</p>
          {error && (
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-secondary text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Reload
            </button>
          )}
        </div>
      </div>
    )
  }

  const b = branding.branding
  const orgName = branding.displayName

  const lifecycle = election.lifecycleState ?? election.status?.toLowerCase()
  const votingOpen = lifecycle === "live" || lifecycle === "open"
  const registrationOpen = lifecycle === "published" || lifecycle === "live" || lifecycle === "paused"
  const votingEnded = lifecycle === "ended" || lifecycle === "archived"

  // Availability and the next action are derived from the authoritative backend
  // state (status endpoint, refreshed on a timer + when the pass changes). The
  // fallback below only applies before the first status response arrives.
  const nextAction: VoterConsoleNextAction = status?.nextAction ?? (
    votingEnded ? "results"
      : votingOpen ? "use_pass"
        : registrationOpen ? "register"
          : "results"
  )

  const ACTION_META: Record<VoterConsoleNextAction, { label: string; icon: typeof Lock; hint: string }> = {
    register: {
      label: "Register",
      icon: UserPlus,
      hint: registrationOpen
        ? "Registration is open. Register to receive your voting pass."
        : "This election is not currently open for voting.",
    },
    continue: {
      label: "Continue",
      icon: RotateCcw,
      hint: "Continue with your voting pass to open your ballot. Need a new pass? Contact the organizer.",
    },
    use_pass: {
      label: "Cast Your Ballot",
      icon: Lock,
      hint: votingOpen
        ? "Voting is open. Enter your voting pass to open your ballot."
        : "Voting opens when the election starts. Registered voters can join with their voting pass at that time.",
    },
    participate: {
      label: "Cast Your Ballot",
      icon: Lock,
      hint: "Voting is open to registered voters. Enter your voting pass to cast your ballot.",
    },
    vote_cast: {
      label: "Vote Cast",
      icon: CheckCircle,
      hint: "You have already voted in this election.",
    },
    results: {
      label: "View Results",
      icon: BarChart3,
      hint: "Voting for this election has ended.",
    },
  }

  const action = ACTION_META[nextAction] ?? ACTION_META.results

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: `${election.title} | ${orgName}`, noindex: true }} />

      <div
        className="w-full border-b border-brand-border relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${b?.primaryColor ?? "#111827"} 0%, ${b?.secondaryColor ?? "#000000"} 100%)` }}
      >
        {election.bannerUrl && (
          <img src={election.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        )}
        <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            {b?.logoUrl ? (
              <img src={b.logoUrl} alt={orgName} className="w-11 h-11 rounded-xl object-contain bg-white/10" />
            ) : (
              <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                {orgName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="text-left">
              <span className="block text-[10px] font-mono uppercase tracking-widest font-bold text-white/80">{orgName}</span>
              <span className="block text-[10px] text-white/55">Powered by ORIVIS</span>
            </div>
            <button
              onClick={() => navigate(`/elections/${election.slug ?? id}`)}
              className="ml-auto text-[10px] text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">{election.title}</h1>
          <p className="text-xs text-white/70 mt-2 max-w-lg leading-relaxed">{election.subtitle || election.description}</p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-10 flex-grow">
        <div className="max-w-2xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {phase === "start" && (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {nextAction === "vote_cast" || status?.hasVoted ? (
                  <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-10 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "color-mix(in srgb, var(--org-primary) 15%, transparent)" }}>
                      <CheckCircle size={28} style={{ color: "var(--org-primary)" }} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text-primary">Vote Cast</h2>
                    <p className="text-xs sm:text-sm text-brand-text-muted mt-3 max-w-md mx-auto leading-relaxed">
                      You have already voted in this election. Your ballot has been recorded securely and anonymously.
                    </p>
                    <button
                      onClick={() => setPhase("results")}
                      className="w-full sm:w-auto mt-8 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-brand-bg-secondary text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
                      style={{ backgroundColor: "var(--org-primary)" }}
                    >
                      <BarChart3 size={16} />
                      <span>View Results</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-10 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "color-mix(in srgb, var(--org-primary) 15%, transparent)" }}>
                      <Shield size={28} style={{ color: "var(--org-primary)" }} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-text-primary">Ready to make your voice count?</h2>
                    <p className="text-xs sm:text-sm text-brand-text-muted mt-3 max-w-md mx-auto leading-relaxed">
                      {action.hint}
                    </p>
                    <button
                      onClick={handleStart}
                      className="w-full sm:w-auto mt-8 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-brand-bg-secondary text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
                      style={{ backgroundColor: "var(--org-primary)" }}
                    >
                      {action.icon && <action.icon size={16} />}
                      <span>{action.label}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {phase === "pass" && (
              <motion.div key="pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-5 justify-center">
                    <Shield size={20} style={{ color: "var(--org-primary)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Enter Your Voting Pass</span>
                  </div>
                  <p className="text-xs text-brand-text-muted text-center mb-6 max-w-sm mx-auto">
                    Your voting pass was emailed to you when your registration was confirmed. Enter it to open your ballot.
                  </p>
                  <VotingPassInput value={passCode} onChange={setPassCode} disabled={busy} />

                  {passError && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-5 flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                      <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error">{passError}</p>
                    </motion.div>
                  )}

                  <button
                    onClick={handleStartSession}
                    disabled={busy || passCode.trim().length === 0}
                    className="w-full mt-6 flex items-center justify-center gap-2 text-brand-bg-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    style={{ backgroundColor: "var(--org-primary)" }}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    <span>{busy ? "Opening Session..." : "Open My Ballot"}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "ballot" && (
              <motion.div key="booth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {viewPositions[positionIndex] ? (
                  <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: "var(--org-primary)" }}>
                        Position {positionIndex + 1} of {viewPositions.length}
                      </span>
                      {viewPositions[positionIndex].maxSelections > 1 && (
                        <span className="text-[10px] text-brand-text-muted">Select up to {viewPositions[positionIndex].maxSelections}</span>
                      )}
                    </div>
                    <BallotPosition
                      position={viewPositions[positionIndex]}
                      selected={selections[viewPositions[positionIndex].id] ?? null}
                      onSelect={handleSelect}
                    />
                  </div>
                ) : null}

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
                  <div className="h-1.5 bg-brand-surface-elevated rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((positionIndex + 1) / Math.max(viewPositions.length, 1)) * 100}%`, backgroundColor: "var(--org-primary)" }} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button onClick={goPrev} disabled={positionIndex === 0} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:text-brand-text-primary text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {positionIndex === viewPositions.length - 1 ? (
                      <button onClick={() => setPhase("review")} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer" style={{ backgroundColor: "var(--org-primary)" }}>
                        Review & Verify
                      </button>
                    ) : (
                      <button onClick={goNext} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer" style={{ backgroundColor: "var(--org-primary)" }}>
                        Next <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div role="alert" className="space-y-2">
                    <div className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                      <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error flex-1">{error}</p>
                    </div>
                    <button
                      onClick={() => { setError(""); setPhase("pass") }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-secondary text-xs font-bold uppercase tracking-wider hover:bg-brand-surface-interactive transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} /> Try Again
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {phase === "review" && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Shield size={18} style={{ color: "var(--org-primary)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Review Your Ballot</h2>
                  </div>
                  <div className="space-y-4">
                    {viewPositions.map((p, i) => {
                      const chosen = selections[p.id]
                      const cand = p.candidates.find((c) => c.id === chosen)
                      return (
                        <div key={p.id} className="flex items-start gap-3 justify-between rounded-xl bg-brand-surface-elevated border border-brand-border p-4">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{p.title}</div>
                            <div className="mt-1">
                              {chosen === null ? (
                                <span className="text-sm text-brand-text-muted">Abstained</span>
                              ) : (
                                <span className="text-sm font-bold text-brand-text-primary">{cand?.name}</span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => { setPositionIndex(i); setPhase("ballot") }} className="text-[10px] font-bold uppercase tracking-wider cursor-pointer underline-offset-2 hover:underline shrink-0" style={{ color: "var(--org-primary)" }}>
                            Edit
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {error && (
                    <div role="alert" className="mt-4 space-y-2">
                      <div className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                        <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-status-error">{error}</p>
                          <p className="text-[10px] text-brand-text-muted mt-1">If this keeps happening, try going back and re-entering your voting pass.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button onClick={() => { setError(""); setPhase("ballot") }} className="px-4 py-2.5 rounded-xl bg-brand-surface-elevated border border-brand-border text-brand-text-muted hover:text-brand-text-primary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
                      Back
                    </button>
                    <button onClick={handleSubmit} disabled={busy} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer" style={{ backgroundColor: "var(--org-primary)" }}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                      <span>{busy ? "Casting..." : "Confirm & Submit"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "color-mix(in srgb, var(--org-primary) 15%, transparent)" }}>
                    <PartyPopper size={30} style={{ color: "var(--org-primary)" }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-text-primary">Your vote has been cast!</h2>
                    <p className="text-xs text-brand-text-muted mt-2 max-w-sm mx-auto">
                      Thank you for participating in {election.title}. Your choices have been recorded securely and anonymously.
                    </p>
                  </div>
                  <button onClick={() => setPhase("results")} className="inline-flex items-center gap-2 text-brand-bg-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer" style={{ backgroundColor: "var(--org-primary)" }}>
                    View Results
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "results" && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResultsPanel
                  slug={id ?? ""}
                  displayName={election.organizationName ?? orgName}
                  passCode={passCode.trim()}
                  liveEnabled={status?.election?.live_results === true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


    </motion.main>
  )
}

function ResultsPanel({ slug, displayName, passCode, liveEnabled }: { slug: string; displayName: string; passCode: string; liveEnabled: boolean }) {
  const [results, setResults] = useState<ResultsData | null>(null)
  const [failed, setFailed] = useState(false)
  // Live results are only attempted when the election has the live-results
  // policy on AND the voter holds a pass (the public live endpoint requires it).
  // Once a poll falls back to published final results, live polling stops.
  const [liveAvailable, setLiveAvailable] = useState(liveEnabled && passCode.length > 0)
  const canPollLive = liveAvailable && passCode.length > 0

  useEffect(() => {
    let cancelled = false
    let interval: number | null = null

    const fetchResults = async (): Promise<boolean> => {
      try {
        if (canPollLive) {
          const live = await resultsService.getPublicLiveResults(slug, passCode)
          if (cancelled) return false
          setResults(live)
          return true
        }
        const final = await resultsService.getPublicResults(slug)
        if (cancelled) return false
        if (final) {
          setResults(final)
          return false
        }
        setFailed(true)
        return false
      } catch {
        // Live results unavailable (voting ended, or policy flipped mid flow):
        // fall back to the published-gated final results endpoint.
        try {
          const final = await resultsService.getPublicResults(slug)
          if (cancelled) return false
          if (final) {
            setLiveAvailable(false)
            setResults(final)
            return false
          }
        } catch {
          // fall through to the unavailable state below
        }
        if (cancelled) return false
        setFailed(true)
        return false
      }
    }

    void fetchResults()

    if (canPollLive) {
      interval = window.setInterval(() => {
        void fetchResults().then((keepLive) => {
          if (!keepLive && interval !== null) {
            window.clearInterval(interval)
            interval = null
          }
        })
      }, 15000)
    }

    return () => {
      cancelled = true
      if (interval !== null) {
        window.clearInterval(interval)
      }
    }
  }, [slug, passCode, canPollLive])

  if (failed) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
        <p className="text-xs text-brand-text-muted">Results are not available yet.</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--org-primary)" }} />
          <span className="text-xs text-brand-text-muted">Loading results...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--org-primary) 12%, transparent)", color: "var(--org-primary)" }}>
          <CheckCircle size={20} />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Results</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">{displayName}</p>
        </div>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-text-disabled text-brand-text-muted">
          {results.live ? "Live" : "Final"}
        </span>
      </div>

      {results.positions.map((pos) => (
        <div key={pos.id} className="bg-brand-surface border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">{pos.title}</h3>
            <span className="text-[10px] text-brand-text-muted">{pos.totalVotes} votes</span>
          </div>
          <div className="space-y-3">
            {[...pos.candidates]
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((cand) => {
                const pct = pos.totalVotes > 0 ? Math.round((cand.voteCount / pos.totalVotes) * 100) : 0
                return (
                  <div key={cand.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-text-primary flex items-center gap-2">
                        {cand.elected && <CheckCircle size={13} style={{ color: "var(--org-primary)" }} />}
                        {cand.name}
                      </span>
                      <span className="text-brand-text-muted font-mono">{cand.voteCount} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-surface-elevated overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "var(--org-primary)" }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-brand-text-muted text-center pt-2">Results are recorded on a tamper evident blockchain ledger.</p>
    </div>
  )
}