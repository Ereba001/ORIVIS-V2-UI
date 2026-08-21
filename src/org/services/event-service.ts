import { getApiClient, unwrapPayload, type PaginationMeta } from '../../lib/api-client';
import { API } from '../../constants/api';
import { electionService } from '../../services/election-service';
import type { Election } from '../../types/election';
import type { RegistrationSettings, RegistrationSettingsInput } from '../../types/registration';

export interface EventDetailData {
  event: Election
  positions: EventPositionData[]
  participants: EventParticipantData[]
  activities: EventActivityData[]
  registrationSettings: RegistrationSettings | null
}

export interface EventPositionData {
  id: string
  title: string
  description: string
  maxSelections: number
  ballotOrder: number
  candidates: EventCandidateData[]
}

export interface EventCandidateData {
  id: string
  name: string
  email: string
  party: string | null
  photoUrl: string | null
  partyLogoUrl: string | null
  campaignImageUrl: string | null
  slogan: string | null
  manifesto: string | null
  biography: string
  candidateCode: string | null
  status: string
  ballotOrder: number
  voteCount: number
}

export interface EventParticipantData {
  id: string
  name: string
  email: string
  department: string
  registrationStatus: string
  verificationStatus: string
  votingPassStatus: string
  registeredAt: string
  fields?: Record<string, string | null>
}

export interface EventActivityData {
  id: string
  action: string
  description: string
  timestamp: string
  type: string
  user: string
}

export interface VoterImportResult {
  successful: number
  failed: number
  total: number
  status: string
}

const VOTER_PAGE_SIZE = 200
const MAX_VOTER_PAGES = 100

export interface EventVoterSummary {
  total: number
  registered: number
  passesIssued: number
  voted: number
}

export const eventService = {
  async fetchEventDetail(eventId: string, options?: { skipVoters?: boolean }): Promise<EventDetailData> {
    const event = await electionService.getElection(eventId)
    if (!event) throw new Error('Event not found')

    // Positions and the voter roster are core datasets: a failure must surface
    // (the page shows an error with retry) instead of silently rendering empty
    // candidate/participant lists. The activity timeline is supplementary and
    // stays best-effort.
    const { data: positionsRaw } = await getApiClient().get<unknown>(
      API.ENDPOINTS.POSITIONS.BASE(eventId)
    )
    const positions = mapPositions(extractList<Record<string, unknown>>(positionsRaw).items)

    // Polling refreshes should skip the (potentially thousands-row) voter
    // roster; the Registration tab polls the lightweight summary endpoint for
    // live counts instead. Initial loads still fetch voters.
    let participants: EventParticipantData[] = []
    if (!options?.skipVoters) {
      participants = await fetchAllVoters(eventId)
    }

    let activities: EventActivityData[] = []
    try {
      const { data: activitiesRaw } = await getApiClient().get<unknown>(
        API.ENDPOINTS.ELECTIONS.ACTIVITIES(eventId)
      )
      activities = mapActivities(extractList<Record<string, unknown>>(activitiesRaw).items)
    } catch (err) {
      console.error('eventService.fetchEventDetail.activities:', err)
      activities = []
    }

    const registrationSettings = await electionService.getRegistrationSettings(eventId)

    return { event, positions, participants, activities, registrationSettings }
  },

  /** Lightweight voter counts for auto-refresh (COUNT queries, no roster fetch). */
  async fetchVoterSummary(eventId: string): Promise<EventVoterSummary> {
    const { data } = await getApiClient().get<unknown>(
      `${API.ENDPOINTS.VOTERS.BASE(eventId)}/summary`,
    )
    const raw = unwrapPayload<Record<string, unknown>>(data)
    return {
      total: Number(raw.total ?? 0),
      registered: Number(raw.registered ?? 0),
      passesIssued: Number(raw.passesIssued ?? raw.passes_issued ?? 0),
      voted: Number(raw.voted ?? 0),
    }
  },

  /** Fetch the full voter roster (all pages) for an election. */
  async fetchVoters(eventId: string): Promise<EventParticipantData[]> {
    return fetchAllVoters(eventId)
  },

  async importVoters(eventId: string, file: File): Promise<VoterImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await getApiClient().post<unknown>(
      API.ENDPOINTS.VOTERS.IMPORT(eventId),
      formData,
      { headers: { 'Content-Type': undefined } },
    )

    const payload = unwrapPayload<Record<string, unknown>>(data)

    const successful = Number(payload.successful_records ?? payload.successfulRecords ?? 0)
    const failed = Number(payload.failed_records ?? payload.failedRecords ?? 0)
    const total = Number(payload.total_records ?? payload.totalRecords ?? (successful + failed))

    if (total <= 0) {
      throw new Error('No voters were imported. Check that the CSV contains a "name" column with rows to import.')
    }

    return {
      successful,
      failed,
      total,
      status: String(payload.status ?? ''),
    }
  },

  async updateEvent(id: string, input: Record<string, unknown>): Promise<Election> {
    return electionService.updateElection(id, input)
  },

  async createPosition(eventId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return electionService.createPosition(eventId, input)
  },

  async publishEvent(id: string): Promise<Election> {
    return electionService.publishElection(id)
  },

  async startEvent(id: string, auditNote: string): Promise<Election> {
    return electionService.startElection(id, auditNote)
  },

  async stopEvent(id: string, auditNote: string): Promise<Election> {
    return electionService.stopElection(id, auditNote)
  },

  async closeEvent(id: string, auditNote: string): Promise<Election> {
    return electionService.closeElection(id, auditNote)
  },

  async saveRegSettings(eventId: string, input: RegistrationSettingsInput): Promise<RegistrationSettings> {
    return electionService.saveRegistrationSettings(eventId, input)
  },
}

