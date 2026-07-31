import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Users, Calendar, BarChart3, Loader2 } from "lucide-react"
import TextureBg from "../../components/TextureBg"
import { electionService } from "../../services/election-service"
import { getApiClient } from "../../lib/api-client"
import { API } from "../../constants/api"
import type { Election, VoterPositionView, VoterCandidateView } from "../../types/election"
import SeoHead from "../../components/SeoHead"

export default function ElectionResults() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [election, setElection] = useState<Election | null>(null)
  const [positions, setPositions] = useState<VoterPositionView[]>([])
  const [loading, setLoading] = useState(true)

  async function loadResults(electionId: string) {
    const e = await electionService.getElection(electionId)
    if (!e) { setLoading(false); return }
    setElection(e)

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
          photoUrl: c.photoUrl ? String(c.photoUrl) : undefined,
          votes: Number(c.voteCount ?? 0),
        })
      }
      setPositions(Array.from(posMap.values()))
    } catch {
      setPositions([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) loadResults(id)
  }, [id])

  if (loading) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24">
        <Loader2 size={20} className="animate-spin text-brand-gold" />
      </div>
    )
  }

  if (!election) {
    return (
      <div className="w-full flex-grow flex items-center justify-center pt-24 px-6">
        <p className="text-xs text-brand-text-muted">Results not available.</p>
      </div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col pt-24"
    >
      <SeoHead meta={{ title: `${election.title} — Results | ORIVIS` }} />

      <div className="w-full bg-brand-surface py-12 border-b border-brand-border relative overflow-hidden">
        <TextureBg src="https://images.unsplash.com/photo-1765408217205-1c42d81f1677?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button onClick={() => navigate(`/elections/${id}`)} className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary transition-colors mb-6 cursor-pointer">
            Back
          </button>

          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={20} className="text-brand-gold" />
            <h1 className="text-xl sm:text-2xl font-display font-bold uppercase text-brand-text-primary">Results</h1>
          </div>

          <h2 className="text-sm font-bold text-brand-text-primary">{election.title}</h2>
          <p className="text-xs text-brand-text-muted">{election.organizationName ?? election.organizationId}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-brand-text-muted">
            <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-text-disabled" /> {new Date(election.startsAt).toLocaleDateString()} — {new Date(election.endsAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-text-disabled" /> {(election.totalRegistered ?? 0).toLocaleString()} registered</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-brand-surface-elevated py-16 relative overflow-hidden flex-grow">
        <TextureBg src="https://images.unsplash.com/photo-1772775756679-34a0716ae0d9?q=80&w=1600&auto=format&fit=crop" opacity={0.2} />
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-8">
          {positions.length === 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center">
              <p className="text-xs text-brand-text-muted">Results will appear here once voting concludes.</p>
            </div>
          )}
          {positions.map((pos) => {
            const totalVotes = pos.candidates.reduce((s, c) => s + (c.votes ?? 0), 0)
            const count = pos.candidates.length
            return (
              <div key={pos.id}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary mb-3">{pos.title}</h3>
                <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
                  {pos.candidates.map((c, i) => (
                    <ResultRow key={c.id} candidate={c} index={i} totalVotes={totalVotes} count={count} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.main>
  )
}

function ResultRow({ candidate, index, totalVotes, count }: { candidate: VoterCandidateView; index: number; totalVotes: number; count: number }) {
  const pct = totalVotes > 0 ? Math.round(((candidate.votes ?? 0) / totalVotes) * 100) : 0

  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${index < count - 1 ? "border-b border-brand-border" : ""}`}>
      <span className="w-6 h-6 rounded-full bg-brand-surface-interactive flex items-center justify-center text-[10px] font-mono font-bold text-brand-text-muted shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-brand-text-primary">{candidate.name}</span>
          <span className="text-xs font-mono font-bold text-brand-gold">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-brand-surface-interactive rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-gold rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        {candidate.party && (
          <span className="text-[10px] text-brand-text-muted mt-1 block">{candidate.party}</span>
        )}
      </div>
    </div>
  )
}
