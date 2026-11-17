import { choiceGroup, commandButton, element, markUnavailable } from './components.js';
import { replyMessage, rowMessage } from '../app/admin-messages.js';
import { ownLimitKeys } from '../app/admin-session.js';
import { qrCode } from '../data/qr-code.js';
import { saveBytes } from '../data/file-download.js';
import { log } from '../data/log.js';

// The server administration surface (feature matrix rows 32-37) drawn from the session's state.
// DOM only: every operation is a method of app/admin-session.js. The view is rebuilt on each state
// change; typed field values and the focus are carried across by element id.

const mebibyte = 1024 * 1024;
const invitationFileName = 'invitation.fmsexch';
const limitFields = Object.freeze([
  { key: 'devicesPerAccount', label: 'adminLimitDevices' },
  { key: 'resourcesPerAccount', label: 'adminLimitResources' },
  { key: 'broadcastsPerAccount', label: 'adminLimitBroadcasts' },
  { key: 'broadcastsPerDevice', label: 'adminLimitBroadcastsPerDevice' },
  { key: 'clipboardMaxBytes', label: 'adminLimitClipboard' },
]);

function fill(text, values = {}) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}

function section(id, title, children) {
  return element('section', { class: 'admin-section', id, 'aria-labelledby': `${id}-title` }, [
    element('h2', { class: 'block-heading', id: `${id}-title`, text: title }),
    ...children,
  ]);
}

function textField({ id, label, hint, type = 'text', autocomplete = 'off', value = '', inputmode }) {
  const hintId = hint ? `${id}-hint` : null;
  return element('div', { class: 'local-field admin-field' }, [
    element('label', { for: id, text: label }),
    element('input', { id, type, class: 'text-field', autocomplete, spellcheck: 'false', value, inputmode, 'aria-describedby': hintId }),
    hint ? element('p', { class: 'explanation', id: hintId, text: hint }) : null,
  ]);
}

function message(container, { what, advice, code }, strings) {
  container.append(element('div', { class: 'admin-message', role: 'alert' }, [
    element('p', { class: 'admin-message-what', text: what }),
    advice ? element('p', { class: 'admin-message-advice', text: advice }) : null,
    element('details', { class: 'admin-message-details' }, [
      element('summary', { text: strings.adminDetails }),
      element('code', { text: code }),
    ]),
  ]));
}

function qrPicture(text, label) {
  const qr = qrCode(text);
  if (!qr) return null;
  const quiet = 4;
  const size = qr.size + quiet * 2;
  let path = '';
  qr.modules.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  }));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'admin-qr');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('shape-rendering', 'crispEdges');
  const back = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  back.setAttribute('class', 'admin-qr-light');
  back.setAttribute('width', String(size));
  back.setAttribute('height', String(size));
  const marks = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  marks.setAttribute('class', 'admin-qr-dark');
  marks.setAttribute('d', path);
  svg.append(back, marks);
  return svg;
}

