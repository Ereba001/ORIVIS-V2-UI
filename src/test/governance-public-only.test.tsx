/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Governance from '../pages/Governance'
import type { Election } from '../types/election'

const h = vi.hoisted(() => {
  const getPublicElections = vi.fn(async (..._a: any[]): Promise<any[]> => [])
  const getElections = vi.fn(async (..._a: any[]): Promise<any[]> => [])
  return { getPublicElections, getElections }
})

vi.mock('../services/election-service', () => ({
  electionService: {
    getPublicElections: (...a: any[]) => h.getPublicElections(...a),
    getElections: (...a: any[]) => h.getElections(...a),
  },
}))

// Capture poll callbacks without scheduling real intervals.
vi.mock('../hooks/usePolling', () => ({
  usePolling: (_fn: () => void | Promise<void>) => {},
}))

const publicElection = (overrides: Record<string, unknown> = {}): Election => ({
  id: 'pub-1',
  slug: 'student-union-polls',
  title: 'Student Union Polls',
  description: 'A published election',
  type: 'ELECTION',
  status: 'PUBLISHED',
  startsAt: '2090-01-01T00:00:00.000Z',
  endsAt: '2091-01-01T00:00:00.000Z',
  totalRegistered: 12,
  organizationId: 'org-1',
  organizationName: 'Test Org',
  ...overrides,
} as Election)

beforeEach(() => {
  h.getPublicElections.mockClear()
  h.getElections.mockClear()
})

describe('Governance Centre listing', () => {
  it('loads only the public listing, never the org list', async () => {
    h.getPublicElections.mockResolvedValueOnce([publicElection()])

    render(
      <MemoryRouter>
        <Governance />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Student Union Polls')).toBeTruthy()
    })

    expect(h.getPublicElections).toHaveBeenCalled()
    expect(h.getElections).not.toHaveBeenCalled()
  })

  it('renders a published election card', async () => {
    h.getPublicElections.mockResolvedValueOnce([publicElection()])

    render(
      <MemoryRouter>
        <Governance />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Student Union Polls')).toBeTruthy()
    })
    // Type chip + status chip from the published listing.
    expect(screen.getByText('Election')).toBeTruthy()
    expect(screen.getByText('UPCOMING')).toBeTruthy()
  })

  it('surfaces the load error instead of silently showing an empty list', async () => {
    h.getPublicElections.mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <Governance />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Network error')
    })
    expect(h.getElections).not.toHaveBeenCalled()
  })

  it('never renders draft or unpublished elections in the public listing', async () => {
    h.getPublicElections.mockResolvedValueOnce([
      publicElection(),
      publicElection({ id: 'draft-1', slug: 'draft-poll', title: 'Hidden Draft', status: 'DRAFT' }),
      publicElection({ id: 'created-1', slug: 'created-poll', title: 'Hidden Created', status: 'CREATED' }),
      publicElection({ id: 'archived-1', slug: 'old-poll', title: 'Hidden Archived', status: 'ARCHIVED' }),
    ])

    render(
      <MemoryRouter>
        <Governance />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Student Union Polls')).toBeTruthy()
    })

    expect(screen.queryByText('Hidden Draft')).toBeNull()
    expect(screen.queryByText('Hidden Created')).toBeNull()
    expect(screen.queryByText('Hidden Archived')).toBeNull()
  })

  it('clicking a listed election navigates directly to the election landing page', async () => {
    h.getPublicElections.mockResolvedValueOnce([publicElection()])

    render(
      <MemoryRouter initialEntries={['/governance']}>
        <Routes>
          <Route
            path="/governance"
            element={<Governance />}
          />
          <Route
            path="/elections/:slug"
            element={<div>LANDING student-union-polls</div>}
          />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /view|participate/i }))

    expect(await screen.findByText('LANDING student-union-polls')).toBeTruthy()
    // No membership gate modal should appear
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Are you a member of this organization?' })).toBeNull()
  })
})
