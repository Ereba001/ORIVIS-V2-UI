import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { getApiClient } from '../lib/api-client'
import { API } from '../constants/api'
import { useAuth } from '../hooks/useAuth'

interface PermissionBreakdown {
  role_permissions: string[]
  granted: string[]
  revoked: string[]
}

interface StaffPermissions {
  permissions: string[]
  role: { id: string; name: string; slug: string; is_system: boolean } | null
  staff: { id: string; name: string; email: string; department: string | null } | null
  permissionBreakdown: PermissionBreakdown | null
}

interface PlatformPermissionsContextValue {
  permissions: string[]
  role: StaffPermissions['role']
  staff: StaffPermissions['staff']
  permissionBreakdown: PermissionBreakdown | null
  loading: boolean
  permissionsLoaded: boolean
  error: string | null
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
  hasAllPermissions: (...permissions: string[]) => boolean
  isFounder: boolean
  refresh: () => Promise<void>
}

const PlatformPermissionsContext = createContext<PlatformPermissionsContextValue | null>(null)

export function PlatformPermissionsProvider({ children }: { children: ReactNode }) {
  const { user, isImpersonating, impersonatedOrgId } = useAuth()
  const [data, setData] = useState<StaffPermissions>({ permissions: [], role: null, staff: null, permissionBreakdown: null })
  const [loading, setLoading] = useState(true)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestSeq = useRef(0)

  const fetchPermissions = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await getApiClient().get(API.ENDPOINTS.PLATFORM.ME_PERMISSIONS)
      if (seq !== requestSeq.current) return // stale response
      setData({
        permissions: response?.permissions ?? [],
        role: response?.role ?? null,
        staff: response?.staff ?? null,
        permissionBreakdown: response?.permissionBreakdown ?? null,
      })
      setPermissionsLoaded(true)
    } catch (err) {
      console.error('PlatformPermissions.fetchPermissions:', err)
      if (seq !== requestSeq.current) return
      setPermissionsLoaded(false)
      setError('Could not load your platform permissions. Check your connection and try again.')
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [user, isImpersonating, impersonatedOrgId])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

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

  const isFounder = data.role?.slug === 'founder' || data.role?.slug === 'super_admin'

  return (
    <PlatformPermissionsContext.Provider
      value={{
        permissions: data.permissions,
        role: data.role,
        staff: data.staff,
        permissionBreakdown: data.permissionBreakdown,
        loading,
        permissionsLoaded,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isFounder,
        refresh: fetchPermissions,
      }}
    >
      {children}
    </PlatformPermissionsContext.Provider>
  )
}

export function usePlatformPermissions() {
  const context = useContext(PlatformPermissionsContext)
  if (!context) {
    throw new Error('usePlatformPermissions must be used within PlatformPermissionsProvider')
  }
  return context
}
