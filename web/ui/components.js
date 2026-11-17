// Shared controls of the page (BUTTONS, BOOLEAN-OPTION, COLLAPSIBLE-GROUP, the support-floor rule
// for an unavailable function). DOM only: callers pass the strings and the handlers.

const glyphBase = new URL('../vendor/icon-set/', import.meta.url);

export function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'text') node.textContent = value;
    else if (name.startsWith('on') && typeof value === 'function') node.addEventListener(name.slice(2), value);
    else node.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) node.append(child);
  }
  return node;
}

// A monochrome ICON-SET glyph drawn in the current text colour; decorative, the caption names it.
export function glyph(meaning) {
  const node = element('span', { class: 'glyph', 'aria-hidden': 'true', 'data-glyph': meaning });
  node.style.setProperty('--glyph-url', `url("${new URL(`${meaning}.svg`, glyphBase).href}")`);
  return node;
}

const markBase = new URL('../vendor/exchange-mark/', import.meta.url);

// The exchange server's mark (EXCHANGE-MARK): the vendored picture, never tinted or redrawn.
// size is in CSS px at scale 1; the drawing follows the resolved size - flat up to 32 px, faceted
// above, never below 16 px. In forced colours the one-tone glyph in the theme's foreground takes
// its place (rule 3). label is the term of DEVICE-EXCHANGE item CW for an image-only mark; an
// empty label makes it decoration beside a visible name.
export function exchangeMark({ size = 24, scale = 1, label = '' } = {}) {
  const resolved = Math.max(16, Math.round(size * scale));
  const file = resolved > 32 ? 'svg/exchange-mark.svg' : 'svg/exchange-mark-small.svg';
  const holder = element('span', {
    class: 'exchange-mark',
    role: label ? 'img' : null,
    'aria-label': label || null,
    'aria-hidden': label ? null : 'true',
    'data-mark-drawing': resolved > 32 ? 'faceted' : 'flat',
  }, [
    element('img', { class: 'exchange-mark-art', src: new URL(file, markBase).href, alt: '', width: resolved, height: resolved, draggable: 'false' }),
    glyph('source.exchange-server'),
  ]);
  holder.style.setProperty('--mark-size', `${resolved}px`);
  return holder;
}

// One command: a stable id, one caption, one handler for every route that invokes it.
// rank: 'ordinary' | 'primary' | 'secondary' | 'destructive'. iconOnly keeps the caption as the
// accessible name and tooltip.
export function commandButton({ id, label, glyphMeaning, rank = 'ordinary', iconOnly = false, onActivate, attributes = {} }) {
  const button = element('button', {
    type: 'button',
    class: `command command-${rank}${iconOnly ? ' command-icon' : ''}`,
    'data-command': id,
    'aria-label': iconOnly ? label : null,
    title: iconOnly ? label : null,
    ...attributes,
  }, [
    glyphMeaning ? glyph(glyphMeaning) : null,
    iconOnly ? null : element('span', { class: 'command-caption', text: label }),
  ]);
  if (onActivate) {
    button.addEventListener('click', (event) => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      onActivate(event);
    });
  }
  return button;
}

// A boolean preference: native checkbox at reading start, the heading (glyph and name) as its
// label, the explanation below, the optional help target outside the label.
export function booleanRow({ id, label, glyphMeaning, explanation, checked = false, onChange, helpLabel, onHelp }) {
  const inputId = `${id}-input`;
  const explanationId = explanation ? `${id}-explanation` : null;
  const input = element('input', {
    type: 'checkbox',
    id: inputId,
    class: 'boolean-check',
    'aria-describedby': explanationId,
  });
  input.checked = checked === true;
  if (onChange) input.addEventListener('change', () => onChange(input.checked));
  const heading = element('div', { class: 'boolean-heading' }, [
    element('label', { for: inputId, class: 'boolean-label' }, [
      glyphMeaning ? glyph(glyphMeaning) : null,
      element('span', { text: label }),
    ]),
    onHelp ? commandButton({ id: `${id}.help`, label: helpLabel, glyphMeaning: 'app.help', iconOnly: true, rank: 'secondary', onActivate: onHelp }) : null,
  ]);
  return element('div', { class: 'boolean-row', 'data-option': id }, [
    input,
    element('div', { class: 'boolean-cell' }, [
      heading,
      explanation ? element('p', { id: explanationId, class: 'explanation', text: explanation }) : null,
    ]),
  ]);
}

// A topic group: the whole header toggles once, the state triangle sits at reading start, a
// collapsed body takes no space and no focus.
export function topicGroup({ id, title, expanded = true, onToggle, body = [] }) {
  const bodyId = `${id}-body`;
  const header = element('button', {
    type: 'button',
    class: 'group-header',
    'aria-expanded': expanded ? 'true' : 'false',
    'aria-controls': bodyId,
  }, [
    element('span', { class: 'group-marker', 'aria-hidden': 'true' }),
    element('span', { class: 'group-caption', text: title }),
  ]);
  const content = element('div', { id: bodyId, class: 'group-body', hidden: !expanded }, body);
  header.addEventListener('click', () => {
    const next = header.getAttribute('aria-expanded') !== 'true';
    header.setAttribute('aria-expanded', next ? 'true' : 'false');
    content.hidden = !next;
    if (onToggle) onToggle(next);
  });
  return element('section', { class: 'topic-group', 'data-group': id }, [
    element('h3', { class: 'group-heading' }, [header]),
    content,
  ]);
}

// An exclusive choice: a fieldset of native radio buttons; options carry their own `lang` when
// they are endonyms.
export function choiceGroup({ id, legend, glyphMeaning, hint, options, value, onChange }) {
  const hintId = hint ? `${id}-hint` : null;
  const rows = options.map((option) => {
    const input = element('input', { type: 'radio', name: id, value: option.value, id: `${id}-${option.value}` });
    input.checked = option.value === value;
    input.addEventListener('change', () => {
      if (input.checked && onChange) onChange(option.value);
    });
    return element('label', { class: 'choice-option', for: `${id}-${option.value}`, lang: option.lang }, [
      input,
      element('span', { text: option.label }),
    ]);
  });
  return element('fieldset', { class: 'choice-group', 'data-choice': id, 'aria-describedby': hintId }, [
    element('legend', { class: 'choice-legend' }, [glyphMeaning ? glyph(glyphMeaning) : null, element('span', { text: legend })]),
    hint ? element('p', { id: hintId, class: 'explanation', text: hint }) : null,
    element('div', { class: 'choice-options' }, rows),
  ]);
}

// The support-floor rule: a function this browser cannot run stays visible and focusable,
// is marked disabled, and carries one line saying what is unavailable and why.
export function markUnavailable(control, reason) {
  const reasonId = `${control.id || control.dataset.command || 'control'}-unavailable`;
  control.setAttribute('aria-disabled', 'true');
  control.classList.add('is-unavailable');
  const described = control.getAttribute('aria-describedby');
  control.setAttribute('aria-describedby', described ? `${described} ${reasonId}` : reasonId);
  const block = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  control.addEventListener('click', block, true);
  const line = element('p', { id: reasonId, class: 'unavailable-reason' }, [element('span', { text: reason })]);
  const wrapper = element('div', { class: 'unavailable' });
  if (control.parentNode) control.parentNode.replaceChild(wrapper, control);
  wrapper.append(control, line);
  return wrapper;
}
