import type { UUID, EmailAddress, ISO8601DateTime } from './common';

export type PassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export type PassStatusView = Exclude<PassStatus, 'INVALID'>;

export interface VoterRecord {
  id: UUID
  name: string
  email: EmailAddress
  orgId: string
  department?: string
  level?: string
}

export interface VotingPass {
  id: string
  electionId: UUID
  voterRecordId: UUID
  issuedAt: ISO8601DateTime
  expiresAt: ISO8601DateTime
  usedAt?: ISO8601DateTime | null
  status: PassStatusView
}

export interface VotingPassCardData {
  code: string
  electionTitle: string
  organizationName: string
  voterName: string
  issuedAt: ISO8601DateTime
  expiresAt: ISO8601DateTime | null
  status: PassStatusView
}

export interface ParticipantIdentity {
  name: string
  email: string
  organization?: string
  department?: string
  level?: string
  maskedEmail: string
  maskedPhone?: string
}

export interface PassValidationResult {
  valid: boolean
  pass?: VotingPassCardData
  voter?: ParticipantIdentity
  electionId?: string
  error?: string
}

export interface ReceiptSelection {
  positionId: UUID
  candidateId: UUID | null
}

export interface CastVoteInput {
  passId: string
  selections: ReceiptSelection[]
}

export interface VoteReceipt {
  passId: string
  electionId: UUID
  voterName: string
  receiptHash: string
  blockNumber: number
  timestamp: ISO8601DateTime
  selections: { positionTitle: string; candidateName: string }[]
}

export interface LookupFieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'tel'
  placeholder: string
  validation: RegExp | null
  errorMessage: string
}