export function createAdminView({ session, strings, host, language, format, copyText }) {
  const root = element('div', { class: 'admin' });
  const state = session.state;
  let copyNote = '';
  let fieldError = null;

  function date(value) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? format.date(time, language) : String(value ?? '');
  }

  function kindName(kind) {
    return kind === 'guest' ? strings.adminKindGuest : strings.adminKindMember;
  }

  function value(id) {
    return root.querySelector(`#${id}`)?.value ?? '';
  }

  function clear(...ids) {
    for (const id of ids) {
      const node = root.querySelector(`#${id}`);
      if (node) node.value = '';
    }
  }

  function run(promise) {
    Promise.resolve(promise).catch((error) => log.error(`administration action failed (${error && error.name})`));
  }

  function requireField(id) {
    if (value(id).trim()) return true;
    fieldError = id;
    update();
    root.querySelector(`#${id}`)?.focus();
    return false;
  }

  // A modal confirmation naming the target and the consequence; Escape and Cancel keep everything.
  function confirmAction({ text, typeLogin = null, onConfirm }) {
    const dialog = element('dialog', { class: 'admin-dialog', 'aria-labelledby': 'admin-dialog-text' });
    const confirm = commandButton({ id: 'admin.confirm', label: strings.adminConfirm, rank: 'destructive' });
    const cancel = commandButton({ id: 'admin.cancel', label: strings.adminCancel, rank: 'secondary', onActivate: () => dialog.close() });
    const typed = typeLogin ? textField({ id: 'admin-confirm-login', label: fill(strings.adminConfirmTypeLogin, { login: typeLogin }) }) : null;
    confirm.addEventListener('click', () => {
      if (typeLogin && dialog.querySelector('#admin-confirm-login').value.trim() !== typeLogin) {
        dialog.querySelector('#admin-confirm-login').focus();
        return;
      }
      dialog.close();
      onConfirm();
    });
    dialog.append(
      element('p', { id: 'admin-dialog-text', text }),
      typed,
      element('div', { class: 'command-row admin-actions' }, [cancel, confirm]),
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      update();
    });
    root.append(dialog);
    dialog.showModal();
    (typed ? dialog.querySelector('#admin-confirm-login') : cancel).focus();
  }

  function signInView() {
    const password = textField({ id: 'admin-password', label: strings.adminPassword, hint: strings.adminPasswordHint, type: 'password', autocomplete: 'current-password' });
    const signingIn = state.phase === 'signing-in';
    const form = element('form', { class: 'admin-form', id: 'admin-signin-form', novalidate: true }, [
      element('p', { class: 'admin-destination', id: 'admin-destination' }, [
        element('span', { class: 'admin-caption', text: `${strings.adminDestination}: ` }),
        element('strong', { text: host }),
      ]),
      password,
      element('div', { class: 'command-row' }, [
        commandButton({ id: 'admin.signIn', label: strings.adminSignIn, rank: 'primary', attributes: { type: 'submit', 'aria-disabled': signingIn ? 'true' : null } }),
      ]),
      element('p', { class: 'admin-status', role: 'status', text: signingIn ? strings.adminSigningIn : '' }),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (state.phase !== 'signin' || !requireField('admin-password')) return;
      const typed = value('admin-password');
      clear('admin-password');
      run(session.signIn(typed));
    });
    const children = [form];
    if (state.message?.kind === 'row') {
      const holder = element('div');
      message(holder, rowMessage(state.message.id, language), strings);
      children.push(holder);
    }
    return section('admin-signin', strings.adminSignInTitle, children);
  }

  function noticeView() {
    const line = element('div', { class: 'admin-notice', id: 'admin-notice', role: 'status' });
    if (state.notice?.kind === 'reply') message(line, replyMessage(state.notice.code, language), strings);
    else if (state.notice?.kind === 'done') line.append(element('p', { text: fill(strings[state.notice.key], state.notice.values) }));
    else if (state.busy) line.append(element('p', { text: strings.adminWorking }));
    return line;
  }

  // The first block, as on the phone: the signed-in line and Sign out. Refresh follows Sign out as the
  // page's own addition - a page has no pull-to-refresh.
  function statusView() {
    return section('admin-session', strings.adminStatus, [
      element('div', { class: 'admin-session-text' }, [
        element('p', { text: fill(strings.adminSignedIn, { host }) }),
        state.expiresSeconds ? element('p', { class: 'explanation', text: fill(strings.adminIdleWindow, { minutes: Math.round(state.expiresSeconds / 60) }) }) : null,
      ]),
      element('div', { class: 'command-row' }, [
        commandButton({ id: 'admin.signOut', label: strings.adminSignOut, rank: 'secondary', onActivate: () => session.signOut() }),
        commandButton({ id: 'admin.refresh', label: strings.adminRefresh, onActivate: () => run(session.refresh()) }),
      ]),
    ]);
  }

  async function copy(text) {
    copyNote = (await copyText(text)) ? strings.adminCopied : strings.adminCopyFailed;
    const note = root.querySelector('#admin-copy-note');
    if (note) note.textContent = copyNote;
  }

  // A `.fmsexch` file carries the reply's connection string unchanged: UTF-8, one line, no byte-order mark
  // and no trailing line break (DEVICE-EXCHANGE 5.5, "File and QR").
  function saveConnectionString(text) {
    saveBytes(invitationFileName, new TextEncoder().encode(text), 'application/x-fmsexch');
  }

  function oneTimeView() {
    const once = state.oneTime;
    if (!once) return null;
    const rows = [];
    if (once.kind === 'invitation') {
      rows.push(
        element('p', { class: 'explanation', text: strings.adminOneTimeNote }),
        element('p', { class: 'admin-secret' }, [element('span', { class: 'admin-caption', text: `${strings.adminInvitationCode}: ` }), element('code', { text: once.code })]),
        element('p', { class: 'admin-secret' }, [element('span', { class: 'admin-caption', text: `${strings.adminConnectionString}: ` }), element('code', { class: 'admin-wrap', text: once.connectionString })]),
        qrPicture(once.connectionString, strings.adminQrLabel) ?? element('p', { text: strings.adminQrTooLong }),
        element('div', { class: 'command-row' }, [
          commandButton({ id: 'admin.copyCode', label: strings.adminCopyCode, onActivate: () => copy(once.code) }),
          commandButton({ id: 'admin.copyString', label: strings.adminCopyString, onActivate: () => copy(once.connectionString) }),
          commandButton({ id: 'admin.saveString', label: strings.adminSaveString, onActivate: () => saveConnectionString(once.connectionString) }),
          commandButton({ id: 'admin.done', label: strings.adminDone, rank: 'primary', onActivate: () => { copyNote = ''; session.dismissOneTime(); } }),
        ]),
      );
    } else {
      rows.push(
        element('p', { class: 'explanation', text: strings.adminOneTimePasswordNote }),
        element('p', { class: 'admin-secret' }, [element('code', { text: once.password })]),
        element('div', { class: 'command-row' }, [
          commandButton({ id: 'admin.copyPassword', label: strings.adminCopyPassword, onActivate: () => copy(once.password) }),
          commandButton({ id: 'admin.done', label: strings.adminDone, rank: 'primary', onActivate: () => { copyNote = ''; session.dismissOneTime(); } }),
        ]),
      );
    }
    rows.push(element('p', { class: 'admin-status', id: 'admin-copy-note', role: 'status', text: copyNote }));
    const title = once.kind === 'invitation'
      ? fill(strings.adminOneTimeTitleInvitation, { kind: kindName(once.invitationKind) })
      : fill(strings.adminOneTimeTitlePassword, { login: once.login });
    return section('admin-onetime', title, rows);
  }

  function kindChoice(id) {
    return choiceGroup({
      id,
      legend: strings.adminKind,
      value: root.querySelector(`input[name="${id}"]:checked`)?.value ?? 'member',
      options: [
        { value: 'member', label: strings.adminKindMember },
        { value: 'guest', label: strings.adminKindGuest },
      ],
    });
  }

  function chosenKind(id) {
    return root.querySelector(`input[name="${id}"]:checked`)?.value === 'guest' ? 'guest' : 'member';
  }

  function invitationsView() {
    const form = element('form', { class: 'admin-form', novalidate: true }, [
      kindChoice('admin-invitation-kind'),
      textField({ id: 'admin-expected-login', label: strings.adminExpectedLogin, autocomplete: 'off' }),
      element('div', { class: 'command-row' }, [commandButton({ id: 'admin.createInvitation', label: strings.adminCreateInvitation, rank: 'primary', attributes: { type: 'submit' } })]),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const expected = value('admin-expected-login').trim();
      clear('admin-expected-login');
      copyNote = '';
      run(session.createInvitation(chosenKind('admin-invitation-kind'), expected));
    });
    const items = state.invitations.map((invitation) => {
      const hash = String(invitation.codeHash ?? '');
      const lines = [
        element('p', { class: 'admin-item-title', text: fill(strings.adminInvitationLine, { kind: kindName(invitation.kind), date: date(invitation.createdAt) }) }),
        invitation.expectedLogin ? element('p', { text: fill(strings.adminInvitationFor, { login: invitation.expectedLogin }) }) : null,
        element('p', { text: invitation.used ? fill(strings.adminInvitationUsed, { date: date(invitation.usedAt), login: invitation.usedBy ?? '' }) : strings.adminInvitationUnused }),
        element('p', { class: 'explanation', text: fill(strings.adminInvitationHash, { hash: hash.slice(0, 12) }) }),
      ];
      const actions = invitation.used ? null : element('div', { class: 'command-row' }, [
        commandButton({ id: `admin.withdraw.${hash.slice(0, 12)}`, label: strings.adminWithdraw, rank: 'destructive', onActivate: () => confirmAction({ text: strings.adminConfirmWithdraw, onConfirm: () => run(session.withdrawInvitation(hash)) }) }),
      ]);
      return element('li', { class: 'admin-item' }, [element('div', { class: 'admin-item-text' }, lines), actions]);
    });
    return section('admin-invitations', strings.adminInvitations, [
      form,
      items.length ? element('ul', { class: 'admin-list' }, items) : element('p', { class: 'explanation', text: strings.adminNoInvitations }),
    ]);
  }

  function sharedView() {
    const shared = state.shared ?? { enabled: false };
    const form = element('form', { class: 'admin-form', novalidate: true }, [
      textField({ id: 'admin-shared-password', label: strings.adminSharedPassword, type: 'password', autocomplete: 'new-password' }),
      kindChoice('admin-shared-kind'),
      element('div', { class: 'command-row' }, [
        commandButton({ id: 'admin.sharedSave', label: strings.adminSharedSave, rank: 'primary', attributes: { type: 'submit' } }),
        shared.enabled ? commandButton({
          id: 'admin.sharedClear',
          label: strings.adminSharedClear,
          rank: 'destructive',
          onActivate: () => confirmAction({ text: strings.adminConfirmSharedOff, onConfirm: () => run(session.setSharedInvitation('', shared.kind === 'guest' ? 'guest' : 'member')) }),
        }) : null,
      ]),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!requireField('admin-shared-password')) return;
      const typed = value('admin-shared-password');
      clear('admin-shared-password');
      run(session.setSharedInvitation(typed, chosenKind('admin-shared-kind')));
    });
    return section('admin-shared', strings.adminShared, [
      element('p', { class: 'explanation', text: strings.adminSharedHint }),
      element('p', { class: 'admin-item-title', text: shared.enabled ? fill(strings.adminSharedOn, { kind: kindName(shared.kind) }) : strings.adminSharedOff }),
      form,
    ]);
  }

  function limitsSummary(effective = {}) {
    const n = (v) => (Number.isFinite(v) ? String(v) : '-');
    return fill(strings.adminEffectiveLimits, {
      devices: n(effective.devices),
      resources: n(effective.resources),
      broadcasts: n(effective.broadcasts),
      perDevice: n(effective.broadcastsPerDevice),
      clipboard: Number.isFinite(effective.clipboardBytes) ? format.size(effective.clipboardBytes, language) : '-',
    });
  }

  function detailsView(account) {
    const details = state.details;
    const login = account.login;
    const devices = details.devices.map((device) => {
      const deviceState = device.signedOut ? strings.adminSignedOutState : device.online ? strings.adminOnline : strings.adminOffline;
      const line = fill(strings.adminDeviceLine, { state: deviceState, date: date(device.enrolledAt) }) + (device.lastSeen ? `, ${fill(strings.adminLastSeen, { date: date(device.lastSeen) })}` : '');
      const name = String(device.deviceName || device.deviceId);
      return element('li', { class: 'admin-item' }, [
        element('div', { class: 'admin-item-text' }, [element('p', { class: 'admin-item-title', text: name }), element('p', { text: line })]),
        element('div', { class: 'command-row' }, [
          commandButton({
            id: `admin.revoke.${device.deviceId}`,
            label: strings.adminRevoke,
            rank: 'destructive',
            onActivate: () => confirmAction({ text: fill(strings.adminConfirmRevoke, { device: name, login }), onConfirm: () => run(session.revokeDevice(login, device.deviceId)) }),
          }),
        ]),
      ]);
    });
    const grants = details.grants.map((grant, index) => {
      const withdraw = commandButton({ id: `admin.grantWithdraw.${index}`, label: strings.adminWithdraw, rank: 'secondary' });
      const holder = element('div', { class: 'command-row' }, [withdraw]);
      markUnavailable(withdraw, strings.adminGrantWithdrawReason);
      return element('li', { class: 'admin-item' }, [
        element('div', { class: 'admin-item-text' }, [element('p', { text: fill(strings.adminGrantLine, { target: grant.targetId, guest: grant.guest, date: date(grant.grantedAt) }) })]),
        holder,
      ]);
    });

    const own = account.limits ?? {};
    const limitsForm = element('form', { class: 'admin-form', novalidate: true }, [
      element('p', { class: 'explanation', text: strings.adminLimitsHint }),
      element('div', { class: 'admin-limits' }, limitFields.map(({ key, label }) => {
        const raw = own[key];
        const shown = Number.isFinite(raw) ? String(key === 'clipboardMaxBytes' ? Math.round(raw / mebibyte) : raw) : '';
        return textField({ id: `admin-limit-${key}`, label: strings[label], inputmode: 'numeric', value: shown });
      })),
      fieldError === 'admin-limits' ? element('p', { class: 'field-error', role: 'alert', text: strings.adminLimitInvalid }) : null,
      element('div', { class: 'command-row' }, [commandButton({ id: 'admin.saveLimits', label: strings.adminSaveLimits, attributes: { type: 'submit' } })]),
    ]);
    limitsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const limits = {};
      for (const key of ownLimitKeys) {
        const text = value(`admin-limit-${key}`).trim();
        if (text === '') {
          limits[key] = null;
        } else if (/^[0-9]+$/.test(text) && Number.isSafeInteger(Number(text))) {
          limits[key] = Number(text);
        } else {
          fieldError = 'admin-limits';
          update();
          root.querySelector(`#admin-limit-${key}`)?.focus();
          return;
        }
      }
      run(session.setLimits(login, limits));
    });

    const resetForm = element('form', { class: 'admin-form', novalidate: true }, [
      textField({ id: 'admin-reset-password', label: strings.adminResetPassword, hint: strings.adminResetHint, type: 'password', autocomplete: 'new-password' }),
      element('div', { class: 'command-row' }, [commandButton({ id: 'admin.reset', label: strings.adminReset, rank: 'destructive', attributes: { type: 'submit' } })]),
    ]);
    resetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!requireField('admin-reset-password')) return;
      confirmAction({
        text: fill(strings.adminConfirmReset, { login }),
        onConfirm: () => {
          const typed = value('admin-reset-password');
          clear('admin-reset-password');
          run(session.resetPassword(login, typed));
        },
      });
    });

    return element('div', { class: 'admin-details', id: 'admin-details' }, [
      element('h3', { class: 'block-heading', text: strings.adminDevices }),
      devices.length ? element('ul', { class: 'admin-list' }, devices) : element('p', { class: 'explanation', text: strings.adminNoDevices }),
      element('h3', { class: 'block-heading', text: strings.adminGrants }),
      grants.length ? element('ul', { class: 'admin-list' }, grants) : element('p', { class: 'explanation', text: strings.adminNoGrants }),
      element('h3', { class: 'block-heading', text: strings.adminLimits }),
      limitsForm,
      element('h3', { class: 'block-heading', text: strings.adminResetTitle }),
      resetForm,
      element('div', { class: 'command-row admin-actions' }, [
        commandButton({
          id: 'admin.removeAccount',
          label: strings.adminRemoveAccount,
          rank: 'destructive',
          onActivate: () => confirmAction({ text: fill(strings.adminConfirmRemove, { login }), typeLogin: login, onConfirm: () => run(session.removeAccount(login)) }),
        }),
        commandButton({ id: 'admin.closeAccount', label: strings.adminCloseAccount, rank: 'secondary', onActivate: () => session.closeAccount() }),
      ]),
    ]);
  }

  function accountsView() {
    const form = element('form', { class: 'admin-form', novalidate: true }, [
      textField({ id: 'admin-new-login', label: strings.adminLogin, autocomplete: 'off' }),
      kindChoice('admin-account-kind'),
      textField({ id: 'admin-new-password', label: strings.adminNewPassword, type: 'password', autocomplete: 'new-password' }),
      element('div', { class: 'command-row' }, [commandButton({ id: 'admin.addAccount', label: strings.adminAddAccount, rank: 'primary', attributes: { type: 'submit' } })]),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!requireField('admin-new-login')) return;
      const login = value('admin-new-login').trim();
      const typed = value('admin-new-password');
      clear('admin-new-login', 'admin-new-password');
      copyNote = '';
      run(session.addAccount(login, chosenKind('admin-account-kind'), typed));
    });
    const items = state.accounts.map((account) => {
      const open = state.details?.login === account.login;
      return element('li', { class: 'admin-item admin-account' }, [
        element('div', { class: 'admin-item-text' }, [
          element('p', { class: 'admin-item-title', text: account.login }),
          element('p', { text: fill(strings.adminAccountLine, { kind: kindName(account.kind), date: date(account.createdAt), count: account.devices ?? 0 }) }),
          element('p', { class: 'explanation', text: limitsSummary(account.effective) }),
        ]),
        open ? null : element('div', { class: 'command-row' }, [
          commandButton({ id: `admin.manage.${account.login}`, label: strings.adminManage, onActivate: () => run(session.openAccount(account.login)) }),
        ]),
        open ? detailsView(account) : null,
      ]);
    });
    return section('admin-accounts', strings.adminAccounts, [
      form,
      items.length ? element('ul', { class: 'admin-list' }, items) : element('p', { class: 'explanation', text: strings.adminNoAccounts }),
    ]);
  }

  // Status, Accounts, Invitations, Shared invitation: the phone's order. A one-time secret stands directly
  // above the block whose form made it, so it is on screen where the person just pressed the button.
  function readyView() {
    const once = oneTimeView();
    const fromInvitation = state.oneTime?.kind === 'invitation';
    return [statusView(), noticeView(), fromInvitation ? null : once, accountsView(), fromInvitation ? once : null, invitationsView(), sharedView()];
  }

  function update() {
    if (root.querySelector('dialog[open]')) return;
    const values = new Map([...root.querySelectorAll('input[id]')].filter((node) => node.type !== 'radio').map((node) => [node.id, node.value]));
    const checked = [...root.querySelectorAll('input[type="radio"]:checked')].map((node) => node.id);
    const focused = document.activeElement && root.contains(document.activeElement) ? (document.activeElement.id || document.activeElement.dataset.command) : null;
    const body = state.phase === 'ready' ? readyView() : [signInView()];
    root.replaceChildren(...body.filter(Boolean));
    for (const [id, text] of values) {
      const node = root.querySelector(`#${CSS.escape(id)}`);
      if (node) node.value = text;
    }
    for (const id of checked) {
      const node = root.querySelector(`#${CSS.escape(id)}`);
      if (node) node.checked = true;
    }
    if (fieldError && fieldError !== 'admin-limits') {
      const field = root.querySelector(`#${CSS.escape(fieldError)}`);
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.closest('.admin-field')?.append(element('p', { class: 'field-error', role: 'alert', text: strings.adminRequired }));
      }
    }
    fieldError = null;
    if (focused) {
      const target = root.querySelector(`#${CSS.escape(focused)}`) ?? root.querySelector(`[data-command="${CSS.escape(focused)}"]`);
      target?.focus();
    }
  }

  update();
  return Object.freeze({ root, update });
}
