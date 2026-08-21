import type { ReactNode } from 'react'
import { usePlatformPermissions } from '../../contexts/PlatformPermissionsContext'

interface PermissionGateProps {
  permissions: string | string[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export default function PermissionGate({ permissions, requireAll = false, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = usePlatformPermissions()
  const perms = Array.isArray(permissions) ? permissions : [permissions]
  const allowed = requireAll ? perms.every((p) => hasPermission(p)) : hasAnyPermission(...perms)
  return allowed ? <>{children}</> : <>{fallback}</>
}
