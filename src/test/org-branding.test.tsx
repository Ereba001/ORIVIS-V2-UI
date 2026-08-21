import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrgBrandingProvider, useOrgBranding, readBrandingCache, writeBrandingCache } from '../org/contexts/OrgBrandingContext'

const h = vi.hoisted(() => {
  const auth = {
    user: { id: 'u1', displayName: 'Admin', email: 'admin@acme.com' },
    activeOrganization: { organizationId: 'org-1', name: 'Acme Corp', role: 'owner' },
  }
  const responders = {
    branding: async () => ({ data: { data: {} } }),
    organization: async () => ({ data: { data: {} } }),
  }
  return { auth, responders }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => h.auth,
}))

vi.mock('../lib/api-client', () => ({
  getApiClient: () => ({
    get: (url: string) => {
      if (/branding/i.test(url)) return h.responders.branding()
      return h.responders.organization()
    },
  }),
  unwrapPayload: (body: unknown) =>
    body && typeof body === 'object' && !Array.isArray(body) && 'data' in body
      ? (body as { data: unknown }).data
      : body,
}))

function Harness() {
  const { branding, status, isLoaded, retry } = useOrgBranding()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="org-name">{branding.organizationName}</span>
      <button data-testid="retry" onClick={retry}>Retry</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <OrgBrandingProvider>
      <Harness />
    </OrgBrandingProvider>
  )
}

const BRANDING_BODY = (overrides: Record<string, unknown> = {}) => ({
  data: {
    data: {
      organizationName: 'Acme Corp',
      shortName: 'ACME',
      workspaceName: 'Acme Workspace',
      primaryColor: '#123456',
      secondaryColor: '#654321',
      accentColor: '#abcdef',
      updatedAt: '2026-08-11T00:00:00Z',
      ...overrides,
    },
  },
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  h.auth.activeOrganization = { organizationId: 'org-1', name: 'Acme Corp', role: 'owner' }
  h.responders.branding = async () => BRANDING_BODY()
  h.responders.organization = async () => ({ data: { data: { organizationType: 'COMPANY' } } })
})

describe('OrgBrandingProvider hydration', () => {
  it('first visit (no cache): loading -> ready and registers a versioned cache entry', async () => {
    renderProvider()

    expect(screen.getByTestId('status').textContent).toBe('loading')
    expect(screen.getByTestId('loaded').textContent).toBe('false')

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('loaded').textContent).toBe('true')
    expect(screen.getByTestId('org-name').textContent).toBe('Acme Corp')

    const entry = readBrandingCache('org-1')
    expect(entry?.organizationId).toBe('org-1')
    expect(entry?.version).toBe('2026-08-11T00:00:00Z')
    expect(entry?.branding.organizationName).toBe('Acme Corp')
  })

  it('valid cache: cached immediately, never shows loading, no re-fetch churn', async () => {
    let brandingCalls = 0
    h.responders.branding = async () => {
      brandingCalls += 1
      return BRANDING_BODY()
    }
    writeBrandingCache('org-1', { organizationName: 'Acme Corp', shortName: 'ACME', primaryColor: '#123456' }, { version: '2026-08-11T00:00:00Z' })

    renderProvider()

    expect(screen.getByTestId('status').textContent).toBe('cached')
    expect(screen.getByTestId('loaded').textContent).toBe('true')
    expect(screen.getByTestId('org-name').textContent).toBe('Acme Corp')

    await waitFor(() => expect(brandingCalls).toBe(1))
    expect(screen.getByTestId('status').textContent).toBe('cached')
  })

  it('different organization uses its own cache key and does not leak cached branding', async () => {
    writeBrandingCache('org-1', { organizationName: 'Org One', shortName: 'O1' }, { version: '2026-08-01T00:00:00Z' })
    h.responders.branding = async () => BRANDING_BODY({ organizationName: 'Org Two', shortName: 'O2', updatedAt: '2026-08-11T00:00:00Z' })
    h.auth.activeOrganization = { organizationId: 'org-2', name: 'Org Two', role: 'owner' }

    renderProvider()

    expect(screen.getByTestId('status').textContent).toBe('loading')

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('org-name').textContent).toBe('Org Two')

    const orgOne = readBrandingCache('org-1')
    expect(orgOne?.branding.organizationName).toBe('Org One')
    expect(orgOne?.version).toBe('2026-08-01T00:00:00Z')
  })

  it('stale cache: stays cached without a spinner while silently refreshing the registered branding', async () => {
    writeBrandingCache('org-1', { organizationName: 'Old Name', shortName: 'OLD' }, { version: '2026-08-01T00:00:00Z' })
    h.responders.branding = async () => BRANDING_BODY({ organizationName: 'Refreshed Org', shortName: 'NEW', updatedAt: '2026-08-11T00:00:00Z' })

    renderProvider()

    expect(screen.getByTestId('status').textContent).toBe('cached')
    expect(screen.getByTestId('org-name').textContent).toBe('Old Name')

    await waitFor(() => {
      const entry = readBrandingCache('org-1')
      expect(entry?.version).toBe('2026-08-11T00:00:00Z')
      expect(entry?.branding.organizationName).toBe('Refreshed Org')
    })
    expect(screen.getByTestId('status').textContent).toBe('cached')
    expect(screen.getByTestId('org-name').textContent).toBe('Refreshed Org')
  })

  it('API failure with no cache: shows error state (loaded with defaults) and retry recovers to ready', async () => {
    h.responders.branding = async () => {
      throw new Error('network down')
    }

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'))
    // The org shell must never be stuck on the "Setting up your dashboard…"
    // overlay: a failed branding fetch resolves as loaded with default branding.
    expect(screen.getByTestId('loaded').textContent).toBe('true')
    expect(screen.getByTestId('org-name').textContent).toBe('Organization')

    h.responders.branding = async () => BRANDING_BODY()
    fireEvent.click(screen.getByTestId('retry'))

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('loaded').textContent).toBe('true')
    expect(readBrandingCache('org-1')?.branding.organizationName).toBe('Acme Corp')
  })

  it('legacy raw cache (previous version) is adopted and re-versioned on refresh', async () => {
    localStorage.setItem('orivis:org-branding:org-1', JSON.stringify({ organizationName: 'Legacy Org', shortName: 'LGO' }))
    h.responders.branding = async () => BRANDING_BODY({ updatedAt: '2026-08-11T00:00:00Z' })

    renderProvider()

    expect(screen.getByTestId('status').textContent).toBe('cached')
    expect(screen.getByTestId('org-name').textContent).toBe('Legacy Org')

    await waitFor(() => expect(readBrandingCache('org-1')?.version).toBe('2026-08-11T00:00:00Z'))
    expect(screen.getByTestId('status').textContent).toBe('cached')
  })
})
