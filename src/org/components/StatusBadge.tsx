interface StatusBadgeProps {
  status: 'live' | 'published' | 'created' | 'scheduled' | 'ended' | 'completed' | 'draft' | 'ready' | 'archived' | 'cancelled' | 'active' | 'invited' | 'suspended' | 'trialing' | 'past_due' | 'canceled'
  size?: 'sm' | 'md'
}

const BADGE_STYLES: Record<string, string> = {
  live: 'bg-status-success/10 text-status-success-strong border-status-success/25',
  active: 'bg-status-success/10 text-status-success-strong border-status-success/25',
  published: 'bg-status-warning/10 text-status-warning-strong border-status-warning/25',
  trialing: 'bg-status-warning/10 text-status-warning-strong border-status-warning/25',
  ready: 'bg-status-info/10 text-status-info-strong border-status-info/25',
  created: 'bg-status-info/10 text-status-info-strong border-status-info/25',
  scheduled: 'bg-event-upcoming/10 text-event-upcoming border-event-upcoming/25',
  invited: 'bg-status-info/10 text-status-info-strong border-status-info/25',
  suspended: 'bg-status-danger/10 text-status-danger-strong border-status-danger/25',
  past_due: 'bg-status-danger/10 text-status-danger-strong border-status-danger/25',
  canceled: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  ended: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  completed: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  draft: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const styles = BADGE_STYLES[status] || BADGE_STYLES.draft
  const textSize = size === 'sm' ? 'text-[9px] px-1.5' : 'text-[10px] px-2'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-0.5 border font-medium ${textSize} ${styles}`}>
      {status}
    </span>
  )
}
