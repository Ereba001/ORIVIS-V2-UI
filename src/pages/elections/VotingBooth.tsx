import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import BallotPosition from "../../components/BallotPosition"
import BallotNavigation from "../../components/BallotNavigation"
import VoteReview from "../../components/VoteReview"
import VoteConfirmation from "../../components/VoteConfirmation"
import { electionService } from "../../services/election-service"
import { voterService } from "../../services/voter-service"
import type { Election, VoterPositionView } from "../../types/election"
import type { VoterBallot, VoterBallotPosition } from "../../types/voting-pass"
import SeoHead from "../../components/SeoHead"

type Step = "voting" | "review"

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
      bio: undefined,
      photoUrl: c.photoUrl ?? undefined,
    })),
  }
}

export default function VotingBooth() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // The raw token is delivered via per-tab sessionStorage (set by VoteAuth),
  // never through the URL — keeping it out of browser history, referrers and
  // server access logs. A legacy ?token= value is still accepted then cleared.
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get("token")
  const storedToken = typeof window !== "undefined" ? window.sessionStorage.getItem("orivis_vote_token") : null
  const token = urlToken ?? storedToken

  const [election, setElection] = useState<Election | null>(null)
  const [ballot, setBallot] = useState<VoterBallot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [positionIndex, setPositionIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string | null>>({})
  const [step, setStep] = useState<Step>("voting")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const viewPositions: VoterPositionView[] = (ballot?.positions ?? []).map(toViewPosition)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const electionData = await electionService.getPublicElection(id!)
        if (cancelled || !electionData) { setLoading(false); return }
        setElection(electionData)

        if (token) {
          await voterService.startSession(id!, token)
        }
        const activeBallot = await voterService.getBallot(id!)
        if (!cancelled) setBallot(activeBallot)
        setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to load ballot.")
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    if (token) {
      // One-time consumption: clear the stored token and any URL copy.
      if (storedToken) {
        window.sessionStorage.removeItem("orivis_vote_token")
      }
      if (urlToken) {
        navigate(`/elections/${id}/vote`, { replace: true })
      }
    } else {
      navigate(`/elections/${id}/auth`, { replace: true })
    }
  }, [token, urlToken, storedToken, id, navigate])

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <Loader2 size={20} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (!election || !ballot || !token) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24 px-6">
        <p className="text-xs text-brand-text-muted">{error || "Unable to load ballot."}</p>
      </div>
    )
  }

  const currentPosition = viewPositions[positionIndex]

  function handleSelect(candidateId: string | null) {
    if (!currentPosition) return
    setSelections((prev) => ({ ...prev, [currentPosition.id]: candidateId }))
  }

  function goNext() {
    if (positionIndex < viewPositions.length - 1) setPositionIndex((i) => i + 1)
  }

  function goPrev() {
    if (positionIndex > 0) setPositionIndex((i) => i - 1)
  }

  function goReview() {
    setStep("review")
  }

  function editPosition(index: number) {
    setPositionIndex(index)
    setStep("voting")
  }

  async function handleSubmit() {
    if (!token || !ballot) return
    setSubmitting(true)
    try {
      let lastReceiptUuid = ""
      let pos = 0
      for (const raw of ballot.positions) {
        const key = String(raw.positionId)
        const chosen = selections[key] ?? null
        if (chosen === null) continue

        const ballotCandidate = raw.candidates.find((c) => String(c.candidateId) === chosen)
        if (!ballotCandidate) continue

        const settled = await voterService.castVote(id!, {
          token,
          ballotUuid: ballot.uuid,
          positionId: raw.positionId,
          candidateId: ballotCandidate.candidateId,
          idempotencyKey: `${ballot.uuid}:${raw.positionId}:${token}`.slice(-64),
        })
        lastReceiptUuid = settled.uuid
        pos += 1
      }

      navigate(
        lastReceiptUuid
          ? `/elections/${id}/success?receipt=${lastReceiptUuid}`
          : `/elections/${id}`,
        { replace: true },
      )
    } catch (e) {
      setSubmitting(false)
      setShowConfirm(false)
      setError(e instanceof Error ? e.message : "Failed to submit your ballot.")
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: "Voting Booth | ORIVIS", noindex: true }} />
      <div className="w-full bg-brand-surface py-6 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-4 cursor-pointer">
            Exit
          </button>
          <h1 className="text-lg font-display font-bold uppercase text-brand-text-primary">
            {election.title}
          </h1>
          <p className="text-[10px] text-brand-text-muted">{election.organizationName ?? election.organizationId}</p>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-10 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          {step === "voting" && currentPosition && (
            <div className="space-y-6">
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
                <BallotPosition
                  position={currentPosition}
                  selected={selections[currentPosition.id] ?? null}
                  onSelect={handleSelect}
                />
              </div>
              <BallotNavigation
                current={positionIndex}
                total={viewPositions.length}
                selections={selections}
                onPrev={goPrev}
                onNext={goNext}
                onReview={goReview}
              />
            </div>
          )}

          {step === "review" && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6">
              <VoteReview
                positions={viewPositions}
                selections={selections}
                onEditPosition={editPosition}
                onConfirm={() => setShowConfirm(true)}
                onBack={() => setStep("voting")}
              />
            </div>
          )}

          {error && (
            <div className="bg-status-error/10 border border-status-error/20 rounded-2xl p-4 text-xs text-status-error">
              {error}
            </div>
          )}

          {viewPositions.length === 0 && step === "voting" && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
              <p className="text-xs text-brand-text-muted">No positions available for this election.</p>
            </div>
          )}
        </div>
      </div>

      <VoteConfirmation
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        loading={submitting}
      />
    </motion.main>
  )
}