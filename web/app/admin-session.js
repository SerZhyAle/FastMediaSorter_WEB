import { createAdminStream, SessionEnded } from '../data/admin-stream.js';
import { randomPassword } from '../data/random-password.js';
import { signInRowId } from './admin-messages.js';

// The state of the server administration surface (feature matrix rows 32-37) over one
// administration stream (DEVICE-EXCHANGE REMOTE-ADMIN). The view reads `state` and calls the
// methods; every change is announced through onChange.
//
// Carried here: invitation.create/list/withdraw, shared_invitation.status/set, account.list/add/
// limits/passwd/remove, device.list/revoke, grant.list. Never sent: grant.add and grant.remove
// (uncarried by the contract) and every host setting.
//
// One-time values - an invitation's code and connection string, a generated account password - live
// in `state.oneTime` until the person dismisses them or the session ends, and in no list.

export const ownLimitKeys = Object.freeze(['devicesPerAccount', 'resourcesPerAccount', 'broadcastsPerAccount', 'broadcastsPerDevice', 'clipboardMaxBytes']);
const mebibyte = 1024 * 1024;

function emptyData() {
  return { accounts: [], invitations: [], shared: null, details: null };
}

export function createAdminSession({ url, Socket, onChange = () => {}, makePassword = randomPassword }) {
  let stream = null;
  const state = {
    phase: 'signin',
    message: null,
    notice: null,
    busy: false,
    expiresSeconds: null,
    oneTime: null,
    ...emptyData(),
  };

  function changed() {
    onChange(state);
  }

  function endSession(rowId) {
    console.debug("S0014: administration session returned to sign-in")
    stream = null;
    Object.assign(state, { phase: 'signin', busy: false, expiresSeconds: null, oneTime: null, notice: null, ...emptyData() });
    state.message = rowId ? { kind: 'row', id: rowId } : null;
    changed();
  }

  // One request; a failed reply becomes the notice, a session end returns the page to sign-in.
  async function run(op, members) {
    try {
      console.debug("S0014: administration request sent")
      const reply = await stream.request(op, members);
      if (!reply.ok) state.notice = { kind: 'reply', code: reply.code };
      return reply;
    } catch (error) {
      if (error instanceof SessionEnded) return null;
      throw error;
    }
  }

  // Serialises the surface's actions: one at a time, a second one while busy is ignored.
  async function act(work) {
    if (state.phase !== 'ready' || state.busy) return false;
    state.busy = true;
    state.notice = null;
    changed();
    try {
      return await work();
    } finally {
      if (state.phase === 'ready') {
        state.busy = false;
        changed();
      }
    }
  }

  async function loadLists() {
    const accounts = await run('account.list');
    if (!accounts?.ok) return;
    state.accounts = Array.isArray(accounts.data) ? accounts.data : [];
    const invitations = await run('invitation.list');
    if (!invitations?.ok) return;
    state.invitations = Array.isArray(invitations.data) ? invitations.data : [];
    const shared = await run('shared_invitation.status');
    if (!shared?.ok) return;
    state.shared = shared.data ?? { enabled: false };
    if (state.details && !state.accounts.some((account) => account.login === state.details.login)) state.details = null;
  }

  async function loadDetails(login) {
    const devices = await run('device.list', { login });
    if (!devices?.ok) return;
    const grants = await run('grant.list', { login });
    if (!grants?.ok) return;
    state.details = {
      login,
      devices: Array.isArray(devices.data) ? devices.data : [],
      grants: Array.isArray(grants.data) ? grants.data : [],
    };
  }

  return Object.freeze({
    state,

    async signIn(password) {
      if (state.phase !== 'signin' || !password) return;
      state.phase = 'signing-in';
      state.message = null;
      changed();
      const current = createAdminStream({ url, Socket, onEnd: (reason) => {
        if (stream === current) endSession(reason);
      } });
      stream = current;
      const outcome = await current.signIn(password);
      console.debug("S0014: administration sign-in answered")
      if (stream !== current) return;
      if (outcome.kind === 'ok') {
        state.phase = 'ready';
        state.expiresSeconds = outcome.expiresSeconds;
        changed();
        await act(loadLists);
        return;
      }
      if (outcome.kind === 'cancelled') {
        endSession(null);
        return;
      }
      endSession(outcome.kind === 'refused' ? signInRowId(outcome.reason) : outcome.kind);
    },

    // Leaving the surface, signing out or the page going to the background: the stream closes,
    // the token and every one-time value are dropped, and coming back asks for the password.
    signOut() {
      const current = stream;
      stream = null;
      current?.close();
      endSession(null);
    },

    refresh() {
      return act(loadLists);
    },

    dismissMessage() {
      state.message = null;
      state.notice = null;
      changed();
    },

    createInvitation(kind, expectedLogin = '') {
      return act(async () => {
        const members = expectedLogin ? { kind, expectedLogin } : { kind };
        const reply = await run('invitation.create', members);
        if (!reply?.ok) return;
        const { code, connectionString } = reply.data ?? {};
        state.oneTime = { kind: 'invitation', invitationKind: kind, code: String(code ?? ''), connectionString: String(connectionString ?? '') };
        await loadLists();
      });
    },

    withdrawInvitation(codeHash) {
      return act(async () => {
        const reply = await run('invitation.withdraw', { codeHash });
        if (reply?.ok) state.notice = { kind: 'done', key: 'adminInvitationWithdrawn' };
        if (reply) await loadLists();
      });
    },

    // An empty password turns the shared invitation off (item AP).
    setSharedInvitation(password, kind) {
      return act(async () => {
        const reply = await run('shared_invitation.set', { password, kind });
        if (reply?.ok) state.notice = { kind: 'done', key: password ? 'adminSharedSaved' : 'adminSharedCleared' };
        if (reply) await loadLists();
      });
    },

    // An empty password makes one in the page and shows it once in the result (row 34).
    addAccount(login, kind, password = '') {
      return act(async () => {
        const generated = password ? null : makePassword();
        const reply = await run('account.add', { login, password: password || generated, kind });
        if (!reply?.ok) return;
        state.oneTime = generated ? { kind: 'password', login, password: generated } : null;
        state.notice = { kind: 'done', key: reply.data?.overCap ? 'adminAccountAddedOverCap' : 'adminAccountAdded', values: { login } };
        await loadLists();
      });
    },

    // `limits` holds whole numbers or null by own-limit key; clipboardMaxBytes arrives in MiB.
    // Every value null clears the account's own limits.
    setLimits(login, limits) {
      return act(async () => {
        const own = {};
        for (const key of ownLimitKeys) {
          const value = limits[key];
          if (value === null || value === undefined) continue;
          own[key] = key === 'clipboardMaxBytes' ? value * mebibyte : value;
        }
        const reply = await run('account.limits', { login, limits: own });
        if (reply?.ok) state.notice = { kind: 'done', key: 'adminLimitsSaved', values: { login } };
        if (reply) await loadLists();
      });
    },

    // The typed password is sent once and never shown back; every device of the account is
    // signed out (item AT).
    resetPassword(login, password) {
      return act(async () => {
        const reply = await run('account.passwd', { login, password });
        if (!reply?.ok) return;
        state.notice = { kind: 'done', key: 'adminPasswordReset', values: { login, count: Number(reply.data?.signedOut ?? 0) } };
        if (state.details?.login === login) await loadDetails(login);
      });
    },

    removeAccount(login) {
      return act(async () => {
        const reply = await run('account.remove', { login });
        if (reply?.ok) {
          state.notice = { kind: 'done', key: 'adminAccountRemoved', values: { login } };
          if (state.details?.login === login) state.details = null;
        }
        if (reply) await loadLists();
      });
    },

    openAccount(login) {
      return act(() => loadDetails(login));
    },

    closeAccount() {
      state.details = null;
      changed();
    },

    revokeDevice(login, deviceId) {
      return act(async () => {
        const reply = await run('device.revoke', { login, deviceId });
        if (reply?.ok) state.notice = { kind: 'done', key: 'adminDeviceRevoked' };
        if (reply) {
          await loadDetails(login);
          await loadLists();
        }
      });
    },

    dismissOneTime() {
      state.oneTime = null;
      changed();
    },
  });
}
