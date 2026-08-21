import { useState } from 'react'
import { motion } from 'motion/react'
import { Vote, Award, BarChart3, ClipboardList, MoreHorizontal, Eye, Edit2, Archive, Copy, ExternalLink, FileDown, X, Share2, Globe, Scale, Users, UserPlus, Megaphone, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OrivisEvent, EventType } from '../types'
import EventStatusBadge from './EventStatusBadge'
import ProgressBar from './ProgressBar'

type EventAction = 'view' | 'edit' | 'archive' | 'duplicate' | 'preview' | 'share' | 'export' | 'publish' | 'close' | 'delete'

const TYPE_ICONS: Record<EventType, LucideIcon> = {
  governance_election: Vote,
  award_competition: Award,
  poll: BarChart3,
  survey: ClipboardList,
  referendum: Scale,
  agm: Users,
  recruitment: UserPlus,
  general_meeting: Megaphone,
  custom: Sparkles,
}

const TYPE_LABELS: Record<string, string> = {
  governance_election: 'Election',
  award_competition: 'Award',
  poll: 'Poll',
  survey: 'Survey',
}

interface EventCardProps {
  event: OrivisEvent
  index?: number
  onAction?: (eventId: string, action: EventAction) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso: string): string {
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

export default function EventCard({ event, index = 0, onAction }: EventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const Icon = TYPE_ICONS[event.type]

  const actions: { label: string; value: EventAction; icon: typeof Eye }[] = [
    { label: 'View Details', value: 'view', icon: Eye },
    { label: 'Edit Event', value: 'edit', icon: Edit2 },
    ...(event.status === 'live' ? [{ label: 'Close Event', value: 'close' as EventAction, icon: X }] : []),
    ...(event.status === 'draft' || event.status === 'ready' ? [{ label: 'Publish', value: 'publish' as EventAction, icon: Globe }] : []),
    { label: 'Duplicate', value: 'duplicate', icon: Copy },
    { label: 'Preview', value: 'preview', icon: ExternalLink },
    { label: 'Share', value: 'share', icon: Share2 },
    { label: 'Export', value: 'export', icon: FileDown },
    ...(event.status === 'archived' ? [{ label: 'Delete', value: 'delete' as EventAction, icon: Archive }] : []),
    { label: 'Archive', value: 'archive', icon: Archive },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-2xl p-5 hover:border-[var(--org-primary)]/30 transition-all duration-300 cursor-pointer relative"
      onClick={() => onAction?.(event.id, 'view')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-surface-elevated flex items-center justify-center shrink-0" style={{ color: 'var(--org-primary)' }}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-text-primary truncate">{event.title}</p>
            <p className="text-[9px] font-mono text-brand-text-muted">{TYPE_LABELS[event.type]}</p>
          </div>
        </div>
        <div className="relative shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-36 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl">
                {actions.map((a) => {
                  const ActionIcon = a.icon
                  return (
                    <button
                      key={a.value}
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction?.(event.id, a.value) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                    >
                      <ActionIcon size={12} />
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-3">
        <EventStatusBadge status={event.status} />
      </div>

      <div className="space-y-2.5 mb-3">
        <ProgressBar
          value={event.registrationProgress}
          max={100}
          size="sm"
          label="Registration Progress"
        />
      </div>

      <div className="flex items-center gap-2 text-[9px] font-mono text-brand-text-muted mb-3">
        <span>{formatDateTime(event.startsAt)}</span>
        <span className="text-brand-text-disabled">→</span>
        <span>{formatDateTime(event.endsAt)}</span>
      </div>

      <div className="flex items-center gap-4 py-2.5 border-t border-brand-divider">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-brand-text-primary">{event.participantCount.toLocaleString()}</span>
          <span className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Voters</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-brand-text-primary">{event.candidateCount.toLocaleString()}</span>
          <span className="text-[8px] font-mono text-brand-text-muted uppercase tracking-wider">Candidates</span>
        </div>
        <div className="ml-auto">
          <span className="text-[8px] font-mono text-brand-text-disabled">Updated {timeAgo(event.updatedAt)}</span>
        </div>
      </div>
    </motion.div>
  )
}