import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Loader2, Fingerprint, CheckCircle, Ban, Key } from 'lucide-react'
import { orgVotingService } from '../services/voting-service'
import { useOrgBranding } from '../contexts/OrgBrandingContext'
import type { VoterBallot, VoterBallotPosition, VoteToken } from '../../types/voting-pass'

type Phase = 'input' | 'validating' | 'ballot' | 'casting' | 'done' | 'error'

interface Props {
  open: boolean
  onClose: () => void
  electionId: string
  /** Participant (voter) UUID resolved server-side — never treated as a pass code. */
  voterUuid?: string
  voterName?: string
}

function toViewPosition(raw: VoterBallotPosition) {
  return {
    id: String(raw.positionId),
    title: raw.title,
    description: raw.description ?? '',
    maxSelections: raw.maxSelections ?? 1,
    candidates: raw.candidates.map((c) => ({
      id: String(c.candidateId),
      name: c.name,
      party: c.taxpayer ?? undefined,
      photoUrl: c.photoUrl ?? undefined,
    })),
  }
}

export default function DirectVoteModal({ open, onClose, electionId, voterUuid, voterName }: Props) {
  const { branding } = useOrgBranding()
  const pColor = branding.primaryColor

  const [phase, setPhase] = useState<Phase>('input')
  const [error, setError] = useState('')
  const [token, setToken] = useState<VoteToken | null>(null)
  const [ballot, setBallot] = useState<VoterBallot | null>(null)
  const [selections, setSelections] = useState<Record<string, string | null>>({})
  const [positionIndex, setPositionIndex] = useState(0)

  // When opened for a specific participant, resolve the session automatically.
  useEffect(() => {
    if (!open) return
    setError('')
    setToken(null)
    setBallot(null)
    setSelections({})
    setPositionIndex(0)
    setPhase('input')
    if (voterUuid) {
      handleValidate(voterUuid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, voterUuid])

  const handleValidate = useCallback(async (uuid: string) => {
    if (!uuid.trim()) { setError('Select a participant to vote on behalf of.'); return }
    setPhase('validating')
    setError('')
    try {
      const result = await orgVotingService.startSessionForVoter(electionId, uuid)
      setToken(result.token)
      setBallot(result.ballot)
      setPhase('ballot')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to open the participant\'s ballot.'
      setError(message)
      setPhase('error')
    }
  }, [electionId])

  const handleCastVote = useCallback(async (positionId: string, candidateId: string) => {
    if (!token || !ballot || !voterUuid) return
    setPhase('casting')
    try {
      await orgVotingService.castVoteForVoter(electionId, {
        passCode: '',
        token: token.rawToken ?? '',
        ballotUuid: ballot.uuid,
        positionId: Number(positionId),
        candidateId: Number(candidateId),
        idempotencyKey: `assist:${ballot.uuid}:${positionId}`.slice(-64),
      })
      setSelections((prev) => ({ ...prev, [positionId]: candidateId }))
      const nextIndex = positionIndex + 1
      if (nextIndex < ballot.positions.length) {
        setPositionIndex(nextIndex)
        setPhase('ballot')
      } else {
        setPhase('done')
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to cast vote.'
      setError(message)
      setPhase('error')
    }
  }, [token, ballot, voterUuid, electionId, positionIndex])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    setPhase('input')
    setError('')
    setToken(null)
    setBallot(null)
    setSelections({})
    setPositionIndex(0)
    onClose()
  }, [onClose])

  const viewPositions = ballot?.positions.map(toViewPosition) ?? []
  const currentPosition = viewPositions[positionIndex]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border shadow-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-brand-text-muted" />
                <h3 className="text-sm font-bold text-brand-text-primary">Vote on Behalf</h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-brand-surface-interactive text-brand-text-muted">
                <X size={16} />
              </button>
            </div>

            {voterName && (
              <div className="p-3 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider">
                <p className="text-[9px] text-brand-text-muted uppercase tracking-wider">Participant</p>
                <p className="text-xs font-bold text-brand-text-primary mt-0.5">{voterName}</p>
              </div>
            )}

            {/* Biometrics advert */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface-elevated/30 border border-brand-divider">
              <Fingerprint size={20} className="text-brand-text-muted shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-brand-text-primary">Biometrics Verification</p>
                <p className="text-[9px] text-brand-text-muted">Coming soon — fingerprint & face ID for secure assisted voting.</p>
              </div>
              <span className="shrink-0 text-[8px] font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-text-muted border border-brand-divider">Soon</span>
            </div>

            {phase === 'input' && (
              <div className="space-y-3">
                <p className="text-[10px] text-brand-text-muted">Resolving the participant's ballot...</p>
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={22} className="animate-spin text-brand-text-muted" />
                </div>
              </div>
            )}

            {phase === 'validating' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-brand-text-muted" />
              </div>
            )}

            {phase === 'ballot' && currentPosition && (
              <div className="space-y-4">
                <p className="text-[10px] text-brand-text-muted">
                  Position {positionIndex + 1} of {viewPositions.length}
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-text-primary">{currentPosition.title}</h4>
                  {currentPosition.description && (
                    <p className="text-[9px] text-brand-text-muted">{currentPosition.description}</p>
                  )}
                  <div className="space-y-1.5">
                    {currentPosition.candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => handleCastVote(currentPosition.id, candidate.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selections[currentPosition.id] === candidate.id
                            ? 'border-status-success bg-status-success/10'
                            : 'border-brand-divider hover:bg-brand-surface-interactive'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-surface-elevated flex items-center justify-center text-[10px] font-bold text-brand-text-muted">
                          {candidate.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-brand-text-primary truncate">{candidate.name}</p>
                          {candidate.party && <p className="text-[8px] text-brand-text-muted">{candidate.party}</p>}
                        </div>
                        {selections[currentPosition.id] === candidate.id && (
                          <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--status-success, #10b981)" }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {phase === 'casting' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-brand-text-muted" />
                <p className="ml-2 text-[10px] text-brand-text-muted">Casting vote...</p>
              </div>
            )}

            {phase === 'done' && (
              <div className="text-center space-y-3 py-4">
                <CheckCircle size={32} className="text-status-success mx-auto" />
                <p className="text-xs font-bold text-brand-text-primary">Vote Cast Successfully</p>
                <p className="text-[10px] text-brand-text-muted">The vote has been recorded on behalf of the participant.</p>
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold text-white transition-colors"
                  style={{ backgroundColor: pColor }}
                >
                  Done
                </motion.button>
              </div>
            )}

            {phase === 'error' && (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 rounded-full bg-status-error/10 flex items-center justify-center mx-auto">
                  <Ban size={24} className="text-status-error" />
                </div>
                <p className="text-xs font-bold text-brand-text-primary">Error</p>
                <p className="text-[10px] text-brand-text-muted">{error}</p>
                <motion.button
                  onClick={() => { if (voterUuid) handleValidate(voterUuid) }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold border border-brand-divider text-brand-text-muted hover:bg-brand-surface-interactive transition-colors"
                >
                  Try Again
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
