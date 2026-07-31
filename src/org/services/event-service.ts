import { getApiClient } from '../../lib/api-client';
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
  photoUrl: string | null
  biography: string
  status: string
  ballotOrder: number
  voteCount: number
}

export interface EventParticipantData {
  id: string
  name: string
  email: string
  registrationStatus: string
  verificationStatus: string
  votingPassStatus: string
  registeredAt: string
}

export interface EventActivityData {
  id: string
  action: string
  description: string
  timestamp: string
  type: string
  user: string
}

export const eventService = {
  async fetchEventDetail(eventId: string): Promise<EventDetailData> {
    const event = await electionService.getElection(eventId)
    if (!event) throw new Error('Event not found')

    let positions: EventPositionData[] = []
    let participants: EventParticipantData[] = []
    let activities: EventActivityData[] = []

    try {
      const { data: candidatesRaw } = await getApiClient().get<Record<string, unknown>[]>(
        API.ENDPOINTS.CANDIDATES.BASE(eventId)
      )
      positions = groupCandidatesByPosition(candidatesRaw)
    } catch {
      positions = []
    }

    try {
      const { data: votersRaw } = await getApiClient().get<Record<string, unknown>[]>(
        API.ENDPOINTS.VOTERS.BASE(eventId)
      )
      participants = mapParticipants(votersRaw)
    } catch {
      participants = []
    }

    try {
      const { data: activitiesRaw } = await getApiClient().get<Record<string, unknown>[]>(
        API.ENDPOINTS.ELECTIONS.ACTIVITIES(eventId)
      )
      activities = mapActivities(activitiesRaw)
    } catch {
      activities = []
    }

    const registrationSettings = await electionService.getRegistrationSettings(eventId)

    return { event, positions, participants, activities, registrationSettings }
  },

  async updateEvent(id: string, input: Record<string, unknown>): Promise<Election> {
    return electionService.updateElection(id, input)
  },

  async publishEvent(id: string): Promise<Election> {
    return electionService.publishElection(id)
  },

  async closeEvent(id: string): Promise<Election> {
    return electionService.closeElection(id)
  },

  async saveRegSettings(eventId: string, input: RegistrationSettingsInput): Promise<RegistrationSettings> {
    return electionService.saveRegistrationSettings(eventId, input)
  },
}

function groupCandidatesByPosition(raw: Record<string, unknown>[]): EventPositionData[] {
  const posMap = new Map<string, EventPositionData>()
  for (const item of raw) {
    const posId = String(item.positionId ?? '')
    if (!posMap.has(posId)) {
      posMap.set(posId, {
        id: posId,
        title: String(item.positionTitle ?? 'Unknown Position'),
        description: String(item.positionDescription ?? ''),
        maxSelections: Number(item.positionMaxSelections ?? 1),
        ballotOrder: Number(item.positionBallotOrder ?? 0),
        candidates: [],
      })
    }
    const pos = posMap.get(posId)!
    pos.candidates.push({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      email: String(item.email ?? ''),
      photoUrl: item.photoUrl ? String(item.photoUrl) : null,
      biography: String(item.biography ?? ''),
      status: String(item.status ?? 'pending'),
      ballotOrder: Number(item.ballotOrder ?? 0),
      voteCount: Number(item.voteCount ?? 0),
    })
  }
  return Array.from(posMap.values()).sort((a, b) => a.ballotOrder - b.ballotOrder)
}

function mapParticipants(raw: Record<string, unknown>[]): EventParticipantData[] {
  return raw.map((p) => ({
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    email: String(p.email ?? ''),
    registrationStatus: String(p.registrationStatus ?? 'registered'),
    verificationStatus: String(p.verificationStatus ?? 'pending'),
    votingPassStatus: String(p.votingPassStatus ?? 'not_issued'),
    registeredAt: String(p.registeredAt ?? ''),
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
