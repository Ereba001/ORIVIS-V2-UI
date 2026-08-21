import { motion } from 'motion/react'
import { ArrowLeft, User } from 'lucide-react'

interface ParticipantHeaderProps {
  participant: { name: string; email_masked: string | null; voter_id_display: string | null }
  onBack: () => void
  primaryColor?: string
}

export default function ParticipantHeader({
  participant,
  onBack,
  primaryColor = '#D4AF37',
}: ParticipantHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface"
    >
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-surface-interactive hover:bg-brand-border transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} className="text-brand-text-muted" />
      </button>

      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${primaryColor}18` }}
      >
        <User size={16} style={{ color: primaryColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-brand-text-primary truncate">
          {participant.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {participant.email_masked && (
            <span className="text-[10px] text-brand-text-muted truncate">
              {participant.email_masked}
            </span>
          )}
          {participant.voter_id_display && (
            <>
              {participant.email_masked && (
                <span className="text-brand-text-disabled">·</span>
              )}
              <span className="text-[9px] font-mono text-brand-text-muted truncate">
                {participant.voter_id_display}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
