/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventDetail from '../org/pages/EventDetail'
import { API } from '../constants/api'

const h = vi.hoisted(() => {
  const calls: { method: string; url: string }[] = []
  const responses: Record<string, unknown> = {}
  const polls: Array<{ fn: () => void | Promise<void>; interval: number }> = []

  const getImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'get', url })
    const body = responses[url]
    if (body instanceof Error) throw body
    return { data: body ?? { data: [] } }
  })
  const postImpl = vi.fn(async () => ({ data: { data: {} } }))
  const putImpl = vi.fn(async () => ({ data: { data: {} } }))
  const deleteImpl = vi.fn(async () => ({ data: { data: {} } }))

  return { calls, responses, polls, getImpl, postImpl, putImpl, deleteImpl }
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
    getElection: async () => ({
      id: 'evt-1',
      organizationId: 'org-1',
      title: 'Annual Election',
      description: '',
      status: 'created',
      startsAt: '',
      endsAt: '',
      timezone: 'UTC',
      visibility: 'private',
      type: 'general',
      branding: { primaryColor: '#000', accentColor: '#000', theme: 'light' },
      settings: {},
    }),
    getRegistrationSettings: async () => null,
    updateElection: async () => ({}),
    createPosition: async () => ({}),
    publishElection: async () => ({}),
    startElection: async () => ({}),
    stopElection: async () => ({}),
    closeElection: async () => ({}),
    archiveElection: async () => ({}),
    saveRegistrationSettings: async () => ({}),
  },
}))

vi.mock('../services/billing-service', () => ({
  billingService: {
    getEventBilling: async () => ({
      billing: { status: 'free_granted', amount: '0.00', currency: 'NGN' },
      freeEntitlement: { available: true },
      billingSatisfied: true,
    }),
  },
}))

// Capture the poll callbacks instead of scheduling real intervals, so the
// roster-skipping lightweight poll can be invoked deterministically.
vi.mock('../hooks/usePolling', () => ({
  usePolling: (fn: () => void | Promise<void>, interval: number, enabled = true) => {
    if (enabled) h.polls.push({ fn, interval })
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

vi.mock('../contexts/OrgPermissionsContext', () => ({
  useOrgPermissions: () => ({
    permissions: ['participant.view'],
    role: null,
    organization: null,
    loading: false,
    permissionsLoaded: true,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    refresh: async () => {},
  }),
}))

const votersUrlPage1 = `${API.ENDPOINTS.VOTERS.BASE('evt-1')}?per_page=200&page=1`

const voter = (id: string, name: string, email: string, department = '') => ({
  id,
  name,
  email,
  department,
  registrationStatus: 'registered',
  verificationStatus: 'pending',
  votingPassStatus: 'not_issued',
  registeredAt: '2026-01-01T00:00:00Z',
})

beforeEach(() => {
  h.calls.length = 0
  h.polls.length = 0
  for (const key of Object.keys(h.responses)) delete h.responses[key]
  h.getImpl.mockClear()
  h.postImpl.mockClear()
  h.putImpl.mockClear()
  h.deleteImpl.mockClear()
})

describe('EventDetail roster stability across the lightweight poll', () => {
  it('keeps the participant table and the publishing readiness check after a roster-skipping refresh', async () => {
    h.responses[votersUrlPage1] = {
      data: [
        voter('v1', 'Alice', 'alice@example.com', 'Engineering'),
        voter('v2', 'Bob', 'bob@example.com', 'Legal'),
      ],
      meta: { current_page: 1, last_page: 1, per_page: 200, total: 2 },
    }
    h.responses[API.ENDPOINTS.POSITIONS.BASE('evt-1')] = { data: [] }
    h.responses[API.ENDPOINTS.ELECTIONS.ACTIVITIES('evt-1')] = { data: [] }

    render(
      <MemoryRouter initialEntries={['/org/events/evt-1']}>
        <Routes>
          <Route path="/org/events/:id" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>
    )

    // Initial load renders the roster in the participants tab.
    fireEvent.click(await screen.findByText('Participants'))
    expect(await screen.findByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()

    // Run the 30s lightweight poll, which fetches the event detail with
    // skipVoters=true and would previously replace the roster with [].
    const lightPolls = h.polls.filter((p) => p.interval === 30000)
    expect(lightPolls.length).toBeGreaterThan(0)
    await act(async () => {
      await lightPolls[lightPolls.length - 1].fn()
    })

    // The uploaded participants must survive the roster-skipping refresh.
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()

    // The publishing readiness "Participants" check must still pass.
    fireEvent.click(await screen.findByText('Publishing'))
    await screen.findByText('Validation Checks')
    const passedParticipantsRow = screen
      .getAllByText('Participants')
      .map((el) => el.closest('div.flex.items-center'))
      .find((row) => row?.querySelector('[class*="circle-check"]'))
    expect(passedParticipantsRow).toBeTruthy()
  })
})
