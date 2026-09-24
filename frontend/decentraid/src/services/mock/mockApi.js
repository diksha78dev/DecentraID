import { ApiError } from '../apiError';
import { STORAGE_KEYS, ROLES, ISSUER_STATUS, REQUEST_STATUS } from '../../utils/constants';
import { isExpired } from '../../utils/format';
import {
  getDb,
  commit,
  addAudit,
  newId,
  pseudoHash,
  simulatedTxRef,
  publicUser,
} from './mockDb';

/**
 * In-browser implementation of the documented REST contract.
 *
 * It mirrors the endpoints the Spring Boot service will expose, including the
 * authorization rules, so the UI exercises the same success and failure paths
 * it will meet against the real backend. Nothing here is security — it is a
 * stand-in for a server that has not been built yet.
 */

const latency = () => new Promise((r) => setTimeout(r, 220 + Math.random() * 260));

const iso = () => new Date().toISOString();

function currentUser() {
  let token = null;
  try {
    token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    token = null;
  }
  if (!token || !token.startsWith('mock.')) return null;
  const id = token.slice(5);
  return getDb().users.find((u) => u.id === id) || null;
}

function requireUser() {
  const user = currentUser();
  if (!user) throw new ApiError('Your session has ended. Sign in again to continue.', 401, 'UNAUTHENTICATED');
  return user;
}

function requireRole(...roles) {
  const user = requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiError('This account is not permitted to perform that action.', 403, 'FORBIDDEN');
  }
  return user;
}

const findUser = (id) => getDb().users.find((u) => u.id === id) || null;

/** Matches a holder by wallet address or email, case-insensitively. */
function findUserByReference(reference) {
  if (!reference) return null;
  const needle = String(reference).trim().toLowerCase();
  return (
    getDb().users.find(
      (u) =>
        u.walletAddress?.toLowerCase() === needle ||
        u.email?.toLowerCase() === needle ||
        u.id.toLowerCase() === needle,
    ) || null
  );
}

/** Accepts either the internal id or the human credential id (CERT-001). */
function findCredential(idOrCredentialId) {
  const needle = String(idOrCredentialId).toLowerCase();
  return (
    getDb().credentials.find(
      (c) => c.id.toLowerCase() === needle || c.credentialId.toLowerCase() === needle,
    ) || null
  );
}

/** Decorates a credential with the names the UI needs to render it. */
function expand(credential) {
  if (!credential) return null;
  const issuer = findUser(credential.issuerId);
  const holder = findUser(credential.holderId);
  return {
    ...credential,
    issuerName: issuer?.organization || issuer?.name || 'Unknown issuer',
    issuerWallet: issuer?.walletAddress || null,
    holderName: holder?.name || 'Unknown holder',
    holderWallet: holder?.walletAddress || null,
  };
}

/**
 * The verification rule set. Order matters: revocation outranks expiry, and
 * both outrank a positive result.
 */
function evaluate(credential) {
  if (!credential) {
    return {
      result: 'INVALID',
      reason: 'No credential record is anchored under this identifier.',
    };
  }
  const issuer = findUser(credential.issuerId);
  if (credential.status === 'REVOKED') {
    return {
      result: 'REVOKED',
      reason:
        'The issuing organisation revoked this credential on ' +
        new Date(credential.revokedAt || Date.now()).toLocaleDateString('en-IN') +
        (credential.revocationReason ? '. Reason given: ' + credential.revocationReason : '.'),
    };
  }
  if (isExpired(credential.expiresAt)) {
    return {
      result: 'EXPIRED',
      reason: 'This credential is outside its validity period. The record itself is authentic.',
    };
  }
  if (!issuer || issuer.status !== ISSUER_STATUS.AUTHORIZED) {
    return {
      result: 'INVALID',
      reason: 'The issuing organisation is not currently an authorised issuer.',
    };
  }
  if (credential.hash !== pseudoHash(
    credential.credentialId + '|' + credential.type + '|' + credential.holderId,
  )) {
    return {
      result: 'INVALID',
      reason: 'The credential hash does not match the anchored integrity record.',
    };
  }
  return { result: 'VALID', reason: 'The credential hash matches its anchored integrity record.' };
}

