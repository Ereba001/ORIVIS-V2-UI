/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventService } from '../org/services/event-service'
import { ParticipantsTab } from '../org/pages/event-detail/ParticipantsTab'
import { API } from '../constants/api'
import type { OrivisEvent, EventParticipant } from '../org/types'
import type { RegistrationSettings } from '../types/registration'

const h = vi.hoisted(() => {
  const calls: { method: string; url: string }[] = []
  const responses: Record<string, unknown> = {}

  const getImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'get', url })
    const body = responses[url]
    if (body instanceof Error) throw body
    return { data: body ?? { data: [] } }
  })

  const postImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'post', url })
    const body = responses[url]
    if (body instanceof Error) throw body
    return { data: body ?? { data: {} } }
  })

  const putImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'put', url })
    return { data: { data: {} } }
  })

  const deleteImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'delete', url })
    return { data: { data: {} } }
  })

  return {
    calls,
    responses,
    getImpl,
    postImpl,
    putImpl,
    deleteImpl,
    election: {
      id: 'evt-1',
      organizationId: 'org-1',
      title: 'Annual Election',
      description: '',
      status: 'scheduled',
      startsAt: '',
      endsAt: '',
      timezone: 'UTC',
      visibility: 'private',
      type: 'general',
      branding: { primaryColor: '#000', accentColor: '#000', theme: 'light' },
      settings: {},
    },
  }
})

vi.mock('../lib/api-client', () => ({
  getApiClient: () => ({
    get: h.getImpl,
    post: h.postImpl,
    put: h.putImpl,
    delete: h.deleteImpl,
  }),
  unwrapPayload: (body: unknown) =>
    body && typeof body === 'object' && !Array.isArray(body) && 'data' in body
      ? (body as { data: unknown }).data
      : body,
}))

vi.mock('../services/election-service', () => ({
  electionService: {
    getElection: async () => ({ ...h.election }),
    getRegistrationSettings: async () => null,
    updateElection: async () => ({}),
    createPosition: async () => ({}),
    publishElection: async () => ({}),
    startElection: async () => ({}),
    stopElection: async () => ({}),
    closeElection: async () => ({}),
    saveRegistrationSettings: async () => ({}),
  },
}))

vi.mock('../org/contexts/OrgBrandingContext', () => ({
  useOrgBranding: () => ({
    branding: {
      organizationName: 'Test Org',
      workspaceName: 'Test Org Workspace',
      shortName: 'TO',
      logoUrl: null,
      faviconUrl: null,
      primaryColor: '#4F46E5',
      secondaryColor: '#333333',
      accentColor: '#4F46E5',
      browserTitle: 'Test Org',
      workspaceTitle: 'Test Org',
      tagline: '',
      eventPackage: 'Pro',
      organizationType: 'UNIVERSITY',
    },
  }),
}))

vi.mock('../org/components/CsvMappingModal', () => ({
  default: ({ onConfirm }: { onConfirm: (mapping: Record<string, string>, records: Record<string, string>[]) => void }) => (
    <button onClick={() => onConfirm(
      { name: 'name', email: 'email' },
      [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ],
    )}>
      ConfirmImport
    </button>
  ),
}))

const importUrl = API.ENDPOINTS.VOTERS.IMPORT('evt-1')
const votersUrlPage1 = `${API.ENDPOINTS.VOTERS.BASE('evt-1')}?per_page=200&page=1`

const part = (id: string, name: string, email: string, department = ''): EventParticipant => ({
  id,
  eventId: 'evt-1',
  name,
  email,
  organizationId: 'org-1',
  department,
  registrationStatus: 'registered',
  verificationStatus: 'pending',
  votingPassStatus: 'not_issued',
  votingPassId: null,
  registeredAt: '2026-01-01T00:00:00Z',
  verifiedAt: null,
})

beforeEach(() => {
  h.calls.length = 0
  for (const key of Object.keys(h.responses)) delete h.responses[key]
  h.getImpl.mockClear()
  h.postImpl.mockClear()
  h.putImpl.mockClear()
  h.deleteImpl.mockClear()
})

