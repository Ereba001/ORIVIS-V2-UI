import { API } from '../constants/api'
import { unwrapPayload } from '../lib/api-client'
import type {
  VoterBallot,
  StartSessionResponse,
  PublicCastVoteRequest,
  VoteToken,
  PublicReceipt,
  VoterConsoleStatus,
} from '../types/voting-pass'

async function apiClient() {
  return (await import('../lib/api-client')).getApiClient()
}

/**
 * Public, pass-based voter console flow (mirrors PublicVoterController).
 * These endpoints are unauthenticated — auth is the emailed voting pass.
 */
export const publicVoterService = {
  /**
   * Voter console status: a PII-free snapshot of the voter's state that maps to
   * one authoritative next action (register | continue | use_pass | participate
   * | vote_cast | results). Optional pass code lets a returning voter's
   * already-voted state surface as a distinct terminal action.
   */
  async getStatus(slug: string, passCode?: string): Promise<VoterConsoleStatus> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.PUBLIC.VOTING.STATUS(slug), {
      params: passCode && passCode.trim().length > 0 ? { passCode: passCode.trim() } : undefined,
    })
    return unwrapPayload<VoterConsoleStatus>(data)
  },

  /**
   * Resolve a pass, issue a fresh raw vote token and open a voting session.
   * Returns both the raw token (for casting) and the active ballot.
   */
  async startSession(slug: string, passCode: string): Promise<{ token: VoteToken; ballot: VoterBallot | null }> {
    const client = await apiClient()
    const { data } = await client.post(API.ENDPOINTS.PUBLIC.VOTING.SESSION_START(slug), { passCode })
    return unwrapPayload<StartSessionResponse>(data)
  },

  /** Fetch the active ballot for a pass (no session created). */
  async getBallot(slug: string, passCode: string): Promise<VoterBallot | null> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.PUBLIC.VOTING.BALLOT(slug), { params: { passCode } })
    return unwrapPayload<VoterBallot | null>(data)
  },

  /** Cast a single position on the active ballot for the resolved pass. */
  async castVote(slug: string, input: PublicCastVoteRequest): Promise<void> {
    const client = await apiClient()
    await client.post(API.ENDPOINTS.PUBLIC.VOTING.VOTE(slug), input)
  },

  /** Read-only receipt lookup by receipt code (no auth, uses the emailed code). */
  async getPublicReceipt(receiptCode: string): Promise<PublicReceipt> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.PUBLIC.RECEIPTS.SHOW(receiptCode))
    return unwrapPayload<PublicReceipt>(data)
  },
}