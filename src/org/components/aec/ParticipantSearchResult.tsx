import { motion } from 'motion/react'
import { User, ChevronRight } from 'lucide-react'
import StatusBadge from '../StatusBadge'
import type { GlobalParticipant } from '../../services/assisted-election-service'

interface ParticipantSearchResultProps {
  participant: GlobalParticipant
  onSelect: (participant: GlobalParticipant) => void
  primaryColor?: string
}

export default function ParticipantSearchResult({
  participant,
  onSelect,
  primaryColor = '#D4AF37',
}: ParticipantSearchResultProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect(participant)}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-surface-interactive transition-colors cursor-pointer"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${primaryColor}18` }}
      >
        <User size={16} style={{ color: primaryColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-brand-text-primary truncate">
          {participant.name}
        </p>
        {participant.email_masked && (
          <p className="text-[10px] text-brand-text-muted truncate mt-0.5">
            {participant.email_masked}
          </p>
        )}
        {participant.voter_id_display && (
          <p className="text-[9px] font-mono text-brand-text-muted mt-0.5">
            {participant.voter_id_display}
          </p>
        )}
        {participant.elections.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {participant.elections.slice(0, 4).map((election) => (
              <StatusBadge
                key={election.election_id}
                status={election.lifecycle_state as 'draft' | 'published' | 'live' | 'ended' | 'completed' | 'archived'}
                size="sm"
              />
            ))}
            {participant.elections.length > 4 && (
              <span className="text-[9px] text-brand-text-muted">
                +{participant.elections.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight size={14} className="text-brand-text-muted shrink-0" />
    </motion.button>
  )
}
