// Replays the adopted administration transcript (DEVICE-EXCHANGE vectors/fmsw-245-completion,
// transcript admin-websocket, copied into tests/vectors/admin-websocket.json) through the page's own
// codec and stream, byte for byte, and drives the administration surface's state over a fake
// server. Plain ES module with no DOM: tests/admin.js runs it in a browser page, and a direct call
// under Node runs the same checks.

import { createAdminStream, SessionEnded } from '../web/data/admin-stream.js';
import { decodeFrame, encodeFrame } from '../web/data/exchange-frame.js';
import { createAdminSession } from '../web/app/admin-session.js';
import { messageIds, replyCodeIds, replyMessage, rowMessage, signInRowId } from '../web/app/admin-messages.js';
import { qrCode } from '../web/data/qr-code.js';
import { randomPassword } from '../web/data/random-password.js';

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(text) {
  const bytes = new Uint8Array(text.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(text.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (got ${actual}, expected ${expected})`);
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// A WebSocket stand-in: records what the page sends, lets the test deliver frames and closes.
export function fakeSocketClass(registry) {
  return class FakeSocket {
    constructor(url, protocol) {
      this.url = url;
      this.protocol = protocol;
      this.readyState = 0;
      this.sent = [];
      this.closedWith = null;
      this.listeners = {};
      registry.push(this);
    }

    addEventListener(type, handler) {
      (this.listeners[type] ??= []).push(handler);
    }

    emit(type, event = {}) {
      for (const handler of this.listeners[type] ?? []) handler(event);
    }

    open() {
      this.readyState = 1;
      this.emit('open');
    }

    deliver(bytes) {
      this.emit('message', { data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
    }

    send(bytes) {
      this.sent.push(new Uint8Array(bytes));
    }

    close(code = 1005) {
      if (this.readyState >= 2) return;
      this.closedWith = code;
      this.readyState = 3;
      this.emit('close', { code });
    }

    drop() {
      if (this.readyState >= 2) return;
      this.readyState = 3;
      this.emit('close', { code: 1006 });
    }
  };
}

function streamSteps(transcript, id) {
  return transcript.steps.filter((step) => step.stream === id && !step.http);
}

// Replays one sign-in stream; returns the sign-in outcome and the socket.
async function replaySignIn(transcript, id, password) {
  const sockets = [];
  const Socket = fakeSocketClass(sockets);
  const ended = [];
  const stream = createAdminStream({ url: 'wss://exchange.example.net:22022/v2/ws', Socket, onEnd: (reason) => ended.push(reason) });
  const steps = streamSteps(transcript, id);
  const outcomePromise = stream.signIn(password);
  const socket = sockets[0];
  socket.open();
  const auth = steps[0];
  assertEqual(auth.direction, 'client->server', `${id}: first step`);
  assertEqual(hex(socket.sent[0]), auth.hex, `${id}: admin-auth bytes`);
  return { stream, socket, steps, outcomePromise, ended };
}

async function deliverRest(socket, steps, from) {
  for (const step of steps.slice(from)) {
    if (step.direction !== 'server->client') break;
    if (step.closed) socket.drop();
    else socket.deliver(fromHex(step.hex));
    await tick();
  }
}

export async function runReplay({ vector, check }) {
  const { transcript } = vector;

  await check('the transcript copy is the adopted corpus (contract, sha256 recorded, 8 streams)', () => {
    assertEqual(vector.contract, 'DEVICE-EXCHANGE', 'contract');
    assertEqual(vector.sourceSha256, '5cf90a6f6b1990155dfb346c581b97eb4f690531530f4e7a832219a1156c194b', 'source hash of PROVENANCE.txt');
    assertEqual(transcript.streams.length, 8, 'streams');
  });

  // The page's own frames must equal the producer's bytes; a server frame is read, and its JSON
  // spelling (Go escapes & as &) is the server's, so it is compared by value.
  await check('frame codec: client frames re-encode to their bytes, server frames decode to their JSON', () => {
    let count = 0;
    for (const step of transcript.steps) {
      if (!step.hex) continue;
      const message = decodeFrame(fromHex(step.hex));
      if (step.direction === 'client->server') assertEqual(hex(encodeFrame(message, 262144)), step.hex, `${step.stream} ${message.type}`);
      else assertEqual(JSON.stringify(message), JSON.stringify(JSON.parse(step.json)), `${step.stream} ${message.type}`);
      count += 1;
    }
    assert(count >= 40, `frames replayed: ${count}`);
  });

  await check('frame codec: a wrong length word, a text body, an array and an oversize open frame are refused', () => {
    const good = encodeFrame({ schemaVersion: 2, type: 'bye' });
    const bad = new Uint8Array(good);
    bad[3] += 1;
    let refused = 0;
    for (const sample of [bad, new Uint8Array([0, 0, 0, 1, 0x41]), encodeFrame([1]), new Uint8Array(3)]) {
      try {
        decodeFrame(sample);
      } catch (error) {
        if (error.name === 'FrameError') refused += 1;
      }
    }
    assertEqual(refused, 4, 'refused samples');
    let oversize = false;
    try {
      encodeFrame({ schemaVersion: 2, type: 'admin-auth', password: 'x'.repeat(16400) });
    } catch (error) {
      oversize = error.name === 'FrameError';
    }
    assert(oversize, 'a 16 KiB+ frame before sign-in is not sent');
  });

  const signIns = [
    ['admin-disabled', 'AdminSecretPass1', { kind: 'refused', reason: 'admin-disabled' }],
    ['admin-excluded', 'AdminSecretPass1', { kind: 'unanswered' }],
    ['admin-wrong', 'WrongPassword99!', { kind: 'refused', reason: 'bad-credentials' }],
    ['admin-waiting-slot', 'AnotherWrongPass!', { kind: 'refused', reason: 'bad-credentials' }],
    ['admin-rate-limited', 'ThirdWrongPass!', { kind: 'refused', reason: 'rate-limited' }],
    ['admin-capacity', 'AdminSecretPass1', { kind: 'refused', reason: 'capacity' }],
  ];
  await check('sign-in streams: admin-auth bytes match and each answer maps to its outcome', async () => {
    for (const [id, password, expected] of signIns) {
      const { socket, steps, outcomePromise } = await replaySignIn(transcript, id, password);
      await deliverRest(socket, steps, 1);
      const outcome = await outcomePromise;
      assertEqual(outcome.kind, expected.kind, `${id}: outcome`);
      if (expected.reason) assertEqual(outcome.reason, expected.reason, `${id}: reason`);
      assert(socket.readyState === 3, `${id}: stream closed`);
    }
  });

  await check('a connection that never opens is unreachable, not unanswered', async () => {
    const sockets = [];
    const stream = createAdminStream({ url: 'wss://h:1/v2/ws', Socket: fakeSocketClass(sockets) });
    const outcome = stream.signIn('x');
    sockets[0].drop();
    assertEqual((await outcome).kind, 'unreachable', 'outcome');
    assertEqual(sockets[0].sent.length, 0, 'no password sent');
    assertEqual(sockets[0].protocol, 'fms-exchange-v2', 'subprotocol');
  });

  await check('admin-lapsed: a bad-credentials refusal after admin-auth-ok ends the session as admin-session-ended', async () => {
    const { stream, socket, steps, outcomePromise, ended } = await replaySignIn(transcript, 'admin-lapsed', 'AdminSecretPass1');
    socket.deliver(fromHex(steps[1].hex));
    const outcome = await outcomePromise;
    assertEqual(outcome.kind, 'ok', 'signed in');
    assertEqual(outcome.expiresSeconds, 900, 'idle window');
    const request = stream.request('status').then(() => 'answered', (error) => (error instanceof SessionEnded ? error.reason : String(error)));
    assertEqual(hex(socket.sent[1]), steps[2].hex, 'status request bytes');
    await deliverRest(socket, steps, 3);
    const endedWith = await request;
    assertEqual(endedWith, 'admin-session-ended', 'request rejected');
    assertEqual(ended.join(','), 'admin-session-ended', 'onEnd');
    assertEqual(stream.phase, 'ended', 'phase');
  });

  await check('admin-ops: every carried request is sent byte for byte and every reply read', async () => {
    const { stream, socket, steps, outcomePromise } = await replaySignIn(transcript, 'admin-ops', 'AdminSecretPass1');
    socket.deliver(fromHex(steps[1].hex));
    assertEqual((await outcomePromise).kind, 'ok', 'signed in');
    let index = 2;
    let replies = 0;
    while (index < steps.length) {
      const step = steps[index];
      const sent = JSON.parse(step.json);
      if (sent.type === 'bye') {
        stream.close();
        assertEqual(hex(socket.sent.at(-1)), step.hex, 'bye bytes');
        assertEqual(socket.closedWith, 1000, 'clean close');
        break;
      }
      const { schemaVersion, type, id, token, op, ...members } = sent;
      const pending = stream.request(op, members);
      assertEqual(hex(socket.sent.at(-1)), step.hex, `${op} request bytes`);
      const answer = steps[index + 1];
      socket.deliver(fromHex(answer.hex));
      const reply = await pending;
      const expected = JSON.parse(answer.json);
      assertEqual(reply.ok, expected.ok, `${op} ok`);
      if (!expected.ok) assertEqual(reply.code, expected.code, `${op} code`);
      replies += 1;
      index += 2;
    }
    assertEqual(replies, 18, 'operations replayed');
  });

  await check('one request at a time: a second request while one is pending is refused locally', async () => {
    const { stream, socket, steps, outcomePromise } = await replaySignIn(transcript, 'admin-ops', 'AdminSecretPass1');
    socket.deliver(fromHex(steps[1].hex));
    await outcomePromise;
    const first = stream.request('status').catch((error) => error);
    let refused = false;
    try {
      await stream.request('account.list');
    } catch (error) {
      refused = !(error instanceof SessionEnded);
    }
    assert(refused, 'second request refused');
    assertEqual(socket.sent.length, 2, 'nothing else sent');
    stream.close();
    assert((await first) instanceof SessionEnded, 'the pending request ends with the stream');
  });

  // The surface's state over a fake server answering from the transcript's replies.
  const replyByOp = new Map();
  const requestByOp = new Map();
  const ops = streamSteps(transcript, 'admin-ops');
  for (let i = 2; i + 1 < ops.length; i += 2) {
    const request = JSON.parse(ops[i].json);
    if (request.type !== 'admin-request') continue;
    requestByOp.set(request.op, request);
    replyByOp.set(request.op, JSON.parse(ops[i + 1].json));
  }
  const authOk = JSON.parse(ops[1].json);

  async function sessionWithServer(answer = (request) => replyByOp.get(request.op)) {
    const sockets = [];
    const Socket = fakeSocketClass(sockets);
    const seen = [];
    const session = createAdminSession({ url: 'wss://exchange.example.net:22022/v2/ws', Socket, makePassword: () => 'GeneratedPassw0rdAbc' });
    const server = async () => {
      const socket = sockets.at(-1);
      let handled = 0;
      for (let rounds = 0; rounds < 400 && socket.readyState === 1; rounds += 1) {
        while (handled < socket.sent.length) {
          const message = decodeFrame(socket.sent[handled]);
          handled += 1;
          seen.push(message);
          if (message.type === 'admin-auth') socket.deliver(encodeFrame(authOk));
          else if (message.type === 'admin-request') {
            const reply = answer(message);
            if (reply === 'lapse') {
              socket.deliver(encodeFrame({ schemaVersion: 2, type: 'refused', reason: 'bad-credentials' }));
              socket.close(1000);
            } else {
              socket.deliver(encodeFrame({ ...(reply ?? { schemaVersion: 2, type: 'admin-reply', ok: false, code: 'bad-request' }), id: message.id }, 262144));
            }
          }
        }
        await tick();
      }
    };
    const signedIn = session.signIn('AdminSecretPass1');
    sockets.at(-1).open();
    const serving = server();
    await signedIn;
    return { session, seen, sockets, serving };
  }

  function membersOf(message) {
    const { schemaVersion, type, id, token, ...rest } = message;
    return JSON.stringify(rest);
  }

  function transcriptMembers(op) {
    const { schemaVersion, type, id, token, ...rest } = requestByOp.get(op);
    return JSON.stringify(rest);
  }

  await check('surface: sign-in loads accounts, invitations and the shared invitation, nothing else', async () => {
    const { session, seen, sockets } = await sessionWithServer();
    await tick();
    assertEqual(session.state.phase, 'ready', 'phase');
    assertEqual(seen.filter((m) => m.type === 'admin-request').map((m) => m.op).join(','), 'account.list,invitation.list,shared_invitation.status', 'requests');
    assertEqual(session.state.accounts[0].login, 'alice', 'accounts read');
    assertEqual(session.state.invitations.length, 1, 'invitations read');
    assertEqual(session.state.shared.enabled, false, 'shared read');
    session.signOut();
    assertEqual(decodeFrame(sockets[0].sent.at(-1)).type, 'bye', 'bye on sign-out');
    assertEqual(session.state.phase, 'signin', 'back to sign-in');
    assertEqual(session.state.accounts.length, 0, 'lists dropped');
  });

  await check('surface: each operation sends exactly the members of the transcript', async () => {
    const { session, seen } = await sessionWithServer();
    await session.addAccount('bob', 'member', 'BobPassword123!');
    await session.setLimits('bob', { devicesPerAccount: 4, resourcesPerAccount: null, broadcastsPerAccount: null, broadcastsPerDevice: null, clipboardMaxBytes: null });
    await session.resetPassword('bob', 'NewBobPassword123!');
    await session.createInvitation('member');
    const created = { ...session.state.oneTime };
    session.dismissOneTime();
    await session.withdrawInvitation('08cdb464ff091c163c8f613993c8841bef37d96d02b13d2dc7fb8f52bc093e6c');
    await session.setSharedInvitation('SharedPassw0rdTest!', 'guest');
    await session.openAccount('alice');
    await session.revokeDevice('alice', 'non-existent-device-id');
    const revokeNotice = session.state.notice;
    await session.removeAccount('bob');
    const sent = new Map(seen.filter((m) => m.type === 'admin-request').map((m) => [m.op, m]));
    for (const op of ['account.add', 'account.limits', 'account.passwd', 'invitation.create', 'invitation.withdraw', 'shared_invitation.set', 'device.list', 'device.revoke', 'grant.list', 'account.remove']) {
      assert(sent.has(op), `${op} sent`);
      assertEqual(membersOf(sent.get(op)), transcriptMembers(op), `${op} members`);
    }
    assertEqual(created.kind, 'invitation', 'one-time invitation');
    assertEqual(created.code, 'ov-XE90wR-a01wACHjnV4w', 'code shown once');
    assert(created.connectionString.startsWith('FMSEXCH1:'), 'connection string from the reply');
    assertEqual(session.state.oneTime, null, 'dismissed');
    assertEqual(revokeNotice?.code, 'not-found', 'reply code kept as the notice');
    const never = ['grant.add', 'grant.remove', 'host.settings', 'policy.set', 'account.kind', 'device.pairing-code', 'status'];
    assert(!seen.some((m) => never.includes(m.op)), 'no uncarried or unordered operation sent');
    session.signOut();
  });

  await check('surface: an empty password makes one in the page, sent once and shown once', async () => {
    const { session, seen } = await sessionWithServer((request) => (request.op === 'account.add'
      ? { schemaVersion: 2, type: 'admin-reply', ok: true, data: { login: request.login, overCap: true } }
      : replyByOp.get(request.op)));
    await session.addAccount('carol', 'guest');
    const add = seen.find((m) => m.op === 'account.add');
    assertEqual(add.password, 'GeneratedPassw0rdAbc', 'generated password sent');
    assertEqual(add.kind, 'guest', 'kind');
    assertEqual(session.state.oneTime.password, 'GeneratedPassw0rdAbc', 'shown once');
    assertEqual(session.state.notice.key, 'adminAccountAddedOverCap', 'over the cap said');
    await session.refresh();
    session.signOut();
    assertEqual(session.state.oneTime, null, 'dropped with the session');
  });

  await check('surface: a lapsed session returns to sign-in with admin-session-ended and drops everything', async () => {
    let lapse = false;
    const { session } = await sessionWithServer((request) => (lapse ? 'lapse' : replyByOp.get(request.op)));
    await session.createInvitation('guest');
    assert(session.state.oneTime, 'one-time value present');
    lapse = true;
    await session.refresh();
    assertEqual(session.state.phase, 'signin', 'phase');
    assertEqual(session.state.message?.id, 'admin-session-ended', 'row');
    assertEqual(session.state.oneTime, null, 'one-time value dropped');
    assertEqual(session.state.accounts.length, 0, 'lists dropped');
  });

  await check('surface: a wrong password shows the administration row of item EU, not the login row', async () => {
    const sockets = [];
    const session = createAdminSession({ url: 'wss://h:1/v2/ws', Socket: fakeSocketClass(sockets) });
    const done = session.signIn('nope');
    sockets[0].open();
    sockets[0].deliver(encodeFrame({ schemaVersion: 2, type: 'refused', reason: 'bad-credentials' }));
    sockets[0].close(1000);
    await done;
    assertEqual(session.state.message.id, 'admin-bad-credentials', 'row id');
    assertEqual(signInRowId('rate-limited'), 'rate-limited', 'other reasons keep their row');
  });

  await check('messages: contract rows and reply codes in EN, RU and UK; unknown codes fall back', () => {
    for (const id of messageIds) {
      for (const language of ['en', 'ru', 'uk']) {
        const message = rowMessage(id, language);
        assert(message.what.trim(), `${id} ${language}`);
      }
    }
    assertEqual(rowMessage('admin-bad-credentials', 'en').what, 'The administrator password is wrong. Type it again - it is set on the server machine.', 'item EU row');
    assertEqual(rowMessage('rate-limited', 'ru').advice, 'Подождите несколько секунд и попробуйте снова: сервер принимает не больше одной попытки в секунду.', 'step sign-in-rate');
    assertEqual(rowMessage('something-new', 'uk').what, 'Сервер відмовив у цьому.', 'generic refusal');
    assertEqual(rowMessage('something-new', 'uk').code, 'something-new', 'code kept for details');
    assertEqual(replyCodeIds.length, 10, 'ten reply codes');
    assertEqual(replyMessage('mystery', 'en').what, replyMessage('internal', 'en').what, 'unknown reply code shows internal');
  });

  await check('one-time helpers: QR fits a connection string; generated passwords meet the policy', () => {
    const string = JSON.parse(ops.find((s) => s.json?.includes('connectionString')).json).data.connectionString;
    const qr = qrCode(string);
    assert(qr && qr.size === qr.version * 4 + 17, 'QR matrix');
    assert(qr.modules[0][0] && qr.modules[6][6] && !qr.modules[7][7], 'finder pattern');
    for (let i = 0; i < 50; i += 1) {
      const password = randomPassword();
      assert(/^[A-Za-z0-9]{20}$/.test(password) && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password), `policy: ${password.length}`);
    }
  });
}

export const replayChecks = 15;
