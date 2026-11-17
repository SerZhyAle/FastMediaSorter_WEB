import { log } from './log.js';

// Folders and files the person hands to the page. Every way in (the folder picker, the folder or
// file input, a drop) becomes one source shape:
//   { label, writable, list(path) -> Promise<entry[]> }
//   entry: { name, isFolder, size, lastModified, file }
// `writable` is true only for a File System Access directory handle (Chromium desktop), which also
// carries `handle` and `directory(path)` for the destination moves; every
// other source is a read-only snapshot taken when the person picked it. Entries come back in the
// order the browser scanned them, which is the tie order of every sort.

export const access = Object.freeze({
  handlePicker: typeof globalThis.showDirectoryPicker === 'function',
  folderInput: typeof HTMLInputElement !== 'undefined' && 'webkitdirectory' in HTMLInputElement.prototype,
});

function fileEntry(file, name = file.name) {
  return { name, isFolder: false, size: file.size, lastModified: file.lastModified, file };
}

function folderEntry(name) {
  return { name, isFolder: true, size: 0, lastModified: 0, file: null };
}

export function sourceFromDirectoryHandle(handle) {
  return {
    label: handle.name,
    writable: true,
    handle,
    async directory(path) {
      let directory = handle;
      for (const segment of path) directory = await directory.getDirectoryHandle(segment);
      return directory;
    },
    async list(path) {
      const directory = await this.directory(path);
      const entries = [];
      for await (const child of directory.values()) {
        if (child.kind === 'directory') entries.push(folderEntry(child.name));
        else entries.push(fileEntry(await child.getFile(), child.name));
      }
      return entries;
    },
  };
}

// A folder input names each file by its path under the picked folder ("Holiday/day 1/a.jpg");
// a plain file input has no folders at all.
export function sourceFromFileList(fileList, fallbackLabel) {
  const files = [...fileList];
  const relative = (file) => (file.webkitRelativePath || file.name).split('/').filter(Boolean);
  const rooted = files.length > 0 && files.every((file) => relative(file).length > 1);
  const root = rooted ? relative(files[0])[0] : fallbackLabel;
  const tree = new Map([['', []]]);
  const seenFolders = new Set();
  for (const file of files) {
    const parts = relative(file);
    if (rooted) parts.shift();
    for (let depth = 0; depth < parts.length - 1; depth += 1) {
      const parent = parts.slice(0, depth).join('/');
      const key = parts.slice(0, depth + 1).join('/');
      if (!seenFolders.has(key)) {
        seenFolders.add(key);
        if (!tree.has(parent)) tree.set(parent, []);
        tree.get(parent).push(folderEntry(parts[depth]));
        tree.set(key, tree.get(key) ?? []);
      }
    }
    const parent = parts.slice(0, -1).join('/');
    if (!tree.has(parent)) tree.set(parent, []);
    tree.get(parent).push(fileEntry(file, parts[parts.length - 1]));
  }
  return {
    label: root,
    writable: false,
    async list(path) {
      return [...(tree.get(path.join('/')) ?? [])];
    },
  };
}

function readAllEntries(directoryEntry) {
  const reader = directoryEntry.createReader();
  const all = [];
  return new Promise((resolve, reject) => {
    const next = () => reader.readEntries((batch) => {
      if (batch.length === 0) resolve(all);
      else { all.push(...batch); next(); }
    }, reject);
    next();
  });
}

function entryFile(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function childDirectory(directoryEntry, name) {
  return new Promise((resolve, reject) => directoryEntry.getDirectory(name, {}, resolve, reject));
}

export function sourceFromDirectoryEntry(rootEntry) {
  return {
    label: rootEntry.name,
    writable: false,
    async list(path) {
      let directory = rootEntry;
      for (const segment of path) directory = await childDirectory(directory, segment);
      const entries = [];
      for (const child of await readAllEntries(directory)) {
        if (child.isDirectory) entries.push(folderEntry(child.name));
        else entries.push(fileEntry(await entryFile(child), child.name));
      }
      return entries;
    },
  };
}

// Returns null when the person cancels the picker; any other refusal is reported to the caller.
export async function pickDirectoryHandle() {
  try {
    return sourceFromDirectoryHandle(await globalThis.showDirectoryPicker({ id: 'fms-web-local', mode: 'read' }));
  } catch (error) {
    if (error && error.name === 'AbortError') {
      log.info('folder pick cancelled');
      return null;
    }
    throw error;
  }
}

// Both drop APIs must be called while the drop event is still being dispatched, so every item
// is asked first and awaited afterwards.
export async function sourceFromDrop(dataTransfer, fallbackLabel) {
  const items = [...(dataTransfer.items ?? [])].filter((item) => item.kind === 'file');
  const asked = items.map((item) => ({
    handle: typeof item.getAsFileSystemHandle === 'function' ? item.getAsFileSystemHandle() : null,
    entry: typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null,
  }));
  const files = [...(dataTransfer.files ?? [])];
  for (const { handle, entry } of asked) {
    let resolved = null;
    if (handle) {
      try {
        resolved = await handle;
      } catch (error) {
        log.warn(`dropped item gave no folder handle (${error && error.name})`);
      }
    }
    if (resolved && resolved.kind === 'directory') return sourceFromDirectoryHandle(resolved);
    if (entry && entry.isDirectory) return sourceFromDirectoryEntry(entry);
  }
  return files.length > 0 ? sourceFromFileList(files, fallbackLabel) : null;
}

// The first bytes of a file, for naming its container; an unreadable file gives an empty head.
export async function readHead(file, count) {
  try {
    return new Uint8Array(await file.slice(0, count).arrayBuffer());
  } catch (error) {
    log.info(`file head could not be read (${error && error.name})`);
    return new Uint8Array(0);
  }
}
