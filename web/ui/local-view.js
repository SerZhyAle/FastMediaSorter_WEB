import { commandButton, element, glyph, markUnavailable } from './components.js';
import { createViewerPane } from './viewer-pane.js';

// The local surface: open controls, listing choices, the folder path, the folder list and the
// viewer side by side on one work screen (owner ruling 2026-11-10). The browser object of
// app/local-browser.js owns the state; this module draws it and forwards the person's input.

const badgeKeys = Object.freeze({ VIDEO: 'badgeVideo', AUDIO: 'badgeAudio' });
const kindLabels = Object.freeze({ image: 'kindImage', video: 'kindVideo', audio: 'kindAudio', other: 'kindOther' });
const listKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

function isEditable(node) {
  return node instanceof HTMLElement && (node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName));
}

function isActivatable(node) {
  return node instanceof HTMLElement && ['BUTTON', 'A', 'VIDEO', 'AUDIO', 'SUMMARY'].includes(node.tagName);
}

export function createLocalView({ browser, sorter, slideshow, strings, locale, format, viewerCommand, destinationSlot, slots, chords }) {
  const { state } = browser;
  const viewer = createViewerPane({ browser, sorter, slideshow, slots, strings, chords });

  const folderInput = element('input', { type: 'file', multiple: true, hidden: true, 'aria-label': strings.openFolder });
  folderInput.webkitdirectory = true;
  const filesInput = element('input', { type: 'file', multiple: true, hidden: true, 'aria-label': strings.openFiles });
  folderInput.addEventListener('change', () => {
    browser.openFileList(folderInput.files, strings.localFiles);
    folderInput.value = '';
  });
  filesInput.addEventListener('change', () => {
    browser.openFileList(filesInput.files, strings.localFiles);
    filesInput.value = '';
  });

  const folderButton = commandButton({
    id: 'local.openFolder', label: strings.openFolder, glyphMeaning: 'content.folder', rank: 'primary',
    onActivate: () => (browser.access.handlePicker ? browser.pickFolder() : folderInput.click()),
  });
  const filesButton = commandButton({ id: 'local.openFiles', label: strings.openFiles, glyphMeaning: 'action.choose-file', onActivate: () => filesInput.click() });
  const openRow = element('div', { class: 'command-row local-open' }, [folderButton, filesButton, folderInput, filesInput]);
  if (!browser.access.handlePicker && !browser.access.folderInput) markUnavailable(folderButton, strings.folderPickUnavailable);

  const status = element('p', { class: 'local-status', role: 'status' });
  const readOnly = element('p', { class: 'local-note', text: strings.readOnlyLine, hidden: true });

  const sortSelect = element('select', { id: 'local-sort', class: 'select-field' }, [
    element('option', { value: 'name', text: strings.sortName }),
    element('option', { value: 'date', text: strings.sortDate }),
    element('option', { value: 'size', text: strings.sortSize }),
  ]);
  sortSelect.addEventListener('change', () => browser.setSort(sortSelect.value));
  const reverse = element('input', { type: 'checkbox', id: 'local-reverse', class: 'boolean-check' });
  reverse.addEventListener('change', () => browser.setDescending(reverse.checked));
  const filter = element('input', { type: 'search', id: 'local-filter', class: 'text-field', autocomplete: 'off', spellcheck: 'false' });
  filter.addEventListener('input', () => browser.setFilter(filter.value));
  const modeInputs = ['grid', 'list'].map((mode) => {
    const input = element('input', { type: 'radio', name: 'local-mode', id: `local-mode-${mode}`, value: mode });
    input.addEventListener('change', () => { if (input.checked) browser.setMode(mode); });
    return element('label', { class: 'choice-option', for: `local-mode-${mode}` }, [input, element('span', { text: mode === 'grid' ? strings.viewGrid : strings.viewList })]);
  });
  const kindInputs = Object.entries(kindLabels).map(([kind, key]) => {
    const input = element('input', { type: 'checkbox', id: `local-kind-${kind}`, class: 'boolean-check', 'data-kind': kind });
    input.addEventListener('change', () => browser.setKind(kind, input.checked));
    return element('label', { class: 'choice-option', for: `local-kind-${kind}` }, [input, element('span', { text: strings[key] })]);
  });

  const choices = element('div', { class: 'local-choices' }, [
    element('fieldset', { class: 'choice-group' }, [element('legend', { class: 'choice-legend', text: strings.viewLegend }), element('div', { class: 'choice-options' }, modeInputs)]),
    element('div', { class: 'local-field' }, [element('label', { for: 'local-sort', text: strings.sortBy }), sortSelect]),
    element('label', { class: 'choice-option', for: 'local-reverse' }, [reverse, element('span', { text: strings.reverseOrder })]),
    element('div', { class: 'local-field' }, [element('label', { for: 'local-filter', text: strings.filterByName }), filter]),
    element('fieldset', { class: 'choice-group' }, [element('legend', { class: 'choice-legend', text: strings.kindsLegend }), element('div', { class: 'choice-options' }, kindInputs)]),
  ]);

  const path = element('nav', { class: 'local-path', 'aria-label': strings.pathLabel });
  const list = element('ul', { class: 'local-list', 'aria-label': strings.folderContents });
  const listPane = element('div', { class: 'local-browse' }, [path, list]);
  const body = element('div', { class: 'local-body' }, [listPane, viewer.node]);
  const root = element('div', { class: 'local' }, [
    element('p', { class: 'explanation', text: strings.dropHint }),
    openRow, readOnly, choices, status, body,
  ]);

  function syncControls() {
    sortSelect.value = state.sortKey;
    reverse.checked = state.descending;
    if (filter.value !== state.filter) filter.value = state.filter;
    for (const label of modeInputs) {
      const input = label.querySelector('input');
      input.checked = input.value === state.mode;
    }
    for (const label of kindInputs) {
      const input = label.querySelector('input');
      input.checked = state.kinds.includes(input.dataset.kind);
    }
    readOnly.hidden = !state.source || state.source.writable;
    choices.hidden = !state.source;
    body.hidden = !state.source;
    let message = '';
    if (state.loading) message = strings.loadingFolder;
    else if (state.failure) message = strings.unreadableFolder;
    else if (state.source && state.entries.length === 0) message = strings.emptyFolder;
    else if (state.source && state.files.length === 0 && state.entries.some((entry) => !entry.isFolder)) message = strings.nothingMatches;
    status.textContent = message;
    status.hidden = message === '';
  }

  function drawPath() {
    if (!state.source) {
      path.replaceChildren();
      return;
    }
    const names = [state.source.label, ...state.path];
    path.replaceChildren(element('ol', { class: 'path-list' }, names.map((name, depth) => element('li', {}, [
      depth === names.length - 1
        ? element('span', { 'aria-current': 'location', text: name })
        : commandButton({ id: `path.${depth}`, label: name, rank: 'secondary', onActivate: () => browser.goToDepth(depth) }),
    ]))));
  }

  function badge(entry) {
    return element('span', { class: 'item-badge', text: strings[badgeKeys[entry.category] ?? 'badgeOther'] });
  }

  function fileItem(entry, index) {
    const details = state.mode === 'list'
      ? element('span', { class: 'item-details', text: `${format.size(entry.size, locale())} - ${format.date(entry.lastModified, locale())}` })
      : null;
    let preview = badge(entry);
    if (state.mode === 'grid' && entry.category === 'IMAGE') {
      preview = element('img', { class: 'item-thumb', alt: '', loading: 'lazy', decoding: 'async', src: browser.urlFor(entry) });
      preview.addEventListener('error', () => preview.replaceWith(badge(entry)), { once: true });
    }
    const itemButton = element('button', {
      type: 'button', class: 'local-item', 'data-key': `file:${entry.name}`, 'data-index': index,
      'aria-current': index === state.index ? 'true' : null,
    }, [preview, element('span', { class: 'item-name', text: entry.name }), details]);
    itemButton.addEventListener('click', () => browser.openFile(index));
    return element('li', {}, [itemButton]);
  }

  function folderItem(entry) {
    const itemButton = element('button', { type: 'button', class: 'local-item is-folder', 'data-key': `folder:${entry.name}` }, [
      glyph('content.folder'),
      element('span', { class: 'item-name', text: entry.name }),
    ]);
    itemButton.addEventListener('click', () => browser.enterFolder(entry.name));
    return element('li', {}, [itemButton]);
  }

  function drawList() {
    list.className = `local-list is-${state.mode}`;
    list.replaceChildren(...state.folders.map(folderItem), ...state.files.map(fileItem));
  }

  function markCurrent() {
    for (const node of list.querySelectorAll('.local-item[data-index]')) {
      if (Number(node.dataset.index) === state.index) node.setAttribute('aria-current', 'true');
      else node.removeAttribute('aria-current');
    }
  }

  function focusCurrentInList() {
    const target = list.querySelector('.local-item[aria-current="true"]') ?? list.querySelector('.local-item');
    if (target) {
      target.focus();
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  function update(part = 'all') {
    if (['transform', 'sorting', 'slideshow', 'countdown', 'replay'].includes(part)) {
      viewer.update(part);
      return;
    }
    const focusedKey = list.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    if (part === 'all') {
      syncControls();
      drawPath();
      drawList();
      if (focusedKey) list.querySelector(`[data-key="${CSS.escape(focusedKey)}"]`)?.focus();
    } else {
      markCurrent();
    }
    list.querySelector('.local-item[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
    viewer.update(part);
  }

  // Arrow keys move between items of the list; Up and Down move by a row of the grid.
  function moveInList(event) {
    const items = [...list.querySelectorAll('.local-item')];
    const from = items.indexOf(document.activeElement);
    if (from < 0) return false;
    const top = items[0].offsetTop;
    const perRow = state.mode === 'grid' ? items.filter((item) => item.offsetTop === top).length : 1;
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -perRow, ArrowDown: perRow };
    let to = from;
    if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = items.length - 1;
    else to = Math.min(items.length - 1, Math.max(0, from + moves[event.key]));
    items[to].focus();
    return true;
  }

  const runners = {
    next: () => browser.navigate('next'),
    previous: () => browser.navigate('previous'),
    first: () => browser.navigate('first'),
    last: () => browser.navigate('last'),
    back10: () => browser.navigate('back10'),
    forward10: () => browser.navigate('forward10'),
    back100: () => browser.navigate('back100'),
    forward100: () => browser.navigate('forward100'),
    random: () => browser.random(),
    jump: () => browser.openJump(),
    chooseFromList: focusCurrentInList,
    toggleGrid: () => browser.toggleMode(),
    zoomIn: () => browser.zoomIn(),
    zoomOut: () => browser.zoomOut(),
    fit: () => browser.fit(),
    actualSize: () => browser.actualSize(),
    rotateRight: () => browser.rotate(1),
    rotateLeft: () => browser.rotate(-1),
    fullscreen: () => viewer.toggleFullscreen(),
    slideshow: () => slideshow.start({ random: false }),
    randomSlideshow: () => slideshow.start({ random: true }),
    back: () => viewer.stepBack(),
  };
  const imageOnly = new Set(['zoomIn', 'zoomOut', 'fit', 'actualSize', 'rotateRight', 'rotateLeft']);
  const listOnly = new Set(['toggleGrid', 'chooseFromList']);
  const spaceOwners = new Set(['BUTTON', 'A', 'SUMMARY']);

  function onKeyDown(event) {
    if (event.defaultPrevented || !state.source || !root.isConnected) return;
    const target = event.target;
    // A field or the go-to-number form owns its keys; only Esc leaves it.
    if (isEditable(target) || state.jump) return;
    // A digit moves the open file to that destination (MEDIA-VIEWER rule 4); with no file open it
    // does nothing.
    const slot = destinationSlot(event);
    if (slot !== null) {
      if (browser.current() === null) return;
      sorter.moveCurrentTo(slot);
      event.preventDefault();
      return;
    }
    if (list.contains(target) && listKeys.has(event.key) && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      if (moveInList(event)) event.preventDefault();
      return;
    }
    const command = viewerCommand(event, { isPlayer: viewer.isPlayer() });
    if (!command) return;
    if (command === 'next' && event.key === ' ' && isActivatable(target)) return;
    // The player's commands; Space on a focused button stays that button's.
    if (!runners[command]) {
      if (event.key === ' ' && target instanceof HTMLElement && spaceOwners.has(target.tagName)) return;
      if (viewer.player()?.run(command)) event.preventDefault();
      return;
    }
    const open = browser.current() !== null;
    if (!open && !listOnly.has(command) && command !== 'back') return;
    if (imageOnly.has(command) && browser.current()?.category !== 'IMAGE') return;
    if (command === 'back' && !viewer.stepBack()) return;
    if (command !== 'back') runners[command]();
    event.preventDefault();
  }

  function onDragOver(event) {
    if (![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    root.classList.add('is-drop-target');
  }

  function onDragLeave(event) {
    if (!root.contains(event.relatedTarget)) root.classList.remove('is-drop-target');
  }

  function onDrop(event) {
    event.preventDefault();
    root.classList.remove('is-drop-target');
    browser.openDrop(event.dataTransfer, strings.localFiles);
  }

  root.addEventListener('dragover', onDragOver);
  root.addEventListener('dragleave', onDragLeave);
  root.addEventListener('drop', onDrop);
  const onVisibility = () => slideshow.setHidden(document.hidden);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();

  update('all');

  return {
    root,
    update,
    dispose() {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      viewer.dispose();
    },
  };
}
