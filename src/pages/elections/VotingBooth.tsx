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
import { getApiClient } from "../../lib/api-client"
import { API } from "../../constants/api"
import type { Election, VoterPositionView, VoterCandidateView } from "../../types/election"
import SeoHead from "../../components/SeoHead"

type Step = "voting" | "review"

async function loadPositions(electionId: string): Promise<VoterPositionView[]> {
  try {
    const { data: candidates } = await getApiClient().get<Record<string, unknown>[]>(
      API.ENDPOINTS.CANDIDATES.BASE(electionId)
    )
    const posMap = new Map<string, VoterPositionView>()
    for (const c of candidates) {
      const posId = String(c.positionId ?? '')
      if (!posMap.has(posId)) {
        posMap.set(posId, {
          id: posId,
          title: String(c.positionTitle ?? 'Unknown Position'),
          description: String(c.positionDescription ?? ''),
          maxSelections: Number(c.positionMaxSelections ?? 1),
          candidates: [],
        })
      }
      posMap.get(posId)!.candidates.push({
        id: String(c.id ?? ''),
        name: String(c.name ?? ''),
        party: c.party ? String(c.party) : undefined,
        bio: c.biography ? String(c.biography) : undefined,
        photoUrl: c.photoUrl ? String(c.photoUrl) : undefined,
      })
    }
    return Array.from(posMap.values())
  } catch {
    return []
  }
}

export default function VotingBooth() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const passId = searchParams.get("pass")

  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [positionIndex, setPositionIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string | null>>({})
  const [step, setStep] = useState<Step>("voting")
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [positions, setPositions] = useState<VoterPositionView[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const electionData = await electionService.getElection(id!)
        if (cancelled || !electionData) { setLoading(false); return }
        setElection(electionData)

        const positionsData = await loadPositions(id!)
        if (!cancelled) setPositions(positionsData)
        setLoading(false)
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!passId) {
      navigate(`/elections/${id}/auth`, { replace: true })
    }
  }, [passId, id, navigate])

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <Loader2 size={20} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (!election || !passId) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24 px-6">
        <p className="text-xs text-brand-text-muted">Unable to load ballot.</p>
      </div>
    )
  }

  const currentPosition = positions[positionIndex]
  if (!currentPosition && positions.length > 0) {
    return null
  }

  function handleSelect(candidateId: string | null) {
    if (!currentPosition) return
    setSelections((prev) => ({ ...prev, [currentPosition.id]: candidateId }))
  }

  function goNext() {
    if (positionIndex < positions.length - 1) setPositionIndex((i) => i + 1)
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
    if (!passId) return
    setSubmitting(true)
    try {
      const ballotSelections = positions.map((pos) => ({
        positionId: pos.id,
        candidateId: selections[pos.id] ?? null,
      }))
      await voterService.castVote({ passId, selections: ballotSelections })
      navigate(`/elections/${id}/success?pass=${passId}`, { replace: true })
    } catch {
      setSubmitting(false)
      setShowConfirm(false)
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
                total={positions.length}
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
                positions={positions}
                selections={selections}
                onEditPosition={editPosition}
                onConfirm={() => setShowConfirm(true)}
                onBack={() => setStep("voting")}
              />
            </div>
          )}

          {positions.length === 0 && step === "voting" && (
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
