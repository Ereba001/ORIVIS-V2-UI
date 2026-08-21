import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OrgDashboard from '../org/pages/Dashboard'
import OrgTemplates from '../org/pages/Templates'
import OrgReports from '../org/pages/Reports'
import OrgArchiveCentre from '../org/pages/ArchiveCentre'
import OrgAuditLogs from '../org/pages/AuditLogs'

let mockResource: { data: unknown; loading: boolean; error: string | null; reload: () => void } = {
  data: null,
  loading: true,
  error: null,
  reload: () => {},
}

vi.mock('../hooks/useApiResource', () => ({
  useApiResource: () => mockResource,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    activeOrganization: {
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      shortName: 'TO',
      status: 'active',
    },
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  AuthContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
  useAuthContext: () => ({
    activeOrganization: {
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      shortName: 'TO',
      status: 'active',
    },
  }),
}))

vi.mock('../org/contexts/OrgBrandingContext', () => ({
  useOrgBranding: () => ({
    branding: {
      organizationName: 'Test Org',
      workspaceName: 'Test Org Workspace',
      shortName: 'TO',
      logoUrl: null,
      faviconUrl: null,
      primaryColor: '#000000',
      secondaryColor: '#333333',
      accentColor: '#4F46E5',
      browserTitle: 'Test Org',
      workspaceTitle: 'Test Org',
      tagline: 'Test tagline',
      eventPackage: 'Pro',
      organizationType: 'UNIVERSITY',
    },
  }),
}))

const dashboardData = {
  stats: [],
  elections: [],
  notifications: [],
  activity: [],
  team: [],
  subscription: { plan: 'Pro', status: 'active', seatsUsed: 1, seatsTotal: 5, nextBilling: '2026-01-01', amount: 9900, currency: 'USD' },
  storage: { used: 0.5, total: 5, unit: 'GB' },
  health: {
    subscriptionStatus: 'active', storageUsed: 0.5, storageTotal: 5, activeEvents: 0, completedEvents: 0,
    pendingTasks: 0, notificationStatus: 'all_sent', workspaceScore: 95, systemMessages: [],
  },
  pendingTasks: [],
  eligibility: [],
}

const templateItem = {
  id: 't1',
  name: 'Annual Election',
  description: 'Annual board election',
  type: 'governance_election',
  category: 'organization',
  configuration: {
    title: 'Annual Election', description: '', timezone: 'UTC', visibility: 'private',
    branding: { primaryColor: '#000000', accentColor: '#000000', theme: 'light' }, settings: {},
  },
  createdAt: '2026-01-01T00:00:00Z',
  usedCount: 3,
}

const reportsData = {
  summary: { elections: { total: 1, live: 0, completed: 0 }, participation: { voters: 0, votes: 0, turnout_pct: 0 }, candidates: 0 },
  reports: [{ key: 'elections', label: 'Election Summary', description: 'Summary of elections' }],
}

const archiveItem = {
  id: 'a1',
  eventId: 'a1',
  eventTitle: 'Annual Election',
  archivedAt: '2026-01-01T00:00:00Z',
  reason: 'completed',
  archiveHistory: [{ action: 'Archived', timestamp: '2026-01-01T00:00:00Z', user: 'System' }],
  canRestore: true,
  retentionPeriod: '1 year',
}

const auditItem = {
  id: 'aud1',
  user: 'Jane Doe',
  avatarUrl: null,
  action: 'Updated workspace settings',
  module: 'Settings',
  timestamp: '2026-01-01T00:00:00Z',
  severity: 'info',
  ipAddress: '127.0.0.1',
}

function mountAndLoad(Component: React.ComponentType, data: unknown, loadedMarker: string) {
  mockResource = { data: null, loading: true, error: null, reload: () => {} }
  const utils = render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  )
  expect(screen.queryByText(loadedMarker)).not.toBeInTheDocument()

  mockResource = { data, loading: false, error: null, reload: () => {} }
  utils.rerender(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  )
  expect(screen.getByText(loadedMarker)).toBeInTheDocument()
  utils.unmount()
}

describe('org pages render through the loading -> loaded transition without a Hooks-order violation', () => {
  it('OrgDashboard', () => {
    mountAndLoad(OrgDashboard, dashboardData, 'Workspace Activity')
  })

  it('OrgTemplates', () => {
    mountAndLoad(OrgTemplates, [templateItem], 'Event Templates')
  })

  it('OrgReports', () => {
    mountAndLoad(OrgReports, reportsData, 'Reports Center')
  })

  it('OrgArchiveCentre', () => {
    mountAndLoad(OrgArchiveCentre, [archiveItem], 'Archive Centre')
  })

  it('OrgAuditLogs', () => {
    mountAndLoad(OrgAuditLogs, [auditItem], 'Audit Log')
  })
})
