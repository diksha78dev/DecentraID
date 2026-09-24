# DecentraID — Frontend

Blockchain-backed digital identity and credential verification prototype. This
repository contains **only the React frontend**. The Spring Boot API and the
Solidity contract are separate components and are not included here.

## What the system does

An institution issues a credential to a person. Later, an employer wants to
confirm that credential is genuine and still stands. Today that means phoning
the institution. DecentraID anchors a hash of each credential's metadata so a
verifier can check two things without contacting the issuer: that the record has
not been altered, and that the issuer has not revoked it.

The credential document itself never goes on the blockchain. Only an integrity
record does.

### What this project does *not* claim

These boundaries are deliberate, and the interface is written to respect them:

- It is **not** a fully decentralised system. It is a blockchain-backed
  prototype with a conventional backend and database in the middle.
- Credentials are **not** stored on the blockchain — only a hash of their
  metadata is anchored.
- It does **not** implement W3C DID or Verifiable Credentials specifications.
- It does **not** use zero-knowledge proofs.
- Frontend route protection is **user experience only**. Authorisation is the
  backend's responsibility.

## Roles

| Role | Responsibilities |
|------|------------------|
| Admin | Authorises and suspends issuing organisations; reads the audit log |
| Issuer | Issues credentials to holders; revokes them when withdrawn |
| Holder | Views their credentials; approves or rejects verification requests |
| Verifier | Raises verification requests; reads verification results |

A holder's credential is never disclosed to a verifier until the holder
approves that specific request.

## Features

- Email/password sign-in, with the role supplied by the backend
- Optional MetaMask/EVM wallet connection, isolated in `walletService.js`
- Role-based sidebar navigation and protected routes
- Admin: issuer statistics, issuer table with authorise/suspend/view, audit log
  with action filtering
- Issuer: issuance statistics, issue-credential form with validation, issued
  credentials table with search, status filter, and confirm-guarded revocation
- Holder: credential cards, pending-request banner, request review with
  credential selection, approve-and-share or reject
- Verifier: request statistics, request creation, request table, and the
  verification result screen with a re-check action
- Four verification states rendered distinctly: VALID, INVALID, REVOKED, EXPIRED
- Loading, empty, and error states on every data screen, with retry
- Responsive: tables convert to per-record cards below the `md` breakpoint
- Copy-to-clipboard for hashes, wallet addresses and transaction references

## Technology

React 18, Vite 5, JavaScript, React Router 6, Tailwind CSS 3, Context API for
session and toast state, and the native `fetch` API. No component library, no
state-management dependency, no axios.

## Architecture

```
src/
├── routes/       route table and the ProtectedRoute / RoleRoute guards
├── context/      AuthContext (session, role), ToastContext (confirmations)
├── hooks/        useAsync + useMutation (loading/error/retry), useWallet
├── services/     one HTTP transport, one service per feature area
│   └── mock/     in-browser implementation of the same REST contract
├── components/
│   ├── common/   reusable UI primitives
│   ├── layout/   shell: sidebar, navbar, wallet button
│   ├── credentials/ + verification/  domain components
├── pages/        one file per screen
└── utils/        constants (enums, config), formatters
```

Two rules hold the structure together:

1. **No component calls `fetch`.** Every request goes through `services/api.js`,
   which decides between the mock API and the real API. That is why switching
   modes needs no component changes.
2. **Status vocabularies live in `utils/constants.js`** and are rendered by a
   single `StatusBadge`, so a status means the same thing and looks the same on
   every screen.

### Where the responsibilities sit

| Layer | Owns |
|-------|------|
| React frontend | Interaction, dashboards, forms, sharing flow, status display, error handling |
| Spring Boot API | Authentication, RBAC, business rules, credential metadata, verification orchestration, audit |
| Smart contract | Issuer authorisation, credential anchoring, credential status, revocation, on-chain verification state |

## Installation

Requires Node.js 18 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

The application runs at `http://localhost:5173`.

## Environment variables

Configured in `.env`, which is git-ignored. Never commit it.

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Base URL of the Spring Boot API, e.g. `http://localhost:8080/api` |
| `VITE_USE_MOCK` | `true` for mock mode, `false` for real API mode |
| `VITE_API_TIMEOUT` | Request timeout in ms (real API mode) |
| `VITE_CHAIN_NAME` | Network label shown in the UI |
| `VITE_CHAIN_ID` | Expected EVM chain id (hex); used to warn on network mismatch |
| `VITE_EXPLORER_BASE_URL` | Block explorer used to link real transaction references |

Vite exposes any `VITE_`-prefixed variable to the browser. Do not put secrets in
them.

## Mock mode

With `VITE_USE_MOCK=true` the entire application runs with no backend. Requests
are served by `src/services/mock/mockApi.js`, which implements the same
endpoints, the same authorisation rules and the same error codes as the real API
is expected to. State persists in `localStorage`, so signing out of one role and
into another preserves what the previous role did — which is what the
demonstration below depends on.

Demo accounts, all with password `demo1234`:

| Account | Role |
|---------|------|
| `admin@decentraid.local` | Admin |
| `issuer@decentraid.local` | Issuer — Rajarambapu Institute of Technology |
| `holder@decentraid.local` | Holder — Aarav Sharma |
| `verifier@decentraid.local` | Verifier — Zensar Talent Screening |

Seeded alongside them: a pending issuer (NexaSkills Academy, for the authorise
step), a suspended issuer, a second holder, and three credentials — CERT-001
(active), DEG-2024-112 (no expiry) and INT-2025-007 (already past its expiry, so
the EXPIRED state can be shown).

