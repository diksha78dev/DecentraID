import api from './api';

/** Credential metadata. Documents themselves stay off-chain and out of scope. */
export const credentialService = {
  /** GET /api/credentials — optional filters: holderId, issuerId, status, type */
  list(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
    ).toString();
    return api.get('/credentials' + (query ? '?' + query : ''));
  },

  /** GET /api/credentials/{id} */
  getById(id) {
    return api.get('/credentials/' + encodeURIComponent(id));
  },

  /** POST /api/credentials */
  issue(payload) {
    return api.post('/credentials', payload);
  },

  /** POST /api/credentials/{id}/revoke */
  revoke(id, reason) {
    return api.post('/credentials/' + encodeURIComponent(id) + '/revoke', { reason });
  },
};

export default credentialService;
