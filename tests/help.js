// In-app help gate (ticket S0031, CONTEXT-HELP rule 19). Static ES module: the help map against the
// shell's surface registry, the help texts against the entry catalogue, the resolver, then the real
// page in a same-origin frame. A PASS requires every declared check to have executed.

import { surfaces } from '../web/app/surfaces.js';
import { getStrings, localeCodes } from '../web/app/strings.js';
import { helpEntries, resolveHelp } from '../web/app/help.js';
import { missingHelpTexts } from '../web/app/help-text.js';
import { collectItems, entryForNode } from '../web/ui/help-layer.js';

const declaredChecks = 12;
const forms = new Set(['layer', 'page', 'both', 'inherit', 'none']);
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

const frame = document.getElementById('page');

function loadPage(hash) {
  return new Promise((resolve) => {
    frame.addEventListener('load', () => resolve(frame.contentWindow), { once: true });
    frame.src = `../web/index.html${hash}`;
  });
}

function navigate(win, hash) {
  if (win.location.hash === hash) return Promise.resolve();
  return new Promise((resolve) => {
    win.addEventListener('hashchange', () => resolve(), { once: true });
    win.location.hash = hash;
  });
}

// The page opens help after the map is read, so the layer arrives a few tasks later.
async function waitFor(probe, what) {
  for (let tries = 0; tries < 100; tries += 1) {
    const value = probe();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${what}`);
}

function press(win, target, key, extra = {}) {
  const event = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
  target.dispatchEvent(event);
  return event;
}

// Every control a person can reach on the surface, outside the layer.
function reachableControls(doc) {
  return [...doc.querySelectorAll('#app button, #app a[href], #app input, #app select, #app textarea')]
    .filter((node) => !node.closest('[hidden]') && node.type !== 'file' && node.getBoundingClientRect().width > 0);
}

async function run() {
  const map = await (await fetch('../web/help/help-map.json')).json();

  await check('the help map has one row per registry surface and no other', () => {
    assertEqual(map.schemaVersion, 1, 'schemaVersion');
    const rows = map.surfaces.map((row) => row.id);
    const ids = surfaces.map((surface) => surface.id);
    assertEqual(new Set(rows).size, rows.length, 'no duplicate row');
    const unmapped = ids.filter((id) => !rows.includes(id));
    const orphan = rows.filter((id) => !ids.includes(id));
    assert(unmapped.length === 0, `surface with no row: ${unmapped.join(', ')}`);
    assert(orphan.length === 0, `row with no surface: ${orphan.join(', ')}`);
  });

  await check('every row has a known form, its registry topic and its reasons', () => {
    for (const row of map.surfaces) {
      assert(forms.has(row.form), `${row.id}: form ${row.form}`);
      const surface = surfaces.find((candidate) => candidate.id === row.id);
      if (row.form === 'none' || row.form === 'inherit') {
        assert(typeof row.reason === 'string' && row.reason.trim() !== '', `${row.id}: reason`);
      } else {
        assertEqual(row.help, surface.helpTopic, `${row.id}: help id`);
      }
      if (row.form === 'inherit') assert(map.surfaces.some((other) => other.id === row.parent), `${row.id}: parent`);
      assertEqual(row.name, getStrings('en')[surface.titleKey], `${row.id}: name as the UI shows it`);
    }
  });

  await check('every help entry has its text in EN, RU and UK, and no text is orphaned', () => {
    const ids = helpEntries.map((entry) => entry.id);
    assertEqual(new Set(ids).size, ids.length, 'unique entry ids');
    const missing = missingHelpTexts(ids, localeCodes);
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  await check('the resolver follows inherit, honours none and ask off, and the button opens the top', () => {
    const start = resolveHelp(map, 'start', 'start.local');
    assertEqual(start.form, 'layer', 'form');
    assertEqual(start.element, 'start.local', 'element entry kept');
    assertEqual(resolveHelp(map, 'start', 'app.help').element, null, 'help button opens the top (0.3 item K)');
    const sample = {
      surfaces: [
        { id: 'main', form: 'page', help: 'main' },
        { id: 'rename', form: 'inherit', parent: 'main', anchor: 'step-3', reason: 'one field' },
        { id: 'preview', form: 'inherit', parent: 'main', ask: 'off', reason: 'any touch closes it' },
        { id: 'confirm', form: 'none', reason: 'the text is the explanation' },
      ],
    };
    const inherited = resolveHelp(sample, 'rename');
    assertEqual(inherited.help, 'main', 'parent help');
    assertEqual(inherited.anchor, 'step-3', 'row anchor');
    assertEqual(resolveHelp(sample, 'preview'), null, 'ask off wires nothing');
    assertEqual(resolveHelp(sample, 'confirm'), null, 'none opens nothing');
    assertEqual(resolveHelp(sample, 'missing'), null, 'unknown surface');
    assertEqual(resolveHelp(null, 'main'), null, 'unread map');
  });

  localStorage.removeItem('fms-web.preferences');
  localStorage.removeItem('fms-web.last-screen');
  const win = await loadPage('#/');
  const doc = win.document;
  const en = getStrings('en');

  await check('the help button is the one addition at the reading start of the trailing group', () => {
    const help = doc.querySelector('[data-command="app.help"]');
    assert(help, 'help button present');
    assertEqual(help.getAttribute('aria-label'), en.help, 'accessible name');
    assertEqual(help.getAttribute('title'), en.help, 'tooltip');
    assert(help.querySelector('[data-glyph="app.help"]'), 'app.help glyph');
    const end = doc.querySelector('.header-end');
    assertEqual(end.firstElementChild, help, 'first in the trailing group');
    const others = [...doc.querySelectorAll('.app-header button')].map((node) => node.dataset.command).filter((id) => id !== 'app.help');
    assertEqual(others.join(','), 'app.settings', 'existing header controls unchanged');
  });

  const coverage = [];
  const layers = [];
  for (const surface of surfaces) {
    await navigate(win, surface.route);
    const uncovered = reachableControls(doc).filter((node) => !entryForNode(doc.getElementById('app'), node));
    if (uncovered.length) coverage.push(`${surface.id}: ${uncovered.map((node) => node.dataset.command || node.id || node.tagName).join(' ')}`);
    doc.querySelector('[data-command="app.help"]').click();
    const layer = await waitFor(() => doc.querySelector('.help-layer'), `the layer on ${surface.id}`);
    const pins = [...layer.querySelectorAll('.help-pin')];
    const expected = collectItems(doc.getElementById('app')).length;
    const described = pins.every((pin) => doc.getElementById(pin.getAttribute('aria-describedby'))?.textContent.trim());
    layers.push({ id: surface.id, pins: pins.length, expected, described, focused: doc.activeElement === pins[0], modal: layer.getAttribute('aria-modal') });
    press(win, doc.activeElement, 'Escape');
    await waitFor(() => !doc.querySelector('.help-layer'), `the layer to close on ${surface.id}`);
    layers.at(-1).returned = doc.activeElement?.dataset.command === 'app.help';
  }

  await check('every reachable control of every surface is explained by an entry', () => {
    assert(coverage.length === 0, coverage.join('; '));
  });

  await check('the button opens a numbered layer on every surface, one mark per shown element', () => {
    for (const layer of layers) {
      assert(layer.pins > 0, `${layer.id}: marks`);
      assertEqual(layer.pins, layer.expected, `${layer.id}: mark count`);
      assert(layer.described, `${layer.id}: every mark has its text`);
      assert(layer.focused, `${layer.id}: focus on the first mark`);
      assertEqual(layer.modal, 'true', `${layer.id}: modal`);
    }
  });

  await check('Esc closes the layer and returns the focus to the help button', () => {
    for (const layer of layers) assert(layer.returned, `${layer.id}: focus returned`);
  });

  await navigate(win, '#/settings/general');
  await check('F1 on an element opens the layer at its mark, and F1 again closes it', async () => {
    const radio = doc.getElementById('theme-system');
    radio.focus();
    const event = press(win, radio, 'F1');
    assert(event.defaultPrevented, 'F1 taken by the page');
    const layer = await waitFor(() => doc.querySelector('.help-layer'), 'the layer');
    assertEqual(doc.activeElement.dataset.entry, 'settings.theme', 'focus on the theme mark');
    assert(layer.querySelector('.help-note-name').textContent.includes(en.theme), 'note names the element');
    press(win, doc.activeElement, 'F1');
    await waitFor(() => !doc.querySelector('.help-layer'), 'the layer to close');
    assertEqual(doc.activeElement, radio, 'focus back on the element');
  });

  await check('F1 with a modifier is left to the browser', () => {
    const event = press(win, doc.body, 'F1', { ctrlKey: true });
    assert(!event.defaultPrevented, 'not taken');
    assert(!doc.querySelector('.help-layer'), 'no layer');
  });

  await check('Tab stays among the marks and a click outside closes the layer', async () => {
    doc.querySelector('[data-command="app.help"]').click();
    const layer = await waitFor(() => doc.querySelector('.help-layer'), 'the layer');
    const pins = [...layer.querySelectorAll('.help-pin')];
    pins.at(-1).focus();
    press(win, doc.activeElement, 'Tab');
    assert(layer.contains(doc.activeElement), 'focus kept in the layer');
    layer.querySelector('.help-backdrop').click();
    await waitFor(() => !doc.querySelector('.help-layer'), 'the layer to close');
    assertEqual(win.location.hash, '#/settings/general', 'the surface stayed');
  });

  await check('the help button and the layer speak the chosen language', async () => {
    doc.getElementById('language-ru').click();
    const ru = getStrings('ru');
    const help = doc.querySelector('[data-command="app.help"]');
    assertEqual(help.getAttribute('aria-label'), ru.help, 'Russian name');
    help.click();
    const layer = await waitFor(() => doc.querySelector('.help-layer'), 'the layer');
    assert(layer.getAttribute('aria-label').startsWith(ru.helpLayer.split('{')[0]), 'Russian layer label');
    assertEqual(layer.querySelector('.help-note-hint').textContent, ru.helpLayerHint, 'Russian hint');
    press(win, doc.activeElement, 'Escape');
    await waitFor(() => !doc.querySelector('.help-layer'), 'the layer to close');
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
