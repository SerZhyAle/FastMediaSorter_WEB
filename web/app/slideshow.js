import { readValue, writeValue } from '../data/local-store.js';

// The slideshow of the local viewer (MEDIA-VIEWER section 1 rule 5, matrix rows 89-90): the
// interval rules, the random no-repeat cycle and a controller over the browser object of
// local-browser.js. The view reports each shown file and its media events; the controller owns
// the timer, the order and the screen lock. Clock and lock are injected so a test drives them.

export const defaultInterval = 10;
export const minInterval = 1;
export const maxInterval = 3600;
const intervalKey = 'slideshow-interval';
const tickMs = 250;

// A stored or typed interval in whole seconds within 1..3600; anything else is the default.
export function normalizeInterval(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return defaultInterval;
  return Math.min(maxInterval, Math.max(minInterval, Math.round(number)));
}

// A repeated start halves the running interval down to the 1 s floor.
export function shortened(running) {
  return Math.max(minInterval, running / 2);
}

// The final 3-2-1, only when the interval is longer than 3 s.
export function countdownValue(interval, remainingSeconds) {
  if (!(interval > 3) || !(remainingSeconds > 0) || remainingSeconds > 3) return null;
  return Math.ceil(remainingSeconds);
}

// Random order without repetition: every file of the list once per cycle, and a new cycle never
// starts with the file the previous cycle ended on. Files are tracked as entries, so a file that
// leaves the list (a move, a filter) simply drops out of the cycle.
// The file shown when the show starts is the first visit of the first cycle.
export function createRandomCycle(random = Math.random) {
  let pending = new Set();
  let fresh = true;
  return {
    next(files, current) {
      if (files.length === 0) return null;
      const live = new Set(files);
      for (const entry of pending) if (!live.has(entry)) pending.delete(entry);
      if (fresh) {
        pending = new Set(files);
        fresh = false;
      }
      if (current) pending.delete(current);
      if (pending.size === 0) pending = new Set(files);
      const candidates = [...pending].filter((entry) => entry !== current || files.length === 1);
      const pick = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
      pending.delete(pick);
      return pick;
    },
    reset() {
      pending = new Set();
      fresh = true;
    },
  };
}

const defaultClock = Object.freeze({
  now: () => performance.now(),
  set: (run, ms) => setTimeout(run, ms),
  clear: (handle) => clearTimeout(handle),
});

