import { log } from './log.js';

// Small JSON values kept in this browser's local storage. Storage can be refused (a private
// window in some engines, a blocked site) - every read then returns the caller's default and
// every write is skipped, so the page keeps working with session-only values.

const namespace = 'fms-web.';

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch (error) {
    log.warn(`local storage is unavailable (${error && error.name})`);
    return null;
  }
}

export function readValue(key, fallback) {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(namespace + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    log.warn(`stored value ${key} is unreadable, using the default (${error && error.name})`);
    return fallback;
  }
}

export function writeValue(key, value) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(namespace + key, JSON.stringify(value));
    return true;
  } catch (error) {
    log.warn(`stored value ${key} was not saved (${error && error.name})`);
    return false;
  }
}
