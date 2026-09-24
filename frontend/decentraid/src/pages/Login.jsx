import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import { Input } from '../components/common/Input';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { ROLE_HOME, CONFIG } from '../utils/constants';
import { shortenHex } from '../utils/format';
import { resetDb } from '../services/mock/mockDb';

/**
 * Demo accounts shown only in mock mode.
 *
 * Choosing one fills the form and submits it through the same login endpoint
 * as any other sign-in. The role still arrives from the server response — the
 * selection is a convenience for demonstration, never an authorization path.
 */
const DEMO_ACCOUNTS = [
  { email: 'admin@decentraid.local', label: 'Administrator', detail: 'Authorises issuers' },
  { email: 'issuer@decentraid.local', label: 'Issuer', detail: 'Rajarambapu Institute of Technology' },
  { email: 'holder@decentraid.local', label: 'Holder', detail: 'Aarav Sharma' },
  { email: 'verifier@decentraid.local', label: 'Verifier', detail: 'Zensar Talent Screening' },
];

const DEMO_PASSWORD = 'demo1234';

export default function Login() {
  const { login, isAuthenticated, role, initializing, mockMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { address, connect, connecting, available, error: walletError } = useWallet();

  // Anyone arriving with a live session goes straight to their dashboard.
  useEffect(() => {
    if (!initializing && isAuthenticated && role) {
      navigate(location.state?.from || ROLE_HOME[role] || '/', { replace: true });
    }
  }, [initializing, isAuthenticated, role, navigate, location.state]);

  const submit = async (e, overrides) => {
    e?.preventDefault?.();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login({
        email: overrides?.email ?? email,
        password: overrides?.password ?? password,
        walletAddress: address || undefined,
      });
      navigate(ROLE_HOME[me.role] || '/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const useDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    submit(null, { email: account.email, password: DEMO_PASSWORD });
  };

  const restartDemo = () => {
    resetDb();
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Identity panel: states what the system does and, just as importantly,
          what it does not claim. */}
      <div className="flex flex-col justify-between bg-shell px-6 py-10 text-white lg:px-14 lg:py-14">
        <Logo size={32} />

        <div className="my-12 max-w-lg lg:my-0">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Credentials that can be checked without calling the issuer.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            DecentraID anchors a hash of each credential so a verifier can confirm it has not been
            altered, and see immediately when an issuer revokes it. The certificate itself stays
            with the institution that issued it.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-white/70">
            {[
              ['Administrator', 'Authorises which organisations may issue.'],
              ['Issuer', 'Issues credentials and revokes them when withdrawn.'],
              ['Holder', 'Decides which credential to share, and with whom.'],
              ['Verifier', 'Requests a credential and receives a verdict.'],
            ].map(([role_, text]) => (
              <li key={role_} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-seal-400" />
                <span>
                  <span className="font-medium text-white">{role_}</span> — {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-white/40">
          A blockchain-backed credential verification prototype. Personal documents are held
          off-chain; only integrity records are anchored.
        </p>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center px-5 py-12 lg:px-14">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your role and permissions are assigned by the registry, not chosen here.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="you@organisation.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-bad-500/25 bg-bad-50 px-3.5 py-2.5 text-sm text-bad-700"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {submitting ? 'Signing in' : 'Sign in'}
            </Button>
          </form>

          {/* Wallet: optional, and clearly separated from authentication. */}
          <div className="mt-6 rounded-lg border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Wallet address</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {address
                    ? 'Linked to this sign-in for on-chain actions.'
                    : 'Optional. Used to identify your on-chain account.'}
                </p>
              </div>
              {address ? (
                <Badge tone="ok" dot className="data shrink-0">
                  {shortenHex(address)}
                </Badge>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={connect}
                  loading={connecting}
                  disabled={!available}
                >
                  {available ? 'Connect' : 'No wallet'}
                </Button>
              )}
            </div>
            {walletError ? (
              <p className="mt-2.5 text-xs text-bad-700">{walletError.message}</p>
            ) : null}
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
              DecentraID never asks for a private key or seed phrase. Signing happens in your
              wallet.
            </p>
          </div>

          {mockMode ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">Demo accounts</p>
                <Badge tone="brass">Mock mode</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => useDemoAccount(a)}
                    className="rounded-lg border border-line bg-white px-3.5 py-3 text-left transition-colors hover:border-seal-200 hover:bg-seal-50 disabled:opacity-50"
                  >
                    <span className="block text-sm font-medium text-ink">{a.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">{a.detail}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                <span>Password for every demo account: {DEMO_PASSWORD}</span>
                <button type="button" onClick={restartDemo} className="underline underline-offset-2 hover:text-ink">
                  Reset demo data
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-xs text-ink-soft">
              Connected to {CONFIG.apiBaseUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
