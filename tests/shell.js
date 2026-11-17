// Page shell test (ticket S0028). Static ES module: checks the shared modules directly, then the
// real page in a same-origin frame. A PASS requires every declared check to have executed.

import { missingKeys, getStrings } from '../web/app/strings.js';
import { normalizePreferences, resolveTheme, preferredLanguage } from '../web/app/preferences.js';
import { booleanRow, commandButton, exchangeMark, markUnavailable, topicGroup } from '../web/ui/components.js';

const declaredChecks = 16;
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
  return new Promise((resolve) => {
    win.addEventListener('hashchange', () => resolve(), { once: true });
    win.location.hash = hash;
  });
}

async function run() {
  await check('every string exists in EN, RU and UK', () => {
    const missing = missingKeys();
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  await check('unknown saved preferences fall back to safe values', () => {
    const values = normalizePreferences({ language: 'de', theme: 'neon', size: 0.875, inputProfile: 'pen' }, false);
    assertEqual(JSON.stringify(values), '{"language":"en","theme":"system","inputProfile":"touch","size":1}', 'fallback');
  });

  await check('system theme follows the device, explicit themes do not', () => {
    assertEqual(resolveTheme('system', true), 'dark', 'system on dark');
    assertEqual(resolveTheme('system', false), 'light', 'system on light');
    assertEqual(resolveTheme('light', true), 'light', 'explicit light');
  });

  await check('the first shipped browser language is chosen', () => {
    assertEqual(preferredLanguage(['de-DE', 'uk-UA', 'en']), 'uk', 'language');
  });

  const host = document.getElementById('components');

  await check('an icon-only command keeps its caption as name and tooltip', () => {
    const button = commandButton({ id: 'app.settings', label: 'Settings', glyphMeaning: 'app.settings', iconOnly: true });
    assertEqual(button.getAttribute('aria-label'), 'Settings', 'accessible name');
    assertEqual(button.getAttribute('title'), 'Settings', 'tooltip');
  });

  await check('a boolean option toggles once from its heading, never from help or explanation', () => {
    let changes = 0;
    let helps = 0;
    const row = booleanRow({
      id: 'test-option', label: 'Option', explanation: 'What it does.', helpLabel: 'Help',
      onChange: () => { changes += 1; }, onHelp: () => { helps += 1; },
    });
    host.append(row);
    const checkbox = row.querySelector('input[type="checkbox"]');
    row.querySelector('label').click();
    assertEqual(checkbox.checked, true, 'label click checks');
    assertEqual(changes, 1, 'one change per click');
    row.querySelector('.explanation').click();
    row.querySelector('[data-command="test-option.help"]').click();
    assertEqual(checkbox.checked, true, 'help and explanation leave the value');
    assertEqual(helps, 1, 'help opened once');
    row.remove();
  });

  await check('a topic group header toggles its body out of layout and focus', () => {
    const group = topicGroup({ id: 'test-group', title: 'Topic', expanded: false, body: [commandButton({ id: 'inner', label: 'Inner' })] });
    host.append(group);
    const header = group.querySelector('.group-header');
    const body = group.querySelector('.group-body');
    assertEqual(body.hidden, true, 'starts collapsed');
    assertEqual(body.getBoundingClientRect().height, 0, 'collapsed body takes no space');
    header.click();
    assertEqual(header.getAttribute('aria-expanded'), 'true', 'expanded state');
    assertEqual(body.hidden, false, 'body shown');
    group.querySelector('[data-command="inner"]').click();
    assertEqual(header.getAttribute('aria-expanded'), 'true', 'body click does not toggle');
    group.remove();
  });

  await check('an unavailable function stays visible, inert and says why', () => {
    let runs = 0;
    const button = commandButton({ id: 'test.move', label: 'Move', onActivate: () => { runs += 1; } });
    host.append(button);
    const wrapper = markUnavailable(button, 'Moving needs folder access this browser does not give.');
    button.click();
    assertEqual(runs, 0, 'handler did not run');
    assertEqual(button.getAttribute('aria-disabled'), 'true', 'disabled state');
    const reason = wrapper.querySelector('.unavailable-reason');
    assert(reason && reason.textContent.length > 0, 'reason line present');
    assert(button.getAttribute('aria-describedby').includes(reason.id), 'reason announced with the control');
    assert(button.getBoundingClientRect().width > 0, 'control still visible');
    wrapper.remove();
  });

  await check('the exchange mark picks its drawing by the resolved size and is never below 16 px', () => {
    const flat = exchangeMark({ size: 24, scale: 1, label: 'Exchange server' });
    assertEqual(flat.dataset.markDrawing, 'flat', '24 px is flat');
    assert(flat.querySelector('img').src.endsWith('/vendor/exchange-mark/svg/exchange-mark-small.svg'), 'flat file');
    assertEqual(flat.getAttribute('role'), 'img', 'image-only mark is an image');
    assertEqual(flat.getAttribute('aria-label'), 'Exchange server', 'accessible name is the term');
    assertEqual(flat.querySelector('img').getAttribute('alt'), '', 'inner picture not announced twice');
    const faceted = exchangeMark({ size: 24, scale: 1.5 });
    assertEqual(faceted.dataset.markDrawing, 'faceted', '36 px is faceted');
    assert(faceted.querySelector('img').src.endsWith('/vendor/exchange-mark/svg/exchange-mark.svg'), 'faceted file');
    assertEqual(faceted.getAttribute('aria-hidden'), 'true', 'unlabelled mark is decoration');
    assertEqual(exchangeMark({ size: 12 }).querySelector('img').getAttribute('width'), '16', 'floor of 16 px');
  });

  localStorage.removeItem('fms-web.preferences');
  localStorage.removeItem('fms-web.last-screen');
  let win = await loadPage('#/');
  let doc = win.document;

  await check('the start screen offers both entries', () => {
    const entries = doc.querySelectorAll('a.entry');
    assertEqual(entries.length, 2, 'entry count');
    assertEqual(entries[0].getAttribute('href'), '#/local', 'first entry');
    assertEqual(entries[1].getAttribute('href'), '#/exchange', 'second entry');
    assert(doc.querySelector('[data-command="app.settings"]'), 'settings button in header');
  });

  await navigate(win, '#/exchange');
  await check('the exchange account screen shows the server mark beside its title, and every page has its favicon', () => {
    const mark = doc.querySelector('.app-header .exchange-mark');
    assert(mark, 'mark in the header');
    assertEqual(mark.getAttribute('aria-label'), getStrings('en').exchangeServer, 'accessible name');
    const icons = [...doc.querySelectorAll('link[rel="icon"]')].map((link) => link.getAttribute('href'));
    assertEqual(icons.join(' '), 'vendor/exchange-mark/ico/favicon.ico vendor/exchange-mark/svg/exchange-mark.svg', 'favicon links');
  });

  await navigate(win, '#/local');
  await check('opening a work screen remembers it for the next open', () => {
    assertEqual(doc.querySelector('main').dataset.surface, 'local', 'work screen shown');
    assertEqual(JSON.parse(localStorage.getItem('fms-web.last-screen')), 'local', 'last screen stored');
  });

  doc.querySelector('[data-command="app.settings"]').click();
  await new Promise((resolve) => win.addEventListener('hashchange', resolve, { once: true }));
  await check('settings open on the first page with the current destination marked', () => {
    const current = doc.querySelectorAll('.rail-item[aria-current="page"]');
    assertEqual(current.length, 1, 'one current destination');
    assertEqual(current[0].dataset.surface, 'settings.general', 'first page');
    assertEqual(doc.querySelectorAll('.rail-item').length, 2, 'General and About');
    assertEqual(doc.querySelectorAll('.rail-item')[1].dataset.surface, 'settings.about', 'About last');
  });

  await check('switching the language changes every string live', () => {
    const before = doc.getElementById('page-title').textContent;
    doc.getElementById('language-uk').click();
    assertEqual(doc.documentElement.lang, 'uk', 'document language');
    assertEqual(doc.getElementById('page-title').textContent, getStrings('uk').settings, 'title translated');
    assert(before !== doc.getElementById('page-title').textContent, 'title changed');
    const english = Object.values(getStrings('en'));
    const leftovers = [...doc.querySelectorAll('#app *')]
      .filter((node) => node.children.length === 0 && english.includes(node.textContent) && !getStrings('uk').appName.includes(node.textContent));
    assertEqual(leftovers.length, 0, `English left: ${leftovers.map((node) => node.textContent).join(' | ')}`);
    assert(doc.getElementById('language-uk').checked, 'choice kept');
  });

  await check('an explicit theme applies at once and persists', () => {
    doc.getElementById('theme-dark').click();
    assertEqual(doc.documentElement.dataset.theme, 'dark', 'dark applied');
    assertEqual(JSON.parse(localStorage.getItem('fms-web.preferences')).theme, 'dark', 'stored');
    doc.getElementById('theme-system').click();
    const systemDark = win.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    assertEqual(doc.documentElement.dataset.theme, systemDark, 'system follows the device');
  });

  const back = new Promise((resolve) => win.addEventListener('hashchange', resolve, { once: true }));
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await back;
  await check('Escape returns from settings to the work screen it was opened from', () => {
    assertEqual(win.location.hash, '#/local', 'returned');
    assertEqual(doc.querySelector('main').dataset.surface, 'local', 'work screen shown');
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
