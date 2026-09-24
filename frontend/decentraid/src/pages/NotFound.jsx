import { Link } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

export default function NotFound() {
  const { role, isAuthenticated } = useAuth();
  const home = isAuthenticated ? ROLE_HOME[role] || '/' : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo tone="dark" size={34} />
      <p className="mt-10 text-5xl font-semibold tracking-tight text-ink">404</p>
      <h1 className="mt-3 text-lg font-medium text-ink">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        The link may be out of date, or the record may have been removed.
      </p>
      <Link to={home} className="mt-7">
        <Button>{isAuthenticated ? 'Back to dashboard' : 'Go to sign in'}</Button>
      </Link>
    </div>
  );
}
