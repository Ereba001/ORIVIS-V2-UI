import { useState } from 'react'
import { motion } from 'motion/react'
import { MoreHorizontal, User, Mail, Trophy, Edit3, Trash2, Eye, Upload, FileText, GripVertical, Image } from 'lucide-react'
import type { EventCandidate } from '../types'

interface CandidateCardProps {
  candidate: EventCandidate
  positionTitle: string
  index?: number
  onReorder?: (candidateId: string, direction: 'up' | 'down') => void
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-status-success/10 text-status-success border-status-success/20',
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  rejected: 'bg-status-error/10 text-status-error border-status-error/20',
  withdrawn: 'bg-brand-surface-elevated text-brand-text-disabled border-brand-border',
}

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export default function CandidateCard({ candidate, positionTitle, index = 0, onReorder }: CandidateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1 }}
      className="glass-card rounded-2xl p-4 hover:border-[var(--org-primary)]/30 transition-all duration-300 relative"
      draggable={!!onReorder}
      onDragStart={(e) => {
        const de = e as unknown as React.DragEvent<HTMLDivElement>
        de.dataTransfer.setData('text/plain', candidate.id)
      }}
    >
      <div className="flex items-start gap-3">
        {onReorder && (
          <div className="cursor-grab text-brand-text-muted hover:text-brand-text-primary shrink-0 mt-0.5">
            <GripVertical size={14} />
          </div>
        )}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
          style={{ backgroundColor: candidate.photoUrl ? 'transparent' : 'var(--org-primary)' }}
        >
          {candidate.photoUrl ? (
            <Image size={16} />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold text-brand-text-primary truncate">{candidate.name}</p>
            {candidate.voteCount > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-mono text-status-success shrink-0">
                <Trophy size={10} />
                {candidate.voteCount}
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-brand-text-muted truncate mb-1">
            <Mail size={9} className="inline mr-1" />
            {candidate.email}
          </p>
          <p className="text-[9px] font-mono" style={{ color: 'var(--org-primary)' }}>
            {positionTitle}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-brand-surface border border-brand-border rounded-xl py-1 shadow-xl">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                >
                  <Eye size={12} />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.click()
                    setTimeout(() => { setMenuOpen(false) }, 1500)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                >
                  <Image size={12} />
                  Upload Photo
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.doc,.docx'
                    input.click()
                    setTimeout(() => { setMenuOpen(false) }, 1500)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                >
                  <FileText size={12} />
                  Upload Manifesto
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                >
                  <Trophy size={12} />
                  Ballot Preview
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-interactive transition-colors"
                >
                  <Edit3 size={12} />
                  Edit
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-status-error hover:bg-brand-surface-interactive transition-colors"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-brand-divider">
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[candidate.status] || STATUS_STYLES.pending}`}>
            {STATUS_LABELS[candidate.status] || candidate.status}
          </span>
          <span className="text-[8px] font-mono text-brand-text-disabled flex items-center gap-1">
            <User size={9} />
            Ballot #{candidate.ballotOrder}
          </span>
        </div>
        {onReorder && (
          <div className="flex items-center gap-1">
            <button onClick={() => onReorder(candidate.id, 'up')} className="p-1 rounded hover:bg-brand-surface-interactive text-brand-text-muted" disabled={index === 0}>
              <ChevronUp size={12} />
            </button>
            <button onClick={() => onReorder(candidate.id, 'down')} className="p-1 rounded hover:bg-brand-surface-interactive text-brand-text-muted">
              <ChevronDown size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ChevronUp({ size }: { size?: number }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDown({ size }: { size?: number }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}