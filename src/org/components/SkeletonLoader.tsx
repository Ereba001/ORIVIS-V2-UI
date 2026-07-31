interface SkeletonLoaderProps {
  rows?: number
  variant?: 'card' | 'list' | 'text'
}

export default function SkeletonLoader({ rows = 3, variant = 'card' }: SkeletonLoaderProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-3" role="status" aria-label="Loading content">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-brand-surface-elevated" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-brand-surface-elevated rounded w-3/4" />
              <div className="h-2 bg-brand-surface-elevated rounded w-1/2" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2 animate-pulse" role="status" aria-label="Loading content">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-brand-surface-elevated rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="Loading dashboard">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated" />
            <div className="w-12 h-4 bg-brand-surface-elevated rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-7 bg-brand-surface-elevated rounded w-20" />
            <div className="h-3 bg-brand-surface-elevated rounded w-24" />
            <div className="h-2 bg-brand-surface-elevated rounded w-16" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
