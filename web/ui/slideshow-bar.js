import { commandButton, element, markUnavailable } from './components.js';

// The slideshow controls of the viewer and its countdown badge. The group is redrawn alone on a
// slideshow change, so a playing video is never restarted; the badge text changes in place.

function fill(text, values) {
  return text.replace(/\{(\w+)\}/gu, (match, name) => String(values[name] ?? match));
}

export function createSlideshowBar({ slideshow, strings, chords }) {
  const { state } = slideshow;
  const node = element('div', { class: 'viewer-slideshow command-row', role: 'group', 'aria-label': strings.slideshowControls });
  // Decorative: the timer is also stated by the status line; a spoken 3-2-1 would only chatter.
  const countdown = element('span', { class: 'slideshow-countdown', 'aria-hidden': 'true', hidden: true });

  function labelled(label, command) {
    return chords[command] ? `${label} (${chords[command]})` : label;
  }

  function button(id, command, label, onActivate, rank) {
    return commandButton({ id, label, rank, onActivate, attributes: { title: labelled(label, command) } });
  }

  function seconds(value) {
    return new Intl.NumberFormat(document.documentElement.lang || 'en', { maximumFractionDigits: 2 }).format(value);
  }

  function intervalField() {
    const input = element('input', {
      id: 'slideshow-interval', class: 'text-field slideshow-interval', type: 'number', inputmode: 'numeric',
      min: '1', max: '3600', step: '1', value: String(state.preference),
    });
    input.addEventListener('change', () => {
      input.value = String(slideshow.setPreference(input.value));
    });
    return element('div', { class: 'local-field' }, [element('label', { for: 'slideshow-interval', text: strings.slideshowInterval }), input]);
  }

  function draw() {
    const focused = node.contains(document.activeElement) ? document.activeElement.dataset.command ?? document.activeElement.id : null;
    if (!state.active) {
      node.replaceChildren(
        button('slideshow.start', 'slideshow', strings.slideshow, () => slideshow.start({ random: false })),
        button('slideshow.random', 'randomSlideshow', strings.randomSlideshow, () => slideshow.start({ random: true })),
        intervalField(),
      );
    } else {
      let shorter = button('slideshow.shorter', 'slideshow', strings.shorterInterval, () => slideshow.shorten());
      if (!slideshow.canShorten()) shorter = markUnavailable(shorter, strings.shortestInterval);
      const running = state.random ? strings.randomSlideshowRunning : strings.slideshowRunning;
      const screenOff = ['denied', 'unavailable', 'released'].includes(state.screen);
      node.replaceChildren(
        element('p', { class: 'viewer-note slideshow-status', role: 'status', text: fill(running, { seconds: seconds(state.running) }) }),
        state.waitingForMedia ? element('p', { class: 'viewer-note', text: strings.slideshowMediaNote }) : null,
        screenOff ? element('p', { class: 'viewer-note', text: strings.screenMayDim }) : null,
        element('div', { class: 'command-row' }, [
          shorter,
          button('slideshow.stop', 'back', strings.stopSlideshow, () => slideshow.stop(), 'secondary'),
        ]),
      );
    }
    drawCountdown();
    if (!focused) return;
    const target = node.querySelector(`[data-command="${CSS.escape(focused)}"]`) ?? node.querySelector(`#${CSS.escape(focused)}`)
      ?? node.querySelector('[data-command="slideshow.stop"], [data-command="slideshow.start"]');
    target?.focus();
  }

  function drawCountdown() {
    const value = state.active ? state.countdown : null;
    countdown.hidden = value === null;
    countdown.textContent = value === null ? '' : String(value);
  }

  return { node, countdown, draw, drawCountdown };
}
