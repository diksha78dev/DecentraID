/**
 * Shared enumerations and runtime configuration.
 * Status vocabularies are fixed by the backend contract — do not extend them here.
 */

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ISSUER: 'ISSUER',
  HOLDER: 'HOLDER',
  VERIFIER: 'VERIFIER',
});

export const ROLE_LIST = [ROLES.ADMIN, ROLES.ISSUER, ROLES.HOLDER, ROLES.VERIFIER];

/** Lifecycle status of a credential record. */
export const CREDENTIAL_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
});

/** Outcome of a verification check. */
export const VERIFICATION_RESULT = Object.freeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
});

/** Lifecycle of a verification request raised by a verifier. */
export const REQUEST_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

/** Authorization state of an issuer account, governed by the admin. */
export const ISSUER_STATUS = Object.freeze({
  AUTHORIZED: 'AUTHORIZED',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
});

export const CREDENTIAL_TYPES = [
  'Java Certification',
  'Degree Certificate',
  'Internship Certificate',
  'Diploma Certificate',
  'Training Completion',
];

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.ISSUER]: '/issuer',
  [ROLES.HOLDER]: '/holder',
  [ROLES.VERIFIER]: '/verifier',
};

export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'decentraid.token',
  MOCK_DB: 'decentraid.mockdb.v1',
  WALLET: 'decentraid.wallet',
});

const env = import.meta.env;

export const CONFIG = Object.freeze({
  apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  useMock: String(env.VITE_USE_MOCK ?? 'true').toLowerCase() !== 'false',
  timeout: Number(env.VITE_API_TIMEOUT || 15000),
  chainName: env.VITE_CHAIN_NAME || 'EVM Testnet',
  chainId: env.VITE_CHAIN_ID || '',
  explorerBaseUrl: env.VITE_EXPLORER_BASE_URL || '',
});
