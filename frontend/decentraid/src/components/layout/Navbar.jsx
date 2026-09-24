import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

const ROLE_LABEL = {
  ADMIN: 'Registry administrator',
  ISSUER: 'Issuing organisation',
  HOLDER: 'Credential holder',
  VERIFIER: 'Verifying organisation',
};

export default function Navbar({ onOpenSidebar, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="-ml-1 rounded-md p-2 text-ink-muted hover:bg-canvas lg:hidden"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <p className="truncate text-sm font-medium text-ink lg:text-base">{title}</p>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:block">
          <WalletConnectButton />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-canvas"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-seal-600 text-xs font-semibold text-white">
              {initials(user?.name || '')}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user?.name}</span>
              <span className="block text-xs leading-tight text-ink-soft">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </span>
            <svg width="12" height="12" viewBox="0 0 12 8" fill="none" aria-hidden="true">
              <path d="M1 1.5 6 6.5l5-5" stroke="#6B7684" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-white shadow-pop"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                {user?.organization ? (
                  <p className="mt-1 truncate text-xs text-ink-soft">{user.organization}</p>
                ) : null}
              </div>
              <div className="p-1.5 sm:hidden">
                <div className="px-2 py-2">
                  <WalletConnectButton compact />
                </div>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  className="w-full rounded px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
