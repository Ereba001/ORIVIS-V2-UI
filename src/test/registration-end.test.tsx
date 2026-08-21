/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegistrationTab } from '../org/pages/event-detail/RegistrationTab'

const h = vi.hoisted(() => {
  const endRegistration = vi.fn(async (..._a: any[]) => {})
  const toggleRegistration = vi.fn(async (..._a: any[]) => {})
  const startRegistration = vi.fn(async (..._a: any[]) => {})
  const saveRegistrationSettings = vi.fn(async (..._a: any[]) => ({}))
  const fetchVoterSummary = vi.fn(async (..._a: any[]) => ({ total: 0, registered: 0, passesIssued: 0, voted: 0 }))
  const onDataChanged = vi.fn()
  return { endRegistration, toggleRegistration, startRegistration, saveRegistrationSettings, fetchVoterSummary, onDataChanged }
})

vi.mock('../services/election-service', () => ({
  electionService: {
    saveRegistrationSettings: (...a: any[]) => h.saveRegistrationSettings(...a),
    toggleRegistration: (...a: any[]) => h.toggleRegistration(...a),
    startRegistration: (...a: any[]) => h.startRegistration(...a),
    endRegistration: (...a: any[]) => h.endRegistration(...a),
  },
}))

vi.mock('../org/services/event-service', () => ({
  eventService: {
    fetchVoterSummary: (...a: any[]) => h.fetchVoterSummary(...a),
  },
}))

// Capture poll callbacks without scheduling real intervals.
vi.mock('../hooks/usePolling', () => ({
  usePolling: (_fn: () => void | Promise<void>) => {},
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

vi.mock('../lib/api-client', () => ({
  getApiClient: () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }),
  unwrapPayload: (body: unknown) => body,
}))

const event: any = {
  id: 'evt-1',
  status: 'published',
  registrationStartsAt: '2090-01-01T00:00:00.000Z',
  registrationEndsAt: '2091-01-01T00:00:00.000Z',
}

const registration: any = {
  id: 'reg-1',
  eventId: 'evt-1',
  isOpen: true,
  eligibilityRules: [],
  verificationMethods: [],
  autoApprove: false,
  maxParticipants: 0,
  currentRegistrations: 0,
  passSettings: { expiresInHours: 24, singleUse: true },
}

const registrationSettings: any = {
  registration_enabled: true,
  registration_required: true,
  pass_required: true,
  lookup_fields: ['student_id'],
  verification_method: 'otp',
  registration_message: null,
}

beforeEach(() => {
  h.endRegistration.mockClear()
  h.toggleRegistration.mockClear()
  h.startRegistration.mockClear()
  h.saveRegistrationSettings.mockClear()
  h.fetchVoterSummary.mockClear()
  h.onDataChanged.mockClear()
})

describe('RegistrationTab end registration flow', () => {
  it('ends registration with an audit note and shows a success message', async () => {
    render(
      <RegistrationTab
        event={event}
        registration={registration}
        registrationSettings={registrationSettings}
        participants={[]}
        locked={false}
        onDataChanged={h.onDataChanged}
      />
    )

    // Published event with registration open offers End Registration.
    fireEvent.click(screen.getByRole('button', { name: 'End Registration' }))

    // Confirmation modal appears with the audit note field.
    expect(await screen.findByText(/This closes registration for new participants immediately/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText(/Why are you ending registration/i), { target: { value: 'Window closed for recount' } })

    // Two buttons share the name now (trigger + confirm) — use the last one.
    const buttons = screen.getAllByRole('button', { name: 'End Registration' })
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => expect(h.endRegistration).toHaveBeenCalledWith('evt-1', 'Window closed for recount'))
    expect(h.onDataChanged).toHaveBeenCalled()

    // Success banner is shown and the modal is gone (after the exit animation).
    expect(await screen.findByText(/Registration ended/)).toBeTruthy()
    await waitFor(() => expect(screen.queryByText(/Audit note \(optional\)/)).toBeNull())
  })

  it('surfaces the API error when ending registration fails', async () => {
    h.endRegistration.mockRejectedValueOnce(new Error('Registration is already closed for this election.'))

    render(
      <RegistrationTab
        event={event}
        registration={registration}
        registrationSettings={registrationSettings}
        participants={[]}
        locked={false}
        onDataChanged={h.onDataChanged}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'End Registration' }))
    const buttons = screen.getAllByRole('button', { name: 'End Registration' })
    fireEvent.click(buttons[buttons.length - 1])

    expect(await screen.findByText('Registration is already closed for this election.')).toBeTruthy()
    expect(h.onDataChanged).not.toHaveBeenCalled()
  })
})

describe('RegistrationTab open registration flow', () => {
  const closedRegistration: any = {
    ...registration,
    isOpen: false,
  }

  it('opens registration with an audit note and shows a success message', async () => {
    render(
      <RegistrationTab
        event={event}
        registration={closedRegistration}
        registrationSettings={registrationSettings}
        participants={[]}
        locked={false}
        onDataChanged={h.onDataChanged}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Registration' }))

    expect(await screen.findByText(/This opens registration for new participants immediately/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText(/Why are you opening registration early/i), { target: { value: 'Walk in registration day' } })

    const buttons = screen.getAllByRole('button', { name: 'Open Registration' })
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => expect(h.startRegistration).toHaveBeenCalledWith('evt-1', 'Walk in registration day'))
    expect(h.onDataChanged).toHaveBeenCalled()
    expect(await screen.findByText(/Registration opened/)).toBeTruthy()
  })

  it('surfaces the API error when opening registration fails', async () => {
    h.startRegistration.mockRejectedValueOnce(new Error('Registration is already open for this election.'))

    render(
      <RegistrationTab
        event={event}
        registration={closedRegistration}
        registrationSettings={registrationSettings}
        participants={[]}
        locked={false}
        onDataChanged={h.onDataChanged}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Registration' }))
    const buttons = screen.getAllByRole('button', { name: 'Open Registration' })
    fireEvent.click(buttons[buttons.length - 1])

    expect(await screen.findByText('Registration is already open for this election.')).toBeTruthy()
    expect(h.onDataChanged).not.toHaveBeenCalled()
  })
})
