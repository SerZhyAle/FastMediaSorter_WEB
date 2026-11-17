// The diagnostic report of the About page (DIAGNOSTIC-REPORT 0.15): a ZIP with `environment.txt`, a
// count-only summary of KEY=value lines, and `session-log.txt`, this page session's own log lines.
//
// The summary is an allowlist: only the keys below are ever written, and a value the page cannot read
// is written `unavailable`. It holds no file, folder, destination or account name and no stored value
// (section 8 B, section 10). Every value and every log line is redacted again here, whatever the log
// module already did, and redaction comes before any cut (section 8 C).

import { redactText } from '../data/redact.js';
import { createZip } from '../data/zip-store.js';

export const schemaVersion = 1;
export const unavailable = 'unavailable';

// The allowlist, in file order. Adding a key is a decision about what leaves the device.
export const environmentKeys = Object.freeze([
  'schema_version',
  'generated_utc',
  'app_name',
  'app_version',
  'app_edition',
  'browser_user_agent',
  'browser_brands',
  'browser_platform',
  'browser_languages',
  'viewport',
  'device_pixel_ratio',
  'online',
  'secure_context',
  'storage_persisted',
  'ui_language',
  'ui_theme',
  'ui_theme_resolved',
  'ui_input_profile',
  'ui_size',
  'api_directory_picker',
  'api_indexed_db',
  'api_web_crypto',
  'api_share_files',
  'api_async_clipboard',
  'api_wake_lock',
  'api_full_screen',
]);

const appName = 'FastMediaSorter for Web';

function yesNo(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return null;
}

function presence(value) {
  return value ? 'present' : 'absent';
}

function pad(value, width = 2) {
  return String(value).padStart(width, '0');
}

function utcStamp(now) {
  return `${now.toISOString().slice(0, 19)}Z`;
}

// The name stamps the person's local time, as the native programs' archives do; `generated_utc` inside
// is UTC.
export function reportFileName(version, now) {
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const part = version ? `-${String(version).replace(/[^A-Za-z0-9._+]/g, '.')}` : '';
  return `FastMediaSorterForWeb-logs${part}-${stamp}.zip`;
}

function values({ facts, preferences, resolvedTheme, now }) {
  return {
    schema_version: String(schemaVersion),
    generated_utc: utcStamp(now),
    app_name: appName,
    app_version: facts.buildStamp,
    app_edition: 'web',
    browser_user_agent: facts.userAgent,
    browser_brands: facts.brands,
    browser_platform: facts.platform,
    browser_languages: facts.languages.length > 0 ? facts.languages.join(',') : null,
    viewport: facts.viewport,
    device_pixel_ratio: facts.devicePixelRatio === null ? null : String(facts.devicePixelRatio),
    online: yesNo(facts.online),
    secure_context: yesNo(facts.secureContext),
    storage_persisted: yesNo(facts.storagePersisted),
    ui_language: preferences.language,
    ui_theme: preferences.theme,
    ui_theme_resolved: resolvedTheme,
    ui_input_profile: preferences.inputProfile,
    ui_size: String(preferences.size),
    api_directory_picker: presence(facts.apis.directoryPicker),
    api_indexed_db: presence(facts.apis.indexedDb),
    api_web_crypto: presence(facts.apis.webCrypto),
    api_share_files: presence(facts.apis.shareFiles),
    api_async_clipboard: presence(facts.apis.asyncClipboard),
    api_wake_lock: presence(facts.apis.wakeLock),
    api_full_screen: presence(facts.apis.fullScreen),
  };
}

export function environmentText(input) {
  const known = values(input);
  const lines = environmentKeys.map((key) => {
    const raw = known[key];
    const value = raw === null || raw === undefined || String(raw).trim() === ''
      ? unavailable
      : redactText(String(raw)).replace(/\s*[\r\n]+\s*/g, ' ');
    return `${key}=${value}`;
  });
  return `${lines.join('\n')}\n`;
}

// Tail-only: the module's ring keeps the recent lines, so the head is never kept and the marker
// says what was let go (section 8 D).
export function sessionLogText({ lines, droppedBytes, keptBytes }) {
  const body = redactText(lines.join('\n'));
  const header = ['# FastMediaSorter for Web - this page session\'s log, newest lines last; no file or folder names are logged'];
  if (droppedBytes > 0) {
    header.push(`[Diag] LOG COMPACTED | dropped_middle_bytes=${droppedBytes} | kept_head_bytes=0 | kept_tail_bytes=${keptBytes}`);
  }
  return `${header.join('\n')}\n${body}${body ? '\n' : ''}`;
}

export function buildReport({ facts, preferences, resolvedTheme, log, now = new Date() }) {
  const entries = [
    { name: 'environment.txt', data: environmentText({ facts, preferences, resolvedTheme, now }) },
    { name: 'session-log.txt', data: sessionLogText(log) },
  ];
  return {
    filename: reportFileName(facts.buildStamp, now),
    entries: entries.map((entry) => entry.name),
    bytes: createZip(entries, now),
  };
}
