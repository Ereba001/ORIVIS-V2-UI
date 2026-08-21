import { useState } from 'react'
import { motion } from 'motion/react'
import { MoreHorizontal, Eye, Edit2, Archive, Copy, ExternalLink, Share2, FileDown, Globe, X } from 'lucide-react'
import type { OrivisEvent } from '../types'
import EventStatusBadge from './EventStatusBadge'

type EventAction = 'view' | 'edit' | 'archive' | 'duplicate' | 'preview' | 'share' | 'export' | 'publish' | 'close' | 'delete'

const TYPE_LABELS: Record<string, string> = {
  governance_election: 'Election',
  award_competition: 'Award',
  poll: 'Poll',
  survey: 'Survey',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  event: OrivisEvent
  index?: number
  onAction?: (eventId: string, action: EventAction) => void
}

export default function EventListRow({ event, index = 0, onAction }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const actions: { label: string; value: EventAction; icon: typeof Eye }[] = [
    { label: 'View Details', value: 'view', icon: Eye },
    { label: 'Edit', value: 'edit', icon: Edit2 },
    ...(event.status === 'live' ? [{ label: 'Close', value: 'close' as EventAction, icon: X }] : []),
    ...(event.status === 'draft' || event.status === 'ready' ? [{ label: 'Publish', value: 'publish' as EventAction, icon: Globe }] : []),
    { label: 'Duplicate', value: 'duplicate', icon: Copy },
    { label: 'Preview', value: 'preview', icon: ExternalLink },
    { label: 'Share', value: 'share', icon: Share2 },
    { label: 'Export', value: 'export', icon: FileDown },
    { label: 'Archive', value: 'archive', icon: Archive },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-brand-surface-interactive transition-colors cursor-pointer border border-transparent hover:border-brand-border group"
      onClick={() => onAction?.(event.id, 'view')}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <EventStatusBadge status={event.status} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-text-primary truncate">{event.title}</p>
          <p className="text-[9px] font-mono text-brand-text-muted">{TYPE_LABELS[event.type] || event.type}</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-[9px] font-mono text-brand-text-muted shrink-0">
        <span>{event.participantCount.toLocaleString()} voters</span>
        <span>{event.candidateCount} candidates</span>
        <span>{formatDate(event.startsAt)}</span>
      </div>
      <div className="relative shrink-0 ml-2">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 w-40 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl">
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
    </motion.div>
  )
}
