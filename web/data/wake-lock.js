import { log } from './log.js';

// The screen wake lock (W3C Screen Wake Lock) behind one small interface. The browser may refuse a
// request, drop a held lock at any time (a hidden tab, a battery saver) or lack the API; each case
// is a status the page can show, never a thrown error. status: 'off', 'pending', 'held',
// 'released' (dropped by the browser while wanted), 'denied', 'unavailable'.

export function createWakeLock(navigatorObject = globalThis.navigator) {
  const api = navigatorObject && navigatorObject.wakeLock;
  const supported = Boolean(api && typeof api.request === 'function');
  let status = supported ? 'off' : 'unavailable';
  let sentinel = null;
  let wanted = false;
  let listener = () => {};

  function set(next) {
    if (status === next) return;
    status = next;
    listener();
  }

  return {
    get status() {
      return status;
    },
    onChange(handler) {
      listener = handler;
    },
    acquire() {
      wanted = true;
      if (!supported) {
        set('unavailable');
        return;
      }
      if (sentinel || status === 'pending') return;
      set('pending');
      let requested;
      try {
        requested = api.request('screen');
      } catch (error) {
        requested = Promise.reject(error);
      }
      Promise.resolve(requested).then((lock) => {
        if (!wanted) {
          Promise.resolve(lock.release()).catch((error) => log.info(`screen lock release failed (${error && error.name})`));
          set('off');
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel !== lock) return;
          sentinel = null;
          set(wanted ? 'released' : 'off');
        });
        set('held');
      }, (error) => {
        log.info(`screen lock refused (${error && error.name})`);
        set(wanted ? 'denied' : 'off');
      });
    },
    release() {
      wanted = false;
      const lock = sentinel;
      sentinel = null;
      if (supported) set(status === 'pending' ? 'pending' : 'off');
      if (lock) Promise.resolve(lock.release()).catch((error) => log.info(`screen lock release failed (${error && error.name})`));
    },
  };
}
