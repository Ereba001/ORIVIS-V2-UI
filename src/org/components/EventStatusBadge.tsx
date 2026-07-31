import type { EventStatus } from '../types'

interface EventStatusBadgeProps {
  status: EventStatus
  size?: 'sm' | 'md'
}

const BADGE_STYLES: Record<EventStatus, string> = {
  draft: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  ready: 'bg-status-info/10 text-status-info border-status-info/20',
  published: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  live: 'bg-status-success/10 text-status-success border-status-success/20',
  completed: 'bg-event-completed/10 text-event-completed border-event-completed/20',
  cancelled: 'bg-status-error/10 text-status-error border-status-error/20',
  archived: 'bg-brand-surface-elevated text-brand-text-disabled border-brand-border',
}

const BADGE_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  published: 'Published',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
}

export default function EventStatusBadge({ status, size = 'sm' }: EventStatusBadgeProps) {
  const styles = BADGE_STYLES[status] || BADGE_STYLES.draft
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'

  return (
    <span className={`${textSize} font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}>
      {BADGE_LABELS[status]}
    </span>
  )
}