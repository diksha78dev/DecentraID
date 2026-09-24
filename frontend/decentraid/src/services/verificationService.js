import api from './api';

/** Verification requests and credential checks. */
export const verificationService = {
  /** POST /api/verification-requests */
  createRequest(payload) {
    return api.post('/verification-requests', payload);
  },

  /** GET /api/verification-requests — filters: verifierId, holderId, status */
  listRequests(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
    ).toString();
    return api.get('/verification-requests' + (query ? '?' + query : ''));
  },

  /**
   * POST /api/verification-requests/{id}/respond
   * decision: 'APPROVE' | 'REJECT'. credentialId is required to approve.
   */
  respond(id, { decision, credentialId }) {
    return api.post('/verification-requests/' + encodeURIComponent(id) + '/respond', {
      decision,
      credentialId,
    });
  },

  /**
   * GET /api/verification/{credentialId}
   * Re-checks a credential against its on-chain status and returns a fresh
   * VerificationResult. This is what turns VALID into REVOKED after revocation.
   */
  verify(credentialId) {
    return api.get('/verification/' + encodeURIComponent(credentialId));
  },
};

export default verificationService;
