/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import VoterConsole from '../pages/elections/VoterConsole'
import type { VoterConsoleStatus } from '../types/voting-pass'

/**
 * CP9 — Voter console distinct, non-conflicting actions.
 *
 * The console must render ONE authoritative next action per voter state,
 * resolved from the backend /voting/{slug}/status endpoint:
 * Register (before registration) -> Use Voting Pass (before voting / no pass)
 * -> Vote Now (voting open, pass active) -> Vote Cast (already voted).
 * A voter who already completed voting must NEVER see a cast action again.
 *
 * The console resolves status through a 500ms debounce; tests use fake timers
 * and advance the debounce inside act() so resolution is deterministic.
 */
const h = vi.hoisted(() => {
  const getPublicElection = vi.fn(async (..._a: any[]): Promise<any> => null)
  const getStatus = vi.fn(async (..._a: any[]): Promise<VoterConsoleStatus | null> => null)
  const startSession = vi.fn(async (..._a: any[]): Promise<any> => ({ token: null, ballot: null }))
  return { getPublicElection, getStatus, startSession }
})

vi.mock('../services/election-service', () => ({
  electionService: { getPublicElection: (...a: any[]) => h.getPublicElection(...a) },
}))

vi.mock('../services/public-voter-service', () => ({
  publicVoterService: {
    getStatus: (...a: any[]) => h.getStatus(...a),
    startSession: (...a: any[]) => h.startSession(...a),
  },
}))

vi.mock('../hooks/usePolling', () => ({
  usePolling: (_fn: () => void | Promise<void>) => {},
}))

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

const status = (overrides: Partial<VoterConsoleStatus> = {}): VoterConsoleStatus => ({
  nextAction: 'register',
  passState: 'none',
  hasVoted: false,
  registered: false,
  eligible: false,
  election: {
    slug: 'test-slug',
    lifecycle_state: 'published',
    registration_open: true,
    voting_open: false,
    voting_ended: false,
    live_results: false,
  },
  ...overrides,
})

function renderConsole() {
  return render(
    <MemoryRouter initialEntries={['/elections/test-slug/console']}>
      <Routes>
        <Route path="/elections/:id/console" element={<VoterConsole />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Advance past the status debounce and flush the resulting async state update. */
async function settleStatus() {
  await act(async () => {
    vi.advanceTimersByTime(700)
    await Promise.resolve()
  })
}

beforeEach(() => {
  h.getPublicElection.mockReset()
  h.getStatus.mockReset()
  h.startSession.mockReset()
  sessionStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VoterConsole (CP9 distinct actions)', () => {
  it('before registration shows a single Register action', async () => {
    h.getPublicElection.mockResolvedValueOnce(election({ lifecycleState: 'published', status: 'PUBLISHED' }))
    h.getStatus.mockResolvedValueOnce(status())

    renderConsole()
    await settleStatus()

    expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /vote now/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /use voting pass/i })).toBeNull()
  })

  it('voting open without a pass shows Use Voting Pass, not Register', async () => {
    h.getPublicElection.mockResolvedValueOnce(election())
    h.getStatus.mockResolvedValueOnce(status({
      nextAction: 'use_pass',
      election: { slug: 'test-slug', lifecycle_state: 'live', registration_open: true, voting_open: true, voting_ended: false, live_results: false },
    }))

    renderConsole()
    await settleStatus()

    expect(screen.getByRole('button', { name: 'Cast Your Ballot' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull()
  })

  it('voting open with an active pass shows Cast Your Ballot', async () => {
    h.getPublicElection.mockResolvedValueOnce(election())
    h.getStatus.mockResolvedValueOnce(status({
      nextAction: 'participate',
      passState: 'active',
      hasVoted: false,
      registered: true,
      eligible: true,
      election: { slug: 'test-slug', lifecycle_state: 'live', registration_open: true, voting_open: true, voting_ended: false, live_results: false },
    }))

    renderConsole()
    await settleStatus()

    expect(screen.getByRole('button', { name: 'Cast Your Ballot' })).toBeTruthy()
  })

  it('an already-voted voter sees the terminal Vote Cast state, never a cast action', async () => {
    h.getPublicElection.mockResolvedValueOnce(election())
    h.getStatus.mockResolvedValueOnce(status({
      nextAction: 'vote_cast',
      passState: 'used',
      hasVoted: true,
      registered: true,
      eligible: true,
      election: { slug: 'test-slug', lifecycle_state: 'live', registration_open: false, voting_open: true, voting_ended: false, live_results: false },
    }))

    renderConsole()
    await settleStatus()

    // The terminal state must offer results, never Register / Vote Now / Cast.
    expect(screen.getByText('Vote Cast')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull()
    expect(screen.queryByRole('button', { name: /vote now/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /cast/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'View Results' })).toBeTruthy()
  })
})