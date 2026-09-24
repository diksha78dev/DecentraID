/**
 * Mounts the real application in jsdom and walks every route for every role.
 * Catches runtime faults a production build cannot see: bad imports, invalid
 * DOM nesting, React warnings, and crashes inside effects.
 */
import { StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { STORAGE_KEYS } from '../src/utils/constants';
import { handleMockRequest } from '../src/services/mock/mockApi';

const problems = [];
const origError = console.error;
const origWarn = console.warn;
console.error = (...args) => {
  problems.push('error: ' + args.map(String).join(' '));
  origError(...args);
};
console.warn = (...args) => {
  const text = args.map(String).join(' ');
  problems.push('warn: ' + text);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function signIn(email) {
  const res = await handleMockRequest('POST', '/auth/login', { email, password: 'demo1234' });
  localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
}

let checks = 0;
let failures = 0;

async function visit(path, expectedText, settle = 2000) {
  window.history.pushState({}, '', path);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
  // Several short flushes rather than one long wait: the screens chain async
  // boundaries (session restore -> mount -> data load), and each needs its own
  // act flush before the next can start.
  for (let i = 0; i < Math.ceil(settle / 200); i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await wait(200);
    });
  }

  const text = host.textContent || '';
  const ok = text.includes(expectedText);
  checks += 1;
  if (!ok) {
    failures += 1;
    console.log('  FAIL  ' + path + ' — expected to find "' + expectedText + '"');
    console.log('        rendered: ' + text.slice(0, 220));
  } else {
    console.log('  PASS  ' + path);
  }

  await act(async () => {
    root.unmount();
  });
  host.remove();
}

async function main() {
  console.log('\nDecentraID — route render checks\n');

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  await visit('/login', 'Sign in');
  await visit('/holder', 'Sign in'); // unauthenticated users are bounced to login
  await visit('/404', 'This page does not exist');

  await signIn('admin@decentraid.local');
  await visit('/admin', 'Registry overview');
  await visit('/admin/issuers', 'Issuer management');
  await visit('/admin/audit', 'Audit activity');
  await visit('/issuer', 'Registry overview'); // wrong role redirects to own home

  await signIn('issuer@decentraid.local');
  await visit('/issuer', 'Rajarambapu Institute of Technology');
  await visit('/issuer/issue', 'Issue credential');
  await visit('/issuer/credentials', 'Issued credentials');
  await visit('/credentials/CERT-001', 'Java Certification');

  await signIn('holder@decentraid.local');
  await visit('/holder', 'Aarav Sharma');
  await visit('/holder/requests', 'Verification requests');

  await signIn('verifier@decentraid.local');
  await visit('/verifier', 'Verification overview');
  await visit('/verifier/request', 'New verification request');
  await visit('/verifier/requests', 'Verification requests');

  console.log('\n' + (checks - failures) + '/' + checks + ' routes rendered');

  if (problems.length) {
    console.log('\nConsole output during render:');
    [...new Set(problems)].forEach((p) => console.log('  ' + p.slice(0, 300)));
  } else {
    console.log('No React warnings or errors logged.');
  }

  console.error = origError;
  console.warn = origWarn;
  process.exit(failures || problems.length ? 1 : 0);
}

main().catch((err) => {
  console.error = origError;
  console.log('Render test crashed:', err);
  process.exit(1);
});
