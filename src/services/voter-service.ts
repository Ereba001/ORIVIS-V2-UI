import { API } from '../constants/api'
import type { VoterRecord, VotingPass, CastVoteInput, VoteReceipt, PassValidationResult } from '../types/voting-pass'

async function apiClient() {
  return (await import('../lib/api-client')).getApiClient()
}

export const voterService = {
  async lookupVoter(electionId: string, orgId: string): Promise<VoterRecord | null> {
    const client = await apiClient()
    const { data } = await client.get(`/elections/${electionId}/voters/lookup?orgId=${encodeURIComponent(orgId)}`)
    return data
  },

  async issueVotingPass(electionId: string, voterRecord: VoterRecord): Promise<VotingPass> {
    const client = await apiClient()
    const { data } = await client.post(`/elections/${electionId}/passes`, { voterRecordId: voterRecord.id })
    return data
  },

  async validatePass(passId: string): Promise<PassValidationResult> {
    const client = await apiClient()
    const { data } = await client.get(API.ENDPOINTS.PASSES.VALIDATE(passId))
    return data
  },

  async markPassUsed(passId: string): Promise<void> {
    const client = await apiClient()
    await client.patch(API.ENDPOINTS.PASSES.USE(passId))
  },

  async castVote(input: CastVoteInput): Promise<VoteReceipt> {
    const client = await apiClient()
    const { data } = await client.post(API.ENDPOINTS.BALLOTS.CAST(input.passId), input)
    return data
  },

  async getReceipt(passId: string): Promise<VoteReceipt | null> {
    const client = await apiClient()
    const { data } = await client.get(`/receipts/${passId}`)
    return data
  },

  async uploadVoterDatabase(electionId: string, records: VoterRecord[]): Promise<void> {
    const client = await apiClient()
    await client.post(`/elections/${electionId}/voters/database`, { records })
  },

  async getVoterDatabase(electionId: string): Promise<VoterRecord[]> {
    const client = await apiClient()
    const { data } = await client.get(`/elections/${electionId}/voters/database`)
    return data
  },
}
