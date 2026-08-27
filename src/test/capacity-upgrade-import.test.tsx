/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CapacityUpgradeDialog, { type CapacityUpgradeData } from '../org/components/CapacityUpgradeDialog'

// ── Mock API client ──────────────────────────────────────────────────────────
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

// ── Test data ────────────────────────────────────────────────────────────────
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

// ── Tests ────────────────────────────────────────────────────────────────────
describe('CapacityUpgradeDialog — upgrade + import retry', () => {
  beforeEach(() => {
    h.postImpl.mockClear()
  })

  it('calls onRetryImport and shows success before auto-closing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onUpgraded = vi.fn()
    const onRetryImport = vi.fn(async () => { /* import succeeds */ })
    const onClose = vi.fn()

    render(
      <CapacityUpgradeDialog
        open={true}
        onClose={onClose}
        onUpgraded={onUpgraded}
        onRetryImport={onRetryImport}
        electionId="evt-1"
        data={baseData}
      />,
    )

    // Click "Move to Next Tier"
    fireEvent.click(screen.getByText('Move to Next Tier'))

    // Wait for upgrade + import to complete and success state to appear
    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())

    // onRetryImport was called
    expect(onRetryImport).toHaveBeenCalledTimes(1)

    // onUpgraded should NOT have been called yet (waiting for auto-close)
    expect(onUpgraded).not.toHaveBeenCalled()

    // Fast-forward 2 seconds → dialog auto-closes
    act(() => vi.advanceTimersByTime(2000))

    await waitFor(() => expect(onUpgraded).toHaveBeenCalled())
    vi.useRealTimers()
  })

  it('keeps the dialog open during import processing (shows spinner)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Make onRetryImport take some time
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

    // Click upgrade
    fireEvent.click(screen.getByText('Move to Next Tier'))

    // Wait for the processing spinner to appear
    await waitFor(() => expect(screen.getByText('Processing upgrade…')).toBeTruthy())

    // onUpgraded should NOT have been called yet (import still running)
    expect(onUpgraded).not.toHaveBeenCalled()

    // Resolve the import
    act(() => { resolveImport!() })

    // Success state should appear
    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())

    // Still not auto-closed
    expect(onUpgraded).not.toHaveBeenCalled()

    // Fast-forward 2 seconds → dialog auto-closes
    act(() => vi.advanceTimersByTime(2000))

    await waitFor(() => expect(onUpgraded).toHaveBeenCalled())
    vi.useRealTimers()
  })

  it('still closes the dialog if the import retry throws', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
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

    // Click upgrade
    fireEvent.click(screen.getByText('Move to Next Tier'))

    // onRetryImport was called
    await waitFor(() => expect(onRetryImport).toHaveBeenCalled())

    // Success state still appears (tier is upgraded even if import failed)
    await waitFor(() => expect(screen.getByText('Upgrade & import complete')).toBeTruthy())

    // Fast-forward 2 seconds → dialog auto-closes
    act(() => vi.advanceTimersByTime(2000))

    await waitFor(() => expect(onUpgraded).toHaveBeenCalled())
    vi.useRealTimers()
  })
})
