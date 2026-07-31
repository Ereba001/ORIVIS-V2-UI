import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingOverlay from './LoadingOverlay';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay messages={['Loading your session...']} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/platformsignin" replace />;
  }

  return <Outlet />;
}
