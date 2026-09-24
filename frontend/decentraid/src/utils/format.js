/** Presentation helpers. No business logic lives here. */

const DATE_OPTS = { day: '2-digit', month: 'short', year: 'numeric' };

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', DATE_OPTS);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', DATE_OPTS);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return date + ', ' + time;
}

export function relativeTime(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + ' hr ago';
  const days = Math.round(hours / 24);
  if (days < 30) return days + ' d ago';
  return formatDate(value);
}

/** 0x1234…c0de — keeps both ends so an address stays checkable by eye. */
export function shortenHex(value, lead = 6, tail = 4) {
  if (!value || typeof value !== 'string') return '—';
  if (value.length <= lead + tail + 1) return value;
  return value.slice(0, lead) + '…' + value.slice(-tail);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const d = new Date(expiresAt).getTime();
  return !Number.isNaN(d) && d < Date.now();
}

export function daysUntil(expiresAt) {
  if (!expiresAt) return null;
  const d = new Date(expiresAt).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

/**
 * Display status of a credential: expiry is derived at read time so a record
 * stored as ACTIVE still reads EXPIRED once it passes its validity window.
 */
export function effectiveStatus(credential) {
  if (!credential) return 'INVALID';
  if (credential.status === 'REVOKED') return 'REVOKED';
  if (isExpired(credential.expiresAt)) return 'EXPIRED';
  return credential.status || 'ACTIVE';
}
