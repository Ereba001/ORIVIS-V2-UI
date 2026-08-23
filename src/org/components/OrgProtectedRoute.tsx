import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingOverlay from '../../components/LoadingOverlay'

export default function OrgProtectedRoute() {
  const { isAuthenticated, isLoading, user, isImpersonating, memberships } = useAuth()

  if (isLoading) {
    return <LoadingOverlay showLogo={false} messages={['Loading your session...']} />
  }
  if (!isAuthenticated) return <Navigate to="/org/signin" replace />

  if (user?.isPlatformStaff && !isImpersonating && (memberships ?? []).length === 0) {
    return <Navigate to="/platform" replace />
  }

  return <Outlet />
}
