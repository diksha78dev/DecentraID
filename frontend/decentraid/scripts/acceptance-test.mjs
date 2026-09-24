/**
 * Runs the acceptance demonstration flow (section 24) against the mock API,
 * outside the browser. Verifies the business rules the viva depends on:
 * authorization, issuance, sharing, VALID, revocation, then REVOKED.
 */
import { handleMockRequest } from '../src/services/mock/mockApi.js';
import { STORAGE_KEYS } from '../src/utils/constants.js';

// Minimal localStorage shim so the mock layer behaves as it does in a browser.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log('  PASS  ' + label);
  } else {
    failed += 1;
    console.log('  FAIL  ' + label + (detail ? ' — ' + detail : ''));
  }
}

const req = (method, path, body) => handleMockRequest(method, path, body);

async function loginAs(email) {
  const res = await req('POST', '/auth/login', { email, password: 'demo1234' });
  localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
  return res.user;
}

async function expectFailure(label, fn, codeOrStatus) {
  try {
    await fn();
    check(label, false, 'expected a rejection but the call succeeded');
  } catch (err) {
    const matches =
      err.code === codeOrStatus || err.status === codeOrStatus || codeOrStatus === undefined;
    check(label, matches, 'got ' + err.code + ' / ' + err.status);
  }
}

