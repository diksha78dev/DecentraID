import { STORAGE_KEYS, ROLES, ISSUER_STATUS } from '../../utils/constants';

/**
 * In-browser database backing mock mode.
 *
 * State is persisted to localStorage so the demonstration survives a page
 * reload and, more importantly, survives signing out of one role and into
 * another — the viva flow depends on an issuer's action being visible to a
 * holder in a later session.
 */

const DAY = 86400000;
const now = () => Date.now();
const iso = (ms) => new Date(ms).toISOString();

/**
 * Deterministic pseudo-hash. Stands in for the SHA-256 digest the backend
 * would compute over canonical credential metadata. Stable for a given input
 * so the same credential always shows the same hash across reloads.
 */
export function pseudoHash(input, prefix = '0x') {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    h1 = Math.imul(h1 ^ str.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + str.charCodeAt(i) * (i + 7), 0x85ebca6b) >>> 0;
  }
  let out = '';
  let a = h1;
  let b = h2;
  for (let i = 0; i < 8; i += 1) {
    a = Math.imul(a ^ (a >>> 13), 0x5bd1e995) >>> 0;
    b = Math.imul(b ^ (b >>> 11), 0xc2b2ae35) >>> 0;
    out += a.toString(16).padStart(8, '0');
    if (out.length < 64) out += b.toString(16).padStart(8, '0');
  }
  return prefix + out.slice(0, 64);
}

/**
 * Simulated transaction reference. Only ever produced in mock mode, and always
 * carried alongside simulated:true so the UI can label it as not a real
 * on-chain transaction.
 */
export function simulatedTxRef(seed) {
  return pseudoHash('tx:' + seed + ':' + Math.random().toString(36).slice(2));
}

export const newId = (prefix) =>
  prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

