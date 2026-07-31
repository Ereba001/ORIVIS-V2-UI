interface StatusBadgeProps {
  status: 'live' | 'published' | 'completed' | 'draft' | 'ready' | 'active' | 'invited' | 'suspended' | 'trialing' | 'past_due' | 'canceled'
  size?: 'sm' | 'md'
}

const BADGE_STYLES: Record<string, string> = {
  live: 'bg-status-success/10 text-status-success border-status-success/20',
  published: 'bg-event-upcoming/10 text-event-upcoming border-event-upcoming/20',
  ready: 'bg-status-info/10 text-status-info border-status-info/20',
  completed: 'bg-event-completed/10 text-event-completed border-event-completed/20',
  draft: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  active: 'bg-status-success/10 text-status-success border-status-success/20',
  invited: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  suspended: 'bg-status-error/10 text-status-error border-status-error/20',
  trialing: 'bg-event-upcoming/10 text-event-upcoming border-event-upcoming/20',
  past_due: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  canceled: 'bg-status-error/10 text-status-error border-status-error/20',
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const styles = BADGE_STYLES[status] || BADGE_STYLES.draft
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'

  return (
    <span className={`${textSize} font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}>
      {status}
    </span>
  )
}
