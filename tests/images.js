// Animated images and EXIF orientation test (ticket S0026). Static ES module: builds its fixtures
// byte by byte (GIF, APNG, EXIF JPEG and a 50 MiB GIF), checks how the engine decodes them, then
// drops them on the real page in a same-origin frame. A PASS requires every declared check to have
// executed. Frame counts are read through ImageDecoder only where the engine has it; the line says
// which engine path ran.

const declaredChecks = 8;
const results = document.getElementById('results');
const lines = [];
let failures = 0;
let executed = 0;

async function check(name, run) {
  executed += 1;
  try {
    const note = await run();
    lines.push(`ok ${name}${note ? ` (${note})` : ''}`);
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

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function until(condition, limit = 5000) {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > limit) return false;
    await pause(20);
  }
  return true;
}

// GIF: LZW with minimum code size 2 and a clear code before every pixel keeps every code at 3 bits.
function lzwPixels(count, index) {
  const bytes = new Uint8Array(Math.ceil(((count * 2 + 1) * 3) / 8));
  let bit = 0;
  const put = (code) => {
    for (let n = 0; n < 3; n += 1, bit += 1) if (code & (1 << n)) bytes[bit >> 3] |= 1 << (bit & 7);
  };
  for (let pixel = 0; pixel < count; pixel += 1) {
    put(4);
    put(index);
  }
  put(5);
  return bytes;
}

function subBlocks(data) {
  const parts = [];
  for (let offset = 0; offset < data.length; offset += 255) {
    const chunk = data.subarray(offset, offset + 255);
    parts.push(Uint8Array.of(chunk.length), chunk);
  }
  parts.push(Uint8Array.of(0));
  return parts;
}

function le16(value) {
  return [value & 255, value >> 8];
}

// Each frame carries its own two-colour table, so frames sharing one pixel stream still differ.
function gifBlob(width, height, colours) {
  const header = Uint8Array.from([
    ...'GIF89a'.split('').map((c) => c.charCodeAt(0)), ...le16(width), ...le16(height), 0x80, 0, 0,
    0, 0, 0, 255, 255, 255,
    0x21, 0xff, 11, ...'NETSCAPE2.0'.split('').map((c) => c.charCodeAt(0)), 3, 1, 0, 0, 0,
  ]);
  const pixels = subBlocks(lzwPixels(width * height, 0));
  const parts = [header];
  for (const [r, g, b] of colours) {
    parts.push(Uint8Array.of(0x21, 0xf9, 4, 0, ...le16(10), 0, 0));
    parts.push(Uint8Array.of(0x2c, 0, 0, 0, 0, ...le16(width), ...le16(height), 0x80, r, g, b, 0, 0, 0, 2));
    parts.push(...pixels);
  }
  parts.push(Uint8Array.of(0x3b));
  return new Blob(parts, { type: 'image/gif' });
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function be32(value) {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function pngChunk(type, data) {
  const body = Uint8Array.from([...type].map((c) => c.charCodeAt(0)).concat([...data]));
  return Uint8Array.from([...be32(data.length), ...body, ...be32(crc32(body))]);
}

function pngChunks(bytes) {
  const chunks = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 8; offset < bytes.length;) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
  }
  return chunks;
}

async function canvasBytes(width, height, colour, type) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = colour;
  context.fillRect(0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type));
  return new Uint8Array(await blob.arrayBuffer());
}

async function apngBlob() {
  const first = pngChunks(await canvasBytes(4, 4, '#c00000', 'image/png'));
  const second = pngChunks(await canvasBytes(4, 4, '#0000c0', 'image/png'));
  // fcTL: sequence, width, height, x, y, delay 1/10 s, dispose none, blend source.
  const control = (sequence) => [...be32(sequence), ...be32(4), ...be32(4), ...be32(0), ...be32(0), 0, 1, 0, 10, 0, 0];
  const frameData = second.filter((c) => c.type === 'IDAT').flatMap((c) => [...c.data]);
  const parts = [
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    pngChunk('IHDR', first.find((c) => c.type === 'IHDR').data),
    pngChunk('acTL', [...be32(2), ...be32(0)]),
    pngChunk('fcTL', control(0)),
    ...first.filter((c) => c.type === 'IDAT').map((c) => pngChunk('IDAT', c.data)),
    pngChunk('fcTL', control(1)),
    pngChunk('fdAT', [...be32(2), ...frameData]),
    pngChunk('IEND', []),
  ];
  return new Blob(parts, { type: 'image/png' });
}

// A 4x2 JPEG with an EXIF APP1 segment (big-endian TIFF, one IFD entry: Orientation) after SOI.
async function exifJpegBlob(orientation) {
  const jpeg = await canvasBytes(4, 2, '#008000', 'image/jpeg');
  const exif = [
    0xff, 0xe1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0,
    0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8,
    0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0,
    0, 0, 0, 0,
  ];
  return new Blob([jpeg.subarray(0, 2), Uint8Array.from(exif), jpeg.subarray(2)], { type: 'image/jpeg' });
}

function decodeSize(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('the engine did not decode it')); };
    image.src = url;
  });
}

async function frameCount(blob) {
  if (typeof ImageDecoder !== 'function' || !(await ImageDecoder.isTypeSupported(blob.type))) return null;
  const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type: blob.type });
  try {
    await decoder.completed;
    return decoder.tracks.selectedTrack.frameCount;
  } finally {
    decoder.close();
  }
}

