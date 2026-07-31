interface ProgressBarProps {
  value: number
  max: number
  color?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
  label?: string
}

export default function ProgressBar({ value, max, color, size = 'md', showLabel = true, label }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          {label ? (
            <span className="text-[10px] font-mono text-brand-text-muted">{label}</span>
          ) : (
            <span className="text-[10px] font-mono text-brand-text-muted">{value.toLocaleString()} / {max.toLocaleString()}</span>
          )}
          <span className="text-[10px] font-mono font-bold" style={{ color: color || 'var(--org-primary)' }}>{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className={`w-full bg-brand-surface-elevated rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color || 'var(--org-primary)' }}
        />
      </div>
    </div>
  )
}
