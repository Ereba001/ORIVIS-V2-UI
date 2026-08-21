import { API } from '../constants/api'
import { unwrapPayload, readOrNull } from '../lib/api-client'
import type {
  VoteToken,
  VotingSession,
  VoterBallot,
  CastVoteInput,
  VoteReceipt,
} from '../types/voting-pass'

async function apiClient() {
  return (await import('../lib/api-client')).getApiClient()
}

export const voterService = {
  /**
   * Authenticated vote-token session flow (matches VotingController).
   * A voter (authenticated, org-scoped) presents an admin-issued 64-char raw
   * token to open a voting session for an election.
   */
  async startSession(electionId: string, token: string): Promise<VotingSession> {
    const client = await apiClient()
    const { data } = await client.post(API.ENDPOINTS.VOTING.SESSION_START(electionId), { token })
    return unwrapPayload<VotingSession>(data)
  },

  async getSession(electionId: string): Promise<VotingSession | null> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.VOTING.SESSION(electionId))
    return unwrapPayload<VotingSession | null>(data)
  },

  async closeSession(electionId: string, sessionId: string): Promise<void> {
    const client = await apiClient()
    await client.post(API.ENDPOINTS.VOTING.SESSION_CLOSE(electionId, sessionId))
  },

  /** Returns the voter's active ballot (with int positionId/candidateId). */
  async getBallot(electionId: string): Promise<VoterBallot | null> {
    const client = await apiClient()
    return readOrNull(async () => {
      const { data } = await client.get(API.ENDPOINTS.VOTING.BALLOT(electionId))
      return unwrapPayload<VoterBallot | null>(data)
    })
  },

  /** Admin: issue a raw voting token for a voter (used by org workspace UI). */
  async issueToken(electionId: string, voterId: string): Promise<VoteToken> {
    const client = await apiClient()
    const { data } = await client.post(API.ENDPOINTS.VOTING.TOKEN_ISSUE(electionId), { voterId })
    return unwrapPayload<VoteToken>(data)
  },

  async revokeToken(electionId: string, tokenId: string): Promise<void> {
    const client = await apiClient()
    await client.delete(API.ENDPOINTS.VOTING.TOKEN_REVOKE(electionId, tokenId))
  },

  /**
   * Cast a single position on the active ballot for the current token/session.
   * Returns the vote resource (including its receipt).
   */
  async castVote(electionId: string, input: CastVoteInput): Promise<VoteReceipt> {
    const client = await apiClient()
    const { data } = await client.post(API.ENDPOINTS.VOTING.VOTE(electionId), input)
    return unwrapPayload<VoteReceipt>(data)
  },

  /** Fetch a receipt by its UUID. */
  async getReceiptByUuid(electionId: string, uuid: string): Promise<VoteReceipt | null> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.VOTING.RECEIPT_UUID(electionId, uuid))
    return unwrapPayload<VoteReceipt>(data)
  },

  /** Fetch a receipt by its human-readable receipt code. */
  async getReceiptByCode(electionId: string, receiptCode: string): Promise<VoteReceipt> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.VOTING.RECEIPT(electionId, receiptCode))
    return unwrapPayload<VoteReceipt>(data)
  },

  async verifyAuditChain(electionId: string): Promise<{ chainIntact: boolean; electionId: number }> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.VOTING.AUDIT_CHAIN(electionId))
    return unwrapPayload<{ chainIntact: boolean; electionId: number }>(data)
  },
}