async function main() {
  console.log('\nDecentraID — acceptance flow\n');

  /* 1–3. Admin authorises a pending issuer. */
  const admin = await loginAs('admin@decentraid.local');
  check('1. Admin signs in and the server returns the ADMIN role', admin.role === 'ADMIN');

  const issuersBefore = await req('GET', '/admin/issuers');
  const pending = issuersBefore.find((i) => i.status === 'PENDING');
  check('2. Admin dashboard lists issuers with a pending organisation', Boolean(pending));

  const authorized = await req('POST', '/admin/issuers', { issuerId: pending.id });
  check('3. Authorising the issuer sets AUTHORIZED', authorized.status === 'AUTHORIZED');

  /* 4–5. Issuer issues the Java Certification to the holder. */
  const issuer = await loginAs('issuer@decentraid.local');
  check('4. Issuer signs in with the ISSUER role', issuer.role === 'ISSUER');

  const issued = await req('POST', '/credentials', {
    credentialId: 'CERT-002',
    type: 'Java Certification',
    holderReference: '0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20',
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  });
  check('5. Issuer issues Java Certification to the holder', issued.credentialId === 'CERT-002');
  check('   Credential is anchored with a hash', /^0x[0-9a-f]{64}$/.test(issued.hash));

  await expectFailure(
    '   Duplicate credential ID is rejected',
    () => req('POST', '/credentials', {
      credentialId: 'CERT-002',
      type: 'Java Certification',
      holderReference: '0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20',
    }),
    'DUPLICATE_CREDENTIAL',
  );

  await expectFailure(
    '   Unknown holder address is rejected',
    () => req('POST', '/credentials', {
      credentialId: 'CERT-777',
      type: 'Java Certification',
      holderReference: '0xdeadbeef',
    }),
    'HOLDER_NOT_FOUND',
  );

  /* 6–7. Holder sees it. */
  const holder = await loginAs('holder@decentraid.local');
  check('6. Holder signs in with the HOLDER role', holder.role === 'HOLDER');

  const held = await req('GET', '/credentials');
  check('7. Holder sees the new credential', held.some((c) => c.credentialId === 'CERT-002'));
  check('   Holder only sees their own credentials', held.every((c) => c.holderId === holder.id));

  /* 8–9. Verifier raises a request. */
  const verifier = await loginAs('verifier@decentraid.local');
  check('8. Verifier signs in with the VERIFIER role', verifier.role === 'VERIFIER');

  const request = await req('POST', '/verification-requests', {
    holderReference: '0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20',
    credentialId: 'CERT-002',
    purpose: 'Pre-employment screening',
  });
  check('9. Verifier creates a verification request', request.status === 'PENDING');

  await expectFailure(
    '   Verifier cannot read an unshared credential',
    () => req('GET', '/verification/CERT-002'),
    'NOT_SHARED',
  );

  /* 10–13. Holder reviews and shares. */
  await loginAs('holder@decentraid.local');
  const inbox = await req('GET', '/verification-requests');
  check('10-11. Holder sees the pending request', inbox.some((r) => r.id === request.id));

  const responded = await req('POST', '/verification-requests/' + request.id + '/respond', {
    decision: 'APPROVE',
    credentialId: 'CERT-002',
  });
  check('12-13. Holder approves and shares CERT-002', responded.request.status === 'APPROVED');
  check('   Sharing produces a VALID result', responded.result.result === 'VALID');

  await expectFailure(
    '   A request cannot be answered twice',
    () => req('POST', '/verification-requests/' + request.id + '/respond', {
      decision: 'APPROVE',
      credentialId: 'CERT-002',
    }),
    'ALREADY_ANSWERED',
  );

  /* 14–15. Verifier sees VALID. */
  await loginAs('verifier@decentraid.local');
  const validResult = await req('GET', '/verification/CERT-002');
  check('14-15. Verifier receives VALID', validResult.result === 'VALID');
  check('   Result carries the credential snapshot', validResult.snapshot?.type === 'Java Certification');
  check('   Transaction reference is flagged as simulated', validResult.simulated === true);

  /* 16–17. Issuer revokes. */
  await loginAs('issuer@decentraid.local');
  const revoked = await req('POST', '/credentials/CERT-002/revoke', { reason: 'Issued in error' });
  check('16-17. Issuer revokes the credential', revoked.status === 'REVOKED');

  await expectFailure(
    '   Revoking twice is rejected',
    () => req('POST', '/credentials/CERT-002/revoke', {}),
    'ALREADY_REVOKED',
  );

  /* 18–20. Verifier re-checks and receives REVOKED. */
  await loginAs('verifier@decentraid.local');
  const afterRevoke = await req('GET', '/verification/CERT-002');
  check('18-20. Verifier re-check now returns REVOKED', afterRevoke.result === 'REVOKED');
  check('   The reason explains the revocation', /revoked/i.test(afterRevoke.reason));

  /* Additional state coverage: EXPIRED and INVALID. */
  await loginAs('holder@decentraid.local');
  const expiredReq = await req('POST', '/verification-requests', {}).catch(() => null);
  check('   Holders cannot create verification requests', expiredReq === null);

  await loginAs('verifier@decentraid.local');
  const expiryRequest = await req('POST', '/verification-requests', {
    holderReference: 'holder@decentraid.local',
    credentialId: 'INT-2025-007',
    purpose: 'Internship check',
  });
  await loginAs('holder@decentraid.local');
  const expiryShare = await req('POST', '/verification-requests/' + expiryRequest.id + '/respond', {
    decision: 'APPROVE',
    credentialId: 'INT-2025-007',
  });
  check('   A past-expiry credential verifies as EXPIRED', expiryShare.result.result === 'EXPIRED');

  await loginAs('admin@decentraid.local');
  const unknown = await req('GET', '/verification/CERT-DOES-NOT-EXIST');
  check('   An unknown credential verifies as INVALID', unknown.result === 'INVALID');

  /* Role boundaries enforced server-side, not only by the router. */
  await loginAs('holder@decentraid.local');
  await expectFailure('   Holder cannot read the audit log', () => req('GET', '/audit'), 'FORBIDDEN');
  await expectFailure(
    '   Holder cannot issue credentials',
    () => req('POST', '/credentials', { credentialId: 'X', type: 'Y', holderReference: 'z' }),
    'FORBIDDEN',
  );

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  await expectFailure(
    '   Unauthenticated requests are rejected',
    () => req('GET', '/credentials'),
    'UNAUTHENTICATED',
  );

  console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
