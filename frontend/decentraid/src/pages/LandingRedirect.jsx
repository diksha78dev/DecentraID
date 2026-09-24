import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

/** Sends an authenticated user to the dashboard that belongs to their role. */
export default function LandingRedirect() {
  const { role } = useAuth();
  return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
}
