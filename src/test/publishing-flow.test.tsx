/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventDetail from '../org/pages/EventDetail'
import { API } from '../constants/api'

const FUTURE_ISO = '2099-01-01T12:00:00.000Z'

const h = vi.hoisted(() => {
  const calls: { method: string; url: string }[] = []
  const responses: Record<string, unknown> = {}
  const polls: Array<{ fn: () => void | Promise<void>; interval: number }> = []

  const election: Record<string, unknown> = {
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
  }

  const getImpl = vi.fn(async (url: string) => {
    calls.push({ method: 'get', url })
    const body = responses[url]
    if (body instanceof Error) throw body
    return { data: body ?? { data: [] } }
  })
  const postImpl = vi.fn(async () => ({ data: { data: {} } }))
  const putImpl = vi.fn(async () => ({ data: { data: {} } }))
  const deleteImpl = vi.fn(async () => ({ data: { data: {} } }))

  return { calls, responses, polls, election, getImpl, postImpl, putImpl, deleteImpl }
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
    publishElection: async () => {
      h.election = { ...h.election, status: 'published', scheduledPublishAt: null }
      return { ...h.election }
    },
    schedulePublishElection: async () => {
      if (h.responses.__scheduleError) {
        throw new Error(h.responses.__scheduleError as string)
      }
      h.election = { ...h.election, scheduledPublishAt: FUTURE_ISO }
      return { ...h.election }
    },
    cancelScheduledPublish: async () => {
      h.election = { ...h.election, scheduledPublishAt: null }
      return { ...h.election }
    },
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

// Capture poll callbacks instead of scheduling real intervals; the publish
// flow is driven through onDataChanged (reloadKey) like the real app.
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

beforeEach(() => {
  h.calls.length = 0
  h.polls.length = 0
  delete h.responses.__scheduleError
  for (const key of Object.keys(h.responses)) delete h.responses[key]
  h.election.status = 'created'
  h.election.scheduledPublishAt = null
  h.getImpl.mockClear()
})

async function mountEventDetail() {
  h.responses[votersUrlPage1] = { data: [], meta: { current_page: 1, last_page: 1, per_page: 200, total: 0 } }
  h.responses[API.ENDPOINTS.POSITIONS.BASE('evt-1')] = { data: [] }
  h.responses[API.ENDPOINTS.ELECTIONS.ACTIVITIES('evt-1')] = { data: [] }
  const utils = render(
    <MemoryRouter initialEntries={['/org/events/evt-1']}>
      <Routes>
        <Route path="/org/events/:id" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>
  )
  fireEvent.click(await screen.findByText('Publishing'))
  await screen.findByText('Validation Checks')
  // Billing loads asynchronously; Schedule Publish / Publish Now stay disabled
  // until the billing snapshot resolves.
  await waitFor(() => {
    expect(screen.getByText('Publish Now').closest('button')).not.toBeDisabled()
  })
  return utils
}

describe('PublishingTab schedule/publish flow', () => {
  it('shows a success message and the Scheduled status after scheduling publish', async () => {
    const { container } = await mountEventDetail()

    expect(screen.getByText('Publish Now')).toBeTruthy()
    fireEvent.click(screen.getByText('Schedule Publish'))

    // Fill the schedule modal with a future date/time and submit.
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2099-01-01' } })
    fireEvent.change(container.querySelector('input[type="time"]')!, { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))

    // A success modal pops up with the schedule details…
    expect(await screen.findByText('Event Scheduled')).toBeTruthy()
    // The modal shows the schedule details (the scheduled card behind it shows
    // the same time once the refetch lands, so match all occurrences).
    expect((await screen.findAllByText(/Jan 1, 2099/)).length).toBeGreaterThan(0)
    expect(await screen.findByText('Publish time')).toBeTruthy()
    // …dismissing it leaves the event status "Scheduled" once the refresh lands.
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByText('Event Scheduled')).toBeNull()
    expect(await screen.findByText('Scheduled')).toBeTruthy()
  })

  it('shows the error message in the modal when scheduling fails', async () => {
    const { container } = await mountEventDetail()
    h.responses.__scheduleError = 'Voting dates are not set.'

    fireEvent.click(screen.getByText('Schedule Publish'))
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2099-01-01' } })
    fireEvent.change(container.querySelector('input[type="time"]')!, { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))

    expect(await screen.findByText('Voting dates are not set.')).toBeTruthy()
  })

  it('shows publish success and the Published status after publishing', async () => {
    await mountEventDetail()

    fireEvent.click(screen.getByText('Publish Now'))

    expect(await screen.findByText('Event published successfully.')).toBeTruthy()
    expect(await screen.findByText('Published')).toBeTruthy()
  })
})
