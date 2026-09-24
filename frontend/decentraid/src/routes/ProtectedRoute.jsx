import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Requires a session before rendering child routes.
 *
 * This is user experience only — it stops someone wandering into a screen they
 * have no data for. Real authorization is enforced by the Spring Boot API on
 * every request, and the mock API applies the same rules so the failure paths
 * are exercised here too.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={28} label="Restoring your session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