// The largest gap between zero-delay timer ticks over a period: what a pressed key would wait.
async function largestTimerGap(period) {
  let largest = 0;
  let last = performance.now();
  const end = last + period;
  while (last < end) {
    await pause(0);
    const now = performance.now();
    largest = Math.max(largest, now - last);
    last = now;
  }
  return Math.round(largest);
}

async function run() {
  const gif = gifBlob(2, 2, [[200, 0, 0], [0, 0, 200]]);
  const apng = await apngBlob();
  const exif6 = await exifJpegBlob(6);
  const exif1 = await exifJpegBlob(1);
  const big = gifBlob(1024, 1024, Array.from({ length: 70 }, (_, n) => [n * 3, 120, 255 - n * 3]));

  await check('a two-frame GIF decodes and keeps its frames', async () => {
    const size = await decodeSize(gif);
    assertEqual(`${size.width}x${size.height}`, '2x2', 'size');
    const frames = await frameCount(gif);
    if (frames === null) return 'frame count unobserved: no ImageDecoder for GIF in this engine';
    assertEqual(frames, 2, 'frames');
    return 'two frames through ImageDecoder';
  });

  await check('a two-frame APNG decodes and keeps its frames', async () => {
    const size = await decodeSize(apng);
    assertEqual(`${size.width}x${size.height}`, '4x4', 'size');
    const frames = await frameCount(apng);
    if (frames === null) return 'frame count unobserved: no ImageDecoder for PNG in this engine';
    assertEqual(frames, 2, 'frames');
    return 'two frames through ImageDecoder';
  });

  await check('EXIF orientation 6 turns a 4x2 JPEG to 2x4 (positive case)', async () => {
    const size = await decodeSize(exif6);
    assertEqual(`${size.width}x${size.height}`, '2x4', 'oriented size');
  });

  await check('EXIF orientation 1 keeps a 4x2 JPEG at 4x2 (negative case)', async () => {
    const size = await decodeSize(exif1);
    assertEqual(`${size.width}x${size.height}`, '4x2', 'unrotated size');
  });

  await check('the large GIF fixture is at least 50 MiB and decodes', async () => {
    assert(big.size >= 50 * 1024 * 1024, `size ${big.size}`);
    const size = await decodeSize(big);
    assertEqual(`${size.width}x${size.height}`, '1024x1024', 'size');
    return `${big.size} bytes`;
  });

  const frame = document.getElementById('page');
  localStorage.removeItem('fms-web.local-view');
  localStorage.setItem('fms-web.preferences', JSON.stringify({ language: 'en', theme: 'light', inputProfile: 'pointer', size: 1 }));
  const win = await new Promise((resolve) => {
    frame.addEventListener('load', () => resolve(frame.contentWindow), { once: true });
    frame.src = '../web/index.html#/local';
  });
  const doc = win.document;
  await pause(0);

  const transfer = new win.DataTransfer();
  const add = (blob, name, n) => transfer.items.add(new win.File([blob], name, { type: blob.type, lastModified: n }));
  add(gif, 'a-anim.gif', 1);
  add(apng, 'b-anim.png', 2);
  add(exif6, 'c-exif6.jpg', 3);
  add(exif1, 'd-exif1.jpg', 4);
  add(big, 'e-big.gif', 5);
  doc.querySelector('.local').dispatchEvent(new win.DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  await until(() => doc.querySelectorAll('.local-item').length === 5);
  doc.getElementById('local-mode-grid')?.click();
  await until(() => doc.querySelectorAll('.item-thumb').length === 5);

  await check('the grid shows every picture as an oriented image thumbnail', async () => {
    const thumbs = [...doc.querySelectorAll('.item-thumb')];
    assertEqual(thumbs.length, 5, 'thumbnails');
    assertEqual(win.getComputedStyle(thumbs[0]).imageOrientation, 'from-image', 'thumbnail orientation');
    const oriented = doc.querySelector('.local-item[data-index="2"] .item-thumb');
    assert(await until(() => oriented.complete && oriented.naturalWidth > 0), 'oriented thumbnail decoded');
    assertEqual(`${oriented.naturalWidth}x${oriented.naturalHeight}`, '2x4', 'thumbnail oriented size');
  });

  await check('the viewer opens animated and oriented pictures with asynchronous decoding', async () => {
    doc.querySelector('.local-item[data-index="0"]').click();
    const picture = () => doc.querySelector('.viewer-image');
    assert(await until(() => picture()?.style.width === '2px'), 'GIF sized from its decode');
    assertEqual(picture().decoding, 'async', 'decoding');
    assertEqual(win.getComputedStyle(picture()).imageOrientation, 'from-image', 'viewer orientation');
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    assert(await until(() => doc.querySelector('.viewer-name')?.textContent === 'b-anim.png' && picture()?.style.width === '4px'), 'APNG opened');
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    assert(await until(() => doc.querySelector('.viewer-name')?.textContent === 'c-exif6.jpg' && picture()?.style.width === '2px'), 'oriented JPEG opened');
    assertEqual(picture().style.height, '4px', 'oriented JPEG height');
  });

  await check('the 50 MiB GIF leaves the page responsive in the grid and the viewer', async () => {
    doc.querySelector('.local-item[data-index="4"]').click();
    assert(await until(() => doc.querySelector('.viewer-name')?.textContent === 'e-big.gif'), 'large GIF opened');
    const gap = await largestTimerGap(1000);
    assert(gap < 1000, `largest timer gap ${gap} ms`);
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
    assert(await until(() => doc.querySelector('.viewer-name')?.textContent === 'd-exif1.jpg', 1000), 'PageUp paged away within a second');
    return `largest timer gap ${gap} ms`;
  });

  localStorage.removeItem('fms-web.local-view');
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
