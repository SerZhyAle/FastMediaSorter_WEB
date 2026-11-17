// Redaction of free text for the log and the diagnostic report (DIAGNOSTIC-REPORT rule 3, section 7
// "the shapes rule 3 redacts", section 10 "exchange account privacy"). Pure: text in, text out.
//
// A structured value is redacted by what is inside it, not by the key it sits under (section 8 C), so
// the same name-and-value rule runs over JSON members, query strings and connection strings alike.
// The result never contains a secret the input held, and running it twice changes nothing.

const MARK = '[REDACTED]';

// Names whose value is secret. A composite name (`deviceToken`, `x-amz-signature`) matches through its
// last word; bare `pass`, `pin` and `auth` match only as the whole name, so `passage` and `pinned` stay.
const SECRET_NAME = String.raw`(?:[A-Za-z0-9_.-]*(?:password|passwd|pwd|passphrase|token|secret|apikey|api[_-]?key|credential|signature|authorization|fingerprint|pairing[_-]?code|hdnts|hdnea|wmsauthsign|key-pair-id|policy|login|server[_-]?address|exchange[_-]?server)|(?:access[_-]?)?pin|pass|auth)`;

// name = value, name: value, "name":"value": the name keeps its place, the value is replaced and keeps its quotes.
const NAME_VALUE = new RegExp(
  String.raw`(^|[^A-Za-z0-9_.-])(["']?)(${SECRET_NAME})(\2)(\s*[:=]\s*)(\[REDACTED\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:Bearer|Basic|Digest|Token)\s+[^\s;&,"'<>)\]}]+|[^\s;&,"'<>)\]}]+)`,
  'gi',
);

const PRIVATE_KEY_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g;

// Userinfo whose password holds `/`, `?` or `#` cannot be split safely, so everything between the scheme
// and the last `@` of the token goes.
const URL_USERINFO = /\b([A-Za-z][A-Za-z0-9+.-]*:\/\/)[^\s"'<>]*@/g;

// Xtream-style panels carry the account in the path: /live/<user>/<pass>/<id>.
const PATH_CREDENTIALS = /\/(live|movie|series)\/[^/\s"'<>]+\/[^/\s"'<>]+\/(?=[^/\s"'<>]*\d)/gi;

const WINDOWS_PROFILE = /([A-Za-z]:[\\/]+Users[\\/]+)[^\\/\s"'<>|:*?]+/gi;
const UNIX_PROFILE = /(^|[^A-Za-z0-9_])(\/(?:Users|home)\/)[^/\s"'<>]+/g;

function quoted(value) {
  const first = value[0];
  return (first === '"' || first === "'") && value.length > 1 ? first : '';
}

export function redactText(text) {
  let result = String(text ?? '');
  result = result.replace(PRIVATE_KEY_BLOCK, MARK);
  result = result.replace(URL_USERINFO, '$1');
  result = result.replace(PATH_CREDENTIALS, (match, kind) => `/${kind}/${MARK}/${MARK}/`);
  result = result.replace(NAME_VALUE, (match, lead, open, name, close, separator, value) => {
    if (value === MARK) return match;
    const quote = quoted(value);
    return `${lead}${open}${name}${close}${separator}${quote}${MARK}${quote}`;
  });
  result = result.replace(WINDOWS_PROFILE, '$1<USER>');
  result = result.replace(UNIX_PROFILE, '$1$2<USER>');
  return result;
}

export const redactionMark = MARK;
