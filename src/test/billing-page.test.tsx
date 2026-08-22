import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OrgBilling from '../org/pages/Billing'

const overview = {
  summary: {
    total_billed: 25000,
    total_paid: 0,
    pending_amount: 25000,
    total_events: 1,
    paid_events: 0,
    free_events: 0,
    pending_events: 1,
    currency: 'NGN',
  },
  events: [{
    uuid: 'billing-1',
    election_id: 42,
    election_title: 'Board Election',
    status: 'payment_required',
    participant_count: 250,
    amount: 25000,
    paid_amount: 0,
    currency: 'NGN',
    tier_name: '250 Participants',
    is_free: false,
    created_at: '2026-08-20T12:00:00Z',
  }],
}

vi.mock('../hooks/useApiResource', () => ({
  useApiResource: (fetcher: () => Promise<unknown>) => ({
    data: fetcher.toString().includes('getOverview') ? overview : { items: [], meta: null },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../org/contexts/OrgBrandingContext', () => ({
  useOrgBranding: () => ({ branding: { primaryColor: '#123456' } }),
}))

describe('organization billing page', () => {
  it('links each event billing record to its real event workflow', () => {
    render(<MemoryRouter><OrgBilling /></MemoryRouter>)

    expect(screen.getAllByRole('link', { name: /view event/i })[0]).toHaveAttribute('href', '/org/events/42')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /view receipt/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
  })
})
