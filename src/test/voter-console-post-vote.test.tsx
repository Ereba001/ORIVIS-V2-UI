/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import VoterConsole from '../pages/elections/VoterConsole'
import type { VoterConsoleStatus } from '../types/voting-pass'

/**
 * CP11 — Post-vote state.
 *
 * After a successful vote the voter sees a clear "Your vote has been cast!" state
 * and is never offered Cast Vote / Vote Now / Submit Vote again. Refreshing with a
 * persisted pass lands on the terminal Vote Cast state. Voting starts by clicking
 * Vote Now which goes straight to the voting pass input (the membership gate lives
 * on the election landing page). (The backend independently rejects a second vote
 * per position and for completed elections — covered by VoteCastingService /
 * VoteCastTest.)
 */
const h = vi.hoisted(() => {
  const getPublicElection = vi.fn(async (..._a: any[]): Promise<any> => null)
  const getStatus = vi.fn(async (..._a: any[]): Promise<VoterConsoleStatus | null> => null)
  const startSession = vi.fn(async (..._a: any[]): Promise<any> => ({ token: null, ballot: null }))
  const castVote = vi.fn(async (..._a: any[]): Promise<any> => ({ receipt: { uuid: 'rc-1' } }))
  return { getPublicElection, getStatus, startSession, castVote }
})

vi.mock('../services/election-service', () => ({
  electionService: { getPublicElection: (...a: any[]) => h.getPublicElection(...a) },
}))

vi.mock('../services/public-voter-service', () => ({
  publicVoterService: {
    getStatus: (...a: any[]) => h.getStatus(...a),
    startSession: (...a: any[]) => h.startSession(...a),
    castVote: (...a: any[]) => h.castVote(...a),
  },
}))

vi.mock('../hooks/usePolling', () => ({
  usePolling: () => {},
}))

const PASS = 'PASS-FLOW-001'

const election = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  slug: 'test-slug',
  title: 'Student Union Polls',
  description: 'A live election',
  type: 'ELECTION',
  status: 'LIVE',
  lifecycleState: 'live',
  startsAt: '2090-01-01T00:00:00.000Z',
  endsAt: '2091-01-01T00:00:00.000Z',
  organizationId: 'org-1',
  organizationName: 'Test Org',
  ...overrides,
})

const participateStatus = (): VoterConsoleStatus => ({
  nextAction: 'participate',
  passState: 'active',
  hasVoted: false,
  registered: true,
  eligible: true,
  election: {
    slug: 'test-slug',
    lifecycle_state: 'live',
    registration_open: false,
    voting_open: true,
    voting_ended: false,
    live_results: false,
  },
})

const session = {
  token: { uuid: 't1', rawToken: 'RAW-TOKEN', tokenHash: 'h', status: 'active', electionId: 1, voterId: 1, issuedAt: null, expiresAt: null },
  ballot: {
    uuid: 'b1',
    status: 'active',
    version: 1,
    positions: [
      {
        positionId: 101,
        sortOrder: 1,
        maxSelections: 1,
        minSelections: 0,
        title: 'President',
        description: 'Choose one',
        candidates: [
          { id: 'c1', candidateId: 1, name: 'Alice', taxpayer: 'Party A', photoUrl: null },
          { id: 'c2', candidateId: 2, name: 'Bob', taxpayer: 'Party B', photoUrl: null },
        ],
      },
    ],
  },
}

function renderConsole() {
  return render(
    <MemoryRouter initialEntries={['/elections/test-slug/console']}>
      <Routes>
        <Route path="/elections/:id/console" element={<VoterConsole />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  h.getPublicElection.mockReset()
  h.getStatus.mockReset()
  h.startSession.mockReset()
  h.castVote.mockReset()
  sessionStorage.clear()
})

describe('VoterConsole (CP11 post-vote state)', () => {
  it('after submitting the ballot the voter sees the cast confirmation, never a cast action again', async () => {
    h.getPublicElection.mockResolvedValue(election())
    h.getStatus.mockResolvedValue(participateStatus())
    h.startSession.mockResolvedValue(session)

    renderConsole()

    fireEvent.click(await screen.findByRole('button', { name: 'Cast Your Ballot' }, { timeout: 3000 }))

    const passInput = await screen.findByLabelText('Voting pass', {}, { timeout: 3000 })
    fireEvent.change(passInput, { target: { value: PASS } })
    fireEvent.click(screen.getByRole('button', { name: 'Open My Ballot' }))

    fireEvent.click(await screen.findByRole('button', { name: /alice/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Review & Verify' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm & Submit' }, { timeout: 3000 }))

    await waitFor(() => expect(h.castVote).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Your vote has been cast!', {}, { timeout: 3000 })).toBeTruthy()

    expect(h.castVote.mock.calls[0][1]).toMatchObject({
      passCode: PASS,
      positionId: 101,
      candidateId: 1,
    })

    expect(screen.queryByRole('button', { name: /confirm & submit/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /cast your ballot/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /open my ballot/i })).toBeNull()
  })

  it('refreshing with a persisted pass keeps the terminal Vote Cast state', async () => {
    sessionStorage.setItem('orivis_vote_pass', PASS)
    h.getPublicElection.mockResolvedValue(election())
    h.getStatus.mockResolvedValue({
      nextAction: 'vote_cast',
      passState: 'used',
      hasVoted: true,
      registered: true,
      eligible: true,
      election: {
        slug: 'test-slug',
        lifecycle_state: 'live',
        registration_open: false,
        voting_open: true,
        voting_ended: false,
        live_results: false,
      },
    })

    renderConsole()

    expect(await screen.findByText('Vote Cast', {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'View Results' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /cast your ballot/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /confirm & submit/i })).toBeNull()
  })
})