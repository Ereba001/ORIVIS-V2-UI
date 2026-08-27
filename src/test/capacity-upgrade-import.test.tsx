/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CapacityUpgradeDialog, { type CapacityUpgradeData } from '../org/components/CapacityUpgradeDialog'

const h = vi.hoisted(() => {
  const postImpl = vi.fn(async (url: string) => {
    if (url.includes('/billing/capacity-consent')) return { data: { data: null } }
    if (url.includes('/billing/upgrade')) return { data: { data: { billing: {}, capacity: {} } } }
    if (url.includes('/billing/pay')) return { data: { data: { authorizationUrl: null } } }
    return { data: { data: {} } }
  })
  return { postImpl }
})

vi.mock('../lib/api-client', () => ({
  getApiClient: () => ({ get: vi.fn(), post: h.postImpl, put: vi.fn(), delete: vi.fn() }),
  unwrapPayload: (body: any) =>
    body && typeof body === 'object' && !Array.isArray(body) && 'data' in body
      ? body.data
      : body,
}))

vi.mock('../services/billing-service', () => ({
  billingService: {
    recordCapacityConsent: vi.fn(async () => { h.postImpl('/billing/capacity-consent'); }),
    upgradeCapacity: vi.fn(async () => { h.postImpl('/billing/upgrade'); }),
    initializePayment: vi.fn(async () => { const r = await h.postImpl('/billing/pay'); return r.data; }),
  },
}))

const baseData: CapacityUpgradeData = {
  ceiling: 100,
  current_participants: 50,
  incoming: 200,
  projected_participants: 250,
  excess: 150,
  currency: 'NGN',
  required_tier: { name: 'Medium', max_participants: 500, price: 25000 },
  additional_amount: 0,
  is_free: true,
  upgrade_possible: true,
}

describe('CapacityUpgradeDialog — upgrade + import retry', () => {
  beforeEach(() => {
    h.postImpl.mockClear()
  })

  it('calls onRetryImport and shows success before calling onUpgraded', async () => {
    const onUpgraded = vi.fn()
    const onRetryImport = vi.fn(async () => { /* success */ })

    render(
      <CapacityUpgradeDialog
        open={true}
        onClose={vi.fn()}
        onUpgraded={onUpgraded}
        onRetryImport={onRetryImport}
        electionId="evt-1"
        data={baseData}
      />,
    )

    fireEvent.click(screen.getByText('Move to Next Tier'))

    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())
    expect(onRetryImport).toHaveBeenCalledTimes(1)
    expect(onUpgraded).not.toHaveBeenCalled()
  })

  it('keeps the dialog open during import processing (shows spinner)', async () => {
    let resolveImport: () => void
    const importPromise = new Promise<void>((resolve) => { resolveImport = resolve })
    const onRetryImport = vi.fn(async () => { await importPromise })
    const onUpgraded = vi.fn()

    render(
      <CapacityUpgradeDialog
        open={true}
        onClose={vi.fn()}
        onUpgraded={onUpgraded}
        onRetryImport={onRetryImport}
        electionId="evt-1"
        data={baseData}
      />,
    )

    fireEvent.click(screen.getByText('Move to Next Tier'))

    await waitFor(() => expect(screen.getByText('Processing upgrade…')).toBeTruthy())
    expect(onUpgraded).not.toHaveBeenCalled()

    await act(async () => { resolveImport!() })

    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())
    expect(onUpgraded).not.toHaveBeenCalled()
  })

  it('still surfaces success if the import retry throws', async () => {
    const onRetryImport = vi.fn(async () => {
      throw new Error('Network error during import')
    })
    const onUpgraded = vi.fn()

    render(
      <CapacityUpgradeDialog
        open={true}
        onClose={vi.fn()}
        onUpgraded={onUpgraded}
        onRetryImport={onRetryImport}
        electionId="evt-1"
        data={baseData}
      />,
    )

    fireEvent.click(screen.getByText('Move to Next Tier'))

    await waitFor(() => expect(onRetryImport).toHaveBeenCalled())
    // Even on import failure, the dialog shows success (tier is upgraded)
    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())
    expect(onUpgraded).not.toHaveBeenCalled()
  })
})
