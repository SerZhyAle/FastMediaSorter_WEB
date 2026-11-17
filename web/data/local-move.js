import { log } from './log.js';

// Moving one file between two folders the person granted through the File System Access API
// (MEDIA-VIEWER section 1 rule 4). The API has no exclusive-create flag on a picked folder, so a
// move is: refuse the same folder, refuse an existing name, stream the file into the destination,
// compare sizes, and only then remove the source. Any failure before that last step removes the
// partial destination file and leaves the source where it was.
//
// Outcomes: 'moved' | 'clash' | 'same' | 'denied' | 'missing' | 'failed' | 'copiedOnly' (the copy is
// complete and verified but the source could not be removed, so the file is in both folders).

const fileHandleProto = globalThis.FileSystemFileHandle?.prototype;

export const writeAccess = typeof globalThis.showDirectoryPicker === 'function'
  && !!fileHandleProto && typeof fileHandleProto.createWritable === 'function';

// Returns null when the person cancels the picker; any other refusal is reported to the caller.
export async function pickDestination() {
  try {
    return await globalThis.showDirectoryPicker({ id: 'fms-web-destination', mode: 'readwrite' });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      log.info('destination pick cancelled');
      return null;
    }
    throw error;
  }
}

// Asks for write access only when it is not already granted; the caller is inside a key press or a
// click, which is the user activation the request needs.
export async function ensureWritable(handle) {
  const options = { mode: 'readwrite' };
  if (typeof handle.queryPermission !== 'function') return true;
  if (await handle.queryPermission(options) === 'granted') return true;
  if (typeof handle.requestPermission !== 'function') return false;
  return await handle.requestPermission(options) === 'granted';
}

async function exists(directory, name) {
  try {
    await directory.getFileHandle(name, { create: false });
    return true;
  } catch (error) {
    if (error && error.name === 'NotFoundError') return false;
    if (error && error.name === 'TypeMismatchError') return true;
    throw error;
  }
}

async function discardPartial(destination, name) {
  try {
    await destination.removeEntry(name);
  } catch (error) {
    log.warn(`partial destination file was not removed (${error && error.name})`);
  }
}

export async function moveFile({ sourceDirectory, name, destination }) {
  if (await destination.isSameEntry(sourceDirectory)) return 'same';
  let sourceHandle;
  try {
    sourceHandle = await sourceDirectory.getFileHandle(name, { create: false });
  } catch (error) {
    log.warn(`source file is gone (${error && error.name})`);
    return 'missing';
  }
  try {
    if (await exists(destination, name)) return 'clash';
  } catch (error) {
    log.warn(`destination could not be checked (${error && error.name})`);
    return error && error.name === 'NotAllowedError' ? 'denied' : 'failed';
  }
  const file = await sourceHandle.getFile();
  let created = false;
  try {
    const target = await destination.getFileHandle(name, { create: true });
    created = true;
    const writable = await target.createWritable({ keepExistingData: false });
    try {
      await file.stream().pipeTo(writable);
    } catch (error) {
      await writable.abort().catch((abortError) => log.warn(`write abort failed (${abortError && abortError.name})`));
      throw error;
    }
    const written = await target.getFile();
    if (written.size !== file.size) throw new Error(`size ${written.size} of ${file.size}`);
  } catch (error) {
    log.warn(`file was not written to the destination (${error && (error.name || error.message)})`);
    if (created) await discardPartial(destination, name);
    return error && error.name === 'NotAllowedError' ? 'denied' : 'failed';
  }
  try {
    await sourceDirectory.removeEntry(name);
  } catch (error) {
    log.warn(`source file was copied but not removed (${error && error.name})`);
    return 'copiedOnly';
  }
  return 'moved';
}
