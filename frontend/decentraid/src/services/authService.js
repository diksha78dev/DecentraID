import api, { setToken, getToken } from './api';

/**
 * Authentication.
 *
 * The role always comes from the backend response — never from anything the
 * user picked in the UI. Demo role selection in mock mode still round-trips
 * through the mock login endpoint for that reason.
 */
export const authService = {
  /** POST /api/auth/login -> { token, user } */
  async login({ email, password, walletAddress }) {
    const data = await api.post('/auth/login', { email, password, walletAddress });
    if (data?.token) setToken(data.token);
    return data;
  },

  /** GET /api/users/me -> User */
  me() {
    return api.get('/users/me');
  },

  logout() {
    setToken(null);
  },

  hasToken() {
    return Boolean(getToken());
  },
};

export default authService;