// state.screen: the wake lock's status ('off', 'pending', 'held', 'released', 'denied',
// 'unavailable'). state.waitingForMedia: the shown file is video or audio and the show waits for
// its end instead of the timer.
export function createSlideshow({ browser, wakeLock, onChange, clock = defaultClock, random = Math.random }) {
  const state = {
    active: false,
    random: false,
    preference: normalizeInterval(readValue(intervalKey, defaultInterval)),
    running: defaultInterval,
    countdown: null,
    waitingForMedia: false,
    screen: wakeLock.status,
  };
  const cycle = createRandomCycle(random);
  let shown = null;
  let deadline = null;
  let pausedLeft = null;
  let handle = null;
  let hidden = false;

  const changed = (part = 'slideshow') => onChange(part);

  wakeLock.onChange(() => {
    state.screen = wakeLock.status;
    if (state.active) changed();
  });

  function clearTimer() {
    if (handle !== null) clock.clear(handle);
    handle = null;
  }

  function setCountdown(value) {
    if (state.countdown === value) return;
    state.countdown = value;
    changed('countdown');
  }

  function schedule() {
    clearTimer();
    if (deadline === null || hidden) return;
    const left = deadline - clock.now();
    handle = clock.set(tick, Math.max(0, Math.min(tickMs, left)));
  }

  function tick() {
    handle = null;
    if (!state.active || deadline === null) return;
    const left = deadline - clock.now();
    if (left <= 0) {
      deadline = null;
      setCountdown(null);
      advance();
      return;
    }
    setCountdown(countdownValue(state.running, left / 1000));
    schedule();
  }

  // The timer of a picture (or of a file the viewer cannot show or play) starts from the full
  // running interval; in a hidden tab it is held and starts when the tab is shown again.
  function arm() {
    state.waitingForMedia = false;
    setCountdown(null);
    if (hidden) {
      deadline = null;
      pausedLeft = state.running * 1000;
      return;
    }
    pausedLeft = null;
    deadline = clock.now() + state.running * 1000;
    schedule();
  }

  function disarm() {
    clearTimer();
    deadline = null;
    pausedLeft = null;
    setCountdown(null);
  }

  function advance() {
    const { files } = browser.state;
    if (!state.active || files.length === 0) return;
    const current = browser.current();
    let target;
    if (state.random) target = files.indexOf(cycle.next(files, current));
    else target = browser.state.index < 0 ? 0 : (browser.state.index + 1) % files.length;
    // The same file again (a list of one): it is shown afresh, so its timer or playback restarts.
    if (files[target] === current) shown = null;
    browser.openFile(target);
    if (files[target] === current) changed('replay');
  }

  const api = {
    state,
    // S (random false) or I (random true). While running, the same key halves the running
    // interval; I on a show in list order switches it to random order instead.
    start({ random: randomOrder = false } = {}) {
      if (browser.current() === null) return;
      if (state.active) {
        if (randomOrder && !state.random) {
          state.random = true;
          cycle.reset();
        } else {
          api.shorten();
          return;
        }
        changed();
        return;
      }
      state.active = true;
      state.random = randomOrder;
      state.running = state.preference;
      cycle.reset();
      shown = null;
      if (!hidden) wakeLock.acquire();
      state.screen = wakeLock.status;
      changed();
    },
    shorten() {
      if (!state.active || state.running <= minInterval) return;
      state.running = shortened(state.running);
      if (deadline !== null) {
        deadline = Math.min(deadline, clock.now() + state.running * 1000);
        schedule();
      } else if (pausedLeft !== null) {
        pausedLeft = Math.min(pausedLeft, state.running * 1000);
      }
      changed();
    },
    canShorten() {
      return state.active && state.running > minInterval;
    },
    stop() {
      if (!state.active) return;
      state.active = false;
      state.waitingForMedia = false;
      shown = null;
      disarm();
      wakeLock.release();
      state.screen = wakeLock.status;
      changed();
    },
    // The stored preference; a running show keeps its own interval.
    setPreference(value) {
      state.preference = normalizeInterval(value);
      writeValue(intervalKey, state.preference);
      changed();
      return state.preference;
    },
    // Called after each viewer redraw. kind: 'media' when the show waits for the end of a video
    // or audio file, 'timed' otherwise. Another file than the last one shown - the show's own
    // step or the person's navigation - restarts the timer; the viewer closed ends the show.
    itemShown(entry, kind) {
      if (!state.active) return;
      if (entry === null) {
        api.stop();
        return;
      }
      if (entry === shown) return;
      shown = entry;
      if (kind === 'media') {
        disarm();
        state.waitingForMedia = true;
      } else {
        arm();
      }
      changed();
    },
    mediaProgress(remainingSeconds) {
      if (state.active && state.waitingForMedia) setCountdown(countdownValue(state.running, remainingSeconds));
    },
    mediaEnded() {
      if (!state.active || !state.waitingForMedia) return;
      state.waitingForMedia = false;
      setCountdown(null);
      advance();
    },
    // A file that cannot play stays for the running interval instead of holding the show.
    mediaFailed() {
      if (!state.active || !state.waitingForMedia) return;
      arm();
      changed();
    },
    // A hidden tab holds the picture timer and resumes it, with the time it had left, on the same
    // file when the tab is shown; the screen lock, which the browser drops on hiding, is asked for
    // again.
    setHidden(isHidden) {
      if (hidden === isHidden) return;
      hidden = isHidden;
      if (!state.active) return;
      if (hidden) {
        if (deadline !== null) pausedLeft = Math.max(0, deadline - clock.now());
        clearTimer();
        deadline = null;
        return;
      }
      if (pausedLeft !== null) {
        deadline = clock.now() + pausedLeft;
        pausedLeft = null;
        schedule();
      }
      wakeLock.acquire();
      state.screen = wakeLock.status;
      changed();
    },
    dispose() {
      api.stop();
    },
  };
  return api;
}
