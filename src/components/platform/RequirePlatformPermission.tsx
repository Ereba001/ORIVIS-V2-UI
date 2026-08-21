import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePlatformPermissions } from '../../contexts/PlatformPermissionsContext'
import LoadingOverlay from '../LoadingOverlay'

interface Props {
  permission: string | string[]
  children: ReactNode
}

export default function RequirePlatformPermission({ permission, children }: Props) {
  const { hasPermission, hasAnyPermission, permissionsLoaded, error, refresh } = usePlatformPermissions()

  if (error && !permissionsLoaded) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-sm font-semibold text-brand-text-primary">Unable to load permissions</div>
        <p className="max-w-sm text-xs text-brand-text-muted">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-gold, #FCA311)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!permissionsLoaded) {
    return <LoadingOverlay messages={['Checking permissions...']} />
  }

  const allowed = Array.isArray(permission) ? hasAnyPermission(...permission) : hasPermission(permission)

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}