function recordResult(credential, requestId = null) {
  const { result, reason } = evaluate(credential);
  const entry = {
    id: newId('vr'),
    requestId,
    credentialId: credential?.credentialId || null,
    result,
    reason,
    checkedAt: iso(),
    transactionRef: credential?.anchorTxRef || null,
    simulated: true,
    snapshot: credential
      ? {
          credentialId: credential.credentialId,
          type: credential.type,
          title: credential.title,
          hash: credential.hash,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
          issuerName: expand(credential).issuerName,
          holderName: expand(credential).holderName,
          holderWallet: expand(credential).holderWallet,
        }
      : null,
  };
  commit((db) => db.verificationResults.unshift(entry));
  return entry;
}

function expandRequest(req) {
  const verifier = findUser(req.verifierId);
  const holder = findUser(req.holderId);
  const db = getDb();
  const result = db.verificationResults.find((r) => r.requestId === req.id) || null;
  return {
    ...req,
    verifierName: verifier?.organization || verifier?.name || 'Unknown verifier',
    holderName: holder?.name || 'Unknown holder',
    holderWallet: holder?.walletAddress || null,
    result: result?.result || null,
    resultId: result?.id || null,
  };
}

/* ------------------------------------------------------------------ */
/* Route handlers                                                      */
/* ------------------------------------------------------------------ */

