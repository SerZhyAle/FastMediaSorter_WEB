import { commandButton, element, markUnavailable } from './components.js';
import { destinationsPanel } from './destinations-panel.js';
import { createPlayerPane } from './player-pane.js';
import { createSlideshowBar } from './slideshow-bar.js';

// The viewer half of the local surface: the open file, its controls, the go-to-number field and
// full screen. The pane node itself is kept for the life of the surface, so a page-started full
// screen survives paging; only its children are rebuilt.

const swipeDistance = 60;
const wheelPause = 180;

function fill(text, values) {
  return text.replace(/\{(\w+)\}/gu, (match, name) => String(values[name] ?? match));
}

function nativeFullscreen(node) {
  const enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const request = node.requestFullscreen || node.webkitRequestFullscreen;
  return enabled && typeof request === 'function' ? request : null;
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function leaveNativeFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (typeof exit === 'function') exit.call(document);
}

export function createViewerPane({ browser, sorter, slideshow, slots, strings, chords }) {
  const pane = element('section', { class: 'local-viewer', 'aria-label': strings.viewerLabel, hidden: true });
  // Kept across rebuilds so a screen reader hears each result in the same live region.
  const sortMessage = element('p', { class: 'viewer-note sort-message', role: 'status' });
  const sortArea = element('div', { class: 'viewer-sorting' });
  const show = createSlideshowBar({ slideshow, strings, chords });
  let stage = null;
  let picture = null;
  // Kept while the same file stays open, so a redraw (full screen, the go-to field) never restarts it.
  let player = null;
  let playerEntry = null;
  const pointers = new Map();
  let gesture = null;
  let lastWheel = 0;

  const resize = new ResizeObserver(() => {
    if (stage) browser.setStage(stage.clientWidth, stage.clientHeight);
  });

  function labelled(label, command) {
    return chords[command] ? `${label} (${chords[command]})` : label;
  }

  function button(command, label, onActivate, rank) {
    return commandButton({
      id: `viewer.${command}`, label, rank, onActivate,
      attributes: { title: labelled(label, command) },
    });
  }

  function stageCentre() {
    const box = stage.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }

  function anchorFrom(clientX, clientY) {
    const centre = stageCentre();
    return { x: clientX - centre.x, y: clientY - centre.y };
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) gesture = { kind: 'drag', startX: event.clientX, startY: event.clientY, moved: false };
    else if (pointers.size === 2) gesture = { kind: 'pinch', distance: pinchDistance() };
  }

  function pinchDistance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  function onPointerMove(event) {
    const previous = pointers.get(event.pointerId);
    if (!previous || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.kind === 'pinch' && pointers.size === 2) {
      const distance = pinchDistance();
      const [a, b] = [...pointers.values()];
      browser.zoomBy(distance / gesture.distance, anchorFrom((a.x + b.x) / 2, (a.y + b.y) / 2));
      gesture.distance = distance;
    } else if (gesture.kind === 'drag') {
      gesture.moved = true;
      browser.panBy(event.clientX - previous.x, event.clientY - previous.y);
    }
  }

  function onPointerUp(event) {
    pointers.delete(event.pointerId);
    if (gesture && gesture.kind === 'drag' && browser.state.transform.zoom === null) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.abs(dx) > swipeDistance && Math.abs(dx) > Math.abs(dy)) browser.navigate(dx < 0 ? 'next' : 'previous');
    }
    gesture = pointers.size === 0 ? null : { kind: 'drag', startX: event.clientX, startY: event.clientY, moved: true };
  }

  // MEDIA-VIEWER rule 3: the wheel pages; Ctrl+wheel (and a trackpad pinch, which arrives as one)
  // zooms at the pointer and never also pages.
  function onWheel(event) {
    event.preventDefault();
    if (event.ctrlKey) {
      if (picture) browser.zoomBy(event.deltaY < 0 ? 1.25 : 1 / 1.25, anchorFrom(event.clientX, event.clientY));
      return;
    }
    const now = event.timeStamp;
    if (now - lastWheel < wheelPause || event.deltaY === 0) return;
    lastWheel = now;
    browser.navigate(event.deltaY > 0 ? 'next' : 'previous');
  }

  function isPlayable(entry) {
    return entry?.category === 'VIDEO' || entry?.category === 'AUDIO';
  }

  function dropPlayer() {
    if (player) player.dispose();
    player = null;
    playerEntry = null;
  }

  // The slideshow waits for the end of a video or audio file and counts down its last seconds.
  // Events of a player already replaced (its element is emptied on disposal) are ignored.
  function watchMedia(node) {
    const live = () => player !== null && player.control.media === node;
    node.addEventListener('ended', () => { if (live()) slideshow.mediaEnded(); });
    node.addEventListener('error', () => { if (live()) slideshow.mediaFailed(); });
    node.addEventListener('timeupdate', () => {
      if (live() && Number.isFinite(node.duration)) slideshow.mediaProgress((node.duration - node.currentTime) / (node.playbackRate || 1));
    });
  }

  function syncSlideshow() {
    const entry = browser.current();
    const playing = isPlayable(entry) && player && playerEntry === entry && !player.control.state.failure;
    slideshow.itemShown(entry, playing ? 'media' : 'timed');
  }

  // The same file shown again by the slideshow (a list of one) plays again from its start.
  function replay() {
    const current = player && playerEntry === browser.current() ? player.control : null;
    if (!current) return;
    current.seekTo(0);
    current.start();
  }

  function media(entry) {
    const url = browser.urlFor(entry);
    const failed = (text) => () => {
      picture = null;
      stage.replaceChildren(element('p', { class: 'viewer-message', role: 'status', text }));
    };
    if (entry.category === 'IMAGE') {
      // Asynchronous decoding: a large animated file never holds the frame while it opens.
      const image = element('img', { class: 'viewer-image', alt: entry.name, draggable: 'false', decoding: 'async', src: url });
      image.addEventListener('load', () => browser.setNatural(image.naturalWidth, image.naturalHeight));
      image.addEventListener('error', failed(strings.cannotShowImage));
      picture = image;
      return image;
    }
    picture = null;
    if (isPlayable(entry)) {
      if (playerEntry !== entry) {
        dropPlayer();
        player = createPlayerPane({ entry, url, strings, chords });
        playerEntry = entry;
        watchMedia(player.control.media);
      }
      return player.surface;
    }
    return element('p', { class: 'viewer-message', text: strings.notViewable });
  }

  function jumpForm(count) {
    const { jump } = browser.state;
    const errorId = 'jump-error';
    const input = element('input', {
      id: 'jump-input', class: 'text-field', type: 'text', inputmode: 'numeric', autocomplete: 'off',
      value: jump.text, 'aria-invalid': jump.invalid ? 'true' : null, 'aria-describedby': jump.invalid ? errorId : null,
    });
    const form = element('form', { class: 'jump-form', role: 'dialog', 'aria-label': strings.goToNumber }, [
      element('label', { for: 'jump-input', text: fill(strings.jumpField, { count }) }),
      input,
      element('div', { class: 'command-row' }, [
        commandButton({ id: 'jump.go', label: strings.go, rank: 'primary', attributes: { type: 'submit' } }),
        commandButton({ id: 'jump.cancel', label: strings.cancel, onActivate: () => browser.cancelJump() }),
      ]),
      jump.invalid ? element('p', { id: errorId, class: 'field-error', role: 'alert', text: fill(strings.jumpInvalid, { count }) }) : null,
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      browser.submitJump(input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        browser.cancelJump();
      }
    });
    return form;
  }

  // The Destinations control, the panel and the result line; redrawn alone on a sorting change so
  // a playing video is not restarted.
  function drawSorting() {
    const focused = sortArea.contains(document.activeElement) ? document.activeElement.dataset.command : null;
    const reason = sorter.unavailableReason();
    let toggle = commandButton({
      id: 'viewer.destinations', label: strings.destinations, onActivate: () => sorter.togglePanel(),
      attributes: { 'aria-expanded': String(!reason && sorter.state.panelOpen) },
    });
    if (reason) toggle = markUnavailable(toggle, strings[reason]);
    const message = sorter.message();
    sortMessage.textContent = message ? fill(strings[message.key], message.values) : '';
    sortMessage.hidden = !message;
    sortArea.replaceChildren(
      toggle,
      sortMessage,
      !reason && sorter.state.panelOpen ? destinationsPanel({ sorter, strings, slots }) : null,
    );
    if (focused) sortArea.querySelector(`[data-command="${CSS.escape(focused)}"]`)?.focus();
  }

  function rebuild() {
    const entry = browser.current();
    const { state } = browser;
    pane.hidden = entry === null;
    pane.classList.toggle('is-full-window', state.fullscreen === 'window');
    if (playerEntry !== entry) dropPlayer();
    if (!entry) {
      if (fullscreenElement() === pane) leaveNativeFullscreen();
      if (stage) resize.unobserve(stage);
      stage = null;
      picture = null;
      pane.replaceChildren();
      syncSlideshow();
      return;
    }
    const count = state.files.length;
    const isImage = entry.category === 'IMAGE';
    const keptFocus = player && player.bar.contains(document.activeElement) ? document.activeElement : null;
    if (stage) resize.unobserve(stage);
    stage = element('div', { class: 'viewer-stage' });
    stage.append(media(entry), show.countdown);
    if (isImage) {
      stage.addEventListener('pointerdown', onPointerDown);
      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerup', onPointerUp);
      stage.addEventListener('pointercancel', onPointerUp);
    }
    stage.addEventListener('wheel', onWheel, { passive: false });
    const inFullscreen = state.fullscreen !== 'none';
    const controls = element('div', { class: 'viewer-controls command-row', role: 'toolbar', 'aria-label': strings.viewerLabel }, [
      button('previous', strings.previousFile, () => browser.navigate('previous')),
      button('next', strings.nextFile, () => browser.navigate('next')),
      isImage ? button('zoomOut', strings.zoomOut, () => browser.zoomOut()) : null,
      isImage ? button('zoomIn', strings.zoomIn, () => browser.zoomIn()) : null,
      isImage ? button('fit', strings.zoomFit, () => browser.fit()) : null,
      isImage ? button('actualSize', strings.actualSize, () => browser.actualSize()) : null,
      isImage ? button('rotateLeft', strings.rotateLeft, () => browser.rotate(-1)) : null,
      isImage ? button('rotateRight', strings.rotateRight, () => browser.rotate(1)) : null,
      button('random', strings.randomFile, () => browser.random()),
      button('jump', strings.goToNumber, () => browser.openJump()),
      button('fullscreen', inFullscreen ? strings.leaveFullScreen : strings.fullScreen, toggleFullscreen),
      button('back', strings.closeViewer, () => browser.closeViewer(), 'secondary'),
    ]);
    pane.replaceChildren(
      element('div', { class: 'viewer-caption' }, [
        element('span', { class: 'viewer-position', text: fill(strings.positionOf, { n: state.index + 1, count }) }),
        element('span', { class: 'viewer-name', text: entry.name }),
      ]),
      state.fullscreen === 'window' ? element('p', { class: 'viewer-note', text: strings.fullWindowReason }) : null,
      stage,
      player && playerEntry === entry ? player.bar : null,
      controls,
      show.node,
      sortArea,
      state.jump ? jumpForm(count) : null,
    );
    drawSorting();
    syncSlideshow();
    show.draw();
    if (keptFocus && keptFocus.isConnected) keptFocus.focus();
    resize.observe(stage);
    applyTransform();
    if (state.jump) {
      const input = pane.querySelector('#jump-input');
      input.focus();
      input.select();
    }
  }

  function applyTransform() {
    if (!picture) return;
    const { natural, transform } = browser.state;
    if (!natural) {
      picture.style.visibility = 'hidden';
      return;
    }
    const scale = browser.effectiveScale();
    picture.style.visibility = '';
    picture.style.width = `${natural.width}px`;
    picture.style.height = `${natural.height}px`;
    picture.style.transform = `translate(-50%, -50%) translate(${transform.panX}px, ${transform.panY}px) rotate(${transform.rotation * 90}deg) scale(${scale})`;
    stage.classList.toggle('is-zoomed', transform.zoom !== null);
  }

  function toggleFullscreen() {
    const { fullscreen } = browser.state;
    if (fullscreen === 'native') {
      leaveNativeFullscreen();
      return;
    }
    if (fullscreen === 'window') {
      browser.setFullscreen('none');
      return;
    }
    const request = nativeFullscreen(pane);
    if (!request) {
      browser.setFullscreen('window');
      return;
    }
    Promise.resolve(request.call(pane)).catch(() => browser.setFullscreen('window'));
  }

  function onFullscreenChange() {
    if (fullscreenElement() === pane) browser.setFullscreen('native');
    else if (browser.state.fullscreen === 'native') browser.setFullscreen('none');
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  return {
    node: pane,
    update(part) {
      if (part === 'transform') applyTransform();
      else if (part === 'sorting') { if (browser.current()) drawSorting(); }
      else if (part === 'countdown') show.drawCountdown();
      else if (part === 'replay') replay();
      else if (part === 'slideshow') {
        syncSlideshow();
        if (browser.current()) show.draw();
      }
      else rebuild();
    },
    toggleFullscreen,
    // Esc steps back one layer: the field, then full screen, then the viewer itself.
    stepBack() {
      const { state } = browser;
      if (state.jump) browser.cancelJump();
      else if (sorter.closePanel()) return true;
      else if (slideshow.state.active) slideshow.stop();
      else if (state.fullscreen === 'native') leaveNativeFullscreen();
      else if (state.fullscreen === 'window') browser.setFullscreen('none');
      else if (state.index >= 0) browser.closeViewer();
      else return false;
      return true;
    },
    isPlayer() {
      return isPlayable(browser.current());
    },
    // The open file's player, or null when the open file is not video or audio.
    player() {
      return isPlayable(browser.current()) && playerEntry === browser.current() ? player : null;
    },
    dispose() {
      dropPlayer();
      resize.disconnect();
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      if (fullscreenElement() === pane) leaveNativeFullscreen();
    },
  };
}
