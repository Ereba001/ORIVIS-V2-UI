import { motion } from 'motion/react'
import {
  Vote,
  CheckCircle,
  Key,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import StatusBadge from '../StatusBadge'
import type { ParticipantElection } from '../../services/assisted-election-service'

interface ElectionContextCardProps {
  election: ParticipantElection & {
    allowed_actions: string[]
    blocked_reasons: Record<string, string>
  }
  onSelectElection: (electionId: number) => void
  primaryColor?: string
}

export default function ElectionContextCard({
  election,
  onSelectElection,
  primaryColor = '#D4AF37',
}: ElectionContextCardProps) {
  const hasBlockedReasons = Object.keys(election.blocked_reasons).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-brand-border bg-brand-surface p-3.5"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-brand-text-primary truncate">
            {election.election_title}
          </p>
        </div>
        <StatusBadge
          status={election.lifecycle_state as 'draft' | 'published' | 'live' | 'ended' | 'completed' | 'archived'}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-3 mb-3">
        {election.registration_status && (
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-brand-text-muted" />
            <span className="text-[9px] text-brand-text-muted capitalize">
              {election.registration_status}
            </span>
          </div>
        )}
        {election.has_voted && (
          <div className="flex items-center gap-1">
            <CheckCircle size={10} className="text-status-success" />
            <span className="text-[9px] text-status-success">Voted</span>
          </div>
        )}
        {election.has_active_pass && (
          <div className="flex items-center gap-1">
            <Key size={10} style={{ color: primaryColor }} />
            <span className="text-[9px] text-brand-text-muted">Pass active</span>
          </div>
        )}
      </div>

      {hasBlockedReasons && (
        <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-status-danger/5 border border-status-danger/10">
          <AlertTriangle size={10} className="text-status-danger shrink-0" />
          <span className="text-[9px] text-status-danger">
            {Object.values(election.blocked_reasons).join('; ')}
          </span>
        </div>
      )}

      <button
        onClick={() => onSelectElection(election.election_id)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all hover:opacity-90"
        style={{
          backgroundColor: `${primaryColor}15`,
          color: primaryColor,
        }}
      >
        <Vote size={12} />
        Select Election
        <ChevronRight size={12} />
      </button>
    </motion.div>
  )
}
