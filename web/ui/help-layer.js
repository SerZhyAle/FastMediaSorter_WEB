import { element } from './components.js';
import { helpEntries } from '../app/help.js';

// The help layer of CONTEXT-HELP rule 6: a numbered marker on every significant element shown on
// the live surface, its name as the screen spells it and the fuller text on focus, hover or tap.
// Read-only: the layer covers the surface, so nothing under it can be activated while it is open.

function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}

// The elements an entry explains inside `scope`, in document order; one entry may match several
// (one per destination row).
export function entryElements(scope, entry) {
  const found = [];
  for (const node of scope.querySelectorAll(entry.selector)) {
    const target = entry.container ? node.closest(entry.container) ?? node : node;
    if (scope.contains(target) && !found.includes(target)) found.push(target);
  }
  return found;
}

// The entry that explains `node` or the nearest group around it; null when none does.
export function entryForNode(scope, node) {
  for (let current = node; current && current !== scope && scope.contains(current); current = current.parentElement) {
    const entry = helpEntries.find((candidate) => entryElements(scope, candidate).includes(current));
    if (entry) return entry;
  }
  return null;
}

// Empty bounds mean the element is not shown in this layout (0.2 item C): it gets no marker.
function isShown(node) {
  if (!node.isConnected || node.closest('[hidden]')) return false;
  const box = node.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

function textOf(node) {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// The name the person sees: the accessible name of the control or the caption of its group.
export function visibleName(node) {
  const own = node.getAttribute('aria-label');
  if (own) return own;
  const labelledBy = node.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = textOf(node.ownerDocument.getElementById(labelledBy.split(' ')[0]));
    if (label) return label;
  }
  const legend = node.querySelector(':scope > legend');
  if (legend) return textOf(legend);
  const label = node.matches('label') ? node : node.querySelector('label');
  if (label) return textOf(label);
  if (node.id) {
    const forLabel = node.ownerDocument.querySelector(`label[for="${CSS.escape(node.id)}"]`);
    if (forLabel) return textOf(forLabel);
  }
  return textOf(node.querySelector('.entry-title, .command-caption')) || node.getAttribute('title') || textOf(node);
}

// The one line that says why a function this browser cannot run is disabled (markUnavailable).
function unavailableReason(node) {
  const disabled = node.matches('[aria-disabled="true"]') ? node : node.querySelector('[aria-disabled="true"]');
  if (!disabled) return '';
  return textOf(disabled.closest('.unavailable')?.querySelector('.unavailable-reason'));
}

// The shown, explained elements of the surface in document order, each once.
export function collectItems(scope) {
  const items = [];
  for (const entry of helpEntries) {
    for (const node of entryElements(scope, entry)) {
      if (isShown(node) && !items.some((item) => item.node === node)) items.push({ entry, node });
    }
  }
  return items.sort((a, b) => (a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

export function openHelpLayer({ scope, title, strings, text, focusEntry = null, origin = null, returnFocus = null, onClose }) {
  const doc = scope.ownerDocument;
  const win = doc.defaultView;
  // The control the person asked from gets the focus back even when pressing it did not focus it
  // (Safari, a script-made click) and the page title holds the focus instead.
  const previous = origin ?? doc.activeElement;
  const items = collectItems(scope).map((item, index) => ({
    ...item,
    number: index + 1,
    name: visibleName(item.node),
    reason: unavailableReason(item.node),
  }));

  const backdrop = element('div', { class: 'help-backdrop' });
  const highlight = element('div', { class: 'help-highlight', 'aria-hidden': 'true', hidden: true });
  const noteName = element('h2', { class: 'help-note-name', id: 'help-note-name' });
  const noteText = element('p', { class: 'help-note-text' });
  const noteReason = element('p', { class: 'help-note-reason', hidden: true });
  const closeButton = element('button', { type: 'button', class: 'command command-secondary help-close', text: strings.helpClose });
  const note = element('section', { class: 'help-note', 'aria-labelledby': 'help-note-name' }, [
    noteName, noteText, noteReason,
    element('p', { class: 'help-note-hint', text: strings.helpLayerHint }),
    element('div', { class: 'command-row help-note-actions' }, [closeButton]),
  ]);
  const pins = items.map((item) => {
    const descriptionId = `help-pin-${item.number}-text`;
    const pin = element('button', {
      type: 'button',
      class: 'help-pin',
      'data-entry': item.entry.id,
      'aria-label': `${item.number}. ${item.name}`,
      'aria-describedby': descriptionId,
      text: String(item.number),
    });
    const description = element('span', { id: descriptionId, class: 'help-pin-text', hidden: true, text: [text(item.entry.id), item.reason].filter(Boolean).join(' ') });
    pin.append(description);
    const show = () => showItem(item, pin);
    pin.addEventListener('focus', show);
    pin.addEventListener('mouseenter', show);
    pin.addEventListener('click', show);
    return pin;
  });
  const layer = element('div', {
    class: 'help-layer',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': fill(strings.helpLayer, { surface: title }),
  }, [backdrop, highlight, ...pins, note]);

  let current = null;

  function place(box, node) {
    node.style.left = `${box.left}px`;
    node.style.top = `${box.top}px`;
    node.style.width = `${box.width}px`;
    node.style.height = `${box.height}px`;
  }

  function showItem(item, pin) {
    current = { item, pin };
    noteName.textContent = `${item.number}. ${item.name}`;
    noteText.textContent = text(item.entry.id);
    noteReason.textContent = item.reason;
    noteReason.hidden = item.reason === '';
    for (const other of pins) other.classList.toggle('is-current', other === pin);
    placeHighlight();
  }

  function placeHighlight() {
    if (!current || !isShown(current.item.node)) {
      highlight.hidden = true;
      return;
    }
    highlight.hidden = false;
    place(current.item.node.getBoundingClientRect(), highlight);
  }

  // A marker sits on the reading-start corner of its element, inside the viewport.
  function placePins() {
    const rtl = win.getComputedStyle(doc.documentElement).direction === 'rtl';
    items.forEach((item, index) => {
      const pin = pins[index];
      pin.hidden = !isShown(item.node);
      if (pin.hidden) return;
      const box = item.node.getBoundingClientRect();
      const width = pin.offsetWidth;
      const left = rtl ? box.right - width : box.left;
      pin.style.left = `${Math.min(Math.max(0, left), win.innerWidth - width)}px`;
      pin.style.top = `${Math.min(Math.max(0, box.top), win.innerHeight - pin.offsetHeight)}px`;
    });
    placeHighlight();
  }

  let frame = 0;
  function schedule() {
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      placePins();
    });
  }

  function focusables() {
    return [...pins.filter((pin) => !pin.hidden), closeButton];
  }

  function onKeyDown(event) {
    // The surface under the layer hears no key while it is open.
    event.stopPropagation();
    const bare = !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    if (event.key === 'Escape' || (event.key === 'F1' && bare)) {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      const order = focusables();
      const at = order.indexOf(doc.activeElement);
      const next = event.shiftKey ? (at <= 0 ? order.length - 1 : at - 1) : (at + 1) % order.length;
      event.preventDefault();
      order[next].focus();
    }
  }

  function close() {
    if (!layer.isConnected) return;
    win.removeEventListener('resize', schedule);
    win.removeEventListener('scroll', schedule, true);
    if (frame) win.cancelAnimationFrame(frame);
    layer.remove();
    const back = previous && previous.isConnected && previous !== doc.body ? previous : returnFocus?.();
    back?.focus({ preventScroll: true });
    onClose?.();
  }

  layer.addEventListener('keydown', onKeyDown);
  backdrop.addEventListener('click', close);
  closeButton.addEventListener('click', close);
  win.addEventListener('resize', schedule);
  win.addEventListener('scroll', schedule, true);
  doc.body.append(layer);
  placePins();

  const start = (focusEntry && pins.find((pin) => pin.dataset.entry === focusEntry && !pin.hidden)) || pins.find((pin) => !pin.hidden);
  if (start) start.focus({ preventScroll: true });
  else closeButton.focus({ preventScroll: true });

  return Object.freeze({ root: layer, items, close });
}
