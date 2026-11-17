// MEDIA-CLASSIFICATION 0.13: rule 1 table (with the 2026-10-18 and 2026-10-29 additions), rule 3
// matching and rule 5 exclusion. A category describes the file by its name only; it never claims
// that this browser can decode it (rule 1, MEDIA-VIEWER rule 6).

export const categories = Object.freeze(['IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'STREAM', 'CONTAINER', 'DOCUMENT', 'UNKNOWN']);

export const extensionTable = Object.freeze({
  IMAGE: Object.freeze(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'heic', 'heif', 'svg', 'tiff', 'ico', 'wmf', 'emf', 'jxl', 'tif']),
  VIDEO: Object.freeze(['mp4', 'mkv', 'mov', 'webm', '3gp', 'flv', 'wmv', 'm4v', 'avi', 'mpg', 'mpeg', 'ts', 'm2ts', 'vob', 'ogv', 'divx', 'm2v', 'mts', '3g2', 'asf']),
  AUDIO: Object.freeze(['mp3', 'm4a', 'flac', 'aac', 'ogg', 'wma', 'opus', 'amr', 'awb', 'ac3', 'ec3', 'ac4', 'adts', 'thd', 'mka', 'oga', 'caf', 'alac', 'mia', 'mid', 'midi', 'wav', 'wave']),
  BOOK: Object.freeze(['epub', 'pdf', 'cbz', 'cbr', 'fb2', 'mobi', 'cb7', 'cbt', 'azw3']),
  STREAM: Object.freeze(['m3u', 'm3u8', 'pls', 'xspf', 'fmsbcast']),
  CONTAINER: Object.freeze(['fd-sec', 'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'cab', 'arj', 'lzh', 'iso', 'dmg', 'img', 'vhd', 'vdi', 'qcow2', 'vmdk']),
  DOCUMENT: Object.freeze(['doc', 'docx', 'rtf', 'odt', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp', 'txt', 'md', 'json', 'xml', 'csv', 'tsv', 'yaml', 'yml', 'toml', 'ini', 'conf', 'html', 'htm']),
});

const byExtension = new Map();
for (const [category, extensions] of Object.entries(extensionTable)) {
  for (const extension of extensions) byExtension.set(extension, category);
}

const temporarySuffixes = ['.temp_copy', '.download'];
const junkNames = new Set(['thumbs.db', 'desktop.ini']);

// Rule 3: trailing dots and spaces and the temporary suffixes go before the extension is read.
function cleanName(name) {
  let value = String(name).toLowerCase();
  let changed = true;
  while (changed) {
    changed = false;
    const trimmed = value.replace(/[. ]+$/u, '');
    if (trimmed !== value) { value = trimmed; changed = true; }
    for (const suffix of temporarySuffixes) {
      if (value.endsWith(suffix)) { value = value.slice(0, -suffix.length); changed = true; }
    }
  }
  return value;
}

export function classify(name) {
  const value = cleanName(name);
  const dot = value.lastIndexOf('.');
  if (dot < 0) return 'UNKNOWN';
  return byExtension.get(value.slice(dot + 1)) ?? 'UNKNOWN';
}

// Rule 5, browser profile: dot-files, temporary files and OS database files never reach browsing.
export function isExcluded(name) {
  const value = String(name).toLowerCase();
  if (value.startsWith('.')) return true;
  if (junkNames.has(value)) return true;
  if (value.endsWith('.tmp') || value.endsWith('.swp')) return true;
  return /\.~[^/]*$/u.test(value);
}
