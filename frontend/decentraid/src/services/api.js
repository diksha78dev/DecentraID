import { CONFIG, STORAGE_KEYS } from '../utils/constants';
import { handleMockRequest } from './mock/mockApi';
import { ApiError } from './apiError';

/**
 * Single HTTP transport for the whole application.
 *
 * Components never call fetch directly. Every feature service goes through
 * request(), which either dispatches to the in-browser mock API or to the
 * Spring Boot REST API, depending on VITE_USE_MOCK. Switching modes therefore
 * requires no component changes.
 */

export { ApiError };

export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch {
    /* storage unavailable — session stays in memory only */
  }
}

export const isMockMode = () => CONFIG.useMock;

/** Messages users actually see. Backend stack traces are never surfaced. */
function friendlyMessage(status, payload) {
  if (payload && typeof payload.message === 'string' && payload.message.length < 160) {
    return payload.message;
  }
  switch (status) {
    case 400:
      return 'The request was rejected. Check the values you entered and try again.';
    case 401:
      return 'Your session has ended. Sign in again to continue.';
    case 403:
      return 'This account is not permitted to perform that action.';
    case 404:
      return 'That record no longer exists.';
    case 409:
      return 'That action conflicts with the current state of the record.';
    case 422:
      return 'Some fields could not be accepted. Review them and try again.';
    default:
      return status >= 500
        ? 'The server could not complete the request. Try again shortly.'
        : 'The request could not be completed.';
  }
}

async function realRequest(method, path, body, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeout);
  const token = getToken();

  try {
    const res = await fetch(CONFIG.apiBaseUrl.replace(/\/$/, '') + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!res.ok) {
      throw new ApiError(
        friendlyMessage(res.status, payload),
        res.status,
        payload?.code || 'HTTP_' + res.status,
      );
    }
    return payload;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond.', 0, 'TIMEOUT');
    }
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
      'NETWORK',
    );
  } finally {
    clearTimeout(timer);
  }
}

export function request(method, path, body, options) {
  if (CONFIG.useMock) return handleMockRequest(method, path, body);
  return realRequest(method, path, body, options);
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
};

export default api;
