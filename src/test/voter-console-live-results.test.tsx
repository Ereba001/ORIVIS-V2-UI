/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import VoterConsole from '../pages/elections/VoterConsole'
import type { VoterConsoleStatus } from '../types/voting-pass'
import type { ElectionResults } from '../services/results-service'

/**
 * CP10 — Voter console live results experience.
 *
 * When the election has the live-results policy on and the voter holds a pass,
 * the results panel must use the public live-results endpoint (pass-authenticated)
 * instead of waiting for published final results. When live results are
 * unavailable (voting ended / policy off mid flow), the panel must fall back to
 * the published-gated final results endpoint — never an authenticated tallies
 * source.
 *
 * Uses real timers: the 500ms status debounce and the phase-exit animation both
 * settle naturally, and `waitFor` polls the DOM for the outcome.
 */
const h = vi.hoisted(() => {
  const getPublicElection = vi.fn(async (..._a: any[]): Promise<any> => null)
  const getStatus = vi.fn(async (..._a: any[]): Promise<VoterConsoleStatus | null> => null)
  const getPublicLiveResults = vi.fn(async (..._a: any[]): Promise<ElectionResults | null> => null)
  const getPublicResults = vi.fn(async (..._a: any[]): Promise<ElectionResults | null> => null)
  return { getPublicElection, getStatus, getPublicLiveResults, getPublicResults }
})

vi.mock('../services/election-service', () => ({
  electionService: { getPublicElection: (...a: any[]) => h.getPublicElection(...a) },
}))

vi.mock('../services/public-voter-service', () => ({
  publicVoterService: {
    getStatus: (...a: any[]) => h.getStatus(...a),
    startSession: async () => ({ token: null, ballot: null }),
  },
}))

vi.mock('../services/results-service', () => ({
  resultsService: {
    getPublicLiveResults: (...a: any[]) => h.getPublicLiveResults(...a),
    getPublicResults: (...a: any[]) => h.getPublicResults(...a),
  },
}))

vi.mock('../hooks/usePolling', () => ({
  usePolling: () => {},
}))

const PASS = 'PASS-LIVE-001'

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

const votedStatus = (overrides: Partial<VoterConsoleStatus> = {}): VoterConsoleStatus => ({
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
    live_results: true,
  },
  ...overrides,
})

const liveResults = (overrides: Partial<ElectionResults> = {}): ElectionResults => ({
  election: {
    id: '1',
    title: 'Student Union Polls',
    slug: 'test-slug',
    type: 'ELECTION',
    category: '',
    status: 'live',
    lifecycleState: 'live',
    votingStartsAt: '2090-01-01T00:00:00.000Z',
    votingEndsAt: '2091-01-01T00:00:00.000Z',
    resultsPublishAt: null,
  },
  live: true,
  isLive: true,
  resultsPublished: false,
  summary: { eligibleVoters: 10, registeredVoters: 10, ballotsCast: 3, confirmedVotes: 3, turnout: 30 },
  positions: [
    {
      id: 'p1',
      title: 'President',
      description: '',
      maxSelections: 1,
      ballotOrder: 1,
      totalVotes: 3,
      candidates: [
        { id: 'c1', name: 'Alice', photoUrl: null, status: 'published', ballotOrder: 1, voteCount: 2, voteShare: 66, rank: 1, elected: true, winner: true },
        { id: 'c2', name: 'Bob', photoUrl: null, status: 'published', ballotOrder: 2, voteCount: 1, voteShare: 33, rank: 2, elected: false, winner: false },
      ],
    },
  ],
  ...overrides,
})

const finalResults = () => liveResults({ live: false, isLive: false, resultsPublished: true })

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
  h.getPublicLiveResults.mockReset()
  h.getPublicResults.mockReset()
  sessionStorage.clear()
})

describe('VoterConsole (CP10 live results)', () => {
  it('live results are fetched with the voter pass when the policy is on', async () => {
    sessionStorage.setItem('orivis_vote_pass', PASS)
    h.getPublicElection.mockResolvedValue(election())
    h.getStatus.mockResolvedValue(votedStatus())
    h.getPublicLiveResults.mockResolvedValue(liveResults())
    h.getPublicResults.mockResolvedValue(null)

    renderConsole()

    fireEvent.click(await screen.findByRole('button', { name: 'View Results' }, { timeout: 3000 }))

    await waitFor(() => expect(h.getPublicLiveResults).toHaveBeenCalledWith('test-slug', PASS))
    expect(await screen.findByText('Alice', {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByText('Live')).toBeTruthy()
    expect(h.getPublicResults).not.toHaveBeenCalled()
  })

  it('falls back to published final results when live results are unavailable', async () => {
    sessionStorage.setItem('orivis_vote_pass', PASS)
    h.getPublicElection.mockResolvedValue(election())
    h.getStatus.mockResolvedValue(votedStatus())
    h.getPublicLiveResults.mockRejectedValue(Object.assign(new Error('Live results have not been enabled.'), { code: 'LIVE_RESULTS_UNAVAILABLE' }))
    h.getPublicResults.mockResolvedValue(finalResults())

    renderConsole()

    fireEvent.click(await screen.findByRole('button', { name: 'View Results' }, { timeout: 3000 }))

    await waitFor(() => expect(h.getPublicResults).toHaveBeenCalledWith('test-slug'))
    expect(await screen.findByText('Alice', {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByText('Final')).toBeTruthy()
  })
})