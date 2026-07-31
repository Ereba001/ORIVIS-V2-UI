import { ChevronLeft, ChevronRight } from "lucide-react"

interface BallotNavigationProps {
  current: number
  total: number
  selections: Record<string, string | null>
  onPrev: () => void
  onNext: () => void
  onReview: () => void
}

export default function BallotNavigation({
  current,
  total,
  selections,
  onPrev,
  onNext,
  onReview,
}: BallotNavigationProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0
  const isLast = current === total - 1


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted font-bold shrink-0">
          Position {current + 1} of {total}
        </span>
        <div className="flex-1 h-1.5 bg-brand-surface border border-brand-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-gold rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onPrev}
          disabled={current === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-gold/30 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        {isLast ? (
          <button
            onClick={onReview}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>Review Vote</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-bg-secondary text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
