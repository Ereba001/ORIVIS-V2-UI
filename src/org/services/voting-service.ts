import { getApiClient, unwrapPayload } from '../../lib/api-client'
import type { VoterBallot, VoteToken, StartSessionResponse, PublicCastVoteRequest } from '../../types/voting-pass'

/**
 * Org-assisted voting ("vote on behalf"). These endpoints are org-authenticated
 * (bearer/session) and permission-gated; the backend resolves the target voter
 * server-side from the voter UUID / token — never from client-supplied identity.
 * The public pass-based flow (public-voter-service) is for voters themselves.
 */
export const orgVotingService = {
  /** Start a voting session for a specific participant (by voter UUID). */
  async startSessionForVoter(electionId: string, voterUuid: string): Promise<{ token: VoteToken; ballot: VoterBallot | null }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/voting/session/start-for-voter`, { voterUuid })
    return unwrapPayload<StartSessionResponse>(data)
  },

  /** Cast a vote on behalf of the participant bound to the session token. */
  async castVoteForVoter(electionId: string, input: PublicCastVoteRequest): Promise<void> {
    const client = await getApiClient()
    await client.post(`/elections/${electionId}/voting/cast-for-voter`, input)
  },
}
