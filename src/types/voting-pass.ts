import type { UUID } from './common';

export type PassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export type PassStatusView = Exclude<PassStatus, 'INVALID'>;

export type BallotStatus = 'pending' | 'active' | 'consumed' | 'expired' | 'void';

export interface VoteToken {
  uuid: UUID
  rawToken: string | null
  tokenHash: string
  status: string
  electionId: number
  voterId: number
  issuedAt: string | null
  expiresAt: string | null
}

export interface VotingSession {
  uuid: UUID
  status: string
  startedAt: string | null
  expiresAt: string | null
}

export interface VoterCandidateView {
  id: string
  candidateId: number
  name: string
  taxpayer: string | null
  photoUrl: string | null
}

export interface VoterBallotPosition {
  /** int position row id (supplies positionId to castVote) */
  positionId: number
  sortOrder: number
  maxSelections: number
  minSelections: number
  title: string
  description: string | null
  candidates: VoterCandidateView[]
}

export interface VoterBallot {
  uuid: UUID
  status: BallotStatus
  version: number
  positions: VoterBallotPosition[]
}

export interface CastVoteInput {
  token: string
  ballotUuid: string
  positionId: number
  candidateId: number
  idempotencyKey: string
}

export interface VoteReceipt {
  uuid: UUID
  status: string
  receiptCode: string
  verificationUrl: string | null
  generatedAt: string | null
  election?: {
    uuid: UUID
  }
  selections?: ReceiptSelection[]
}

export interface ReceiptSelection {
  positionId: number
  positionTitle: string | null
  candidateId: number
  candidateName: string | null
}

export interface PublicReceipt extends VoteReceipt {
  election?: {
    uuid: UUID
    title: string
    slug: string
    organizationName: string | null
  }
  selections: ReceiptSelection[]
}

export interface LookupFieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'tel'
  placeholder: string
  validation: RegExp | null
  errorMessage: string
}

export interface StartSessionRequest {
  passCode: string
}

export interface StartSessionResponse {
  token: VoteToken
  ballot: VoterBallot | null
}

export interface PublicCastVoteRequest {
  passCode: string
  token: string
  ballotUuid: string
  positionId: number
  candidateId: number
  idempotencyKey?: string
}

/**
 * The single authoritative next action the voter console should render, resolved
 * server-side by PublicVoterController::status / VotingPassService::getConsoleStatus.
 * Each value maps to exactly one, non-conflicting UI action (CP9):
 * - register    : before registration → "Register"
 * - continue    : registered, pass expired/revoked → "Continue"
 * - use_pass    : before voting (or pass not yet entered while voting open) → "Use Voting Pass"
 * - participate : registered + eligible + pass active + voting open → "Vote Now"
 * - vote_cast   : voter already completed voting → terminal "Vote Cast / Completed"
 * - results     : election ended/archived → results panel
 */
export type VoterConsoleNextAction = 'register' | 'continue' | 'use_pass' | 'participate' | 'vote_cast' | 'results'

export type VoterConsolePassState = 'none' | 'active' | 'used' | 'expired' | 'revoked' | 'invalid' | 'other_election'

export interface VoterConsoleStatus {
  nextAction: VoterConsoleNextAction
  passState: VoterConsolePassState
  hasVoted: boolean
  registered: boolean
  eligible: boolean
  election: {
    slug: string
    lifecycle_state: string
    registration_open: boolean
    voting_open: boolean
    voting_ended: boolean
    live_results: boolean
  }
}