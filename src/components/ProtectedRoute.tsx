import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingOverlay from './LoadingOverlay';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay messages={['Loading your session...']} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/platformsignin" replace />;
  }

  if (!user?.isPlatformStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
