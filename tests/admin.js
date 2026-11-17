// Server administration gate (tickets S0014, S0034). Static ES module: the contract transcript replay of
// tests/admin-replay.js, then the real page in a same-origin frame with a fake server behind its
// WebSocket. A PASS requires every declared check to have executed.

import { runReplay, replayChecks } from './admin-replay.js';
import { decodeFrame, encodeFrame } from '../web/data/exchange-frame.js';
import { getAdminStrings, missingAdminKeys } from '../web/app/admin-strings.js';
import { rowMessage } from '../web/app/admin-messages.js';

// 15 replay checks (tests/admin-replay.js) and 11 page checks.
const declaredChecks = 26;
const pageChecks = 11;
let liveSockets = [];
const results = document.getElementById('results');
const lines = [];
let failures = 0;
let executed = 0;

async function check(name, run) {
  executed += 1;
  try {
    await run();
    lines.push(`ok ${name}`);
  } catch (error) {
    failures += 1;
    lines.push(`FAIL ${name}: ${error && error.message ? error.message : error}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (got ${actual}, expected ${expected})`);
}

async function waitFor(probe, what) {
  for (let tries = 0; tries < 150; tries += 1) {
    const value = probe();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${what}`);
}

const frame = document.getElementById('page');

function loadPage(hash) {
  return new Promise((resolve) => {
    frame.addEventListener('load', () => resolve(frame.contentWindow), { once: true });
    frame.src = `../web/index.html${hash}`;
  });
}

// A new document, as a link opened in a browser tab: changing only the fragment of the frame's address
// would be an in-document navigation with no load event.
async function freshPage(hash) {
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.src = 'about:blank';
  });
  return loadPage(hash);
}

function navigate(win, hash) {
  if (win.location.hash === hash) return Promise.resolve();
  return new Promise((resolve) => {
    win.addEventListener('hashchange', () => resolve(), { once: true });
    win.location.hash = hash;
  });
}

// A fake exchange server behind the page's WebSocket: `answer(message)` returns the envelope to send
// back, 'silent' to close with no frame, or null to say nothing.
function serverSocket(log, answer) {
  return class ServerSocket {
    constructor(url, protocol) {
      this.url = url;
      this.protocol = protocol;
      this.readyState = 0;
      this.listeners = {};
      this.sent = [];
      log.push(this);
      setTimeout(() => {
        this.readyState = 1;
        this.emit('open');
      }, 0);
    }

    addEventListener(type, handler) {
      (this.listeners[type] ??= []).push(handler);
    }

    emit(type, event = {}) {
      for (const handler of this.listeners[type] ?? []) handler(event);
    }

    send(bytes) {
      const message = decodeFrame(new Uint8Array(bytes));
      this.sent.push(message);
      const reply = answer(message);
      setTimeout(() => {
        if (reply === 'silent') {
          this.close(1000);
        } else if (reply) {
          const body = encodeFrame(reply, 262144);
          this.emit('message', { data: body.buffer });
          if (reply.type === 'refused') this.close(1000);
        }
      }, 0);
    }

    close(code = 1005) {
      if (this.readyState >= 2) return;
      this.readyState = 3;
      this.closedWith = code;
      this.emit('close', { code });
    }
  };
}

const envelope = (type, members) => ({ schemaVersion: 2, type, ...members });

function adminServer(overrides = {}) {
  const data = {
    'account.list': [{ login: 'alice', createdAt: '2026-10-07T12:00:00Z', devices: 1, kind: 'member', effective: { devices: 64, resources: 256, broadcasts: 16, broadcastsPerDevice: 4, clipboardBytes: 5368709120 } }],
    'invitation.list': [],
    'shared_invitation.status': { enabled: false },
    'invitation.create': { code: 'ov-XE90wR-a01wACHjnV4w', invitation: { codeHash: '08cdb464ff09', kind: 'member', createdAt: '2026-10-07T12:16:09Z', used: false }, connectionString: 'FMSEXCH1:x=exchange.example.net%3A22022&fp=SHA256%3ACiRPpo2CAv0EWbvrI36dOY5LzLMElp1F4Je4giuncbI&i=ov-XE90wR-a01wACHjnV4w' },
    'device.list': [{ deviceId: 'd1', deviceName: 'Phone', product: 'fms-android', enrolledAt: '2026-10-07T12:00:00Z', online: true }],
    'grant.list': [{ targetId: 'r1', kind: 'resource', guest: 'bob', grantedBy: 'd1', grantedAt: '2026-10-08T12:00:00Z' }],
    ...overrides,
  };
  return (message) => {
    if (message.type === 'admin-auth') return envelope('admin-auth-ok', { token: 't0k', expiresSeconds: 900 });
    if (message.type !== 'admin-request') return null;
    if (message.token !== 't0k') return envelope('refused', { reason: 'bad-credentials' });
    const value = data[message.op];
    return value === undefined ? envelope('admin-reply', { id: message.id, ok: true }) : envelope('admin-reply', { id: message.id, ok: true, data: value });
  };
}

async function signIn(win, doc) {
  const field = await waitFor(() => doc.getElementById('admin-password'), 'the password field');
  field.value = 'AdminSecretPass1';
  doc.querySelector('[data-command="admin.signIn"]').click();
}

async function run() {
  if (replayChecks + pageChecks !== declaredChecks) throw new Error('declared count out of step with the checks');
  const vector = await (await fetch('vectors/admin-websocket.json')).json();
  await runReplay({ vector, check });

  await check('admin strings: every key in EN, RU and UK', () => {
    const missing = missingAdminKeys();
    assert(missing.length === 0, missing.join(', '));
  });

  localStorage.removeItem('fms-web.preferences');
  localStorage.removeItem('fms-web.last-screen');
  const win = await loadPage('#/exchange');
  const doc = win.document;
  const en = getAdminStrings('en');

  await check('the exchange screen offers Server administration, which opens #/admin', async () => {
    const entry = doc.querySelector('a.entry[data-surface="admin"]');
    assert(entry, 'entry present');
    assertEqual(entry.getAttribute('href'), '#/admin', 'route');
    await navigate(win, '#/admin');
    assert(doc.querySelector('#main[data-surface="admin"]'), 'admin surface shown');
  });

  await check('the destination host:port stands before the password field, which is a labelled password input', () => {
    const destination = doc.getElementById('admin-destination');
    const field = doc.getElementById('admin-password');
    assert(destination.textContent.includes(win.location.host), 'host shown');
    assert(destination.compareDocumentPosition(field) & win.Node.DOCUMENT_POSITION_FOLLOWING, 'destination first');
    assertEqual(field.type, 'password', 'type');
    assertEqual(doc.querySelector('label[for="admin-password"]').textContent, en.adminPassword, 'label');
  });

  await check('admin-disabled is shown with the contract row and its code in the details only', async () => {
    const sockets = [];
    win.WebSocket = serverSocket(sockets, (m) => (m.type === 'admin-auth' ? envelope('refused', { reason: 'admin-disabled' }) : null));
    await signIn(win, doc);
    const what = await waitFor(() => doc.querySelector('.admin-message-what'), 'the message');
    assertEqual(what.textContent, rowMessage('admin-disabled', 'en').what, 'row text');
    assertEqual(doc.querySelector('.admin-message-details code').textContent, 'admin-disabled', 'code in details');
    assertEqual(sockets[0].url, `wss://${win.location.host}/v2/ws`, 'same-origin socket');
    assertEqual(doc.getElementById('admin-password').value, '', 'password not kept in the field');
  });

  await check('signed in: accounts and invitations are listed; an invitation is shown once with its QR', async () => {
    const sockets = [];
    liveSockets = sockets;
    win.WebSocket = serverSocket(sockets, adminServer());
    await signIn(win, doc);
    await waitFor(() => doc.getElementById('admin-accounts'), 'the accounts');
    assert(doc.getElementById('admin-session').textContent.includes(win.location.host), 'signed-in host');
    doc.querySelector('[data-command="admin.createInvitation"]').click();
    const once = await waitFor(() => doc.getElementById('admin-onetime'), 'the one-time panel');
    assert(once.textContent.includes('ov-XE90wR-a01wACHjnV4w'), 'code shown');
    assert(once.querySelector('svg.admin-qr path').getAttribute('d').length > 100, 'QR drawn');
  });

  await check('the invitation saves as a .fmsexch file holding the reply connection string and nothing else; Done hides it', async () => {
    const saved = [];
    const realCreate = win.URL.createObjectURL;
    const realClick = win.HTMLAnchorElement.prototype.click;
    win.URL.createObjectURL = (blob) => { saved.push({ blob }); return 'blob:test'; };
    win.HTMLAnchorElement.prototype.click = function click() { saved.at(-1).name = this.download; };
    try {
      doc.querySelector('[data-command="admin.saveString"]').click();
    } finally {
      win.URL.createObjectURL = realCreate;
      win.HTMLAnchorElement.prototype.click = realClick;
    }
    assertEqual(saved.length, 1, 'one file');
    assertEqual(saved[0].name, 'invitation.fmsexch', 'file name');
    assertEqual(saved[0].blob.type, 'application/x-fmsexch', 'media type');
    const expected = 'FMSEXCH1:x=exchange.example.net%3A22022&fp=SHA256%3ACiRPpo2CAv0EWbvrI36dOY5LzLMElp1F4Je4giuncbI&i=ov-XE90wR-a01wACHjnV4w';
    assertEqual(await saved[0].blob.text(), expected, 'content');
    assertEqual(saved[0].blob.size, expected.length, 'no byte-order mark, no line break');
    doc.querySelector('[data-command="admin.done"]').click();
    await waitFor(() => !doc.getElementById('admin-onetime'), 'the panel to go');
    assert(!doc.getElementById('app').textContent.includes('ov-XE90wR'), 'code gone from the page');
  });

  await check('a grant withdrawal is visible, disabled and says where it is done; no grant op is sent', async () => {
    const sockets = liveSockets;
    doc.querySelector('[data-command="admin.manage.alice"]').click();
    const button = await waitFor(() => doc.querySelector('[data-command="admin.grantWithdraw.0"]'), 'the grant row');
    assertEqual(button.getAttribute('aria-disabled'), 'true', 'disabled');
    assertEqual(button.closest('.unavailable').querySelector('.unavailable-reason').textContent, en.adminGrantWithdrawReason, 'reason');
    button.click();
    assert(!sockets.some((s) => s.sent.some((m) => String(m.op).startsWith('grant.') && m.op !== 'grant.list')), 'no grant mutation');
  });

  await check('account deletion asks in a dialog; Cancel sends nothing', async () => {
    const before = doc.querySelectorAll('dialog').length;
    doc.querySelector('[data-command="admin.removeAccount"]').click();
    const dialog = await waitFor(() => doc.querySelector('dialog[open]'), 'the dialog');
    assert(dialog.textContent.includes('alice'), 'names the account');
    assert(dialog.querySelector('#admin-confirm-login'), 'asks to type the login');
    dialog.querySelector('[data-command="admin.cancel"]').click();
    await waitFor(() => doc.querySelectorAll('dialog').length === before, 'the dialog to close');
    assert(doc.querySelector('[data-command="admin.removeAccount"]'), 'account still there');
  });

  await check('leaving the surface sends bye, closes the stream and asks for the password again', async () => {
    const sockets = [];
    win.WebSocket = serverSocket(sockets, adminServer());
    await navigate(win, '#/exchange');
    await navigate(win, '#/admin');
    await signIn(win, doc);
    await waitFor(() => doc.getElementById('admin-accounts'), 'the accounts');
    await navigate(win, '#/exchange');
    const socket = sockets[0];
    assertEqual(socket.sent.at(-1).type, 'bye', 'bye sent');
    assertEqual(socket.readyState, 3, 'closed');
    await navigate(win, '#/admin');
    assert(doc.getElementById('admin-password'), 'password asked again');
  });

  await check('the link #admin opens the operator sign-in, leaves the address bar and connects to nothing', async () => {
    const linked = await freshPage('#admin');
    const page = linked.document;
    await waitFor(() => page.getElementById('admin-password'), 'the password field');
    assert(page.querySelector('#main[data-surface="admin"]'), 'admin surface shown');
    assertEqual(linked.location.hash, '#/admin', 'fragment replaced');
    assert(!page.getElementById('admin-session'), 'not signed in');
    assert(!page.querySelector('.admin-message-what'), 'no connection attempted');
  });

  await check('a fragment that is neither admin nor a route is ignored', async () => {
    localStorage.removeItem('fms-web.last-screen');
    const other = await freshPage('#administrator');
    await waitFor(() => other.document.getElementById('start-title'), 'the start screen');
    assertEqual(other.location.hash, '#/', 'start route');
    assert(!other.document.getElementById('admin-password'), 'no operator sign-in');
  });

  localStorage.removeItem('fms-web.preferences');
  localStorage.removeItem('fms-web.last-screen');

  const counted = executed === declaredChecks;
  const verdict = failures === 0 && counted
    ? `SMOKE: PASS (${executed} checks)`
    : `SMOKE: FAIL (${failures} failed, ${executed} of ${declaredChecks} executed)`;
  results.textContent = [...lines, verdict].join('\n');
  if (verdict.startsWith('SMOKE: PASS')) console.info(verdict);
  else console.error(verdict);
}

run().catch((error) => {
  results.textContent = [...lines, `FAIL unhandled: ${error}`, 'SMOKE: FAIL'].join('\n');
  console.error(`SMOKE: FAIL (${error})`);
});
