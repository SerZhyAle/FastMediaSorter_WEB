import { commandButton, element, markUnavailable } from './components.js';
import { containerOf, createPlayerControl, formatTime, seekSteps, volumeStep } from '../app/media-player.js';

// The player of the viewer: the media surface for the stage and the control bar beside it (owner
// ruling 2026-11-10). The bar is built once per file and updated in place, so a focused control or
// a slider being dragged is never replaced under the pointer.

const failureKeys = Object.freeze({ unsupported: 'cannotPlayFormat', decode: 'cannotDecode', unreadable: 'fileUnreadable', aborted: 'playbackAborted' });

function fill(text, values) {
  return text.replace(/\{(\w+)\}/gu, (match, name) => String(values[name] ?? match));
}

function rateText(rate) {
  return String(Math.round(rate * 100) / 100);
}

export function createPlayerPane({ entry, url, strings, chords }) {
  const video = element('video', { class: 'viewer-video', playsinline: true, preload: 'metadata', src: url, 'aria-label': entry.name });
  const soundLine = element('p', { class: 'player-sound-only', text: strings.soundOnly, hidden: true });
  const message = element('p', { class: 'viewer-message player-message', role: 'status', hidden: true });
  const surface = element('div', { class: 'player-surface' }, [video, soundLine, message]);
  const control = createPlayerControl({ media: video, onChange: (part) => (part === 'time' ? drawTime() : draw()) });
  let dragging = false;
  let backMarked = false;
  let failureShown = null;

  function titled(label, command) {
    return chords[command] ? `${label} (${chords[command]})` : label;
  }

  function button(command, label, onActivate) {
    return commandButton({ id: `player.${command}`, label, onActivate, attributes: { title: titled(label, command) } });
  }

  function caption(node, label, command) {
    node.querySelector('.command-caption').textContent = label;
    node.title = titled(label, command);
  }

  const runners = {
    playPause: () => control.togglePlay(),
    seekBack10: () => control.seekBy(-seekSteps.medium),
    seekForward10: () => control.seekBy(seekSteps.medium),
    seekBack3: () => control.seekBy(-seekSteps.short),
    seekForward3: () => control.seekBy(seekSteps.short),
    seekBack60: () => control.seekBy(-seekSteps.long),
    seekForward60: () => control.seekBy(seekSteps.long),
    slower: () => control.slower(),
    faster: () => control.faster(),
    normalSpeed: () => control.normalSpeed(),
    frameForward: () => control.frameStep(1),
    frameBack: () => control.frameStep(-1),
    abLoop: () => control.toggleLoop(),
    mute: () => control.toggleMute(),
    volumeUp: () => control.volumeBy(volumeStep),
    volumeDown: () => control.volumeBy(-volumeStep),
  };

  const playButton = button('playPause', strings.play, runners.playPause);
  const backButton = button('seekBack10', strings.seekBack, runners.seekBack10);
  const forwardButton = button('seekForward10', strings.seekForward, runners.seekForward10);
  const seek = element('input', { type: 'range', id: 'player-seek', class: 'player-range', min: '0', max: '0', step: 'any', value: '0' });
  seek.addEventListener('input', () => control.seekTo(Number(seek.value)));
  seek.addEventListener('pointerdown', () => { dragging = true; });
  for (const type of ['pointerup', 'pointercancel', 'change']) seek.addEventListener(type, () => { dragging = false; });
  const time = element('span', { class: 'player-time', 'aria-hidden': 'true' });
  const slowerButton = button('slower', strings.slower, runners.slower);
  const speedButton = button('normalSpeed', '1x', runners.normalSpeed);
  const fasterButton = button('faster', strings.faster, runners.faster);
  const frameBackButton = button('frameBack', strings.frameBack, runners.frameBack);
  const frameBackSlot = element('span', { class: 'player-frame-back' }, [frameBackButton]);
  const frameForwardButton = button('frameForward', strings.frameForward, runners.frameForward);
  const frameGroup = element('div', { class: 'command-row player-group' }, [frameBackSlot, frameForwardButton]);
  const loopButton = button('abLoop', strings.loopStart, runners.abLoop);
  const loopLine = element('span', { class: 'player-loop', hidden: true });
  const muteButton = button('mute', strings.mute, runners.mute);
  const volume = element('input', { type: 'range', id: 'player-volume', class: 'player-range player-volume', min: '0', max: '1', step: '0.05' });
  volume.addEventListener('input', () => control.setVolume(volume.value));

  const bar = element('div', { class: 'player-controls', role: 'toolbar', 'aria-label': strings.playerControls }, [
    element('div', { class: 'player-seek-row' }, [
      element('label', { for: 'player-seek', text: strings.seekPosition }),
      seek,
      time,
    ]),
    element('div', { class: 'command-row player-buttons' }, [
      playButton, backButton, forwardButton,
      element('div', { class: 'command-row player-group' }, [slowerButton, speedButton, fasterButton]),
      frameGroup,
      element('div', { class: 'command-row player-group' }, [loopButton, loopLine]),
      element('div', { class: 'command-row player-group' }, [
        muteButton,
        element('label', { for: 'player-volume', text: strings.volume }),
        volume,
      ]),
    ]),
  ]);

  function drawTime() {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const now = video.currentTime;
    const spoken = fill(strings.timeOf, { time: formatTime(now), duration: formatTime(video.duration) });
    seek.max = String(duration);
    if (!dragging) seek.value = String(now);
    seek.setAttribute('aria-valuetext', spoken);
    time.textContent = `${formatTime(now)} / ${formatTime(video.duration)}`;
  }

  function showFailure(kind) {
    if (failureShown === kind) return;
    failureShown = kind;
    surface.classList.add('is-failed');
    bar.hidden = true;
    const say = (format) => {
      message.textContent = fill(strings[failureKeys[kind]], { name: entry.name, format: format ?? strings.formatUnknown });
      message.hidden = false;
    };
    say(null);
    containerOf(entry.file).then(say);
  }

  function draw() {
    const { state } = control;
    if (state.failure) {
      showFailure(state.failure);
      return;
    }
    message.hidden = !state.waiting;
    if (state.waiting) message.textContent = strings.pressPlay;
    surface.classList.toggle('is-sound-only', state.soundOnly === true);
    soundLine.hidden = state.soundOnly !== true;
    frameGroup.hidden = state.soundOnly === true;
    const paused = video.paused || video.ended;
    caption(playButton, paused ? strings.play : strings.pause, 'playPause');
    const rate = rateText(video.playbackRate);
    speedButton.querySelector('.command-caption').textContent = `${rate}x`;
    speedButton.setAttribute('aria-label', fill(strings.speedReset, { rate }));
    speedButton.title = titled(fill(strings.speedReset, { rate }), 'normalSpeed');
    const { a, b } = state.loop;
    caption(loopButton, a === null ? strings.loopStart : b === null ? strings.loopEnd : strings.loopClear, 'abLoop');
    loopLine.hidden = a === null;
    loopLine.textContent = a === null ? '' : b === null ? fill(strings.loopFrom, { a: formatTime(a) }) : fill(strings.loopRange, { a: formatTime(a), b: formatTime(b) });
    caption(muteButton, video.muted ? strings.unmute : strings.mute, 'mute');
    muteButton.setAttribute('aria-pressed', String(video.muted));
    volume.value = String(video.muted ? 0 : video.volume);
    if (!control.canStepBack() && !backMarked) {
      backMarked = true;
      const hadFocus = document.activeElement === frameBackButton;
      markUnavailable(frameBackButton, strings.frameBackUnavailable);
      if (hadFocus) frameBackButton.focus();
    }
    drawTime();
  }

  draw();
  control.start();

  return {
    surface,
    bar,
    control,
    // A command of the player rows; false when this player has none of that name.
    run(command) {
      const runner = runners[command];
      if (!runner) return false;
      runner();
      return true;
    },
    dispose() {
      control.dispose();
    },
  };
}