**Reset demo data** from the link under the demo accounts on the login page.

Transaction references generated in mock mode are simulated and are always
labelled as such in the interface. No fabricated hashes are ever shown in real
API mode.

## Real API mode

Set `VITE_USE_MOCK=false` and point `VITE_API_BASE_URL` at the running backend.
No other change is required. The transport attaches
`Authorization: Bearer <token>` to every request, converts HTTP failures into
readable messages, and never shows a raw server error to the user.

## Demonstration flow

The flow the project is built to demonstrate, and which the automated test
covers end to end:

1. Sign in as Admin → authorise NexaSkills Academy
2. Sign in as Issuer → issue a Java Certification to the holder's wallet address
3. Sign in as Holder → the credential appears
4. Sign in as Verifier → create a verification request for it
5. Sign in as Holder → review the request, select the credential, approve
6. Sign in as Verifier → the result reads **VALID**
7. Sign in as Issuer → revoke the credential
8. Sign in as Verifier → check again; the result now reads **REVOKED**

The demo holder's wallet address is shown on the issuance and request forms in
mock mode, so nothing needs to be memorised during a viva.

## Routes

| Route | Role | Screen |
|-------|------|--------|
| `/login` | — | Sign in |
| `/admin` | Admin | Registry overview |
| `/admin/issuers` | Admin | Issuer management |
| `/admin/audit` | Admin | Audit activity |
| `/issuer` | Issuer | Issuer overview |
| `/issuer/issue` | Issuer | Issue credential |
| `/issuer/credentials` | Issuer | Issued credentials |
| `/holder` | Holder | My credentials |
| `/holder/requests` | Holder | Verification requests |
| `/verifier` | Verifier | Verifier overview |
| `/verifier/request` | Verifier | New verification request |
| `/verifier/requests` | Verifier | My requests |
| `/credentials/:credentialId` | Any signed-in role | Credential detail |
| `/verification/:credentialId` | Verifier, Admin | Verification result |
| `/404` | — | Not found |

Signing in redirects to the dashboard for the role the backend returned. A user
who reaches a route outside their role is redirected to their own dashboard.

## API integration

Endpoints the frontend calls:

```
POST   /api/auth/login
GET    /api/users/me
GET    /api/credentials                        ?holderId&issuerId&type&status
POST   /api/credentials
GET    /api/credentials/{id}
POST   /api/credentials/{id}/revoke
POST   /api/verification-requests
GET    /api/verification-requests              ?status
POST   /api/verification-requests/{id}/respond
GET    /api/verification/{credentialId}
GET    /api/admin/issuers                      (assumed)
POST   /api/admin/issuers
POST   /api/admin/issuers/{id}/status          (assumed)
GET    /api/audit                              ?limit
```

### Assumptions

The supplied contract specifies only `POST /api/admin/issuers`. Two endpoints
were added because the admin screens need them, and both are confined to
`adminService.js` so a contract change touches one file:

- `GET /api/admin/issuers` — the issuer table needs to list issuers
- `POST /api/admin/issuers/{id}/status` — suspending and restoring an issuer

Further assumptions, all isolated in the service layer:

- `POST /api/credentials` and `POST /api/verification-requests` accept
  `holderReference`, which may be a wallet address or an email
- `POST /api/verification-requests/{id}/respond` takes
  `{ decision: 'APPROVE' | 'REJECT', credentialId }`
- List endpoints accept the query filters shown above
- The backend scopes `GET /api/credentials` by the caller's role rather than
  returning every record
- `GET /api/verification/{credentialId}` re-evaluates on each call rather than
  replaying a stored result — this is what makes a revoked credential report as
  revoked immediately

### Data models

```js
User               { id, walletAddress, name, email, organization, role, status }
Credential         { id, credentialId, holderId, issuerId, type, title, hash,
                     status, issuedAt, expiresAt, documentReference }
VerificationRequest{ id, verifierId, holderId, credentialId, credentialType,
                     purpose, status, createdAt, respondedAt, sharedCredentialId }
VerificationResult { id, requestId, credentialId, result, reason, checkedAt,
                     transactionRef, snapshot }
```

Credential status is `ACTIVE`, `REVOKED` or `EXPIRED`. Verification results are
`VALID`, `INVALID`, `REVOKED` or `EXPIRED`. Expiry is derived at read time, so a
record stored as `ACTIVE` still reads `EXPIRED` once it passes its validity
window.

## Testing

```bash
npm test            # both suites
npm run test:flow   # the demonstration flow against the mock API
npm run test:render # mounts every route in jsdom, for all four roles
```

`test:flow` walks the full eight-step demonstration and also checks the failure
paths: duplicate credential IDs, unknown holders, double revocation, answering a
request twice, a verifier reading a credential that was never shared, a holder
reaching the audit log, and unauthenticated requests.

`test:render` mounts the real application in jsdom and asserts each route
renders for each role, failing if React logs any warning or error.

Not covered: real-browser layout, responsive breakpoints and click-throughs.
Those still need a manual pass.

## Security notes

- Private keys and seed phrases are never requested, handled or stored. Signing
  happens inside the user's wallet.
- No identity numbers, phone numbers or addresses are placed in any
  blockchain-related payload.
- Secrets belong in `.env`, which is git-ignored.
- Frontend role checks are for navigation only. The backend must enforce
  authorisation on every request — the mock API enforces the same rules so those
  failure paths are exercised during development.

## Build

```bash
npm run build     # production build to dist/
npm run preview   # serve the built output
```
