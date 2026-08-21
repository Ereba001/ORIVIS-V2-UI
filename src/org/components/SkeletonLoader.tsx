interface SkeletonLoaderProps {
  rows?: number
  variant?: 'card' | 'list' | 'text'
}

const PULSE = 'animate-pulse bg-brand-surface-interactive rounded-lg'

export default function SkeletonLoader({ rows = 3, variant = 'card' }: SkeletonLoaderProps) {
  if (variant === 'list') {
    const heights = ['h-10', 'h-12', 'h-9', 'h-11']
    return (
      <div className="space-y-3" role="status" aria-label="Loading content">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${heights[i % heights.length]} ${PULSE}`} />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'text') {
    const widths = ['w-3/4', 'w-1/2', 'w-full', 'w-2/3']
    return (
      <div className="space-y-3" role="status" aria-label="Loading content">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`h-3 ${widths[i % widths.length]} ${PULSE}`} />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading dashboard">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`h-10 w-10 ${PULSE}`} />
            <div className={`h-4 w-12 ${PULSE}`} />
          </div>
          <div className="space-y-2">
            <div className={`h-7 w-20 ${PULSE}`} />
            <div className={`h-3 w-24 ${PULSE}`} />
            <div className={`h-2 w-16 ${PULSE}`} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
