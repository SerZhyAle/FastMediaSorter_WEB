import { log } from './log.js';

// The ten destination folders, kept across visits as File System Access handles in a database of
// their own (version 1, one store), so no other database ever has to upgrade from it. Where the
// browser refuses IndexedDB the slots live in memory for this visit only.

const databaseName = 'fms-web-destinations';
const storeName = 'slots';
const memory = new Map();
let opening = null;

function request(operation) {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}

function database() {
  if (!globalThis.indexedDB) return Promise.resolve(null);
  opening ??= new Promise((resolve) => {
    let open;
    try {
      open = globalThis.indexedDB.open(databaseName, 1);
    } catch (error) {
      log.warn(`destination store is unavailable (${error && error.name})`);
      resolve(null);
      return;
    }
    open.onupgradeneeded = () => open.result.createObjectStore(storeName);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => {
      log.warn(`destination store is unavailable (${open.error && open.error.name})`);
      resolve(null);
    };
    open.onblocked = () => log.warn('destination store is blocked by another tab');
  });
  return opening;
}

async function inStore(mode, run) {
  const db = await database();
  if (!db) return null;
  try {
    return await request(run(db.transaction(storeName, mode).objectStore(storeName)));
  } catch (error) {
    log.warn(`destination store ${mode} failed (${error && error.name})`);
    return null;
  }
}

// Returns Map<slot digit string, FileSystemDirectoryHandle>.
export async function loadSlots() {
  const slots = new Map(memory);
  const keys = await inStore('readonly', (store) => store.getAllKeys());
  const values = await inStore('readonly', (store) => store.getAll());
  if (Array.isArray(keys) && Array.isArray(values) && keys.length === values.length) {
    keys.forEach((key, index) => {
      if (values[index] && values[index].kind === 'directory') slots.set(String(key), values[index]);
    });
  }
  return slots;
}

export async function saveSlot(slot, handle) {
  memory.set(slot, handle);
  await inStore('readwrite', (store) => store.put(handle, slot));
}

export async function clearSlot(slot) {
  memory.delete(slot);
  await inStore('readwrite', (store) => store.delete(slot));
}
