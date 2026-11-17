import { loadLastScreen, loadPreferences, resolveTheme, saveLastScreen, savePreferences, sizeValues } from './app/preferences.js';
import { getStrings, languageNames } from './app/strings.js';
import { entryRouteForFragment, settingsDestinations, surfaceById, surfaceForRoute } from './app/surfaces.js';
import { formatDate, formatSize } from './app/browse.js';
import { createLocalBrowser } from './app/local-browser.js';
import { createSorter } from './app/sorting.js';
import { createSlideshow } from './app/slideshow.js';
import { createWakeLock } from './data/wake-lock.js';
import { commandChords, destinationSlot, destinationSlots, viewerCommand } from './app/viewer-keys.js';
import { createLocalView } from './ui/local-view.js';
import { buildFrame } from './ui/shell.js';
import { resolveHelp } from './app/help.js';
import { helpText } from './app/help-text.js';
import { loadHelpMap } from './data/help-map-source.js';
import { buildReport } from './app/diagnostic-report.js';
import { readBrowserFacts } from './data/browser-facts.js';
import { saveBytes } from './data/file-download.js';
import { log } from './data/log.js';
import { entryForNode, openHelpLayer } from './ui/help-layer.js';
import { createAdminSession } from './app/admin-session.js';
import { getAdminStrings } from './app/admin-strings.js';
import { adminSocketUrl } from './data/admin-stream.js';
import { createAdminView } from './ui/admin-view.js';

// Composition root: owns the route, the preferences and the live system signals, and hands one
// state object to the shell for each frame.

const root = document.getElementById('app');
const html = document.documentElement;
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const pointerOnly = matchMedia('(pointer: fine)').matches && !matchMedia('(any-pointer: coarse)').matches;
const sizeKeys = { 1: 'ordinary', 1.25: 'comfortable', 1.5: 'large', 2: 'veryLarge' };
const sizeOptions = sizeValues.map((value) => ({ value, key: sizeKeys[value] }));

let preferences = loadPreferences(pointerOnly, navigator.languages ?? [navigator.language]);
let surface = surfaceById('start');
let returnTo = '#/';
let lastSettingsRoute = settingsDestinations[0].route;
let drawerOpen = false;
let localBrowser = null;
let localView = null;
let localSorter = null;
let localSlideshow = null;
let helpLayer = null;
let adminSession = null;
let adminView = null;
// The last result of the About diagnostic report: { kind: 'saved', name } or { kind: 'failed' }.
let diagnostic = null;
let diagnosticBusy = false;
const helpMap = loadHelpMap();

function applyRoot() {
  html.lang = preferences.language;
  html.dataset.theme = resolveTheme(preferences.theme, darkQuery.matches);
  html.dataset.inputProfile = preferences.inputProfile;
  html.style.setProperty('--ui-scale', String(preferences.size));
}

function diagnosticNote(strings) {
  if (!diagnostic) return '';
  return diagnostic.kind === 'saved' ? strings.diagnosticSaved.replace('{name}', () => diagnostic.name) : strings.diagnosticFailed;
}

// The status line is a live region already on the page, so the result is written into it in place
// rather than by drawing a new frame, which would not be announced.
function showDiagnosticNote() {
  const node = root.querySelector('#about-diagnostic-status');
  if (node) node.textContent = diagnosticNote(getStrings(preferences.language));
}

// Starts only from the person's own activation of the command; builds the report in memory and hands
// it to the browser as a download. No request is made.
async function saveDiagnosticReport() {
  if (diagnosticBusy) return;
  diagnosticBusy = true;
  try {
    const report = buildReport({
      facts: await readBrowserFacts(),
      preferences,
      resolvedTheme: resolveTheme(preferences.theme, darkQuery.matches),
      log: log.recent(),
    });
    saveBytes(report.filename, report.bytes, 'application/zip');
    diagnostic = { kind: 'saved', name: report.filename };
  } catch (error) {
    log.warn(`diagnostic report was not saved (${error && error.name})`);
    diagnostic = { kind: 'failed' };
  } finally {
    diagnosticBusy = false;
  }
  showDiagnosticNote();
}

function focusKey(node) {
  if (!node || node === document.body) return null;
  if (node.id) return `#${node.id}`;
  if (node.dataset.command) return `[data-command="${node.dataset.command}"]`;
  if (node.dataset.surface && node.tagName === 'A') return `a[data-surface="${node.dataset.surface}"]`;
  return null;
}

// The local surface keeps its browser (the open folder, the position) across frames and
// languages; only its view is rebuilt with the frame.
function mountLocal(strings) {
  localView?.dispose();
  localView = null;
  if (surface.id !== 'local') return;
  const locale = () => preferences.language;
  localBrowser ??= createLocalBrowser({ locale, onChange: (part) => localView?.update(part) });
  localSorter ??= createSorter({ browser: localBrowser, onChange: (part) => localView?.update(part) });
  localSlideshow ??= createSlideshow({ browser: localBrowser, wakeLock: createWakeLock(), onChange: (part) => localView?.update(part) });
  localView = createLocalView({
    browser: localBrowser,
    sorter: localSorter,
    slideshow: localSlideshow,
    strings,
    locale,
    format: { size: formatSize, date: formatDate },
    viewerCommand,
    destinationSlot,
    slots: destinationSlots,
    chords: commandChords,
  });
  root.querySelector('#main').append(localView.root);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    log.info(`clipboard write refused (${error && error.name})`);
    return false;
  }
}

// The administration session lives while its surface is shown; leaving the surface or hiding the
// page closes the stream and drops the token (REMOTE-ADMIN "What the client keeps").
function leaveAdmin() {
  adminSession?.signOut();
  adminSession = null;
  adminView = null;
}

