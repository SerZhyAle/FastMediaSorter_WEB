import { decodeFrame, encodeFrame, envelope, FrameError, frameLimitAuthenticated, frameLimitOpen } from './exchange-frame.js';
import { log } from './log.js';

// The administration stream of DEVICE-EXCHANGE REMOTE-ADMIN on the WebSocket opening
// (WEB-BINDING `websocket-binding`, `operator-administration`). One stream: `admin-auth` first,
// then one `admin-request` at a time, each answered by one `admin-reply`.
//
// What the stream keeps: the session token in this closure only, never stored, never logged; the
// password is sent once and not kept. Logs carry the envelope type, never its members (item AN).
// The stream keeps no clock of its own and never repeats `admin-auth` (item EV).

export const subprotocol = 'fms-exchange-v2';

// The page administers only the server it was loaded from (the Origin rule of the binding).
export function adminSocketUrl(place) {
  return `wss://${place.host}/v2/ws`;
}

export class SessionEnded extends Error {
  constructor(reason) {
    super(`administration stream ended (${reason})`);
    this.name = 'SessionEnded';
    this.reason = reason;
  }
}

// Sign-in outcomes: { kind: 'ok', expiresSeconds } | { kind: 'refused', reason }
// | { kind: 'unanswered' } | { kind: 'unreachable' }.
// Session end reasons handed to onEnd: 'admin-session-ended' for a lapsed session (a
// `bad-credentials` refusal after `admin-auth-ok`, or a close with no frame), otherwise the
// `refused.reason` the server sent.
export function createAdminStream({ url, Socket = globalThis.WebSocket, onEnd = () => {} }) {
  let socket = null;
  let token = null;
  let phase = 'idle';
  let opened = false;
  let nextId = 1;
  let pending = null;
  let signInSettle = null;

  function send(message, limit) {
    socket.send(encodeFrame(message, limit));
  }

  function settleSignIn(outcome) {
    const settle = signInSettle;
    signInSettle = null;
    if (settle) settle(outcome);
  }

  function end(reason, { notify = true } = {}) {
    if (phase === 'ended') return;
    const wasReady = phase === 'ready';
    phase = 'ended';
    token = null;
    if (socket && socket.readyState <= 1) socket.close(1000);
    if (pending) {
      const { reject } = pending;
      pending = null;
      reject(new SessionEnded(reason));
    }
    if (wasReady && notify) onEnd(reason);
  }

  function onMessage(event) {
    let message;
    try {
      message = decodeFrame(event.data, phase === 'ready' ? frameLimitAuthenticated : frameLimitOpen);
    } catch (error) {
      if (!(error instanceof FrameError)) throw error;
      log.warn(`administration stream: unreadable frame from the server (${error.message})`);
      if (socket.readyState <= 1) socket.close(1002);
      if (phase === 'signing-in') {
        phase = 'ended';
        settleSignIn({ kind: 'unanswered' });
      } else {
        end('admin-session-ended');
      }
      return;
    }
    if (phase === 'signing-in') {
      if (message.type === 'admin-auth-ok' && typeof message.token === 'string' && message.token) {
        token = message.token;
        phase = 'ready';
        settleSignIn({ kind: 'ok', expiresSeconds: Number.isFinite(message.expiresSeconds) ? message.expiresSeconds : null });
      } else if (message.type === 'refused') {
        log.info(`administration sign-in refused (${String(message.reason)})`);
        phase = 'ended';
        if (socket.readyState <= 1) socket.close(1000);
        settleSignIn({ kind: 'refused', reason: String(message.reason ?? '') });
      }
      return;
    }
    if (phase !== 'ready') return;
    if (message.type === 'refused') {
      const reason = message.reason === 'bad-credentials' ? 'admin-session-ended' : String(message.reason ?? '');
      log.info(`administration session ended by the server (${String(message.reason)})`);
      end(reason);
      return;
    }
    if (message.type !== 'admin-reply' || !pending || message.id !== pending.id) return;
    const { resolve } = pending;
    pending = null;
    if (message.ok === true) resolve({ ok: true, data: message.data });
    else resolve({ ok: false, code: typeof message.code === 'string' ? message.code : 'internal' });
  }

  function onClose() {
    if (phase === 'signing-in') {
      phase = 'ended';
      settleSignIn({ kind: opened ? 'unanswered' : 'unreachable' });
      return;
    }
    end('admin-session-ended');
  }

  return Object.freeze({
    get phase() {
      return phase;
    },

    signIn(password) {
      if (phase !== 'idle') return Promise.reject(new Error('the administration stream was already used'));
      phase = 'signing-in';
      return new Promise((resolve) => {
        signInSettle = resolve;
        try {
          socket = new Socket(url, subprotocol);
        } catch (error) {
          log.warn(`administration stream could not be opened (${error && error.name})`);
          phase = 'ended';
          settleSignIn({ kind: 'unreachable' });
          return;
        }
        socket.binaryType = 'arraybuffer';
        socket.addEventListener('open', () => {
          opened = true;
          send(envelope('admin-auth', { password }), frameLimitOpen);
          log.info('administration stream: admin-auth sent');
        });
        socket.addEventListener('message', onMessage);
        socket.addEventListener('close', onClose);
      });
    },

    // One request at a time; a second call while one is pending is refused locally.
    request(op, members = {}) {
      if (phase !== 'ready') return Promise.reject(new SessionEnded('admin-session-ended'));
      if (pending) return Promise.reject(new Error('an administration request is already pending'));
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        pending = { id, resolve, reject };
        send(envelope('admin-request', { id, token, op, ...members }), frameLimitAuthenticated);
      });
    },

    get busy() {
      return pending !== null;
    },

    // Leaving: `bye`, then a clean close; the token is dropped and onEnd is not called.
    close() {
      if (phase === 'ready' && socket.readyState === 1) send(envelope('bye'), frameLimitAuthenticated);
      if (phase === 'signing-in') {
        phase = 'ended';
        if (socket && socket.readyState <= 1) socket.close(1000);
        settleSignIn({ kind: 'cancelled' });
        return;
      }
      end('closed', { notify: false });
    },
  });
}
