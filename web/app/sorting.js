import { clearSlot, loadSlots, saveSlot } from '../data/destination-store.js';
import { ensureWritable, moveFile, pickDestination, writeAccess } from '../data/local-move.js';
import { log } from '../data/log.js';

// Sorting into the ten destination folders (MEDIA-VIEWER section 1 rule 4): the slots, whether this
// browser and this source can move at all, and one move at a time. The result of the last action
// is a message the viewer shows while the file it belongs to is on screen; `onChange('sorting')`
// asks the view to redraw the sorting controls alone.

const outcomeKeys = Object.freeze({
  moved: 'movedTo',
  clash: 'moveClash',
  same: 'moveSameFolder',
  denied: 'moveDenied',
  missing: 'moveMissing',
  failed: 'moveFailed',
  copiedOnly: 'moveCopiedOnly',
});

export function createSorter({ browser, onChange }) {
  const state = { slots: new Map(), panelOpen: false, busy: false, message: null };
  const changed = () => onChange('sorting');

  loadSlots().then((stored) => {
    for (const [slot, handle] of stored) if (!state.slots.has(slot)) state.slots.set(slot, handle);
    changed();
  }, (error) => log.warn(`destinations could not be read (${error && error.name})`));

  function say(key, values = {}) {
    state.message = { key, values, entry: browser.current() };
    changed();
  }

  // The strings key of the line that says why moving is unavailable, or null.
  function unavailableReason() {
    if (!writeAccess) return 'sortUnavailable';
    const { source } = browser.state;
    if (source && !source.writable) return 'sortNeedsFolder';
    return null;
  }

  async function transfer(entry, destination) {
    const { source, path } = browser.state;
    if (!await ensureWritable(source.handle) || !await ensureWritable(destination)) return 'denied';
    const sourceDirectory = await source.directory(path);
    return moveFile({ sourceDirectory, name: entry.name, destination });
  }

  return {
    state,
    unavailableReason,
    message() {
      const { message } = state;
      return message && message.entry === browser.current() ? message : null;
    },
    togglePanel() {
      state.panelOpen = !state.panelOpen;
      changed();
    },
    closePanel() {
      if (!state.panelOpen) return false;
      state.panelOpen = false;
      changed();
      return true;
    },
    async choose(slot) {
      if (unavailableReason() === 'sortUnavailable') return;
      try {
        const handle = await pickDestination();
        if (!handle) return;
        state.slots.set(slot, handle);
        await saveSlot(slot, handle);
        console.debug("S0024: destination set")
        changed();
      } catch (error) {
        log.warn(`destination folder refused (${error && error.name})`);
        say('destinationNotChosen');
      }
    },
    async clear(slot) {
      state.slots.delete(slot);
      await clearSlot(slot);
      changed();
    },
    async moveCurrentTo(slot) {
      const entry = browser.current();
      if (!entry || state.busy) return;
      const reason = unavailableReason();
      if (reason) {
        console.debug("S0024: move refused, unavailable")
        say(reason);
        return;
      }
      const destination = state.slots.get(slot);
      if (!destination) {
        say('moveNotSet', { n: slot });
        return;
      }
      const values = { name: entry.name, folder: destination.name };
      state.busy = true;
      say('moving', values);
      let outcome;
      try {
        outcome = await transfer(entry, destination);
      } catch (error) {
        log.warn(`move failed (${error && error.name})`);
        outcome = error && error.name === 'NotAllowedError' ? 'denied' : 'failed';
      }
      state.busy = false;
      console.debug("S0024: move finished")
      if (outcome === 'moved') browser.removeFile(entry);
      say(outcomeKeys[outcome] ?? 'moveFailed', values);
    },
  };
}