describe('eventService.read-back of paginated list envelopes', () => {
  it('parses voters, positions and activities regardless of envelope shape', async () => {
    h.responses[votersUrlPage1] = {
      data: [
        {
          id: 'v1',
          name: 'Alice',
          email: 'alice@example.com',
          department: 'Engineering',
          registrationStatus: 'registered',
          verificationStatus: 'pending',
          votingPassStatus: 'not_issued',
          registeredAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'v2',
          name: 'Bob',
          email: 'bob@example.com',
          department: 'Legal',
          registrationStatus: 'verified',
          verificationStatus: 'verified',
          votingPassStatus: 'issued',
          registeredAt: '2026-01-02T00:00:00Z',
        },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 200, total: 2 },
    }
    h.responses[API.ENDPOINTS.POSITIONS.BASE('evt-1')] = {
      data: [{ id: 'pos1', title: 'President', description: '', maxSelections: 1, sortOrder: 0, candidates: [] }],
    }
    h.responses[API.ENDPOINTS.ELECTIONS.ACTIVITIES('evt-1')] = {
      data: [{ id: 'a1', action: 'created', description: 'Event created', timestamp: '2026-01-01T00:00:00Z', type: 'create', user: 'System' }],
    }

    const detail = await eventService.fetchEventDetail('evt-1')

    expect(detail.participants).toHaveLength(2)
    expect(detail.participants[0].name).toBe('Alice')
    expect(detail.participants[0].department).toBe('Engineering')
    expect(detail.participants[1].department).toBe('Legal')
    expect(detail.positions[0].title).toBe('President')
    expect(detail.activities[0].action).toBe('created')
  })

  it('carries identity columns and custom metadata fields onto participants', async () => {
    h.responses[votersUrlPage1] = {
      data: [
        {
          id: 'v1',
          name: 'Ada',
          email: 'ada@example.com',
          department: 'Engineering',
          student_id: 'STU-001',
          membership_number: 'M-9',
          metadata: { faculty: 'Computing', registration_status: 'approved' },
          registrationStatus: 'registered',
          verificationStatus: 'pending',
          votingPassStatus: 'not_issued',
          registeredAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 200, total: 1 },
    }
    h.responses[API.ENDPOINTS.POSITIONS.BASE('evt-1')] = { data: [] }
    h.responses[API.ENDPOINTS.ELECTIONS.ACTIVITIES('evt-1')] = { data: [] }

    const detail = await eventService.fetchEventDetail('evt-1')

    expect(detail.participants[0].fields).toMatchObject({
      student_id: 'STU-001',
      membership_number: 'M-9',
      faculty: 'Computing',
      department: 'Engineering',
    })
    // Internal registration bookkeeping must never surface as a participant field.
    expect(detail.participants[0].fields?.registration_status).toBeUndefined()
  })

  it('pages through all voters using meta.total', async () => {
    const p1 = Array.from({ length: 2 }, (_, i) => ({ id: `p1-${i}`, name: `Early ${i}`, email: `early${i}@x.io`, department: '', registrationStatus: 'registered', verificationStatus: 'pending', votingPassStatus: 'not_issued', registeredAt: '2026-01-01T00:00:00Z' }))
    const p2 = Array.from({ length: 1 }, (_, i) => ({ id: `p2-${i}`, name: `Late ${i}`, email: `late${i}@x.io`, department: '', registrationStatus: 'registered', verificationStatus: 'pending', votingPassStatus: 'not_issued', registeredAt: '2026-01-01T00:00:00Z' }))
    h.responses[votersUrlPage1] = { data: p1, meta: { current_page: 1, last_page: 2, per_page: 2, total: 3 } }
    h.responses[`${API.ENDPOINTS.VOTERS.BASE('evt-1')}?per_page=200&page=2`] = { data: p2, meta: { current_page: 2, last_page: 2, per_page: 2, total: 3 } }
    h.responses[API.ENDPOINTS.POSITIONS.BASE('evt-1')] = { data: [] }
    h.responses[API.ENDPOINTS.ELECTIONS.ACTIVITIES('evt-1')] = { data: [] }

    const detail = await eventService.fetchEventDetail('evt-1')

    expect(detail.participants.map((p) => p.name)).toEqual(['Early 0', 'Early 1', 'Late 0'])
  })
})

describe('eventService.importVoters', () => {
  it('posts the CSV and parses snake_case counts', async () => {
    h.responses[importUrl] = {
      data: {
        uuid: 'batch-1',
        filename: 'import.csv',
        status: 'completed_with_errors',
        total_records: 3,
        successful_records: 2,
        failed_records: 1,
      },
    }

    const file = new File(['name,email\nAlice,a@x.io'], 'import.csv', { type: 'text/csv' })
    const result = await eventService.importVoters('evt-1', file)

    expect(result).toEqual({ successful: 2, failed: 1, total: 3, status: 'completed_with_errors' })
    expect(h.postImpl).toHaveBeenCalledWith(expect.stringContaining('/voters/import'), expect.any(FormData), expect.anything())
  })

  it('rejects when nothing was imported', async () => {
    h.responses[importUrl] = {
      data: { uuid: 'b', status: 'completed', total_records: 0, successful_records: 0, failed_records: 0 },
    }

    await expect(eventService.importVoters('evt-1', new File(['name,email\n'], 'import.csv', { type: 'text/csv' })))
      .rejects.toThrow('No voters were imported')
  })

  it('surfaces API error messages', async () => {
    h.responses[importUrl] = new Error('The CSV file contains no valid voter rows.')

    await expect(eventService.importVoters('evt-1', new File(['name,email\n'], 'import.csv', { type: 'text/csv' })))
      .rejects.toThrow('The CSV file contains no valid voter rows.')
  })
})

describe('ParticipantsTab import flow', () => {
  it('renders persisted participants in the table and refreshes after a successful import', async () => {
    h.responses[importUrl] = {
      data: { uuid: 'batch-1', status: 'completed', total_records: 2, successful_records: 2, failed_records: 0 },
    }
    const onDataChanged = vi.fn()

    render(
      <ParticipantsTab
        event={h.election as unknown as OrivisEvent}
        participants={[part('v1', 'Alice', 'alice@example.com', 'Engineering'), part('v2', 'Bob', 'bob@example.com')]}
        onDataChanged={onDataChanged}
      />,
    )

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('ConfirmImport'))

    await waitFor(() => expect(h.postImpl).toHaveBeenCalledWith(expect.stringContaining('/voters/import'), expect.any(FormData), expect.anything()))
    await waitFor(() => expect(onDataChanged).toHaveBeenCalled())

    expect(screen.getAllByText(/Import complete: 2 voters imported/).length).toBeGreaterThan(0)
  })

  it('shows the API error message when an import fails', async () => {
    h.responses[importUrl] = new Error('The CSV file contains no valid voter rows.')

    render(
      <ParticipantsTab
        event={h.election as unknown as OrivisEvent}
        participants={[part('v1', 'Alice', 'alice@example.com')]}
      />,
    )

    fireEvent.click(screen.getByText('ConfirmImport'))

    await waitFor(() => expect(screen.getByText('The CSV file contains no valid voter rows.')).toBeTruthy())
  })

  it('renders schema-driven participant columns from the registration settings', async () => {
    const settings: RegistrationSettings = {
      registration_enabled: true,
      registration_required: true,
      registration_message: null,
      lookup_fields: ['name', 'email', 'custom'],
      verification_method: 'otp',
      pass_required: true,
      custom_lookup_fields: ['Faculty'],
      participant_fields: [
        { key: 'name', label: 'Full Name', required: true, custom: false },
        { key: 'email', label: 'Email', required: false, custom: false },
        { key: 'faculty', label: 'Faculty', required: false, custom: true },
      ],
    }
    const facultyParticipant = { ...part('v3', 'Grace', 'grace@example.com'), fields: { faculty: 'Computing' } }

    render(
      <ParticipantsTab
        event={h.election as unknown as OrivisEvent}
        participants={[facultyParticipant]}
        registrationSettings={settings}
      />,
    )

    expect(screen.getByText('Faculty')).toBeTruthy()
    expect(screen.getByText('Computing')).toBeTruthy()
  })

  it('hides schema columns that have no data yet', async () => {
    const settings: RegistrationSettings = {
      registration_enabled: true,
      registration_required: true,
      registration_message: null,
      lookup_fields: ['name', 'email', 'custom'],
      verification_method: 'otp',
      pass_required: true,
      custom_lookup_fields: ['Faculty'],
      participant_fields: [
        { key: 'name', label: 'Full Name', required: true, custom: false },
        { key: 'email', label: 'Email', required: false, custom: false },
        { key: 'faculty', label: 'Faculty', required: false, custom: true },
      ],
    }

    render(
      <ParticipantsTab
        event={h.election as unknown as OrivisEvent}
        participants={[part('v4', 'NoFaculty', 'none@example.com')]}
        registrationSettings={settings}
      />,
    )

    expect(screen.queryByText('Faculty')).toBeNull()
  })
})