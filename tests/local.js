// Local browsing, viewing, destination sorting and slideshow test (tickets S0023, S0024, S0025, S0027). Static ES module: checks the app modules
// directly, then the real page in a same-origin frame with dropped files. A PASS requires every
// declared check to have executed.

import { classify, extensionTable, isExcluded } from '../web/app/media-kind.js';
import { arrange, parseJump, prepareEntries, randomIndex, step } from '../web/app/browse.js';
import { destinationSlot, viewerCommand } from '../web/app/viewer-keys.js';
import { createLocalBrowser } from '../web/app/local-browser.js';
import { sourceFromFileList } from '../web/data/local-files.js';
import { moveFile } from '../web/data/local-move.js';
import { missingKeys } from '../web/app/strings.js';
import { createPlayerControl, formatTime, mediaErrorKind, nextSpeed, seekSteps, sniffContainer } from '../web/app/media-player.js';

const declaredChecks = 21;
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

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function entry(name, size, lastModified, isFolder = false) {
  return { name, size, lastModified, isFolder, file: null };
}

function pngBlob(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').fillRect(0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function run() {
  await check('every string exists in EN, RU and UK', () => {
    const missing = missingKeys();
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  await check('the MEDIA-CLASSIFICATION 0.13 table classifies every listed extension', () => {
    for (const [category, extensions] of Object.entries(extensionTable)) {
      for (const extension of extensions) assertEqual(classify(`a.${extension.toUpperCase()}`), category, extension);
    }
    assertEqual(Object.values(extensionTable).flat().length, 114, 'table size');
    assertEqual(classify('x.jxl'), 'IMAGE', 'jxl (2026-10-18)');
    assertEqual(classify('x.htm'), 'DOCUMENT', 'htm (2026-10-29)');
    assertEqual(classify('noext'), 'UNKNOWN', 'no extension');
    assertEqual(classify('clip.mp4.download'), 'VIDEO', 'temporary suffix stripped');
    assertEqual(classify('photo.jpg. '), 'IMAGE', 'trailing dot and space stripped');
  });

  await check('dot-files and junk are excluded before classification', () => {
    for (const name of ['.DS_Store', '.hidden.jpg', 'Thumbs.db', 'desktop.ini', 'a.tmp', 'b.swp', 'c.~1']) assert(isExcluded(name), name);
    assert(!isExcluded('photo.jpg'), 'ordinary file kept');
    const prepared = prepareEntries([entry('.git', 0, 0, true), entry('a.png', 1, 1)]);
    assertEqual(prepared.length, 1, 'excluded entry dropped');
    assertEqual(prepared[0].category, 'IMAGE', 'category assigned');
  });

  const scanned = prepareEntries([
    entry('b.JPG', 300, 30), entry('Sub', 0, 0, true), entry('a.png', 100, 10), entry('C.webp', 100, 20),
    entry('song.mp3', 50, 5), entry('notes.txt', 10, 1), entry('alpha', 0, 0, true),
  ]);

  await check('name sort is case-insensitive, folders first, kinds filter the files', () => {
    const { folders, files } = arrange(scanned, { sortKey: 'name', locale: 'en' });
    assertEqual(folders.map((item) => item.name).join(','), 'alpha,Sub', 'folders by name');
    assertEqual(files.map((item) => item.name).join(','), 'a.png,b.JPG,C.webp,song.mp3', 'files, no txt by default');
    const all = arrange(scanned, { sortKey: 'name', kinds: ['image', 'video', 'audio', 'other'] });
    assert(all.files.some((item) => item.name === 'notes.txt'), 'other files joined');
  });

  await check('date and size sort, ties keep scan order, reverse order', () => {
    assertEqual(arrange(scanned, { sortKey: 'date' }).files.map((item) => item.name).join(','), 'song.mp3,a.png,C.webp,b.JPG', 'date');
    assertEqual(arrange(scanned, { sortKey: 'size' }).files.map((item) => item.name).join(','), 'song.mp3,a.png,C.webp,b.JPG', 'size ties in scan order');
    assertEqual(arrange(scanned, { sortKey: 'size', descending: true }).files[0].name, 'b.JPG', 'reverse');
  });

  await check('the live name filter is a case-insensitive substring', () => {
    assertEqual(arrange(scanned, { filter: 'PN' }).files.map((item) => item.name).join(','), 'a.png', 'filter');
    assertEqual(arrange(scanned, { filter: 'zzz' }).folders.length, 2, 'folders stay reachable');
  });

  await check('navigation steps, random excludes the current file, jump validates', () => {
    assertEqual(step(4, 5, 'next'), 0, 'next wraps');
    assertEqual(step(0, 5, 'previous'), 4, 'previous wraps');
    assertEqual(step(3, 250, 'forward100'), 103, '+100');
    assertEqual(step(5, 250, 'back10'), 0, '-10 stops at the start');
    assertEqual(step(245, 250, 'forward10'), 249, '+10 stops at the end');
    for (let draw = 0; draw < 50; draw += 1) assert(randomIndex(2, 5) !== 2, 'random repeated the current file');
    assertEqual(randomIndex(0, 1), 0, 'single file');
    assertEqual(parseJump('3', 5), 2, 'jump 3');
    for (const bad of ['0', '6', '-1', '2.5', 'a', '']) assertEqual(parseJump(bad, 5), null, `jump ${bad}`);
  });

  await check('viewer keys follow VIEWER-KEYBOARD', () => {
    const key = (k, extra = {}) => viewerCommand({ key: k, code: extra.code ?? '', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...extra });
    assertEqual(key('PageDown'), 'next', 'PageDown');
    assertEqual(key('PageUp', { shiftKey: true }), 'back100', 'Shift+PageUp');
    assertEqual(key('ArrowRight'), 'next', 'Right');
    assertEqual(viewerCommand({ key: 'ArrowRight', code: 'ArrowRight' }, { isPlayer: true }), 'seekForward10', 'Right on a video seeks');
    assertEqual(key(' '), 'next', 'Space');
    assertEqual(key('ArrowUp'), 'back10', 'Up');
    assertEqual(key('Home'), 'first', 'Home');
    assertEqual(key('н', { code: 'KeyY' }), 'random', 'Y on any layout');
    assertEqual(key('т', { code: 'KeyN' }), 'jump', 'N');
    assertEqual(key('F4'), 'chooseFromList', 'F4');
    assertEqual(key('*', { code: 'NumpadMultiply' }), 'actualSize', 'keypad *');
    assertEqual(key('/', { code: 'NumpadDivide' }), 'fit', 'keypad /');
    assertEqual(key('=', { code: 'Equal' }), 'zoomIn', '=');
    assertEqual(key('R', { code: 'KeyR', shiftKey: true }), 'rotateLeft', 'Shift+R');
    assertEqual(key('f', { code: 'KeyF' }), 'fullscreen', 'F');
    assertEqual(key('f', { code: 'KeyF', ctrlKey: true }), null, 'Ctrl+F stays the browser\'s');
  });

  await check('player keys follow the VIEWER-KEYBOARD player rows on video and audio', () => {
    const key = (k, extra = {}) => viewerCommand({ key: k, code: extra.code ?? '', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...extra }, { isPlayer: true });
    assertEqual(key(' '), 'playPause', 'Space');
    assertEqual(key('л', { code: 'KeyK' }), 'playPause', 'K on any layout');
    assertEqual(key('MediaPlayPause'), 'playPause', 'media key');
    assertEqual(key('ArrowLeft'), 'seekBack10', 'Left');
    assertEqual(key('ArrowRight', { shiftKey: true }), 'seekForward3', 'Shift+Right');
    assertEqual(key('ArrowLeft', { ctrlKey: true }), 'seekBack60', 'Ctrl+Left');
    assertEqual(key('ArrowUp', { ctrlKey: true }), 'volumeUp', 'Ctrl+Up');
    assertEqual(key('ArrowUp'), 'back10', 'Up still pages by ten');
    assertEqual(key('х', { code: 'BracketLeft' }), 'slower', '[');
    assertEqual(key('ъ', { code: 'BracketRight' }), 'faster', ']');
    assertEqual(key('\\', { code: 'Backslash' }), 'normalSpeed', '\\');
    assertEqual(key('ю', { code: 'Period' }), 'frameForward', '.');
    assertEqual(key('б', { code: 'Comma' }), 'frameBack', ',');
    assertEqual(key('L', { code: 'KeyL', shiftKey: true }), 'abLoop', 'Shift+L');
    assertEqual(key('m', { code: 'KeyM' }), 'mute', 'M');
    assertEqual(key('PageDown'), 'next', 'PageDown still pages');
    assertEqual(key('f', { code: 'KeyF', ctrlKey: true }), null, 'Ctrl+F stays the browser\'s');
    assertEqual(viewerCommand({ key: 'ArrowLeft', code: 'ArrowLeft', ctrlKey: true }), null, 'Ctrl+Left off the player stays the browser\'s');
  });

  await check('the container is named from the first bytes, never from the name', () => {
    const bytes = (...parts) => {
      const out = [];
      for (const part of parts) {
        if (typeof part === 'string') for (const char of part) out.push(char.charCodeAt(0));
        else out.push(...part);
      }
      while (out.length < 256) out.push(0);
      return new Uint8Array(out);
    };
    assertEqual(sniffContainer(bytes([0, 0, 0, 24], 'ftypisom')), 'MP4', 'MP4');
    assertEqual(sniffContainer(bytes([0, 0, 0, 20], 'ftypqt  ')), 'MOV', 'MOV');
    assertEqual(sniffContainer(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84], 'webm')), 'WebM', 'WebM');
    assertEqual(sniffContainer(bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x88], 'matroska')), 'Matroska', 'MKV');
    assertEqual(sniffContainer(bytes('RIFF', [1, 2, 3, 4], 'AVI LIST')), 'AVI', 'AVI renamed .mp4 is still AVI');
    assertEqual(sniffContainer(bytes('OggS')), 'Ogg', 'Ogg');
    assertEqual(sniffContainer(bytes('ID3')), 'MP3', 'MP3');
    assertEqual(sniffContainer(bytes([0xff, 0xf1])), 'AAC', 'ADTS');
    assertEqual(sniffContainer(bytes([0x30, 0x26, 0xb2, 0x75])), 'ASF', 'WMV');
    assertEqual(sniffContainer(bytes('hello')), null, 'unrecognised');
    assertEqual(mediaErrorKind({ code: 4 }), 'unsupported', 'code 4');
    assertEqual(mediaErrorKind({ code: 3 }), 'decode', 'code 3');
    assertEqual(mediaErrorKind(null), null, 'no error');
  });

  await check('the player seeks, changes speed, loops A-B, mutes, steps frames and tells autoplay refusal from a decode failure', async () => {
    const make = (playResult) => {
      const handlers = {};
      return {
        currentTime: 20, duration: 100, paused: true, ended: false, playbackRate: 1, volume: 1, muted: false,
        videoWidth: 640, videoHeight: 360, error: null,
        addEventListener(type, handler) { (handlers[type] ??= []).push(handler); },
        removeEventListener(type, handler) { handlers[type] = (handlers[type] ?? []).filter((item) => item !== handler); },
        emit(type) { for (const handler of handlers[type] ?? []) handler(); },
        count(type) { return (handlers[type] ?? []).length; },
        play() { if (playResult) return Promise.reject(playResult); this.paused = false; return Promise.resolve(); },
        pause() { this.paused = true; },
        removeAttribute(name) { this.removed = name; },
        load() { this.loaded = true; },
      };
    };
    const media = make(null);
    const parts = [];
    const player = createPlayerControl({ media, onChange: (part) => parts.push(part) });
    assertEqual(player.state.frameBack, 'unavailable', 'no frame callback: back step disabled');
    player.seekBy(-seekSteps.medium);
    assertEqual(media.currentTime, 10, 'back 10 s');
    player.seekBy(-seekSteps.long);
    assertEqual(media.currentTime, 0, 'clamped at the start');
    player.seekBy(500);
    assertEqual(media.currentTime, 100, 'clamped at the end');
    player.faster();
    assertEqual(media.playbackRate, 1.25, 'faster');
    player.slower();
    player.slower();
    assertEqual(media.playbackRate, 0.75, 'slower');
    player.normalSpeed();
    assertEqual(media.playbackRate, 1, 'normal');
    assertEqual(nextSpeed(4, 1), 4, 'top of the ladder');
    media.currentTime = 5;
    player.toggleLoop();
    media.currentTime = 8;
    player.toggleLoop();
    assertEqual(`${player.state.loop.a}-${player.state.loop.b}`, '5-8', 'A and B marked');
    media.currentTime = 8.1;
    media.emit('timeupdate');
    assertEqual(media.currentTime, 5, 'the loop returned to A');
    player.toggleLoop();
    assertEqual(player.state.loop.a, null, 'third press clears');
    player.toggleMute();
    assertEqual(media.muted, true, 'muted');
    player.volumeBy(-0.3);
    assertEqual(media.volume, 0.7, 'volume down');
    player.volumeBy(0.1);
    assertEqual(media.muted, false, 'raising the volume unmutes');
    media.currentTime = 1;
    player.frameStep(1);
    assertEqual(Math.round(media.currentTime * 1000), 1033, 'one frame on at 30 fps by default');
    player.frameStep(-1);
    assertEqual(Math.round(media.currentTime * 1000), 1033, 'back step refused while unavailable');
    player.start();
    await tick();
    assertEqual(media.paused, false, 'started');
    player.togglePlay();
    assertEqual(media.paused, true, 'paused');
    media.emit('loadedmetadata');
    assertEqual(player.state.soundOnly, false, 'a picture');
    player.dispose();
    assertEqual(media.removed, 'src', 'source cleared');
    assertEqual(media.loaded, true, 'decoder released');
    assertEqual(media.count('timeupdate'), 0, 'listeners removed');

    const refused = Object.assign(new Error('refused'), { name: 'NotAllowedError' });
    const quiet = make(refused);
    const waiting = createPlayerControl({ media: quiet, onChange: () => {} });
    waiting.start();
    await tick();
    await tick();
    assertEqual(waiting.state.waiting, true, 'autoplay refusal asks for Play');
    assertEqual(waiting.state.failure, null, 'not a format failure');
    quiet.error = { code: 4 };
    quiet.emit('error');
    assertEqual(waiting.state.failure, 'unsupported', 'decode refusal is the format line');
    assertEqual(waiting.state.waiting, false, 'no Play prompt over the format line');

    const sound = make(null);
    sound.videoWidth = 0;
    sound.videoHeight = 0;
    const listening = createPlayerControl({ media: sound, onChange: () => {} });
    sound.emit('loadedmetadata');
    assertEqual(listening.state.soundOnly, true, 'audio-only file');
    sound.currentTime = 3;
    listening.frameStep(1);
    assertEqual(sound.currentTime, 3, 'no frame step on sound');

    const framed = make(null);
    let pending = null;
    framed.requestVideoFrameCallback = (callback) => { pending = callback; return 1; };
    framed.cancelVideoFrameCallback = () => { pending = null; };
    const stepping = createPlayerControl({ media: framed, onChange: () => {} });
    assertEqual(stepping.state.frameBack, 'unknown', 'frame callback: back step offered');
    framed.currentTime = 2;
    stepping.frameStep(-1);
    pending(0, { mediaTime: 1.967, presentedFrames: 10 });
    assertEqual(stepping.state.frameBack, 'working', 'one frame back observed');
    framed.currentTime = 2;
    stepping.frameStep(-1);
    pending(0, { mediaTime: 0, presentedFrames: 11 });
    assertEqual(stepping.state.frameBack, 'unavailable', 'a snap to a key frame disables the back step');
    assertEqual(stepping.canStepBack(), false, 'disabled with its reason');
    assertEqual(formatTime(3725), '1:02:05', 'hours');
    assertEqual(formatTime(65), '1:05', 'minutes');
  });

  await check('digits 1..9 and 0, top row and keypad, choose the destination on any layout', () => {
    const key = (code, k, extra = {}) => destinationSlot({ code, key: k, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...extra });
    for (let digit = 0; digit <= 9; digit += 1) {
      assertEqual(key(`Digit${digit}`, String(digit)), String(digit), `Digit${digit}`);
      assertEqual(key(`Numpad${digit}`, String(digit)), String(digit), `Numpad${digit}`);
    }
    assertEqual(key('Digit2', 'é'), '2', 'AZERTY 2');
    assertEqual(key('Digit2', '@', { shiftKey: true }), null, 'Shift+digit is not a move');
    assertEqual(key('Digit2', '2', { ctrlKey: true }), null, 'Ctrl+digit stays with the browser');
    assertEqual(key('Numpad2', 'ArrowDown'), null, 'keypad with Num Lock off');
  });

  await check('a move never overwrites, refuses the same folder and removes the source only after the copy', async () => {
    if (!navigator.storage || typeof navigator.storage.getDirectory !== 'function') {
      throw new Error('no origin private file system in this engine - could not verify');
    }
    const root = await navigator.storage.getDirectory();
    const work = await root.getDirectoryHandle(`s0024-${Date.now()}`, { create: true });
    const from = await work.getDirectoryHandle('from', { create: true });
    const to = await work.getDirectoryHandle('to', { create: true });
    const put = async (directory, name, text) => {
      const writable = await (await directory.getFileHandle(name, { create: true })).createWritable();
      await writable.write(text);
      await writable.close();
    };
    const read = async (directory, name) => (await (await directory.getFileHandle(name)).getFile()).text();
    const has = async (directory, name) => directory.getFileHandle(name).then(() => true, () => false);
    try {
      await put(from, 'a.jpg', 'AAAA');
      await put(from, 'b.jpg', 'NEW');
      await put(to, 'b.jpg', 'OLD');
      assertEqual(await moveFile({ sourceDirectory: from, name: 'a.jpg', destination: to }), 'moved', 'move');
      assertEqual(await read(to, 'a.jpg'), 'AAAA', 'bytes in the destination');
      assertEqual(await has(from, 'a.jpg'), false, 'source removed');
      assertEqual(await moveFile({ sourceDirectory: from, name: 'b.jpg', destination: to }), 'clash', 'clash');
      assertEqual(await read(to, 'b.jpg'), 'OLD', 'destination not overwritten');
      assertEqual(await read(from, 'b.jpg'), 'NEW', 'source kept on a clash');
      assertEqual(await moveFile({ sourceDirectory: from, name: 'b.jpg', destination: from }), 'same', 'same folder refused');
    } finally {
      await root.removeEntry(work.name, { recursive: true });
    }
  });

  await check('a folder input becomes a folder tree with a path stack', async () => {
    const make = (path) => {
      const file = new File(['x'], path.split('/').pop(), { lastModified: 5 });
      Object.defineProperty(file, 'webkitRelativePath', { value: path });
      return file;
    };
    const source = sourceFromFileList([make('Trip/a.jpg'), make('Trip/day 2/b.png'), make('Trip/day 2/deep/c.gif')], 'Files');
    assertEqual(source.label, 'Trip', 'root label');
    assertEqual(source.writable, false, 'read-only snapshot');
    const top = await source.list([]);
    assertEqual(top.map((item) => `${item.isFolder ? 'D' : 'F'}:${item.name}`).join(','), 'F:a.jpg,D:day 2', 'top level');
    const inner = await source.list(['day 2']);
    assertEqual(inner.map((item) => item.name).join(','), 'b.png,deep', 'second level');
    assertEqual((await source.list(['day 2', 'deep']))[0].name, 'c.gif', 'third level');
    const loose = sourceFromFileList([new File(['x'], 'one.jpg')], 'Files');
    assertEqual(loose.label, 'Files', 'loose files get the fallback label');
  });

  let changes = [];
  const fake = {
    label: 'Root',
    writable: false,
    async list(path) {
      if (path.join('/') === 'Sub') return [entry('inner.png', 1, 1)];
      return [entry('Sub', 0, 0, true), entry('b.png', 2, 2), entry('a.png', 1, 1), entry('c.png', 3, 3)];
    },
  };
  const browser = createLocalBrowser({ locale: () => 'en', onChange: (part) => changes.push(part) });

  await check('the browser opens a source, enters a folder and steps back up the path', async () => {
    browser.open(fake);
    await tick();
    assertEqual(browser.state.files.map((item) => item.name).join(','), 'a.png,b.png,c.png', 'listed and sorted');
    browser.enterFolder('Sub');
    await tick();
    assertEqual(browser.state.path.join('/'), 'Sub', 'path stack');
    assertEqual(browser.state.files[0].name, 'inner.png', 'subfolder listed');
    browser.goToDepth(0);
    await tick();
    assertEqual(browser.state.path.length, 0, 'back at the root');
  });

  await check('the jump field keeps invalid input and explains', () => {
    browser.openFile(0);
    browser.openJump();
    assertEqual(browser.state.jump.text, '1', 'prefilled with the position');
    assertEqual(browser.submitJump('9'), false, 'out of range refused');
    assertEqual(browser.state.jump.invalid, true, 'explanation shown');
    assertEqual(browser.state.jump.text, '9', 'input retained');
    assertEqual(browser.submitJump('3'), true, 'valid jump');
    assertEqual(browser.state.index, 2, 'moved to file 3');
  });

  await check('zoom steps by 1.25 at the anchor, fit and actual size, quarter-turn rotation', () => {
    browser.setStage(400, 300);
    browser.setNatural(800, 600);
    assertEqual(browser.effectiveScale(), 0.5, 'fit scale');
    browser.zoomIn({ x: 100, y: 0 });
    assertEqual(browser.effectiveScale(), 0.625, 'one step');
    assertEqual(browser.state.transform.panX, 100 - 100 * 1.25, 'anchor point kept');
    browser.actualSize();
    assertEqual(browser.effectiveScale(), 1, 'actual size');
    browser.rotate(1);
    browser.rotate(1);
    browser.rotate(-1);
    assertEqual(browser.state.transform.rotation, 1, 'quarter turns');
    browser.fit();
    browser.setNatural(300, 400);
    assertEqual(browser.effectiveScale(), 1, 'fit never enlarges past actual size');
    assertEqual(browser.state.transform.rotation, 1, 'fit keeps the rotation');
  });

  changes = [];
  const frame = document.getElementById('page');
  localStorage.removeItem('fms-web.slideshow-interval');
  localStorage.removeItem('fms-web.local-view');
  localStorage.setItem('fms-web.preferences', JSON.stringify({ language: 'en', theme: 'light', inputProfile: 'pointer', size: 1 }));
  const win = await new Promise((resolve) => {
    frame.addEventListener('load', () => resolve(frame.contentWindow), { once: true });
    frame.src = '../web/index.html#/local';
  });
  const doc = win.document;
  await tick();

  await check('the local screen offers the open controls and the drop hint', () => {
    assert(doc.querySelector('[data-command="local.openFolder"]'), 'open folder');
    assert(doc.querySelector('[data-command="local.openFiles"]'), 'open files');
    assert(doc.querySelector('.local .explanation').textContent.length > 0, 'drop hint');
  });

  const transfer = new win.DataTransfer();
  transfer.items.add(new win.File([await pngBlob(64, 48)], 'one.png', { type: 'image/png', lastModified: 1 }));
  transfer.items.add(new win.File([await pngBlob(32, 32)], 'two.png', { type: 'image/png', lastModified: 2 }));
  transfer.items.add(new win.File(['x'], '.DS_Store', { lastModified: 3 }));
  transfer.items.add(new win.File(['x'], 'readme.txt', { type: 'text/plain', lastModified: 4 }));
  doc.querySelector('.local').dispatchEvent(new win.DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let wait = 0; wait < 50 && doc.querySelectorAll('.local-item').length === 0; wait += 1) await new Promise((resolve) => setTimeout(resolve, 20));

  await check('dropped files list the media kinds, without the dot-file, read-only', () => {
    const names = [...doc.querySelectorAll('.local-item .item-name')].map((node) => node.textContent);
    assertEqual(names.join(','), 'one.png,two.png', 'listed');
    assertEqual(doc.querySelector('.local-note').hidden, false, 'read-only line shown');
  });

  await check('a file opens in the viewer beside the list and the keys page through it', async () => {
    doc.querySelector('.local-item[data-index="0"]').click();
    const viewer = doc.querySelector('.local-viewer');
    assertEqual(viewer.hidden, false, 'viewer shown');
    const destinations = doc.querySelector('[data-command="viewer.destinations"]');
    assert(destinations, 'Destinations control shown');
    assertEqual(destinations.getAttribute('aria-disabled'), 'true', 'disabled for a read-only source');
    assert(doc.getElementById(destinations.getAttribute('aria-describedby')).textContent.length > 0, 'reason line beside it');
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true, cancelable: true }));
    assertEqual(doc.querySelectorAll('.local-item[data-index]').length, 2, 'a digit moved nothing');
    assert(!doc.querySelector('.sort-message').hidden, 'the digit says why');
    assert(doc.querySelector('.local-list').isConnected, 'list kept beside it');
    assertEqual(doc.querySelector('.viewer-name').textContent, 'one.png', 'first file');
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    assertEqual(doc.querySelector('.viewer-name').textContent, 'two.png', 'PageDown');
    assertEqual(doc.querySelector('.local-item[aria-current="true"] .item-name').textContent, 'two.png', 'current marked in the list');
    doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true, cancelable: true }));
    for (let wait = 0; wait < 50 && !doc.querySelector('.viewer-image')?.style.transform.includes('rotate(90deg)'); wait += 1) await new Promise((resolve) => setTimeout(resolve, 20));
    assert(doc.querySelector('.viewer-image').style.transform.includes('rotate(90deg)'), 'R rotated the view');
    const escape = new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    doc.body.dispatchEvent(escape);
    assertEqual(viewer.hidden, true, 'Esc closed the viewer');
    assert(escape.defaultPrevented, 'Esc consumed by the viewer layer');
  });

  await check('S starts the slideshow, S again halves its interval, Esc stops it', async () => {
    doc.querySelector('.local-item[data-index="0"]').click();
    const press = (key, code) => doc.body.dispatchEvent(new win.KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
    assert(doc.querySelector('[data-command="slideshow.start"]'), 'Slideshow control shown');
    assert(doc.querySelector('#slideshow-interval'), 'interval field shown');
    press('s', 'KeyS');
    const status = () => doc.querySelector('.slideshow-status');
    assert(status() && status().textContent.includes('10'), 'running at the 10 s default');
    press('s', 'KeyS');
    assert(status().textContent.includes('5'), 'S again halved the interval');
    assertEqual(doc.getElementById('slideshow-interval'), null, 'the field gives way to the running controls');
    press('Escape', 'Escape');
    assertEqual(status(), null, 'Esc stopped the slideshow');
    assertEqual(doc.querySelector('.local-viewer').hidden, false, 'the viewer stays open');
    assertEqual(doc.getElementById('slideshow-interval').value, '10', 'the stored interval is unchanged');
    press('Escape', 'Escape');
    assertEqual(doc.querySelector('.local-viewer').hidden, true, 'the next Esc closed the viewer');
  });

  localStorage.removeItem('fms-web.slideshow-interval');
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
