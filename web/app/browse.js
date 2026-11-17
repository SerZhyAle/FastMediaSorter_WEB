import { classify, isExcluded } from './media-kind.js';

// Folder listing rules of MEDIA-VIEWER section 1 rule 1 and the navigation arithmetic of rule 2
// and VIEWER-KEYBOARD. Pure functions: the caller owns the state.

export const sortKeys = Object.freeze(['name', 'date', 'size']);
export const kindGroups = Object.freeze(['image', 'video', 'audio', 'other']);

export function kindGroup(category) {
  if (category === 'IMAGE') return 'image';
  if (category === 'VIDEO') return 'video';
  if (category === 'AUDIO') return 'audio';
  return 'other';
}

// Each scanned entry gets its scan position (ties keep it) and its category; excluded names are
// dropped before classification and get none.
export function prepareEntries(entries) {
  return entries
    .filter((entry) => !isExcluded(entry.name))
    .map((entry, order) => ({ ...entry, order, category: entry.isFolder ? null : classify(entry.name) }));
}

function comparator(sortKey, collator) {
  const byName = (a, b) => collator.compare(a.name, b.name);
  if (sortKey === 'date') return (a, b) => a.lastModified - b.lastModified;
  if (sortKey === 'size') return (a, b) => a.size - b.size;
  return byName;
}

// Folders precede files and are always in name order (a picked folder has no reliable folder
// date or size); files follow the chosen key. Array sort is stable, so equal keys keep scan order.
export function arrange(entries, { sortKey = 'name', descending = false, filter = '', kinds = ['image', 'video', 'audio'], locale = 'en' } = {}) {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const needle = filter.trim().toLocaleLowerCase(locale);
  const wanted = new Set(kinds);
  const folders = entries.filter((entry) => entry.isFolder).sort(comparator('name', collator));
  const compare = comparator(sortKeys.includes(sortKey) ? sortKey : 'name', collator);
  const direction = descending ? -1 : 1;
  const files = entries
    .filter((entry) => !entry.isFolder)
    .filter((entry) => wanted.has(kindGroup(entry.category)))
    .filter((entry) => needle === '' || entry.name.toLocaleLowerCase(locale).includes(needle))
    .sort((a, b) => direction * compare(a, b) || a.order - b.order);
  return { folders, files };
}

function clamp(index, count) {
  return Math.min(Math.max(index, 0), count - 1);
}

// Moves within the paging list. Next and previous wrap (as both programs do); the jumps by 10 and
// 100 and first/last stop at the ends.
export function step(index, count, move) {
  if (count <= 0) return -1;
  switch (move) {
    case 'next': return (index + 1) % count;
    case 'previous': return (index - 1 + count) % count;
    case 'first': return 0;
    case 'last': return count - 1;
    case 'forward10': return clamp(index + 10, count);
    case 'back10': return clamp(index - 10, count);
    case 'forward100': return clamp(index + 100, count);
    case 'back100': return clamp(index - 100, count);
    default: return clamp(index, count);
  }
}

// Rule 2: another file than the current one whenever there is another.
export function randomIndex(index, count, random = Math.random) {
  if (count <= 1) return count === 1 ? 0 : -1;
  const pick = Math.floor(random() * (count - 1));
  return pick >= index ? pick + 1 : pick;
}

// Rule 2: 1-based, digits only, within 1..count. Returns the 0-based index or null.
export function parseJump(text, count) {
  const value = String(text).trim();
  if (!/^[0-9]+$/u.test(value)) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > count) return null;
  return number - 1;
}

const units = [['gigabyte', 1024 ** 3], ['megabyte', 1024 ** 2], ['kilobyte', 1024]];

export function formatSize(bytes, locale) {
  for (const [unit, size] of units) {
    if (bytes >= size) {
      return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: 1 }).format(bytes / size);
    }
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'byte', unitDisplay: 'short' }).format(bytes);
}

// The browser's own time zone (web-source rules: the person's zone).
export function formatDate(milliseconds, locale) {
  return new Date(milliseconds).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}
