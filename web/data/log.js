// The one logging module of the page. `error` is for programming errors only; an expected
// fallback (storage refused, an unknown saved value) is `warn` or `info`.
//
// Every message is redacted before it reaches the console or the session ring (DIAGNOSTIC-REPORT
// section 10: at the sink, and again when the report is exported). Messages carry an error name or a
// fixed phrase, never a file, folder, destination or account name: the report is count-only, and no
// redaction can recognise a name the person chose.

import { redactText } from './redact.js';

const prefix = 'FMS_Web';
const maxLines = 400;
const maxLineLength = 2000;
const encoder = new TextEncoder();

const ring = [];
let droppedBytes = 0;
let ringBytes = 0;

function size(text) {
  return encoder.encode(`${text}\n`).length;
}

function remember(level, text) {
  let line = `${new Date().toISOString()} ${level} ${text.replace(/\r?\n/g, ' | ')}`;
  if (line.length > maxLineLength) {
    const cut = size(line.slice(maxLineLength));
    line = `${line.slice(0, maxLineLength)} [Diag] LOG TRUNCATED | dropped_bytes=${cut}`;
  }
  ring.push(line);
  ringBytes += size(line);
  while (ring.length > maxLines) {
    const gone = size(ring.shift());
    droppedBytes += gone;
    ringBytes -= gone;
  }
}

function write(level, method, message) {
  const text = redactText(String(message));
  remember(level, text);
  console[method](`${prefix}: ${text}`);
}

export const log = Object.freeze({
  info(message) {
    write('INFO', 'info', message);
  },
  warn(message) {
    write('WARN', 'warn', message);
  },
  error(message) {
    write('ERROR', 'error', message);
  },
  // This page session's own lines, oldest first, and what the ring let go of. Tail-only: the ring
  // keeps the recent failure sequence (DIAGNOSTIC-REPORT section 8 D).
  recent() {
    return Object.freeze({ lines: Object.freeze([...ring]), droppedBytes, keptBytes: ringBytes });
  },
});
