import type { ReactNode } from 'react'
import { useOrgPermissions } from '../../../contexts/OrgPermissionsContext'

interface OrgPermissionGateProps {
  permissions: string | string[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
}

export default function OrgPermissionGate({ permissions, requireAll = false, children, fallback = null }: OrgPermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions, permissionsError } = useOrgPermissions()
  const perms = Array.isArray(permissions) ? permissions : [permissions]

  // A transient permissions failure must never masquerade as "no permission":
  // surface it instead of silently hiding every gated action.
  if (permissionsError) {
    return (
      <div className="rounded-lg border border-brand-border bg-brand-surface p-4 text-sm text-brand-text-muted">
        Your permissions could not be loaded. Check your connection and try again.
      </div>
    )
  }

  const allowed = requireAll ? hasAllPermissions(...perms) : hasAnyPermission(...perms)
  return allowed ? <>{children}</> : <>{fallback}</>
}
