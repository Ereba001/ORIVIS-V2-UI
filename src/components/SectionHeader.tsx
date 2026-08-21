interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export default function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text-primary">{title}</h2>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[10px] font-mono text-brand-gold hover:text-brand-gold-hover transition-colors uppercase tracking-wider font-bold cursor-pointer"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}