const routes = [
  /* -------------------------------- auth -------------------------------- */
  {
    method: 'POST',
    match: /^\/auth\/login$/,
    handler: (_m, body) => {
      const email = String(body?.email || '').trim().toLowerCase();
      const user = getDb().users.find((u) => u.email.toLowerCase() === email);
      if (!user || (body?.password && user.password !== body.password)) {
        throw new ApiError('Email or password is incorrect.', 401, 'BAD_CREDENTIALS');
      }
      if (user.role === ROLES.ISSUER && user.status === ISSUER_STATUS.SUSPENDED) {
        throw new ApiError(
          'This issuer account is suspended. Contact the registry administrator.',
          403,
          'ISSUER_SUSPENDED',
        );
      }
      if (body?.walletAddress) {
        commit((db) => {
          const u = db.users.find((x) => x.id === user.id);
          u.lastWalletAddress = body.walletAddress;
        });
      }
      return { token: 'mock.' + user.id, user: publicUser(user) };
    },
  },
  {
    method: 'GET',
    match: /^\/users\/me$/,
    handler: () => publicUser(requireUser()),
  },

  /* ----------------------------- credentials ---------------------------- */
  {
    method: 'GET',
    match: /^\/credentials$/,
    handler: (_m, _b, query) => {
      const user = requireUser();
      let list = getDb().credentials.slice();

      // Scoping the backend will enforce: issuers see what they issued,
      // holders see what they hold, verifiers reach credentials only through
      // a verification flow.
      if (user.role === ROLES.ISSUER) list = list.filter((c) => c.issuerId === user.id);
      else if (user.role === ROLES.HOLDER) list = list.filter((c) => c.holderId === user.id);
      else if (user.role === ROLES.VERIFIER) list = [];

      if (query.holderId) list = list.filter((c) => c.holderId === query.holderId);
      if (query.issuerId) list = list.filter((c) => c.issuerId === query.issuerId);
      if (query.type) list = list.filter((c) => c.type === query.type);
      if (query.status) list = list.filter((c) => c.status === query.status);

      return list
        .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
        .map(expand);
    },
  },
  {
    method: 'POST',
    match: /^\/credentials$/,
    handler: (_m, body) => {
      const issuer = requireRole(ROLES.ISSUER);
      if (issuer.status !== ISSUER_STATUS.AUTHORIZED) {
        throw new ApiError(
          'Your issuer account is not authorised to issue credentials yet.',
          403,
          'ISSUER_NOT_AUTHORIZED',
        );
      }
      const required = ['credentialId', 'type', 'holderReference'];
      const missing = required.filter((f) => !String(body?.[f] || '').trim());
      if (missing.length) {
        throw new ApiError('Credential ID, type and holder address are required.', 400, 'VALIDATION');
      }
      if (findCredential(body.credentialId)) {
        throw new ApiError(
          'Credential ID ' + body.credentialId + ' is already anchored.',
          409,
          'DUPLICATE_CREDENTIAL',
        );
      }
      const holder = findUserByReference(body.holderReference);
      if (!holder || holder.role !== ROLES.HOLDER) {
        throw new ApiError(
          'No holder is registered against that wallet address or email.',
          404,
          'HOLDER_NOT_FOUND',
        );
      }

      const credential = {
        id: newId('c'),
        credentialId: String(body.credentialId).trim(),
        holderId: holder.id,
        issuerId: issuer.id,
        type: body.type,
        title: String(body.title || body.type).trim(),
        hash: pseudoHash(String(body.credentialId).trim() + '|' + body.type + '|' + holder.id),
        status: 'ACTIVE',
        issuedAt: body.issuedAt ? new Date(body.issuedAt).toISOString() : iso(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt).toISOString() : null,
        documentReference: String(body.documentReference || '').trim() || null,
        anchorTxRef: simulatedTxRef(body.credentialId),
        simulated: true,
      };

      commit((db) => db.credentials.unshift(credential));
      addAudit(issuer, 'CREDENTIAL_ISSUED', credential.credentialId, credential.anchorTxRef);
      return expand(credential);
    },
  },
  {
    method: 'GET',
    match: /^\/credentials\/([^/]+)$/,
    handler: (m) => {
      const user = requireUser();
      const credential = findCredential(decodeURIComponent(m[1]));
      if (!credential) throw new ApiError('That credential no longer exists.', 404, 'NOT_FOUND');

      const allowed =
        user.role === ROLES.ADMIN ||
        credential.issuerId === user.id ||
        credential.holderId === user.id ||
        // A verifier may read a credential the holder has shared with them.
        (user.role === ROLES.VERIFIER &&
          getDb().verificationRequests.some(
            (r) =>
              r.verifierId === user.id &&
              r.status === REQUEST_STATUS.APPROVED &&
              r.sharedCredentialId === credential.credentialId,
          ));

      if (!allowed) {
        throw new ApiError('This credential has not been shared with your account.', 403, 'FORBIDDEN');
      }
      return expand(credential);
    },
  },
  {
    method: 'POST',
    match: /^\/credentials\/([^/]+)\/revoke$/,
    handler: (m, body) => {
      const issuer = requireRole(ROLES.ISSUER);
      const credential = findCredential(decodeURIComponent(m[1]));
      if (!credential) throw new ApiError('That credential no longer exists.', 404, 'NOT_FOUND');
      if (credential.issuerId !== issuer.id) {
        throw new ApiError('Only the issuing organisation can revoke this credential.', 403, 'FORBIDDEN');
      }
      if (credential.status === 'REVOKED') {
        throw new ApiError('This credential is already revoked.', 409, 'ALREADY_REVOKED');
      }

      const txRef = simulatedTxRef('revoke:' + credential.credentialId);
      commit((db) => {
        const c = db.credentials.find((x) => x.id === credential.id);
        c.status = 'REVOKED';
        c.revokedAt = iso();
        c.revocationReason = String(body?.reason || '').trim() || null;
        c.revocationTxRef = txRef;
      });
      addAudit(issuer, 'CREDENTIAL_REVOKED', credential.credentialId, txRef);
      return expand(findCredential(credential.id));
    },
  },

  /* ------------------------ verification requests ----------------------- */
  {
    method: 'POST',
    match: /^\/verification-requests$/,
    handler: (_m, body) => {
      const verifier = requireRole(ROLES.VERIFIER);
      if (!String(body?.holderReference || '').trim()) {
        throw new ApiError('A holder wallet address or email is required.', 400, 'VALIDATION');
      }
      if (!String(body?.credentialId || '').trim() && !String(body?.credentialType || '').trim()) {
        throw new ApiError('Provide a credential ID or a credential type.', 400, 'VALIDATION');
      }
      const holder = findUserByReference(body.holderReference);
      if (!holder || holder.role !== ROLES.HOLDER) {
        throw new ApiError(
          'No holder is registered against that wallet address or email.',
          404,
          'HOLDER_NOT_FOUND',
        );
      }

      const req = {
        id: 'REQ-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        verifierId: verifier.id,
        holderId: holder.id,
        credentialId: String(body.credentialId || '').trim() || null,
        credentialType: String(body.credentialType || '').trim() || null,
        purpose: String(body.purpose || '').trim() || null,
        status: REQUEST_STATUS.PENDING,
        createdAt: iso(),
        respondedAt: null,
        sharedCredentialId: null,
      };
      commit((db) => db.verificationRequests.unshift(req));
      addAudit(verifier, 'VERIFICATION_REQUESTED', req.id, null);
      return expandRequest(req);
    },
  },
  {
    method: 'GET',
    match: /^\/verification-requests$/,
    handler: (_m, _b, query) => {
      const user = requireUser();
      let list = getDb().verificationRequests.slice();
      if (user.role === ROLES.VERIFIER) list = list.filter((r) => r.verifierId === user.id);
      else if (user.role === ROLES.HOLDER) list = list.filter((r) => r.holderId === user.id);
      else if (user.role === ROLES.ISSUER) list = [];

      if (query.status) list = list.filter((r) => r.status === query.status);
      return list.map(expandRequest);
    },
  },
  {
    method: 'POST',
    match: /^\/verification-requests\/([^/]+)\/respond$/,
    handler: (m, body) => {
      const holder = requireRole(ROLES.HOLDER);
      const id = decodeURIComponent(m[1]);
      const req = getDb().verificationRequests.find((r) => r.id === id);
      if (!req) throw new ApiError('That verification request no longer exists.', 404, 'NOT_FOUND');
      if (req.holderId !== holder.id) {
        throw new ApiError('This request was not addressed to your account.', 403, 'FORBIDDEN');
      }
      if (req.status !== REQUEST_STATUS.PENDING) {
        throw new ApiError('You have already responded to this request.', 409, 'ALREADY_ANSWERED');
      }

      if (body?.decision === 'REJECT') {
        commit((db) => {
          const r = db.verificationRequests.find((x) => x.id === id);
          r.status = REQUEST_STATUS.REJECTED;
          r.respondedAt = iso();
        });
        addAudit(holder, 'VERIFICATION_REJECTED', id, null);
        return expandRequest(getDb().verificationRequests.find((r) => r.id === id));
      }

      const credential = findCredential(String(body?.credentialId || ''));
      if (!credential) {
        throw new ApiError('Select a credential to share before approving.', 400, 'VALIDATION');
      }
      if (credential.holderId !== holder.id) {
        throw new ApiError('You can only share credentials issued to you.', 403, 'FORBIDDEN');
      }

      commit((db) => {
        const r = db.verificationRequests.find((x) => x.id === id);
        r.status = REQUEST_STATUS.APPROVED;
        r.respondedAt = iso();
        r.sharedCredentialId = credential.credentialId;
      });
      const result = recordResult(credential, id);
      addAudit(holder, 'CREDENTIAL_SHARED', credential.credentialId + ' → ' + id, null);
      return { request: expandRequest(getDb().verificationRequests.find((r) => r.id === id)), result };
    },
  },

  /* ----------------------------- verification --------------------------- */
  {
    method: 'GET',
    match: /^\/verification\/([^/]+)$/,
    handler: (m) => {
      const user = requireUser();
      const credentialId = decodeURIComponent(m[1]);
      const credential = findCredential(credentialId);

      if (user.role === ROLES.VERIFIER && credential) {
        const shared = getDb().verificationRequests.some(
          (r) =>
            r.verifierId === user.id &&
            r.status === REQUEST_STATUS.APPROVED &&
            r.sharedCredentialId === credential.credentialId,
        );
        if (!shared) {
          throw new ApiError(
            'The holder has not shared this credential with your account.',
            403,
            'NOT_SHARED',
          );
        }
      }
      return recordResult(credential || { credentialId });
    },
  },

  /* -------------------------------- admin ------------------------------- */
  {
    method: 'GET',
    match: /^\/admin\/issuers$/,
    handler: () => {
      requireRole(ROLES.ADMIN);
      return getDb()
        .users.filter((u) => u.role === ROLES.ISSUER)
        .map((u) => ({
          ...publicUser(u),
          authorizedAt: u.authorizedAt || null,
          suspendedAt: u.suspendedAt || null,
          suspensionReason: u.suspensionReason || null,
          credentialsIssued: getDb().credentials.filter((c) => c.issuerId === u.id).length,
        }));
    },
  },
  {
    method: 'POST',
    match: /^\/admin\/issuers$/,
    handler: (_m, body) => {
      const admin = requireRole(ROLES.ADMIN);
      const target = body?.issuerId ? findUser(body.issuerId) : findUserByReference(body?.walletAddress);
      if (!target || target.role !== ROLES.ISSUER) {
        throw new ApiError('No issuer account matches that reference.', 404, 'ISSUER_NOT_FOUND');
      }
      if (target.status === ISSUER_STATUS.AUTHORIZED) {
        throw new ApiError('That issuer is already authorised.', 409, 'ALREADY_AUTHORIZED');
      }

      const txRef = simulatedTxRef('authorize:' + target.id);
      commit((db) => {
        const u = db.users.find((x) => x.id === target.id);
        u.status = ISSUER_STATUS.AUTHORIZED;
        u.authorizedAt = iso();
        u.suspendedAt = null;
        u.suspensionReason = null;
      });
      addAudit(admin, 'ISSUER_AUTHORIZED', target.organization || target.name, txRef);
      return { ...publicUser(findUser(target.id)), transactionRef: txRef, simulated: true };
    },
  },
  {
    method: 'POST',
    match: /^\/admin\/issuers\/([^/]+)\/status$/,
    handler: (m, body) => {
      const admin = requireRole(ROLES.ADMIN);
      const target = findUser(decodeURIComponent(m[1]));
      if (!target || target.role !== ROLES.ISSUER) {
        throw new ApiError('No issuer account matches that reference.', 404, 'ISSUER_NOT_FOUND');
      }
      const status = body?.status;
      if (![ISSUER_STATUS.AUTHORIZED, ISSUER_STATUS.SUSPENDED].includes(status)) {
        throw new ApiError('Status must be AUTHORIZED or SUSPENDED.', 400, 'VALIDATION');
      }

      const txRef = simulatedTxRef('status:' + target.id);
      commit((db) => {
        const u = db.users.find((x) => x.id === target.id);
        u.status = status;
        if (status === ISSUER_STATUS.SUSPENDED) {
          u.suspendedAt = iso();
          u.suspensionReason = String(body?.reason || '').trim() || null;
        } else {
          u.authorizedAt = iso();
          u.suspendedAt = null;
          u.suspensionReason = null;
        }
      });
      addAudit(
        admin,
        status === ISSUER_STATUS.SUSPENDED ? 'ISSUER_SUSPENDED' : 'ISSUER_AUTHORIZED',
        target.organization || target.name,
        txRef,
      );
      return { ...publicUser(findUser(target.id)), transactionRef: txRef, simulated: true };
    },
  },
  {
    method: 'GET',
    match: /^\/audit$/,
    handler: (_m, _b, query) => {
      requireRole(ROLES.ADMIN);
      const limit = Number(query.limit || 50);
      return getDb().audit.slice(0, limit);
    },
  },
];

export async function handleMockRequest(method, fullPath, body) {
  await latency();

  const [path, search = ''] = fullPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(search));

  for (const route of routes) {
    if (route.method !== method) continue;
    const m = path.match(route.match);
    if (m) return route.handler(m, body, query);
  }

  throw new ApiError('That endpoint is not available.', 404, 'NO_ROUTE');
}

export default handleMockRequest;
