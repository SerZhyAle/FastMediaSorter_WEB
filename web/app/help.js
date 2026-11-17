// The one help resolver (CONTEXT-HELP rule 17): a surface id and an optional element entry in,
// the target out. The F1 key and every help button call it; no surface carries help code of its own.
//
// `helpEntries` lists every significant element the help explains. `selector` finds the element;
// `container`, where set, widens the match to the enclosing group, so one entry explains a whole
// group of radio buttons or a labelled field. The marker order is the document order on screen.

export const helpEntries = Object.freeze([
  { id: 'nav.back', selector: '[data-command="nav.back"]' },
  { id: 'nav.menu', selector: '[data-command="nav.menu"]' },
  { id: 'app.help', selector: '[data-command="app.help"]' },
  { id: 'app.settings', selector: '[data-command="app.settings"]' },
  { id: 'start.local', selector: 'a.entry[data-surface="local"]' },
  { id: 'start.exchange', selector: 'a.entry[data-surface="exchange"]' },
  { id: 'exchange.admin', selector: 'a.entry[data-surface="admin"]' },
  { id: 'admin.signIn', selector: '#admin-signin' },
  { id: 'admin.session', selector: '#admin-session' },
  { id: 'admin.notice', selector: '#admin-notice' },
  { id: 'admin.oneTime', selector: '#admin-onetime' },
  { id: 'admin.invitations', selector: '#admin-invitations' },
  { id: 'admin.shared', selector: '#admin-shared' },
  { id: 'admin.accounts', selector: '#admin-accounts' },
  { id: 'settings.rail', selector: '#settings-rail' },
  { id: 'settings.theme', selector: 'fieldset[data-choice="theme"]' },
  { id: 'settings.language', selector: 'fieldset[data-choice="language"]' },
  { id: 'settings.inputProfile', selector: 'fieldset[data-choice="input-profile"]' },
  { id: 'settings.size', selector: 'fieldset[data-choice="size"]' },
  { id: 'settings.diagnostic', selector: '[data-command="about.diagnostic"]' },
  { id: 'local.openFolder', selector: '[data-command="local.openFolder"]' },
  { id: 'local.openFiles', selector: '[data-command="local.openFiles"]' },
  { id: 'local.mode', selector: '#local-mode-grid', container: 'fieldset' },
  { id: 'local.sort', selector: '#local-sort', container: '.local-field' },
  { id: 'local.reverse', selector: '#local-reverse', container: 'label' },
  { id: 'local.filter', selector: '#local-filter', container: '.local-field' },
  { id: 'local.kinds', selector: '[data-kind]', container: 'fieldset' },
  { id: 'local.status', selector: '.local-status' },
  { id: 'local.path', selector: '.local-path' },
  { id: 'local.list', selector: '.local-list' },
  { id: 'viewer.previous', selector: '[data-command="viewer.previous"]' },
  { id: 'viewer.next', selector: '[data-command="viewer.next"]' },
  { id: 'viewer.zoomOut', selector: '[data-command="viewer.zoomOut"]' },
  { id: 'viewer.zoomIn', selector: '[data-command="viewer.zoomIn"]' },
  { id: 'viewer.fit', selector: '[data-command="viewer.fit"]' },
  { id: 'viewer.actualSize', selector: '[data-command="viewer.actualSize"]' },
  { id: 'viewer.rotateLeft', selector: '[data-command="viewer.rotateLeft"]' },
  { id: 'viewer.rotateRight', selector: '[data-command="viewer.rotateRight"]' },
  { id: 'viewer.random', selector: '[data-command="viewer.random"]' },
  { id: 'viewer.jump', selector: '[data-command="viewer.jump"]' },
  { id: 'viewer.fullscreen', selector: '[data-command="viewer.fullscreen"]' },
  { id: 'viewer.back', selector: '[data-command="viewer.back"]' },
  { id: 'viewer.destinations', selector: '[data-command="viewer.destinations"]' },
  { id: 'jump.input', selector: '#jump-input', container: '.jump-form' },
  { id: 'destination.choose', selector: '[data-command^="destination.choose."]' },
  { id: 'destination.move', selector: '[data-command^="destination.move."]' },
  { id: 'destination.clear', selector: '[data-command^="destination.clear."]' },
  { id: 'destination.close', selector: '[data-command="destination.close"]' },
  { id: 'slideshow.start', selector: '[data-command="slideshow.start"]' },
  { id: 'slideshow.random', selector: '[data-command="slideshow.random"]' },
  { id: 'slideshow.interval', selector: '#slideshow-interval', container: '.local-field' },
  { id: 'slideshow.shorter', selector: '[data-command="slideshow.shorter"]' },
  { id: 'slideshow.stop', selector: '[data-command="slideshow.stop"]' },
  { id: 'player.seek', selector: '#player-seek', container: '.player-seek-row' },
  { id: 'player.playPause', selector: '[data-command="player.playPause"]' },
  { id: 'player.seekBack10', selector: '[data-command="player.seekBack10"]' },
  { id: 'player.seekForward10', selector: '[data-command="player.seekForward10"]' },
  { id: 'player.slower', selector: '[data-command="player.slower"]' },
  { id: 'player.normalSpeed', selector: '[data-command="player.normalSpeed"]' },
  { id: 'player.faster', selector: '[data-command="player.faster"]' },
  { id: 'player.frameBack', selector: '[data-command="player.frameBack"]' },
  { id: 'player.frameForward', selector: '[data-command="player.frameForward"]' },
  { id: 'player.abLoop', selector: '[data-command="player.abLoop"]' },
  { id: 'player.mute', selector: '[data-command="player.mute"]' },
  { id: 'player.volume', selector: '#player-volume' },
].map((entry) => Object.freeze(entry)));

export const helpButtonEntry = 'app.help';

// A map row by surface id, following `inherit` to the parent (CONTEXT-HELP 0.2 item A). Returns
// null for a `none` row, an `ask: "off"` row (item B) or an unknown surface: then nothing opens.
export function resolveHelp(map, surfaceId, entryId = null) {
  const rows = new Map((map?.surfaces ?? []).map((row) => [row.id, row]));
  let row = rows.get(surfaceId);
  if (!row || row.form === 'none' || row.ask === 'off') return null;
  let anchor = null;
  const seen = new Set();
  while (row.form === 'inherit') {
    if (seen.has(row.id)) return null;
    seen.add(row.id);
    anchor = anchor ?? row.anchor ?? null;
    row = rows.get(row.parent);
    if (!row || row.form === 'none') return null;
  }
  // The help button opens the beginning of the help, never its own entry (0.3 item K).
  const element = entryId && entryId !== helpButtonEntry ? entryId : null;
  return Object.freeze({ surfaceId: row.id, form: row.form, help: row.help, anchor: anchor ?? row.anchor ?? null, element });
}
