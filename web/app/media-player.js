import { readHead } from '../data/local-files.js';
import { log } from '../data/log.js';

// The player of the local viewer (matrix rows 67-68): its rules, and a controller over one media
// element. The controller only reads and sets the element's documented members, so a plain object
// with the same members drives it in a test. What the engine decodes is learned from the element's
// own events, never from the file name (MEDIA-VIEWER section 1 rule 6).

export const seekSteps = Object.freeze({ short: 3, medium: 10, long: 60 });
export const speeds = Object.freeze([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]);
export const volumeStep = 0.1;
export const headLength = 256;
const defaultFrame = 1 / 30;
const frameLimits = Object.freeze({ shortest: 1 / 240, longest: 1 / 10 });

export function clampTime(time, duration) {
  if (!Number.isFinite(time) || time < 0) return 0;
  return Number.isFinite(duration) ? Math.min(time, duration) : time;
}

// The next rung of the speed ladder in a direction; a rate between rungs moves to the nearest one
// beyond it, and direction 0 is normal speed.
export function nextSpeed(rate, direction) {
  if (direction === 0) return 1;
  if (direction > 0) return speeds.find((rung) => rung > rate + 1e-9) ?? speeds[speeds.length - 1];
  return [...speeds].reverse().find((rung) => rung < rate - 1e-9) ?? speeds[0];
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

// MediaError codes: 1 aborted, 2 network (a local file that could not be read), 3 decode,
// 4 source not supported.
export function mediaErrorKind(error) {
  if (!error) return null;
  return { 1: 'aborted', 2: 'unreadable', 3: 'decode', 4: 'unsupported' }[error.code] ?? 'decode';
}

function ascii(bytes, from, length) {
  return String.fromCharCode(...bytes.slice(from, from + length));
}

// The container named by the first bytes of a file, or null when the head is not recognised.
export function sniffContainer(bytes) {
  if (!bytes || bytes.length < 4) return null;
  const at = (index) => bytes[index];
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (brand === 'qt  ') return 'MOV';
    if (brand.startsWith('3g')) return '3GP';
    return 'MP4';
  }
  if (at(0) === 0x1a && at(1) === 0x45 && at(2) === 0xdf && at(3) === 0xa3) {
    return ascii(bytes, 0, Math.min(bytes.length, 64)).includes('webm') ? 'WebM' : 'Matroska';
  }
  const head = ascii(bytes, 0, 4);
  if (head === 'RIFF') {
    const form = ascii(bytes, 8, 4);
    if (form === 'AVI ') return 'AVI';
    if (form === 'WAVE') return 'WAV';
    return null;
  }
  if (head === 'OggS') return 'Ogg';
  if (head === 'fLaC') return 'FLAC';
  if (head === 'caff') return 'CAF';
  if (head === 'MThd') return 'MIDI';
  if (ascii(bytes, 0, 3) === 'FLV') return 'FLV';
  if (ascii(bytes, 0, 5) === '#!AMR') return 'AMR';
  if (at(0) === 0x30 && at(1) === 0x26 && at(2) === 0xb2 && at(3) === 0x75) return 'ASF';
  if (at(0) === 0x00 && at(1) === 0x00 && at(2) === 0x01 && at(3) === 0xba) return 'MPEG-PS';
  if (at(0) === 0x47 && bytes.length > 188 && at(188) === 0x47) return 'MPEG-TS';
  if (bytes.length > 196 && at(4) === 0x47 && at(196) === 0x47) return 'MPEG-TS';
  if (ascii(bytes, 0, 3) === 'ID3') return 'MP3';
  if (at(0) === 0xff && (at(1) & 0xf6) === 0xf0) return 'AAC';
  if (at(0) === 0xff && (at(1) & 0xe0) === 0xe0) return 'MP3';
  return null;
}

export async function containerOf(file) {
  return file ? sniffContainer(await readHead(file, headLength)) : null;
}

