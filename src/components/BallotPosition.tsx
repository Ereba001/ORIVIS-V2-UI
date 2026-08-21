import type { VoterPositionView, VoterCandidateView } from "../types/election"

interface BallotPositionProps {
  position: VoterPositionView
  selected: string | null
  onSelect: (candidateId: string | null) => void
}

export default function BallotPosition({ position, selected, onSelect }: BallotPositionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold uppercase tracking-tight text-brand-text-primary">{position.title}</h3>
        <p className="text-xs text-brand-text-muted mt-1">{position.description}</p>
      </div>

      <div className="space-y-2">
        {position.candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            selected={selected === c.id}
            onSelect={() => onSelect(selected === c.id ? null : c.id)}
          />
        ))}

        {position.maxSelections === 1 && (
          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
              selected === null
                ? "border-brand-gold bg-brand-gold/5"
                : "border-brand-border bg-brand-surface hover:border-brand-gold/40"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
              selected === null ? "border-brand-gold" : "border-brand-text-disabled"
            }`}>
              {selected === null && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-brand-text-primary">Abstain</div>
              <div className="text-xs text-brand-text-muted">I abstain from this position</div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: VoterCandidateView
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
        selected
          ? "border-brand-gold bg-brand-gold/5"
          : "border-brand-border bg-brand-surface hover:border-brand-gold/40"
      }`}
    >
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
        selected ? "border-brand-gold" : "border-brand-text-disabled"
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
      </div>
      {candidate.photoUrl ? (
        <img
          src={candidate.photoUrl}
          alt={candidate.name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-surface-elevated flex items-center justify-center text-xs font-bold text-brand-text-muted shrink-0">
          {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-brand-text-primary">{candidate.name}</div>
        {candidate.party && (
          <div className="text-xs text-brand-text-muted">{candidate.party}</div>
        )}
      </div>
      {candidate.bio && (
        <span className="text-[10px] text-brand-gold font-semibold uppercase tracking-wider shrink-0">View Profile</span>
      )}
    </button>
  )
}
