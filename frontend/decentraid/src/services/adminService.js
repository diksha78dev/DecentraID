import api from './api';

/**
 * Administration.
 *
 * Note: the documented contract only specifies POST /api/admin/issuers. Issuer
 * listing and status changes are isolated here so a contract change touches one
 * file. See README "Assumptions".
 */
export const adminService = {
  /** GET /api/admin/issuers (assumed) */
  listIssuers() {
    return api.get('/admin/issuers');
  },

  /** POST /api/admin/issuers — authorize an issuer */
  authorizeIssuer(payload) {
    return api.post('/admin/issuers', payload);
  },

  /** POST /api/admin/issuers/{id}/status (assumed) — SUSPENDED | AUTHORIZED */
  setIssuerStatus(id, status, reason) {
    return api.post('/admin/issuers/' + encodeURIComponent(id) + '/status', { status, reason });
  },

  /** GET /api/audit */
  audit(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
    ).toString();
    return api.get('/audit' + (query ? '?' + query : ''));
  },
};

export default adminService;
