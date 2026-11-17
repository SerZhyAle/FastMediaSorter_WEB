// A ZIP writer for stored (uncompressed) entries: enough for a small text bundle that any archive tool,
// and a plain text search, can read. No compression keeps the bytes inspectable; no ZIP64 keeps the
// format simple, so a bundle past the classic limits is refused rather than written wrong.

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let value = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    value = crcTable[(value ^ bytes[index]) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function dosStamp(when) {
  const year = Math.max(1980, when.getFullYear());
  return {
    time: (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate(),
  };
}

// entries: [{ name: string, data: string | Uint8Array }]; returns the archive as a Uint8Array.
export function createZip(entries, when = new Date()) {
  const encoder = new TextEncoder();
  const stamp = dosStamp(when);
  const files = entries.map(({ name, data }) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    return { name: encoder.encode(name), bytes, crc: crc32(bytes) };
  });
  if (files.length > 0xffff) throw new RangeError('too many entries for a ZIP file');
  const localSize = files.reduce((sum, file) => sum + 30 + file.name.length + file.bytes.length, 0);
  const centralSize = files.reduce((sum, file) => sum + 46 + file.name.length, 0);
  const total = localSize + centralSize + 22;
  if (total > 0xffffffff) throw new RangeError('archive too large for a ZIP file');
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let at = 0;
  const offsets = [];
  // Bit 11 of the flags says the names are UTF-8.
  for (const file of files) {
    offsets.push(at);
    view.setUint32(at, 0x04034b50, true);
    view.setUint16(at + 4, 20, true);
    view.setUint16(at + 6, 0x0800, true);
    view.setUint16(at + 8, 0, true);
    view.setUint16(at + 10, stamp.time, true);
    view.setUint16(at + 12, stamp.date, true);
    view.setUint32(at + 14, file.crc, true);
    view.setUint32(at + 18, file.bytes.length, true);
    view.setUint32(at + 22, file.bytes.length, true);
    view.setUint16(at + 26, file.name.length, true);
    view.setUint16(at + 28, 0, true);
    out.set(file.name, at + 30);
    out.set(file.bytes, at + 30 + file.name.length);
    at += 30 + file.name.length + file.bytes.length;
  }
  const centralStart = at;
  files.forEach((file, index) => {
    view.setUint32(at, 0x02014b50, true);
    view.setUint16(at + 4, 20, true);
    view.setUint16(at + 6, 20, true);
    view.setUint16(at + 8, 0x0800, true);
    view.setUint16(at + 10, 0, true);
    view.setUint16(at + 12, stamp.time, true);
    view.setUint16(at + 14, stamp.date, true);
    view.setUint32(at + 16, file.crc, true);
    view.setUint32(at + 20, file.bytes.length, true);
    view.setUint32(at + 24, file.bytes.length, true);
    view.setUint16(at + 28, file.name.length, true);
    view.setUint32(at + 42, offsets[index], true);
    out.set(file.name, at + 46);
    at += 46 + file.name.length;
  });
  view.setUint32(at, 0x06054b50, true);
  view.setUint16(at + 8, files.length, true);
  view.setUint16(at + 10, files.length, true);
  view.setUint32(at + 12, centralSize, true);
  view.setUint32(at + 16, centralStart, true);
  return out;
}
