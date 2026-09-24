import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const TITLES = [
  [/^\/admin\/issuers/, 'Issuer management'],
  [/^\/admin\/audit/, 'Audit activity'],
  [/^\/admin/, 'Registry overview'],
  [/^\/issuer\/issue/, 'Issue credential'],
  [/^\/issuer\/credentials/, 'Issued credentials'],
  [/^\/issuer/, 'Issuer overview'],
  [/^\/holder\/requests/, 'Verification requests'],
  [/^\/holder/, 'My credentials'],
  [/^\/verifier\/request$/, 'New verification request'],
  [/^\/verifier\/requests/, 'Verification requests'],
  [/^\/verifier/, 'Verifier overview'],
  [/^\/credentials\//, 'Credential detail'],
  [/^\/verification\//, 'Verification result'],
];

export default function DashboardLayout() {
  const { role, mockMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] || 'DecentraID';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Persistent sidebar from lg upward */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar role={role} mockMode={mockMode} />
        </div>
      </aside>

      {/* Drawer below lg */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-72 max-w-[80vw]">
            <Sidebar role={role} mockMode={mockMode} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Navbar title={title} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
