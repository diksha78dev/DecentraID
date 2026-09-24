import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

/**
 * Restricts a branch of the route tree to specific roles. A signed-in user who
 * lands somewhere they should not be is redirected to their own dashboard
 * rather than shown an error.
 */
export default function RoleRoute({ allow = [] }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
  return <Outlet />;
}