// state.frameBack: 'unknown' until a back step was watched, 'working' after one moved back by about
// one frame, 'unavailable' when the engine cannot confirm the presented frame or a step was seen to
// land elsewhere.
export function createPlayerControl({ media, onChange }) {
  const canWatchFrames = typeof media.requestVideoFrameCallback === 'function';
  const state = {
    failure: null,
    waiting: false,
    soundOnly: null,
    loop: { a: null, b: null },
    frameDuration: defaultFrame,
    frameBack: canWatchFrames ? 'unknown' : 'unavailable',
  };
  let frameHandle = null;
  let lastFrame = null;
  let disposed = false;
  const listeners = [];

  const changed = (part = 'all') => { if (!disposed) onChange(part); };

  function listen(type, handler) {
    media.addEventListener(type, handler);
    listeners.push([type, handler]);
  }

  function cancelFrames() {
    if (frameHandle !== null && typeof media.cancelVideoFrameCallback === 'function') media.cancelVideoFrameCallback(frameHandle);
    frameHandle = null;
  }

  // While playing, consecutive presented frames give the frame duration of this file.
  function watchFrames() {
    if (!canWatchFrames || disposed) return;
    cancelFrames();
    const onFrame = (now, meta) => {
      frameHandle = null;
      if (lastFrame && meta.presentedFrames > lastFrame.presentedFrames && meta.mediaTime > lastFrame.mediaTime) {
        const each = (meta.mediaTime - lastFrame.mediaTime) / (meta.presentedFrames - lastFrame.presentedFrames);
        if (each >= frameLimits.shortest && each <= frameLimits.longest && (state.frameDuration === defaultFrame || each < state.frameDuration)) {
          state.frameDuration = each;
        }
      }
      lastFrame = { mediaTime: meta.mediaTime, presentedFrames: meta.presentedFrames };
      if (!media.paused) frameHandle = media.requestVideoFrameCallback(onFrame);
    };
    frameHandle = media.requestVideoFrameCallback(onFrame);
  }

  function seekTo(time) {
    if (state.failure) return;
    media.currentTime = clampTime(time, media.duration);
  }

  function play() {
    state.waiting = false;
    let started;
    try {
      started = media.play();
    } catch (error) {
      started = Promise.reject(error);
    }
    Promise.resolve(started).catch((error) => {
      if (disposed) return;
      if (error && error.name === 'NotAllowedError' && !media.error) {
        state.waiting = true;
        changed();
        return;
      }
      // A decode failure arrives as the element's error event; an abort by a newer load is expected.
      if (!media.error && !(error && error.name === 'AbortError')) log.info(`playback did not start (${error && error.name})`);
    });
  }

  listen('loadedmetadata', () => {
    state.soundOnly = !(media.videoWidth > 0 && media.videoHeight > 0);
    changed();
  });
  listen('error', () => {
    state.failure = mediaErrorKind(media.error) ?? 'decode';
    state.waiting = false;
    cancelFrames();
    changed();
  });
  listen('timeupdate', () => {
    const { a, b } = state.loop;
    if (a !== null && b !== null && media.currentTime >= b) media.currentTime = a;
    changed('time');
  });
  listen('durationchange', () => changed('time'));
  listen('play', () => {
    state.waiting = false;
    watchFrames();
    changed();
  });
  listen('pause', () => { cancelFrames(); changed(); });
  listen('ended', () => changed());
  listen('ratechange', () => changed());
  listen('volumechange', () => changed());

  const api = {
    state,
    media,
    start: play,
    togglePlay() {
      if (state.failure) return;
      if (media.paused || media.ended) play();
      else media.pause();
    },
    seekBy(seconds) { seekTo(media.currentTime + seconds); },
    seekTo,
    faster() { media.playbackRate = nextSpeed(media.playbackRate, 1); },
    slower() { media.playbackRate = nextSpeed(media.playbackRate, -1); },
    normalSpeed() { media.playbackRate = 1; },
    // First press marks A, the second marks B after A, the third clears the loop.
    toggleLoop() {
      const { loop } = state;
      const now = media.currentTime;
      if (loop.a === null) loop.a = now;
      else if (loop.b === null && now > loop.a) loop.b = now;
      else if (loop.b === null) loop.a = now;
      else state.loop = { a: null, b: null };
      changed();
    },
    toggleMute() { media.muted = !media.muted; },
    volumeBy(delta) {
      const next = Math.round(Math.min(1, Math.max(0, media.volume + delta)) * 100) / 100;
      media.volume = next;
      if (delta > 0 && media.muted) media.muted = false;
    },
    setVolume(value) {
      media.volume = Math.min(1, Math.max(0, Number(value) || 0));
      if (media.volume > 0 && media.muted) media.muted = false;
    },
    canStepBack() {
      return state.frameBack !== 'unavailable';
    },
    // Forward moves one frame on; back moves one frame back where the engine shows it, and the
    // presented frame is checked so a decoder that snaps elsewhere disables the back step.
    frameStep(direction) {
      if (state.failure || state.soundOnly) return;
      if (direction < 0 && !api.canStepBack()) return;
      if (!media.paused) media.pause();
      const before = media.currentTime;
      seekTo(before + (direction < 0 ? -1 : 1) * state.frameDuration);
      if (direction >= 0 || !canWatchFrames || before <= 0) return;
      cancelFrames();
      frameHandle = media.requestVideoFrameCallback((now, meta) => {
        frameHandle = null;
        const moved = before - meta.mediaTime;
        state.frameBack = moved > state.frameDuration * 0.25 && moved < state.frameDuration * 2.5 ? 'working' : 'unavailable';
        changed();
      });
    },
    // The decoder is released at once: switching files must not exhaust hardware decoders.
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelFrames();
      for (const [type, handler] of listeners) media.removeEventListener(type, handler);
      media.pause();
      media.removeAttribute('src');
      media.load();
    },
  };
  return api;
}
