import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { getToken, setToken, isMockMode } from '../services/api';

/**
 * Session state.
 *
 * The signed-in user — and critically the role — is whatever GET /users/me
 * returns. Nothing the user selects in the interface determines their role.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Restore a session from a stored token on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await authService.login(credentials);
    // Prefer the authoritative profile endpoint over the login payload.
    const me = data?.user ?? (await authService.me());
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      initializing,
      error,
      setError,
      login,
      logout,
      mockMode: isMockMode(),
    }),
    [user, initializing, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}

export default AuthContext;
