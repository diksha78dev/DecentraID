import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { cn } from '../../utils/cn';
import { ROLES } from '../../utils/constants';

/** Navigation is derived from the role returned by the backend. */
const NAV = {
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Overview', end: true, icon: 'grid' },
    { to: '/admin/issuers', label: 'Issuers', icon: 'building' },
    { to: '/admin/audit', label: 'Audit activity', icon: 'list' },
  ],
  [ROLES.ISSUER]: [
    { to: '/issuer', label: 'Overview', end: true, icon: 'grid' },
    { to: '/issuer/issue', label: 'Issue credential', icon: 'plus' },
    { to: '/issuer/credentials', label: 'Issued credentials', icon: 'list' },
  ],
  [ROLES.HOLDER]: [
    { to: '/holder', label: 'My credentials', end: true, icon: 'grid' },
    { to: '/holder/requests', label: 'Verification requests', icon: 'inbox' },
  ],
  [ROLES.VERIFIER]: [
    { to: '/verifier', label: 'Overview', end: true, icon: 'grid' },
    { to: '/verifier/request', label: 'New request', icon: 'plus' },
    { to: '/verifier/requests', label: 'My requests', icon: 'list' },
  ],
};

const ICONS = {
  grid: <path d="M4 4h6v6H4V4Zm0 10h6v6H4v-6Zm10-10h6v6h-6V4Zm0 10h6v6h-6v-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  building: <path d="M5 20V6l7-3 7 3v14M9 20v-4h6v4M9 9h2m4 0h-2m2 3h-2m-2 0H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  list: <path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  inbox: <path d="M4 13h4l1.5 3h5L16 13h4M4 13l2-7h12l2 7v6H4v-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
};

export default function Sidebar({ role, onNavigate, mockMode }) {
  const items = NAV[role] || [];

  return (
    <div className="flex h-full flex-col bg-shell text-white">
      <div className="flex h-16 items-center border-b border-shell-line px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-seal-600 font-medium text-white'
                  : 'text-white/70 hover:bg-shell-hover hover:text-white',
              )
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {ICONS[item.icon]}
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-shell-line px-5 py-4">
        <p className="text-xs leading-relaxed text-white/45">
          Blockchain-backed credential verification prototype.
        </p>
        {mockMode ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded border border-white/15 px-2 py-1 text-2xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-brass-500" />
            Mock data · no backend connected
          </p>
        ) : null}
      </div>
    </div>
  );
}
