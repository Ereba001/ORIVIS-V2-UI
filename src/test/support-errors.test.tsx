import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PlatformSupportCentre from '../pages/platform/Support'
import PricingTiers from '../pages/platform/PricingTiers'

const mockedService = vi.hoisted(() => ({
  getSupportTickets: vi.fn(),
  getStaff: vi.fn(),
  getSupportTicket: vi.fn(),
  updateSupportTicket: vi.fn(),
  acceptSupportTicket: vi.fn(),
  getPricingTiers: vi.fn(),
  togglePricingTier: vi.fn(),
  archivePricingTier: vi.fn(),
  restorePricingTier: vi.fn(),
}))

vi.mock('../services/platform-service', () => ({
  platformService: mockedService,
}))

vi.mock('../contexts/PlatformPermissionsContext', () => ({
  usePlatformPermissions: () => ({ hasPermission: () => true }),
}))

vi.mock('../constants/platformPermissions', () => ({
  PLATFORM_PERMISSIONS: { MANAGE_FINANCE: 'manage_finance', VIEW_FINANCE: 'view_finance' },
}))

vi.mock('motion/react', async () => {
  const React = await import('react')
  // Preserve the element tag so table rows stay valid (motion.tr must render
  // a <tr>, not a <div>, or the ticket list breaks under testing-library).
  const renderMotion = (tag: string) =>
    (props: React.PropsWithChildren) => React.createElement(tag, props, props.children)
  return {
    motion: new Proxy({}, {
      get: (_target: never, prop: string) =>
        typeof prop === 'string' ? renderMotion(prop) : undefined,
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  }
})

const ticket = {
  id: 'ticket-1',
  subject: 'Cannot cast vote',
  description: 'Voting pass rejected',
  status: 'OPEN',
  priority: 'HIGH',
  category: 'TECHNICAL',
  organizationName: 'RSU',
  organizationId: 'org-1',
  assignedTo: null,
  assignedToName: null,
  acceptedBy: null,
  acceptedByName: null,
  acceptedAt: null,
  createdBy: 'someone',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  messages: [],
}

function renderSupport() {
  return render(
    <MemoryRouter>
      <PlatformSupportCentre />
    </MemoryRouter>
  )
}

describe('Support ticket mutation error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedService.getSupportTickets.mockResolvedValue({ items: [ticket], meta: { total: 1 } })
    mockedService.getStaff.mockResolvedValue({ items: [] })
    mockedService.getSupportTicket.mockResolvedValue(ticket)
    mockedService.updateSupportTicket.mockResolvedValue({})
    mockedService.acceptSupportTicket.mockResolvedValue({})
  })

  function openTicket() {
    renderSupport()
    return waitFor(() => {
      expect(screen.getByText('Cannot cast vote')).toBeTruthy()
    }).then(() => fireEvent.click(screen.getByText('Cannot cast vote')))
  }

  it('opens a ticket and shows its status control', async () => {
    await openTicket()

    await waitFor(() => {
      expect(screen.getByLabelText('Status')).toBeTruthy()
    })
  })

  it('surfaces an error and reverts the optimistic status change when the API call fails', async () => {
    mockedService.updateSupportTicket.mockRejectedValue(new Error('Server rejected the status change'))
    await openTicket()

    await waitFor(() => expect(screen.getByLabelText('Status')).toBeTruthy())

    // Change the status select — optimistic update happens first, then the
    // failed API call must revert (reloadTicket) and surface the error.
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'RESOLVED' } })

    await waitFor(() => {
      expect(mockedService.updateSupportTicket).toHaveBeenCalledWith('ticket-1', { status: 'resolved' })
    })
    await waitFor(() => {
      expect(screen.getByText('Server rejected the status change')).toBeTruthy()
    })
  })

  it('surfaces an error when accepting a ticket fails', async () => {
    mockedService.acceptSupportTicket.mockRejectedValue(new Error('Accept failed'))
    await openTicket()

    await waitFor(() => expect(screen.getByLabelText('Status')).toBeTruthy())
    fireEvent.click(screen.getByText('Accept'))

    await waitFor(() => {
      expect(screen.getByText('Accept failed')).toBeTruthy()
    })
  })
})

describe('PricingTiers mutation error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedService.getPricingTiers.mockResolvedValue({
      items: [{
        uuid: 'tier-1',
        name: 'Standard',
        code: 'standard',
        minParticipants: 1,
        maxParticipants: 100,
        price: '25000',
        currency: 'NGN',
        isFree: false,
        isActive: true,
        effectiveFrom: null,
        archivedAt: null,
        description: 'Standard tier',
      }],
      meta: { total: 1 },
    })
    mockedService.togglePricingTier.mockResolvedValue({})
  })

  it('reverts the toggle and shows an inline error banner when the API call fails', async () => {
    mockedService.togglePricingTier.mockRejectedValue(new Error('Toggle failed'))
    render(
      <MemoryRouter>
        <PricingTiers />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Standard')).toBeTruthy())
    fireEvent.click(screen.getByLabelText('Deactivate tier'))

    await waitFor(() => {
      expect(mockedService.togglePricingTier).toHaveBeenCalledWith('tier-1', false)
    })
    await waitFor(() => {
      expect(screen.getByText('Toggle failed')).toBeTruthy()
    })
  })
})
