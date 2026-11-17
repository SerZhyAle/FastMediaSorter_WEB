import { access, pickDirectoryHandle, sourceFromDrop, sourceFromFileList } from '../data/local-files.js';
import { readValue, writeValue } from '../data/local-store.js';
import { log } from '../data/log.js';
import { arrange, kindGroups, parseJump, prepareEntries, randomIndex, sortKeys, step } from './browse.js';

// State and use cases of the local surface: the open source and its folder stack, the listing
// choices, the open file and its view transform (MEDIA-VIEWER section 1 rules 1-3). The view
// reads `state` and calls the methods; `onChange(part)` tells it which part to redraw:
// 'all', 'viewer' or 'transform'.

export const zoomStep = 1.25;
const zoomMin = 1 / 20;
const zoomMax = 32;
const viewKey = 'local-view';

function loadView() {
  const saved = readValue(viewKey, {});
  const values = saved && typeof saved === 'object' ? saved : {};
  const kinds = Array.isArray(values.kinds) ? values.kinds.filter((kind) => kindGroups.includes(kind)) : null;
  return {
    mode: values.mode === 'list' ? 'list' : 'grid',
    sortKey: sortKeys.includes(values.sortKey) ? values.sortKey : 'name',
    descending: values.descending === true,
    kinds: kinds ?? ['image', 'video', 'audio'],
  };
}

function freshTransform() {
  return { zoom: null, rotation: 0, panX: 0, panY: 0 };
}