function mapPositions(raw: Record<string, unknown>[]): EventPositionData[] {
  return raw.map((p) => ({
    id: String(p.id ?? ''),
    title: String(p.title ?? 'Unknown Position'),
    description: String(p.description ?? ''),
    maxSelections: Number(p.maxSelections ?? 1),
    ballotOrder: Number(p.sortOrder ?? 0),
    candidates: (Array.isArray(p.candidates) ? p.candidates : []).map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ''),
      name: String(c.name ?? ''),
      email: String(c.email ?? ''),
      party: c.party ? String(c.party) : null,
      photoUrl: c.photoUrl ? String(c.photoUrl) : null,
      partyLogoUrl: c.partyLogoUrl ? String(c.partyLogoUrl) : null,
      campaignImageUrl: c.campaignImageUrl ? String(c.campaignImageUrl) : null,
      slogan: c.slogan ? String(c.slogan) : null,
      manifesto: c.manifesto ? String(c.manifesto) : null,
      biography: String(c.biography ?? ''),
      candidateCode: c.candidateCode ? String(c.candidateCode) : null,
      status: String(c.status ?? 'pending'),
      ballotOrder: Number(c.ballotOrder ?? 0),
      voteCount: Number(c.voteCount ?? 0),
    })),
  })).sort((a, b) => a.ballotOrder - b.ballotOrder)
}

const VOTER_COLUMN_KEYS = [
  'phone', 'voter_id', 'external_id', 'student_id', 'staff_id',
  'employee_id', 'membership_number', 'dob', 'constituency', 'polling_station',
]

const VOTER_METADATA_INTERNAL_KEYS = new Set([
  'registration_status', 'registration_status_updated_at', 'registration_status_updated_by',
])

function mapVoterFields(raw: Record<string, unknown>): Record<string, string | null> | undefined {
  const fields: Record<string, string | null> = {}

  for (const key of VOTER_COLUMN_KEYS) {
    const value = raw[key]
    if (value !== undefined && value !== null && value !== '') {
      fields[key] = String(value)
    }
  }

  if (raw.department !== undefined && raw.department !== null && raw.department !== '') {
    fields.department = String(raw.department)
  }

  const metadata = typeof raw.metadata === 'object' && raw.metadata !== null && !Array.isArray(raw.metadata)
    ? raw.metadata as Record<string, unknown>
    : undefined
  if (metadata) {
    for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
      if (VOTER_METADATA_INTERNAL_KEYS.has(key)) continue
      if (key === 'department') continue
      if (value === undefined || value === null || value === '') continue
      fields[key] = String(value)
    }
  }

  return Object.keys(fields).length > 0 ? fields : undefined
}

function mapParticipants(raw: Record<string, unknown>[]): EventParticipantData[] {
  return raw.map((p) => ({
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    email: String(p.email ?? ''),
    department: p.department ? String(p.department) : '',
    registrationStatus: String(p.registrationStatus ?? 'registered'),
    verificationStatus: String(p.verificationStatus ?? 'pending'),
    votingPassStatus: String(p.votingPassStatus ?? 'not_issued'),
    registeredAt: String(p.registeredAt ?? ''),
    fields: mapVoterFields(p),
  }))
}

function mapActivities(raw: Record<string, unknown>[]): EventActivityData[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    action: String(a.action ?? ''),
    description: String(a.description ?? ''),
    timestamp: String(a.timestamp ?? ''),
    type: String(a.type ?? 'system'),
    user: String(a.user ?? 'System'),
  }))
}

function extractList<T>(payload: unknown): { items: T[]; meta?: PaginationMeta } {
  if (Array.isArray(payload)) {
    return { items: payload as T[] }
  }

  const body = (payload ?? {}) as { data?: unknown; meta?: unknown }

  if (Array.isArray(body.data)) {
    return {
      items: body.data as T[],
      meta: body.meta as PaginationMeta | undefined,
    }
  }

  return { items: [] }
}

async function fetchAllVoters(eventId: string): Promise<EventParticipantData[]> {
  const all: EventParticipantData[] = []
  let page = 1
  let total = Infinity

  do {
    const query = `per_page=${VOTER_PAGE_SIZE}&page=${page}`
    const { data } = await getApiClient().get<unknown>(
      `${API.ENDPOINTS.VOTERS.BASE(eventId)}?${query}`
    )

    const { items, meta } = extractList<Record<string, unknown>>(data)

    if (items.length === 0) {
      break
    }

    all.push(...mapParticipants(items))

    if (meta?.total !== undefined) {
      total = Number(meta.total)
    }

    page++
  } while (all.length < total && page <= MAX_VOTER_PAGES)

  return all
}
