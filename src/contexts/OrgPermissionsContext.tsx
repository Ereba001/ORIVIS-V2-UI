import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getApiClient, unwrapPayload } from '../lib/api-client'
import { API } from '../constants/api'
import { useAuth } from '../hooks/useAuth'

interface OrgMemberPermissions {
  permissions: string[]
  role: { slug: string; name: string; is_system: boolean } | null
  organization: { id: string; name: string } | null
}

interface OrgPermissionsContextValue {
  permissions: string[]
  role: OrgMemberPermissions['role']
  organization: OrgMemberPermissions['organization']
  loading: boolean
  permissionsLoaded: boolean
  permissionsError: boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
  hasAllPermissions: (...permissions: string[]) => boolean
  refresh: () => Promise<void>
}

const OrgPermissionsContext = createContext<OrgPermissionsContextValue | null>(null)

export function OrgPermissionsProvider({ children }: { children: ReactNode }) {
  const { user, isImpersonating, impersonatedOrgId, activeOrganization } = useAuth()
  const [data, setData] = useState<OrgMemberPermissions>({ permissions: [], role: null, organization: null })
  const [loading, setLoading] = useState(true)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [permissionsError, setPermissionsError] = useState(false)

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setData({ permissions: [], role: null, organization: null })
      setLoading(false)
      setPermissionsLoaded(true)
      return
    }

    try {
      setLoading(true)
      setPermissionsError(false)
      const { data } = await getApiClient().get(API.ENDPOINTS.ORG.ME_PERMISSIONS)
      const payload = unwrapPayload<OrgMemberPermissions>(data)
      setData({
        permissions: payload?.permissions ?? [],
        role: payload?.role ?? null,
        organization: payload?.organization ?? null,
      })
      setPermissionsLoaded(true)
    } catch (err) {
      console.error('OrgPermissions.fetchPermissions:', err)
      // Never silently render empty permissions: surface the error so the UI
      // shows a retry state instead of hiding every permission-gated action.
      setPermissionsError(true)
      setData({ permissions: [], role: null, organization: null })
      setPermissionsLoaded(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Re-fetch whenever the authenticated user changes (login, logout, impersonation)
  // so permissions from a previous identity never leak into the new session.
  const scope = user ? `${user.id}:${isImpersonating ? impersonatedOrgId : ''}:${activeOrganization?.organizationId ?? ''}` : ''

  useEffect(() => {
    void fetchPermissions()
  }, [fetchPermissions, scope])

  const hasPermission = useCallback(
    (permission: string) => data.permissions.includes(permission),
    [data.permissions],
  )

  const hasAnyPermission = useCallback(
    (...permissions: string[]) => permissions.some((p) => data.permissions.includes(p)),
    [data.permissions],
  )

  const hasAllPermissions = useCallback(
    (...permissions: string[]) => permissions.every((p) => data.permissions.includes(p)),
    [data.permissions],
  )

  return (
    <OrgPermissionsContext.Provider
      value={{
        permissions: data.permissions,
        role: data.role,
        organization: data.organization,
        loading,
        permissionsLoaded,
        permissionsError,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refresh: fetchPermissions,
      }}
    >
      {children}
    </OrgPermissionsContext.Provider>
  )
}

export function useOrgPermissions() {
  const context = useContext(OrgPermissionsContext)
  if (!context) {
    throw new Error('useOrgPermissions must be used within OrgPermissionsProvider')
  }
  return context
}