export function createLocalBrowser({ locale, onChange }) {
  const view = loadView();
  const state = {
    source: null,
    path: [],
    entries: [],
    folders: [],
    files: [],
    index: -1,
    mode: view.mode,
    sortKey: view.sortKey,
    descending: view.descending,
    kinds: view.kinds,
    filter: '',
    loading: false,
    failure: null,
    transform: freshTransform(),
    natural: null,
    stage: { width: 0, height: 0 },
    fullscreen: 'none',
    jump: null,
  };
  const urls = new Map();
  let generation = 0;

  const changed = (part = 'all') => onChange(part);

  function saveView() {
    writeValue(viewKey, { mode: state.mode, sortKey: state.sortKey, descending: state.descending, kinds: state.kinds });
  }

  function releaseUrls() {
    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear();
  }

  function rearrange() {
    const current = state.files[state.index] ?? null;
    const { folders, files } = arrange(state.entries, {
      sortKey: state.sortKey, descending: state.descending, filter: state.filter, kinds: state.kinds, locale: locale(),
    });
    state.folders = folders;
    state.files = files;
    state.index = current ? files.indexOf(current) : -1;
    if (current && state.index < 0) resetView();
  }

  function resetView() {
    state.transform = freshTransform();
    state.natural = null;
    state.jump = null;
  }

  async function load() {
    const ticket = ++generation;
    state.loading = true;
    state.failure = null;
    changed();
    try {
      const entries = await state.source.list(state.path);
      if (ticket !== generation) return;
      releaseUrls();
      state.entries = prepareEntries(entries);
      state.index = -1;
      resetView();
      rearrange();
    } catch (error) {
      if (ticket !== generation) return;
      log.warn(`folder could not be read (${error && error.name})`);
      state.entries = [];
      state.folders = [];
      state.files = [];
      state.index = -1;
      state.failure = 'unreadable';
    }
    state.loading = false;
    changed();
  }

  function effectiveScale() {
    const { natural, stage, transform } = state;
    if (transform.zoom !== null) return transform.zoom;
    if (!natural || stage.width <= 0 || stage.height <= 0) return 1;
    const turned = transform.rotation % 2 !== 0;
    const width = turned ? natural.height : natural.width;
    const height = turned ? natural.width : natural.height;
    return Math.min(1, stage.width / width, stage.height / height);
  }

  function setScale(next, anchor) {
    const before = effectiveScale();
    const scale = Math.min(zoomMax, Math.max(zoomMin, next));
    const { transform } = state;
    // The point under the pointer stays under it: anchor and pan are offsets from the stage centre.
    const point = anchor ?? { x: 0, y: 0 };
    transform.panX = point.x - (point.x - transform.panX) * (scale / before);
    transform.panY = point.y - (point.y - transform.panY) * (scale / before);
    transform.zoom = scale;
    changed('transform');
  }

  const api = {
    state,
    effectiveScale,
    current() {
      return state.files[state.index] ?? null;
    },
    urlFor(entry) {
      if (!entry || !entry.file) return null;
      if (!urls.has(entry)) urls.set(entry, URL.createObjectURL(entry.file));
      return urls.get(entry);
    },
    access,
    // Only for a browser with the folder picker; the others open through the folder input.
    async pickFolder() {
      try {
        api.open(await pickDirectoryHandle());
      } catch (error) {
        log.warn(`folder picker refused (${error && error.name})`);
        state.failure = 'unreadable';
        changed();
      }
    },
    openFileList(fileList, fallbackLabel) {
      if (fileList && fileList.length > 0) api.open(sourceFromFileList(fileList, fallbackLabel));
    },
    // Called inside the drop event: the drop APIs are asked before its first await.
    openDrop(dataTransfer, fallbackLabel) {
      sourceFromDrop(dataTransfer, fallbackLabel).then(api.open, (error) => {
        log.warn(`dropped items could not be read (${error && error.name})`);
        state.failure = 'unreadable';
        changed();
      });
    },
    open(source) {
      if (!source) return;
      state.source = source;
      state.path = [];
      state.filter = '';
      state.fullscreen = 'none';
      load();
    },
    enterFolder(name) {
      state.path = [...state.path, name];
      load();
    },
    // depth 0 is the picked folder itself.
    goToDepth(depth) {
      if (depth >= state.path.length) return;
      state.path = state.path.slice(0, depth);
      load();
    },
    setMode(mode) {
      state.mode = mode === 'list' ? 'list' : 'grid';
      saveView();
      changed();
    },
    toggleMode() {
      api.setMode(state.mode === 'grid' ? 'list' : 'grid');
    },
    setSort(sortKey) {
      state.sortKey = sortKey;
      saveView();
      rearrange();
      changed();
    },
    setDescending(descending) {
      state.descending = descending === true;
      saveView();
      rearrange();
      changed();
    },
    setKind(kind, on) {
      const kinds = new Set(state.kinds);
      if (on) kinds.add(kind); else kinds.delete(kind);
      state.kinds = kindGroups.filter((group) => kinds.has(group));
      saveView();
      rearrange();
      changed();
    },
    setFilter(text) {
      state.filter = text;
      rearrange();
      changed();
    },
    openFile(index) {
      if (index < 0 || index >= state.files.length) return;
      if (index !== state.index) resetView();
      state.index = index;
      changed('viewer');
    },
    // After a move (MEDIA-VIEWER rule 4): the moved file leaves the list and the file that took
    // its place shows; the list left empty closes the viewer.
    removeFile(entry) {
      const at = state.files.indexOf(entry);
      state.entries = state.entries.filter((item) => item !== entry);
      if (urls.has(entry)) {
        URL.revokeObjectURL(urls.get(entry));
        urls.delete(entry);
      }
      const wasCurrent = at >= 0 && at === state.index;
      if (wasCurrent) state.index = -1;
      rearrange();
      if (wasCurrent) {
        // The next file wraps to the first, as paging does.
        state.index = state.files.length === 0 ? -1 : at % state.files.length;
        if (state.index < 0) state.fullscreen = 'none';
        resetView();
      }
      changed();
    },
    closeViewer() {
      state.index = -1;
      state.fullscreen = 'none';
      resetView();
      changed('viewer');
    },
    navigate(move) {
      if (state.files.length === 0) return;
      const from = state.index < 0 ? 0 : state.index;
      api.openFile(state.index < 0 && move === 'next' ? 0 : step(from, state.files.length, move));
    },
    random() {
      if (state.files.length === 0) return;
      api.openFile(randomIndex(state.index, state.files.length));
    },
    openJump() {
      if (state.files.length === 0) return;
      state.jump = { text: String(Math.max(state.index, 0) + 1), invalid: false };
      changed('viewer');
    },
    submitJump(text) {
      const target = parseJump(text, state.files.length);
      if (target === null) {
        state.jump = { text, invalid: true };
        changed('viewer');
        return false;
      }
      state.jump = null;
      api.openFile(target);
      return true;
    },
    cancelJump() {
      state.jump = null;
      changed('viewer');
    },
    setNatural(width, height) {
      state.natural = width > 0 && height > 0 ? { width, height } : null;
      changed('transform');
    },
    setStage(width, height) {
      state.stage = { width, height };
      changed('transform');
    },
    zoomIn(anchor) { setScale(effectiveScale() * zoomStep, anchor); },
    zoomOut(anchor) { setScale(effectiveScale() / zoomStep, anchor); },
    zoomBy(factor, anchor) { setScale(effectiveScale() * factor, anchor); },
    fit() {
      state.transform = { ...freshTransform(), rotation: state.transform.rotation };
      changed('transform');
    },
    actualSize() {
      state.transform = { ...freshTransform(), rotation: state.transform.rotation, zoom: 1 };
      changed('transform');
    },
    // Quarter turns of the view only; the file is never written (rule 3).
    rotate(direction) {
      const { transform } = state;
      transform.rotation = (transform.rotation + (direction < 0 ? 3 : 1)) % 4;
      transform.panX = 0;
      transform.panY = 0;
      changed('transform');
    },
    panBy(dx, dy) {
      if (state.transform.zoom === null) return;
      state.transform.panX += dx;
      state.transform.panY += dy;
      changed('transform');
    },
    setFullscreen(mode) {
      state.fullscreen = mode;
      changed('viewer');
    },
  };
  return api;
}