function seed() {
  const t = now();

  const users = [
    {
      id: 'u_admin',
      email: 'admin@decentraid.local',
      password: 'demo1234',
      name: 'System Administrator',
      organization: 'DecentraID Registry',
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      walletAddress: '0xA11CE00fD2b41c7E9f4B23d5aC9E0b7F2D6a4C81',
      createdAt: iso(t - 240 * DAY),
    },
    {
      id: 'u_issuer_rit',
      email: 'issuer@decentraid.local',
      password: 'demo1234',
      name: 'Dr. S. Kulkarni',
      organization: 'Rajarambapu Institute of Technology',
      role: ROLES.ISSUER,
      status: ISSUER_STATUS.AUTHORIZED,
      walletAddress: '0x4D2fA7bE913c5Ef08a6B1d7C3049Ee52B8fA1c60',
      authorizedAt: iso(t - 180 * DAY),
      createdAt: iso(t - 200 * DAY),
    },
    {
      id: 'u_issuer_nexa',
      email: 'registrar@nexaskills.local',
      password: 'demo1234',
      name: 'Meera Joshi',
      organization: 'NexaSkills Academy',
      role: ROLES.ISSUER,
      status: ISSUER_STATUS.PENDING,
      walletAddress: '0x91Bc3E7a54D8f2019cB6e4A7dF35C81b09E2a743',
      createdAt: iso(t - 6 * DAY),
    },
    {
      id: 'u_issuer_bluepeak',
      email: 'certs@bluepeak.local',
      password: 'demo1234',
      name: 'Rohan Deshpande',
      organization: 'BluePeak Training Institute',
      role: ROLES.ISSUER,
      status: ISSUER_STATUS.SUSPENDED,
      walletAddress: '0x7E5a1C04B9dF62381aC7b0E4592fD8a63B41c0D9',
      authorizedAt: iso(t - 150 * DAY),
      suspendedAt: iso(t - 21 * DAY),
      suspensionReason: 'Accreditation under review by the state board.',
      createdAt: iso(t - 160 * DAY),
    },
    {
      id: 'u_holder',
      email: 'holder@decentraid.local',
      password: 'demo1234',
      name: 'Aarav Sharma',
      organization: null,
      role: ROLES.HOLDER,
      status: 'ACTIVE',
      walletAddress: '0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20',
      createdAt: iso(t - 400 * DAY),
    },
    {
      id: 'u_holder_2',
      email: 'priya.nair@decentraid.local',
      password: 'demo1234',
      name: 'Priya Nair',
      organization: null,
      role: ROLES.HOLDER,
      status: 'ACTIVE',
      walletAddress: '0x8Fa2b07C31eD649a05B7c2E8134Df96b0A7e5C34',
      createdAt: iso(t - 320 * DAY),
    },
    {
      id: 'u_verifier',
      email: 'verifier@decentraid.local',
      password: 'demo1234',
      name: 'Neha Patil',
      organization: 'Zensar Talent Screening',
      role: ROLES.VERIFIER,
      status: 'ACTIVE',
      walletAddress: '0x6B3e9A27cF014d85B2a7E60D394fC18a52Db7E41',
      createdAt: iso(t - 90 * DAY),
    },
  ];

  const credentials = [
    {
      id: 'c_java_001',
      credentialId: 'CERT-001',
      holderId: 'u_holder',
      issuerId: 'u_issuer_rit',
      type: 'Java Certification',
      title: 'Java Certification',
      hash: pseudoHash('CERT-001|Java Certification|u_holder'),
      status: 'ACTIVE',
      issuedAt: iso(t - 2 * DAY),
      expiresAt: iso(t + 730 * DAY),
      documentReference: 'ipfs://QmT4c9Pe1Ra7Vx2nD5kLbY8sWq3uZ6hMf0JgX9oB2iKdNv',
      anchorTxRef: pseudoHash('anchor:CERT-001'),
      simulated: true,
    },
    {
      id: 'c_degree_112',
      credentialId: 'DEG-2024-112',
      holderId: 'u_holder',
      issuerId: 'u_issuer_rit',
      type: 'Degree Certificate',
      title: 'B.Tech Computer Science & Engineering',
      hash: pseudoHash('DEG-2024-112|Degree Certificate|u_holder'),
      status: 'ACTIVE',
      issuedAt: iso(t - 420 * DAY),
      expiresAt: null,
      documentReference: 'ipfs://QmR8v2Lp5Nq7Yd1cF3aH6zXw9tB4eK0mSj2UgQ7rP1oVx',
      anchorTxRef: pseudoHash('anchor:DEG-2024-112'),
      simulated: true,
    },
    {
      id: 'c_intern_007',
      credentialId: 'INT-2025-007',
      holderId: 'u_holder',
      issuerId: 'u_issuer_rit',
      type: 'Internship Certificate',
      title: 'Summer Internship — Embedded Systems',
      hash: pseudoHash('INT-2025-007|Internship Certificate|u_holder'),
      status: 'ACTIVE',
      issuedAt: iso(t - 300 * DAY),
      expiresAt: iso(t - 30 * DAY),
      documentReference: 'ipfs://QmY3k8Dc2Wf6Tb9nQ1xL7pR5aJ0vE4sH8mZgU2iN6oCyB',
      anchorTxRef: pseudoHash('anchor:INT-2025-007'),
      simulated: true,
    },
    {
      id: 'c_training_114',
      credentialId: 'TRN-2026-114',
      holderId: 'u_holder_2',
      issuerId: 'u_issuer_rit',
      type: 'Training Completion',
      title: 'Industrial Automation Workshop',
      hash: pseudoHash('TRN-2026-114|Training Completion|u_holder_2'),
      status: 'ACTIVE',
      issuedAt: iso(t - 45 * DAY),
      expiresAt: iso(t + 320 * DAY),
      documentReference: 'ipfs://QmW9p4Fh1Sv3Mc7dT2rB8kL5nY6xA0eJqZ4gU1oD3iRtC',
      anchorTxRef: pseudoHash('anchor:TRN-2026-114'),
      simulated: true,
    },
  ];

  const audit = [
    {
      id: 'a_1',
      actorId: 'u_admin',
      actor: 'System Administrator',
      action: 'ISSUER_AUTHORIZED',
      entity: 'Rajarambapu Institute of Technology',
      timestamp: iso(t - 180 * DAY),
      transactionRef: pseudoHash('audit:rit-auth'),
      simulated: true,
    },
    {
      id: 'a_2',
      actorId: 'u_issuer_rit',
      actor: 'Dr. S. Kulkarni',
      action: 'CREDENTIAL_ISSUED',
      entity: 'DEG-2024-112',
      timestamp: iso(t - 420 * DAY),
      transactionRef: pseudoHash('audit:deg112'),
      simulated: true,
    },
    {
      id: 'a_3',
      actorId: 'u_admin',
      actor: 'System Administrator',
      action: 'ISSUER_SUSPENDED',
      entity: 'BluePeak Training Institute',
      timestamp: iso(t - 21 * DAY),
      transactionRef: pseudoHash('audit:bluepeak-susp'),
      simulated: true,
    },
    {
      id: 'a_4',
      actorId: 'u_issuer_rit',
      actor: 'Dr. S. Kulkarni',
      action: 'CREDENTIAL_ISSUED',
      entity: 'CERT-001',
      timestamp: iso(t - 2 * DAY),
      transactionRef: pseudoHash('audit:cert001'),
      simulated: true,
    },
  ];

  return {
    version: 1,
    users,
    credentials,
    verificationRequests: [],
    verificationResults: [],
    audit,
  };
}

let db = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEYS.MOCK_DB, JSON.stringify(db));
  } catch {
    /* quota or privacy mode — the demo continues in memory */
  }
}

export function getDb() {
  if (db) return db;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCK_DB);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && Array.isArray(parsed.users)) {
        db = parsed;
        return db;
      }
    }
  } catch {
    /* fall through to a fresh seed */
  }
  db = seed();
  persist();
  return db;
}

/** Mutates the database and persists in one step. */
export function commit(mutator) {
  const current = getDb();
  const result = mutator(current);
  persist();
  return result;
}

/** Returns the demo to its seeded state. Exposed in the UI in mock mode only. */
export function resetDb() {
  db = seed();
  persist();
  return db;
}

export function addAudit(actor, action, entity, transactionRef) {
  const current = getDb();
  current.audit.unshift({
    id: newId('a'),
    actorId: actor?.id || null,
    actor: actor?.name || 'System',
    action,
    entity,
    timestamp: iso(now()),
    transactionRef: transactionRef || null,
    simulated: Boolean(transactionRef),
  });
  current.audit = current.audit.slice(0, 200);
}

export const publicUser = (u) =>
  u
    ? {
        id: u.id,
        walletAddress: u.walletAddress,
        name: u.name,
        email: u.email,
        organization: u.organization,
        role: u.role,
        status: u.status,
      }
    : null;
