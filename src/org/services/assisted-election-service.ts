import { getApiClient, unwrapPayload } from '../../lib/api-client'

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

export interface AssistedParticipant {
  id: number
  uuid: string
  name: string
  email_masked: string | null
  voting_status: string
  has_voted: boolean
  registration_status: string
  has_active_pass: boolean
  pass_code: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface AssistedSearchResult {
  data: AssistedParticipant[]
  meta: PaginationMeta
}

export interface AssistedStats {
  total_participants: number
  registered: number
  verified: number
  active_passes: number
  voted: number
  registration_rate: number
  verification_rate: number
  voting_rate: number
}

export interface AssistedActivity {
  id: number
  event: string
  description: string
  actor: string | null
  created_at: string | null
}

export interface AssistedActivityResult {
  data: AssistedActivity[]
  meta: PaginationMeta
}

export interface BallotPosition {
  id: number
  title: string
  description: string | null
  candidates: BallotCandidate[]
}

export interface BallotCandidate {
  id: number
  name: string
  description: string | null
  photo_url: string | null
}

export interface StartSessionResult {
  token: string
  voter: { name: string; uuid: string }
  ballot: {
    uuid: string
    positions: BallotPosition[]
  }
}

export interface ParticipantElection {
  election_id: number
  election_uuid: string
  election_title: string
  lifecycle_state: string
  registration_status: string
  has_voted: boolean
  has_active_pass: boolean
}

export interface GlobalParticipant {
  id: number
  uuid: string
  name: string
  email_masked: string | null
  voter_id_display: string | null
  elections: ParticipantElection[]
}

export interface GlobalSearchResult {
  data: GlobalParticipant[]
  meta: PaginationMeta
}

export interface ParticipantContextResult {
  participant: {
    id: number
    uuid: string
    name: string
    email_masked: string | null
    voter_id_display: string | null
  }
  elections: Array<ParticipantElection & {
    allowed_actions: string[]
    blocked_reasons: Record<string, string>
  }>
}

export interface AllowedActionsResult {
  allowed_actions: string[]
  blocked_reasons: Record<string, string>
}

export interface CenterStats {
  total_participants: number
  total_elections: number
  registered: number
  verified: number
  active_passes: number
  voted: number
}

// ──────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────

export const assistedElectionService = {
  /** Search participants in an election. */
  async searchParticipants(
    electionId: string,
    query?: string,
    perPage?: number,
  ): Promise<AssistedSearchResult> {
    const client = await getApiClient()
    const params: Record<string, string | number> = {}
    if (query) params.query = query
    if (perPage) params.per_page = perPage
    const { data } = await client.get(`/elections/${electionId}/assisted/search`, { params })
    return unwrapPayload<AssistedSearchResult>(data)
  },

  /** Log access to the Assisted Election Centre for an election. */
  async logAccess(electionId: string): Promise<void> {
    const client = await getApiClient()
    await client.post(`/elections/${electionId}/assisted/access`)
  },

  /** Get Assisted Election Centre stats for an election. */
  async getStats(electionId: string): Promise<AssistedStats> {
    const client = await getApiClient()
    const { data } = await client.get(`/elections/${electionId}/assisted/stats`)
    return unwrapPayload<AssistedStats>(data)
  },

  /** Get activity log for the Assisted Election Centre. */
  async getActivity(electionId: string, perPage?: number): Promise<AssistedActivityResult> {
    const client = await getApiClient()
    const params: Record<string, number> = {}
    if (perPage) params.per_page = perPage
    const { data } = await client.get(`/elections/${electionId}/assisted/activity`, { params })
    return unwrapPayload<AssistedActivityResult>(data)
  },

  /** Register a participant for the election (staff-initiated). */
  async registerParticipant(
    electionId: string,
    voterId: number,
  ): Promise<{ registration_uuid: string; status: string; voter: { name: string; email_masked: string | null } }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/register`, {
      voter_id: voterId,
    })
    return unwrapPayload(data)
  },

  /** Send OTP to participant's email for verification. */
  async sendOtp(electionId: string, registrationUuid: string): Promise<{ message: string; expires_in: number; registration: string }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/send-otp`, {
      registration_uuid: registrationUuid,
    })
    return unwrapPayload(data)
  },

  /** Verify the OTP code entered by the participant. */
  async verifyOtp(
    electionId: string,
    registrationUuid: string,
    code: string,
  ): Promise<{ message: string; verified: boolean; registration: string }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/verify-otp`, {
      registration_uuid: registrationUuid,
      code,
    })
    return unwrapPayload(data)
  },

  /** Complete registration and issue a voting pass. */
  async issuePass(
    electionId: string,
    registrationUuid: string,
  ): Promise<{ pass: { code: string; expires_at: string | null }; registration: string }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/issue-pass`, {
      registration_uuid: registrationUuid,
    })
    return unwrapPayload(data)
  },

  /** Reissue a voting pass for a participant. */
  async reissuePass(
    electionId: string,
    registrationUuid: string,
  ): Promise<{ pass_code: string; expires_at: string | null }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/reissue-pass`, {
      registration_uuid: registrationUuid,
    })
    return unwrapPayload(data)
  },

  /** Validate a voting pass for assisted voting. */
  async validatePass(
    electionId: string,
    passCode: string,
  ): Promise<{ valid: boolean; pass: { code: string; election_id: number; voter_id: number }; voter: { name: string } }> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/validate-pass`, {
      pass_code: passCode,
    })
    return unwrapPayload(data)
  },

  /** Start an assisted voting session for a participant. */
  async startSession(electionId: string, voterId: number): Promise<StartSessionResult> {
    const client = await getApiClient()
    const { data } = await client.post(`/elections/${electionId}/assisted/start-session`, {
      voter_id: voterId,
    })
    return unwrapPayload(data)
  },

  /** Cast an assisted vote for a participant. */
  async castVote(
    electionId: string,
    input: {
      voter_id: number
      position_id: number
      candidate_id: number
      token: string
      ballot_uuid: string
      idempotency_key?: string
    },
  ): Promise<void> {
    const client = await getApiClient()
    await client.post(`/elections/${electionId}/assisted/cast-vote`, input)
  },

  /** Get receipt for an assisted vote. */
  async getReceipt(
    electionId: string,
    code: string,
  ): Promise<{ uuid: string; code: string; verification_url: string; status: string; generated_at: string | null }> {
    const client = await getApiClient()
    const { data } = await client.get(`/elections/${electionId}/assisted/receipt/${code}`)
    return unwrapPayload(data)
  },

  /** Search participants across ALL elections (participant-first workflow). */
  async searchParticipantsGlobally(
    query: string,
    perPage?: number,
  ): Promise<GlobalSearchResult> {
    const client = await getApiClient()
    const params: Record<string, string | number> = { query }
    if (perPage) params.per_page = perPage
    const { data } = await client.get('/assisted/participants/search', { params })
    return unwrapPayload<GlobalSearchResult>(data)
  },

  /** Get participant context across all their elections. */
  async getParticipantContext(voterUuid: string): Promise<ParticipantContextResult> {
    const client = await getApiClient()
    const { data } = await client.get(`/assisted/participants/${voterUuid}/context`)
    return unwrapPayload<ParticipantContextResult>(data)
  },

  /** Get allowed actions for a participant in a specific election. */
  async getAllowedActions(voterUuid: string, electionId: number): Promise<AllowedActionsResult> {
    const client = await getApiClient()
    const { data } = await client.get(`/assisted/participants/${voterUuid}/elections/${electionId}/actions`)
    return unwrapPayload<AllowedActionsResult>(data)
  },

  /** Get aggregate AEC stats across all elections. */
  async getCenterStats(): Promise<CenterStats> {
    const client = await getApiClient()
    const { data } = await client.get('/assisted/center/stats')
    return unwrapPayload<CenterStats>(data)
  },

  /** Get AEC activity log across all elections. */
  async getCenterActivity(perPage?: number): Promise<AssistedActivityResult> {
    const client = await getApiClient()
    const params: Record<string, number> = {}
    if (perPage) params.per_page = perPage
    const { data } = await client.get('/assisted/center/activity', { params })
    return unwrapPayload<AssistedActivityResult>(data)
  },

  /** Log access to the Assisted Election Center. */
  async logCenterAccess(): Promise<void> {
    const client = await getApiClient()
    await client.post('/assisted/center/access')
  },
}
