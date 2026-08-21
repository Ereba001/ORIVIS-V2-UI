import type { EventType, EventStatus } from '../types'

// ── Event Action ──────────────────────────────────────────────────────────────

export type EventAction =
  | 'view' | 'edit' | 'archive' | 'duplicate' | 'preview'
  | 'share' | 'export' | 'publish' | 'close' | 'delete'
  | 'results' | 'start' | 'stop'

// ── Event Type Constants ──────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  governance_election: 'Governance Election',
  award_competition: 'Award Competition',
  poll: 'Poll',
  survey: 'Survey',
  referendum: 'Referendum',
  agm: 'AGM',
  recruitment: 'Recruitment',
  general_meeting: 'General Meeting',
  custom: 'Custom',
}

/** Lucide icon name strings — resolve to components at the call site. */
export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  governance_election: 'Vote',
  award_competition: 'Award',
  poll: 'BarChart3',
  survey: 'ClipboardList',
  referendum: 'Scale',
  agm: 'Users',
  recruitment: 'UserPlus',
  general_meeting: 'Megaphone',
  custom: 'Sparkles',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  governance_election: 'text-status-info',
  award_competition: 'text-status-warning',
  poll: 'text-status-success',
  survey: 'text-event-upcoming',
  referendum: 'text-status-error',
  agm: 'text-status-info',
  recruitment: 'text-status-warning',
  general_meeting: 'text-event-upcoming',
  custom: 'text-brand-text-muted',
}

// ── Event Status Constants ────────────────────────────────────────────────────

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  created: 'Created',
  scheduled: 'Scheduled',
  published: 'Published',
  live: 'Live',
  ended: 'Ended',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-brand-surface-interactive text-brand-text-muted border-brand-border',
  ready: 'bg-status-info/10 text-status-info border-status-info/20',
  created: 'bg-status-info/10 text-status-info border-status-info/20',
  scheduled: 'bg-event-upcoming/10 text-event-upcoming border-event-upcoming/20',
  published: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  live: 'bg-status-success/10 text-status-success border-status-success/20',
  ended: 'bg-event-completed/10 text-event-completed border-event-completed/20',
  completed: 'bg-event-completed/10 text-event-completed border-event-completed/20',
  cancelled: 'bg-status-error/10 text-status-error border-status-error/20',
  archived: 'bg-brand-surface-elevated text-brand-text-disabled border-brand-border',
}

// ── Backend → Frontend Mapping ────────────────────────────────────────────────

export const ELECTION_TYPE_MAP: Record<string, EventType> = {
  ELECTION: 'governance_election',
  APPROVAL: 'poll',
  CONSULTATION: 'survey',
  REFERENDUM: 'referendum',
  SURVEY: 'survey',
}

// ── Audit Action Metadata ─────────────────────────────────────────────────────

export const AUDIT_ACTION_META: Partial<
  Record<EventAction, { label: string; verb: string; description: string }>
> = {
  start: { label: 'Start Event', verb: 'start', description: 'Start voting for this event.' },
  stop: { label: 'Stop Event', verb: 'stop', description: 'Stop voting for this event. It will be moved to ended.' },
  close: { label: 'Close Event', verb: 'close', description: 'Close voting for this event.' },
}
