import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "motion/react"
import { Calendar, Users, Clock, Vote, Shield, AlertCircle, CheckCircle, Info } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import SeoHead from "../../components/SeoHead"
import CountdownTimer from "../../components/CountdownTimer"
import { electionService } from "../../services/election-service"
import type { Election, ElectionStatus } from "../../types/election"
import type { ElectionRegistrationInfo } from "../../types/registration"

type PageState = "loading" | "not-found" | "ready"

function getDisplayStatus(status: ElectionStatus): { label: string; colorClass: string } {
  switch (status) {
    case 'LIVE':
      return { label: 'LIVE', colorClass: 'text-status-success border-status-success bg-status-success/10' }
    case 'PUBLISHED':
    case 'READY':
      return { label: 'UPCOMING', colorClass: 'text-brand-text-muted border-brand-text-disabled bg-brand-surface-interactive' }
    default:
      return { label: status, colorClass: 'text-brand-text-disabled border-brand-text-disabled bg-brand-surface-interactive' }
  }
}

const LIVE_STATUSES: ElectionStatus[] = ['LIVE']
const UPCOMING_STATUSES: ElectionStatus[] = ['PUBLISHED', 'READY']
const CLOSED_STATUSES: ElectionStatus[] = ['COMPLETED', 'ARCHIVED', 'CANCELLED']

export default function ElectionLanding() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>("loading")
  const [election, setElection] = useState<Election | null>(null)
  const [regInfo, setRegInfo] = useState<ElectionRegistrationInfo | null>(null)

  useEffect(() => {
    if (!id) { setState("not-found"); return }
    let cancelled = false
    async function load() {
      try {
        const [electionData, info] = await Promise.all([
          electionService.getElection(id!),
          electionService.getRegistrationInfo(id!),
        ])
        if (cancelled) return
        if (!electionData) { setState("not-found"); return }
        setElection(electionData)
        setRegInfo(info)
        setState("ready")
      } catch {
        if (!cancelled) { setState("not-found") }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (state === "loading") {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
          <span className="text-xs text-brand-text-muted font-mono">Loading election...</span>
        </div>
      </div>
    )
  }

  if (state === "not-found" || !election) {
    return (
      <div className="w-full flex-grow flex flex-col items-center justify-center pt-24 px-6">
        <AlertCircle size={40} className="text-brand-text-disabled mb-4" />
        <h1 className="text-xl font-bold text-brand-text-primary mb-2">Election Not Found</h1>
        <p className="text-xs text-brand-text-muted mb-6">This election doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/governance")} className="flex items-center gap-2 bg-brand-gold text-brand-bg-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          Back
        </button>
      </div>
    )
  }

  const isLive = LIVE_STATUSES.includes(election.status)
  const isUpcoming = UPCOMING_STATUSES.includes(election.status)
  const isClosed = CLOSED_STATUSES.includes(election.status)
  const regOpen = regInfo?.registrationEnabled && regInfo?.registrationOpen
  const regRequired = regInfo?.registrationRequired ?? false
  const regCtaLabel = regRequired ? "Register Now" : "Get a Voting Pass"
  const ds = getDisplayStatus(election.status)

  return (
    <motion.main
      key={`el-${id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: `${election.title} | ORIVIS` }} />

      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate("/governance")} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            Back
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${ds.colorClass}`}>
                {ds.label}
              </span>
              {isLive && <span className="flex items-center gap-1.5 text-[10px] text-status-success font-mono"><span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />Voting Open</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase text-brand-text-primary leading-tight">
              {election.title}
            </h1>

            <p className="text-xs text-brand-text-muted max-w-xl leading-relaxed">
              {election.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-text-muted">
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-text-disabled" /> {new Date(election.startsAt).toLocaleDateString()} — {new Date(election.endsAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-text-disabled" /> {(election.totalRegistered ?? 0).toLocaleString()} registered</span>
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-brand-text-disabled" /> {election.organizationName ?? election.organizationId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          {isLive && <LiveState election={election} regOpen={regOpen} regCtaLabel={regCtaLabel} />}
          {isUpcoming && <UpcomingState election={election} regOpen={regOpen} regCtaLabel={regCtaLabel} regInfo={regInfo} />}
          {isClosed && <ClosedState election={election} navigate={navigate} />}
        </div>
      </div>
    </motion.main>
  )
}

function LiveState({ election, regOpen, regCtaLabel }: { election: Election; regOpen: boolean; regCtaLabel: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Cast Your Vote</h2>
        <p className="text-xs text-brand-text-muted">
          {regOpen ? "If you have a voting pass, enter it below to authenticate and proceed to the ballot." : "Authentication is open. Enter your pass to vote."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/elections/${election.id}/auth`}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Vote size={14} />
            <span>I Have a Voting Pass</span>
          </Link>
          {regOpen && (
            <Link
              to={`/elections/${election.id}/register`}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-gold/30 text-brand-text-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <CheckCircle size={14} />
              <span>{regCtaLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function UpcomingState({ election, regOpen, regCtaLabel, regInfo }: { election: Election; regOpen: boolean; regCtaLabel: string; regInfo: ElectionRegistrationInfo | null }) {
  const [countdown, setCountdown] = useState("")

  useEffect(() => {
    function update() {
      const diff = new Date(election.startsAt).getTime() - Date.now()
      if (diff <= 0) { setCountdown("Opening soon..."); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setCountdown(`${d}d ${h}h ${m}m`)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [election.startsAt])

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto">
          <Clock size={22} className="text-brand-gold" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Voting Opens In</h2>
          <p className="text-2xl font-mono font-bold text-brand-gold mt-2">{countdown}</p>
        </div>

        {regInfo?.registrationStartsAt && !regOpen && (
          <CountdownTimer targetDate={regInfo.registrationStartsAt} label="Registration opens in" />
        )}
        {regInfo?.registrationEndsAt && regOpen && (
          <CountdownTimer targetDate={regInfo.registrationEndsAt} label="Registration closes in" />
        )}

        <p className="text-xs text-brand-text-muted">
          Voting opens on {new Date(election.startsAt).toLocaleDateString()} and closes on {new Date(election.endsAt).toLocaleDateString()}.
        </p>

        {regOpen && (
          <Link
            to={`/elections/${election.id}/register`}
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <CheckCircle size={14} />
            <span>{regCtaLabel}</span>
          </Link>
        )}

        {!regOpen && regInfo?.registrationStatus === "closed" && (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-text-muted">
            <Info size={13} />
            <span>Registration is currently closed</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ClosedState({ election, navigate }: { election: Election; navigate: (path: string) => void }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-brand-text-disabled/10 flex items-center justify-center mx-auto">
        <AlertCircle size={26} className="text-brand-text-disabled" />
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">Voting Has Ended</h2>
        <p className="text-xs text-brand-text-muted mt-1">
          This election closed on {new Date(election.endsAt).toLocaleDateString()}.
        </p>
      </div>
      <button
        onClick={() => navigate(`/elections/${election.id}/results`)}
        className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
      >
        View Results
      </button>
    </div>
  )
}
