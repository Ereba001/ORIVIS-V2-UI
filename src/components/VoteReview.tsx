import { Edit3 } from "lucide-react"
import type { VoterPositionView } from "../types/election"

interface VoteReviewProps {
  positions: VoterPositionView[]
  selections: Record<string, string | null>
  onEditPosition: (index: number) => void
  onConfirm: () => void
  onBack: () => void
}

export default function VoteReview({ positions, selections, onEditPosition, onConfirm, onBack }: VoteReviewProps) {
  function resolveName(positionId: string, candidateId: string | null): string {
    if (candidateId === null) return "Abstained"
    const pos = positions.find((p) => p.id === positionId)
    if (!pos) return "Unknown"
    const c = pos.candidates.find((c) => c.id === candidateId)
    return c?.name ?? "Unknown"
  }

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Review Your Vote</h3>
          <p className="text-[10px] text-brand-text-muted mt-0.5">
            Verify your selections before submitting. You can go back to make changes.
          </p>
        </div>

        <div className="divide-y divide-brand-border">
          {positions.map((pos, i) => (
            <div key={pos.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-brand-text-muted font-bold">
                  {pos.title}
                </span>
                <span className="text-sm font-semibold text-brand-text-primary mt-0.5 block truncate">
                  {resolveName(pos.id, selections[pos.id] ?? null)}
                </span>
              </div>
              <button
                onClick={() => onEditPosition(i)}
                className="flex items-center gap-1 text-brand-gold hover:text-brand-gold-hover text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ml-3 cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4">
        <p className="text-xs text-status-warning font-medium text-center">
          Once submitted, your vote cannot be changed.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Submit My Vote
        </button>
      </div>
    </div>
  )
}
