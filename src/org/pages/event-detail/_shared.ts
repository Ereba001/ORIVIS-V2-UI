import type {
  OrivisEvent, EventPosition, EventParticipant, TimelineActivity,
  EventAnalytics, EventRegistration, EventCandidate, EventStatus,
} from '../../types'

export type {
  OrivisEvent, EventPosition, EventParticipant, TimelineActivity,
  EventAnalytics, EventRegistration, EventCandidate, EventStatus,
}

export const PARTICIPANT_REG_STYLES: Record<string, string> = {
  registered: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  verified: 'bg-status-info/10 text-status-info border-status-info/20',
  approved: 'bg-status-success/10 text-status-success border-status-success/20',
  rejected: 'bg-status-error/10 text-status-error border-status-error/20',
}

export const VERIFICATION_STYLES: Record<string, string> = {
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  verified: 'bg-status-success/10 text-status-success border-status-success/20',
  failed: 'bg-status-error/10 text-status-error border-status-error/20',
}

export const PASS_STYLES: Record<string, string> = {
  not_issued: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  issued: 'bg-status-info/10 text-status-info border-status-info/20',
  used: 'bg-brand-surface-elevated text-brand-text-disabled border-brand-border',
  expired: 'bg-status-error/10 text-status-error border-status-error/20',
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(iso: string): string {
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}
