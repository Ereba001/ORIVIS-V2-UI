/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsTab } from '../org/pages/event-detail/SettingsTab'

const h = vi.hoisted(() => {
  const updateCandidateSlots = vi.fn(async (..._a: any[]) => {})
  const updateElection = vi.fn(async (..._a: any[]) => ({}))
  const onDataChanged = vi.fn()
  return { updateCandidateSlots, updateElection, onDataChanged }
})

vi.mock('../services/election-service', () => ({
  electionService: {
    updateCandidateSlots: (...a: any[]) => h.updateCandidateSlots(...a),
    updateElection: (...a: any[]) => h.updateElection(...a),
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

const baseEvent: any = {
  id: 'evt-1',
  title: 'Test Election',
  description: '',
  timezone: 'Africa/Lagos',
  visibility: 'public',
  registrationStartsAt: '2090-01-01T00:00:00.000Z',
  registrationEndsAt: '2091-01-01T00:00:00.000Z',
  startsAt: '2092-01-01T00:00:00.000Z',
  endsAt: '2093-01-01T00:00:00.000Z',
  candidateSlots: 5,
  settings: {
    allowAnonymousVoting: false,
    requireEmailVerification: false,
    requireIdVerification: false,
    requireTwoFactor: false,
    allowMultipleVotes: false,
    resultPublication: 'manual',
    liveResults: false,
    notifyOnRegistration: false,
    notifyOnVote: false,
  },
}

beforeEach(() => {
  h.updateCandidateSlots.mockClear()
  h.updateElection.mockClear()
  h.onDataChanged.mockClear()
})

describe('SettingsTab candidate slots', () => {
  it('renders the current cap and slot usage', () => {
    render(
      <SettingsTab
        event={baseEvent}
        locked={false}
        saveSuccess={false}
        setSaveSuccess={() => {}}
        candidateApprovedCount={5}
        onDataChanged={h.onDataChanged}
      />,
    )

    expect(screen.getByLabelText('Slot Cap')).toHaveValue(5)
    expect(screen.getByText('5 of 5 candidate slots used')).toBeTruthy()
  })

  it('raises the cap even when the tab is locked (published event)', async () => {
    render(
      <SettingsTab
        event={{ ...baseEvent, candidateSlots: 5 }}
        locked
        saveSuccess={false}
        setSaveSuccess={() => {}}
        candidateApprovedCount={5}
        onDataChanged={h.onDataChanged}
      />,
    )

    const input = screen.getByLabelText('Slot Cap')
    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Cap' }))

    await waitFor(() => {
      expect(h.updateCandidateSlots).toHaveBeenCalledWith('evt-1', 25)
      expect(h.onDataChanged).toHaveBeenCalled()
    })
    expect(screen.getByRole('alert').textContent).toBe('Saved!')
  })

  it('surfaces API errors without crashing', async () => {
    h.updateCandidateSlots.mockRejectedValueOnce(new Error('Candidate slot limit reached.'))

    render(
      <SettingsTab
        event={baseEvent}
        locked={false}
        saveSuccess={false}
        setSaveSuccess={() => {}}
        candidateApprovedCount={5}
        onDataChanged={h.onDataChanged}
      />,
    )

    fireEvent.change(screen.getByLabelText('Slot Cap'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Cap' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Candidate slot limit reached.')
    })
  })

  it('rejects invalid values locally without calling the API', async () => {
    render(
      <SettingsTab
        event={baseEvent}
        locked={false}
        saveSuccess={false}
        setSaveSuccess={() => {}}
        candidateApprovedCount={5}
        onDataChanged={h.onDataChanged}
      />,
    )

    fireEvent.change(screen.getByLabelText('Slot Cap'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Cap' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('between 0 and 1000')
    })
    expect(h.updateCandidateSlots).not.toHaveBeenCalled()
  })
})
