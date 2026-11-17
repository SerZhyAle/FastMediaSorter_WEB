// About diagnostic report test (ticket S0048). Static ES module: the pure modules directly, then the
// real page in a same-origin frame with the download intercepted. A PASS requires every declared check
// to have executed.

import { redactText } from '../web/data/redact.js';
import { crc32, createZip } from '../web/data/zip-store.js';
import { log } from '../web/data/log.js';
import { buildReport, environmentKeys, environmentText, reportFileName } from '../web/app/diagnostic-report.js';
import { getStrings, localeCodes } from '../web/app/strings.js';

const declaredChecks = 12;
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

// A frame whose address differs only by the fragment does not reload, so the page is left first.
function blankPage() {
  return new Promise((resolve) => {
    frame.addEventListener('load', () => resolve(), { once: true });
    frame.src = 'about:blank';
  });
}

async function waitFor(probe, what) {
  for (let tries = 0; tries < 100; tries += 1) {
    const value = probe();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${what}`);
}

// Reads a stored ZIP back from its bytes: the end record, the central directory, then each entry's
// data through its local header, with the CRC recomputed.
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  assertEqual(view.getUint32(end, true), 0x06054b50, 'end record signature');
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    assertEqual(view.getUint32(at, true), 0x02014b50, 'central header signature');
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const local = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    assertEqual(view.getUint32(local, true), 0x04034b50, 'local header signature');
    assertEqual(view.getUint16(local + 8, true), 0, `${name} stored without compression`);
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    assertEqual(crc32(data), crc, `${name} CRC`);
    entries.push({ name, text: decoder.decode(data) });
    at += 46 + nameLength;
  }
  return entries;
}

const facts = {
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/150.0',
  brands: null,
  platform: 'Linux x86_64',
  languages: ['uk-UA', 'en'],
  viewport: '1024x640',
  devicePixelRatio: 1,
  online: true,
  secureContext: true,
  storagePersisted: null,
  apis: { directoryPicker: false, indexedDb: true, webCrypto: true, shareFiles: false, asyncClipboard: true, wakeLock: false, fullScreen: true },
  buildStamp: null,
};
const preferences = { language: 'uk', theme: 'dark', inputProfile: 'touch', size: 1 };

async function run() {
  await check('redaction: the structured-value vectors of the contract, in their EXPECTED-FIELD form', () => {
    assertEqual(
      redactText('folderParams={"folders":[{"label":"Family","accessPin":"4821","slideshowInterval":15}]}'),
      'folderParams={"folders":[{"label":"Family","accessPin":"[REDACTED]","slideshowInterval":15}]}',
      'JSON under a benign key',
    );
    assertEqual(
      redactText('lastOpened=https://media.example.test/play?id=17&token=Zk93mQ&lang=en'),
      'lastOpened=https://media.example.test/play?id=17&token=[REDACTED]&lang=en',
      'query string under a benign key',
    );
    assertEqual(
      redactText('source=Host=nas.example.test;Port=22;User=guest;Password=Hq7-pL2x;Timeout=15'),
      'source=Host=nas.example.test;Port=22;User=guest;Password=[REDACTED];Timeout=15',
      'connection string under a benign key',
    );
  });

  await check('redaction: userinfo, secret parameters, exchange values, personal paths, key blocks; words that stay', () => {
    assertEqual(redactText('open http://user:password@host.test/s'), 'open http://host.test/s', 'userinfo');
    assertEqual(redactText('a?x=1&amp;token=abc&amp;y=2'), 'a?x=1&amp;token=[REDACTED]&amp;y=2', 'escaped separator');
    assertEqual(redactText('c?X-Amz-Signature=ab&X-Amz-Credential=AK'), 'c?X-Amz-Signature=[REDACTED]&X-Amz-Credential=[REDACTED]', 'signed parameters');
    assertEqual(redactText('deviceToken=abc pairingCode=123456'), 'deviceToken=[REDACTED] pairingCode=[REDACTED]', 'device token and pairing code');
    assertEqual(
      redactText('{"login":"anna","serverAddress":"10.0.0.5:22022","certFingerprint":"AA:BB"}'),
      '{"login":"[REDACTED]","serverAddress":"[REDACTED]","certFingerprint":"[REDACTED]"}',
      'exchange login, address and pin',
    );
    assertEqual(redactText('C:\\Users\\anna\\x and /Users/anna/y and /home/anna/z'), 'C:\\Users\\<USER>\\x and /Users/<USER>/y and /home/<USER>/z', 'personal paths');
    // Assembled at run time: a whole armor header in the source reads as a committed key to secret scanners.
    const armor = (edge) => `-----${edge} PRIVATE KEY-----`;
    assertEqual(redactText(`k ${armor('BEGIN')}\nMII\n${armor('END')} e`), 'k [REDACTED] e', 'private key block');
    assertEqual(redactText('passage=3 pinned=2 folder could not be read (NotAllowedError)'), 'passage=3 pinned=2 folder could not be read (NotAllowedError)', 'ordinary text');
    const once = redactText('x?token=1 C:\\Users\\a\\b {"accessPin":"1"}');
    assertEqual(redactText(once), once, 'a second pass changes nothing');
  });

  await check('the session log ring redacts at the sink, flattens lines, stays bounded and says what it let go of', () => {
    log.info('ring probe one');
    log.warn('token=ringsecret in a line');
    log.error('two\nlines');
    const early = log.recent().lines.join('\n');
    assert(early.includes('WARN token=[REDACTED] in a line'), 'redacted line kept');
    assert(early.includes('ERROR two | lines'), 'newline flattened');
    assert(!early.includes('ringsecret'), 'secret never held');
    for (let index = 0; index < 450; index += 1) log.info(`ring fill ${index}`);
    const late = log.recent();
    assertEqual(late.lines.length, 400, 'bounded to 400 lines');
    assert(late.droppedBytes > 0, 'dropped bytes counted');
    assert(late.lines.at(-1).endsWith('ring fill 449'), 'newest line last');
    log.info('y'.repeat(2500));
    assert(log.recent().lines.at(-1).includes('[Diag] LOG TRUNCATED | dropped_bytes='), 'cut line marked');
  });

  await check('the summary is the allowlist: its keys in order, unread values written unavailable, no free text', () => {
    const when = new Date(2026, 10, 12, 19, 30, 5);
    const text = environmentText({ facts, preferences, resolvedTheme: 'dark', now: when });
    const keys = text.trim().split('\n').map((line) => line.slice(0, line.indexOf('=')));
    assertEqual(keys.join(','), environmentKeys.join(','), 'keys');
    assert(text.startsWith('schema_version=1\n'), 'schema_version first');
    assert(text.includes('app_version=unavailable\n'), 'unread build stamp');
    assert(text.includes('browser_brands=unavailable\n'), 'unread brands');
    assert(text.includes('storage_persisted=unavailable\n'), 'unread storage state');
    assert(text.includes('api_directory_picker=absent\n'), 'presence, not support');
    assert(text.includes('generated_utc=2026-11-12T'), 'UTC stamp');
    assertEqual(reportFileName(null, when), 'FastMediaSorterForWeb-logs-20261112-193005.zip', 'name without version');
    assertEqual(reportFileName('26.1112.1930', when), 'FastMediaSorterForWeb-logs-26.1112.1930-20261112-193005.zip', 'name with version');
  });

  await check('the archive reads back: end record, central directory, local headers, every CRC', () => {
    const when = new Date(2026, 10, 12, 19, 30, 5);
    const plain = readZip(createZip([{ name: 'a.txt', data: 'one' }, { name: 'ж.txt', data: 'два' }], when));
    assertEqual(plain.map((entry) => entry.name).join(','), 'a.txt,ж.txt', 'names, one in UTF-8');
    assertEqual(plain[1].text, 'два', 'UTF-8 data');
    const report = buildReport({ facts, preferences, resolvedTheme: 'dark', log: log.recent(), now: when });
    const entries = readZip(report.bytes);
    assertEqual(entries.map((entry) => entry.name).join(','), 'environment.txt,session-log.txt', 'report entries');
    assert(entries[1].text.includes('[Diag] LOG COMPACTED | dropped_middle_bytes='), 'compaction marker in the log file');
    assert(entries[1].text.includes('kept_head_bytes=0'), 'tail-only marker');
  });

  await check('the export modules make no request: no fetch, XHR, beacon, socket, mail link or share call', async () => {
    const forbidden = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'mailto:', 'navigator.share', 'EventSource'];
    for (const path of ['data/redact.js', 'data/zip-store.js', 'data/log.js', 'data/browser-facts.js', 'data/file-download.js', 'app/diagnostic-report.js']) {
      const source = await (await fetch(`../web/${path}`)).text();
      for (const token of forbidden) assert(!source.includes(token), `${path} contains ${token}`);
    }
  });

  await check('the strings exist in EN, RU and UK and the saved line carries the file name', () => {
    for (const code of localeCodes) {
      const strings = getStrings(code);
      for (const key of ['diagnosticReport', 'diagnosticIntro', 'diagnosticSave', 'diagnosticSaved', 'diagnosticFailed']) {
        assert(typeof strings[key] === 'string' && strings[key].trim() !== '', `${code}.${key}`);
      }
      assert(strings.diagnosticSaved.includes('{name}'), `${code}.diagnosticSaved holds {name}`);
    }
  });

  localStorage.removeItem('fms-web.preferences');
  const win = await loadPage('#/settings/about');
  const doc = win.document;
  await waitFor(() => doc.querySelector('[data-command="about.diagnostic"]'), 'the About block');
  const own = win.location.origin;
  const foreign = () => win.performance.getEntriesByType('resource').filter((entry) => !entry.name.startsWith(own) && !entry.name.startsWith('blob:'));

  await check('About shows the block with its command and a status line, and opening it makes no foreign request', () => {
    const strings = getStrings(doc.documentElement.lang);
    const block = doc.getElementById('about-diagnostic');
    assert(block, 'block present');
    assertEqual(block.textContent, strings.diagnosticReport, 'block heading');
    const button = doc.querySelector('[data-command="about.diagnostic"]');
    assertEqual(button.textContent.trim(), strings.diagnosticSave, 'command caption');
    const status = doc.getElementById('about-diagnostic-status');
    assertEqual(status.getAttribute('role'), 'status', 'status role');
    assertEqual(status.textContent, '', 'status empty before any action');
    assertEqual(foreign().length, 0, `foreign requests: ${foreign().map((entry) => entry.name).join(' ')}`);
  });

  const taken = [];
  win.URL.createObjectURL = (blob) => {
    taken.push({ blob });
    return 'blob:fms-web-test';
  };
  win.HTMLAnchorElement.prototype.click = function capture() {
    taken.at(-1).name = this.download;
    taken.at(-1).href = this.href;
  };

  await check('nothing is made before the command, and the command hands one ZIP to the browser', async () => {
    assertEqual(taken.length, 0, 'nothing made on open');
    doc.querySelector('[data-command="about.diagnostic"]').click();
    await waitFor(() => taken.length === 1 && taken[0].name, 'the download');
    assert(/^FastMediaSorterForWeb-logs(-[^-]+)?-\d{8}-\d{6}\.zip$/.test(taken[0].name), `file name ${taken[0].name}`);
    assertEqual(taken[0].blob.type, 'application/zip', 'type');
    const entries = readZip(new Uint8Array(await taken[0].blob.arrayBuffer()));
    assertEqual(entries.map((entry) => entry.name).join(','), 'environment.txt,session-log.txt', 'entries');
    const summary = entries[0].text;
    assert(summary.startsWith('schema_version=1\n'), 'schema_version');
    assert(summary.includes('ui_language=en\n') || summary.includes('ui_language=uk\n') || summary.includes('ui_language=ru\n'), 'language key');
    assert(!summary.includes('fms-web.'), 'no stored key names');
    assertEqual(foreign().length, 0, 'no foreign request after the save');
  });

  await check('the status line names the saved file in place', async () => {
    const strings = getStrings(doc.documentElement.lang);
    const status = doc.getElementById('about-diagnostic-status');
    await waitFor(() => status.textContent !== '', 'the status text');
    assertEqual(status.textContent, strings.diagnosticSaved.replace('{name}', taken[0].name), 'saved line');
    assert(doc.getElementById('about-diagnostic-status') === status, 'same node: updated in place');
  });

  for (const code of ['uk', 'ru']) {
    await check(`the block is drawn in ${code} when that is the saved language`, async () => {
      localStorage.setItem('fms-web.preferences', JSON.stringify({ language: code }));
      await blankPage();
      const next = await loadPage('#/settings/about');
      await waitFor(() => next.document.querySelector('[data-command="about.diagnostic"]'), 'the About block');
      const strings = getStrings(code);
      assertEqual(next.document.documentElement.lang, code, 'document language');
      assertEqual(next.document.getElementById('about-diagnostic').textContent, strings.diagnosticReport, 'heading');
      assertEqual(next.document.querySelector('[data-command="about.diagnostic"]').textContent.trim(), strings.diagnosticSave, 'caption');
      assertEqual(next.document.querySelector('[aria-labelledby="about-diagnostic"] p').textContent, strings.diagnosticIntro, 'explanation');
    });
  }

  localStorage.removeItem('fms-web.preferences');

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
