// A random account password made in the page (feature matrix row 34): 20 characters from capital and
// small Latin letters and digits, at least one of each, so it meets the password policy of
// DEVICE-EXCHANGE 5.1 (at least 10 characters with capital and small Latin letters and digits).
// Letters and digits that are easy to confuse when read aloud or copied by hand are left out.

const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const lower = 'abcdefghijkmnopqrstuvwxyz';
const digits = '23456789';
const all = upper + lower + digits;

function uniform(limit, source) {
  // Rejection sampling keeps every character equally likely.
  const ceiling = 256 - (256 % limit);
  for (;;) {
    const [value] = source(new Uint8Array(1));
    if (value < ceiling) return value % limit;
  }
}

export function randomPassword(length = 20, source = (bytes) => crypto.getRandomValues(bytes)) {
  for (;;) {
    let text = '';
    for (let i = 0; i < length; i += 1) text += all[uniform(all.length, source)];
    if (/[A-Z]/.test(text) && /[a-z]/.test(text) && /[0-9]/.test(text)) return text;
  }
}