function mountAdmin(strings) {
  adminView = null;
  if (surface.id !== 'admin') {
    leaveAdmin();
    return;
  }
  adminSession ??= createAdminSession({ url: adminSocketUrl(location), onChange: () => adminView?.update() });
  adminView = createAdminView({
    session: adminSession,
    strings: { ...strings, ...getAdminStrings(preferences.language) },
    host: location.host,
    language: preferences.language,
    format: { size: formatSize, date: formatDate },
    copyText,
  });
  root.querySelector('#main').append(adminView.root);
}

function render({ moveFocus = false } = {}) {
  const strings = getStrings(preferences.language);
  const key = moveFocus ? null : focusKey(document.activeElement);
  const frame = buildFrame({
    surface,
    destinations: settingsDestinations,
    preferences,
    languageNames,
    sizeOptions,
    drawerOpen,
    diagnosticNote: diagnosticNote(strings),
  }, strings, actions);
  root.replaceChildren(...frame);
  mountLocal(strings);
  mountAdmin(strings);
  document.title = surface.id === 'start' ? strings.appName : `${strings[surface.titleKey]} - ${strings.appName}`;
  // A control that vanished with the old frame hands focus to the page title, never to the body.
  const target = (key && root.querySelector(key)) || (moveFocus || key ? root.querySelector('#page-title') : null);
  if (target) {
    if (target.id === 'page-title') target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: !moveFocus });
  }
}

// The one way into help for the F1 key and the help button (CONTEXT-HELP rules 1 to 3): the
// element that has the focus picks the entry, the resolver picks the target. Asking again closes it.
async function toggleHelp(node) {
  if (helpLayer) {
    helpLayer.close();
    return;
  }
  const asked = surface;
  const entry = node ? entryForNode(root, node) : null;
  const target = resolveHelp(await helpMap, asked.id, entry?.id ?? null);
  if (!target || asked !== surface || helpLayer) return;
  if (target.form !== 'layer' && target.form !== 'both') {
    log.error(`help map names form ${target.form} for ${target.surfaceId}, which this page does not draw`);
    return;
  }
  const strings = getStrings(preferences.language);
  const language = preferences.language;
  helpLayer = openHelpLayer({
    scope: root,
    title: surface.id === 'start' ? strings.startTitle : strings[surface.titleKey],
    strings,
    text: (id) => helpText(language, id),
    focusEntry: target.element,
    origin: node,
    returnFocus: () => root.querySelector('[data-command="app.help"]'),
    onClose() {
      helpLayer = null;
    },
  });
}

function updatePreferences(change) {
  preferences = { ...preferences, ...change };
  savePreferences(preferences);
  applyRoot();
  render();
}

const actions = {
  openSettings() {
    location.hash = lastSettingsRoute;
  },
  closeSettings() {
    location.hash = returnTo;
  },
  goStart() {
    location.hash = '#/';
  },
  goExchange() {
    location.hash = '#/exchange';
  },
  openHelp(event) {
    toggleHelp(event.currentTarget);
  },
  toggleDrawer() {
    drawerOpen = !drawerOpen;
    render();
    if (drawerOpen) root.querySelector('.rail-item[aria-current="page"]')?.focus();
  },
  setTheme(theme) {
    updatePreferences({ theme });
  },
  setLanguage(language) {
    updatePreferences({ language });
  },
  setInputProfile(inputProfile) {
    updatePreferences({ inputProfile });
  },
  setSize(size) {
    updatePreferences({ size });
  },
  saveDiagnosticReport,
};

function route() {
  helpLayer?.close();
  // An entry link's fragment leaves the address bar at once (REMOTE-ADMIN `administration-link`); reading
  // it opens a surface and never connects.
  const entry = entryRouteForFragment(location.hash);
  if (entry) {
    history.replaceState(null, '', entry);
    console.debug("S0034: administration link opened the operator sign-in")
  }
  const next = surfaceForRoute(location.hash);
  if (!next) {
    history.replaceState(null, '', '#/');
    surface = surfaceById('start');
  } else {
    if (next.kind === 'settings' && surface.kind === 'work') returnTo = surface.route;
    surface = next;
  }
  if (surface.kind === 'work') saveLastScreen(surface.id);
  else lastSettingsRoute = surface.route;
  if (surface.id !== 'settings.about') diagnostic = null;
  // A destination picked in the drawer closes it, so focus moves to the new page's title.
  const pickedInDrawer = drawerOpen;
  drawerOpen = false;
  render({ moveFocus: surface.kind === 'work' || pickedInDrawer });
}

document.addEventListener('keydown', (event) => {
  // Bare F1 only, and only while this page has the focus: the browser's own help stays reachable
  // everywhere else (CONTEXT-HELP rule 1).
  if (event.key === 'F1' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault();
    toggleHelp(document.activeElement);
    return;
  }
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  if (drawerOpen) {
    drawerOpen = false;
    render();
    root.querySelector('[data-command="nav.menu"]')?.focus();
  } else if (surface.kind === 'settings') {
    actions.closeSettings();
  }
});

darkQuery.addEventListener('change', () => {
  if (preferences.theme === 'system') applyRoot();
});

window.addEventListener('hashchange', route);

function hideAdmin() {
  if (!adminSession || adminSession.state.phase === 'signin') return;
  adminSession.signOut();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') hideAdmin();
});
window.addEventListener('pagehide', hideAdmin);

applyRoot();
if (location.hash === '' || location.hash === '#' || location.hash === '#/') {
  const last = surfaceById(loadLastScreen());
  history.replaceState(null, '', last.route);
}
route();
