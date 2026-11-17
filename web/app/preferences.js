import { readValue, writeValue } from '../data/local-store.js';

const languages = new Set(['en', 'ru', 'uk']);
const themes = new Set(['system', 'light', 'dark']);
const inputProfiles = new Set(['pointer', 'touch']);
// Compact (0.875) is declared in the product profile but stays unexposed until its targets are
// measured (docs/DESIGN_unified-ui.md, UI-SIZING section 2 rule 4).
export const sizeValues = Object.freeze([1, 1.25, 1.5, 2]);
const sizes = new Set(sizeValues);
const workScreens = new Set(['start', 'local', 'exchange']);

const preferencesKey = 'preferences';
const lastScreenKey = 'last-screen';

export function normalizePreferences(saved = {}, pointerOnly = false) {
  const values = saved && typeof saved === 'object' ? saved : {};
  return {
    language: languages.has(values.language) ? values.language : 'en',
    theme: themes.has(values.theme) ? values.theme : 'system',
    inputProfile: inputProfiles.has(values.inputProfile)
      ? values.inputProfile
      : pointerOnly === true ? 'pointer' : 'touch',
    size: sizes.has(values.size) ? values.size : 1,
  };
}

export function resolveTheme(theme, systemIsDark) {
  if (theme === 'dark' || theme === 'light') return theme;
  return systemIsDark === true ? 'dark' : 'light';
}

// The first language of the browser that the page ships, otherwise English.
export function preferredLanguage(browserLanguages = []) {
  for (const tag of browserLanguages) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (languages.has(base)) return base;
  }
  return 'en';
}

export function loadPreferences(pointerOnly, browserLanguages) {
  const saved = readValue(preferencesKey, null);
  const seeded = saved && typeof saved === 'object'
    ? saved
    : { language: preferredLanguage(browserLanguages) };
  return normalizePreferences(seeded, pointerOnly);
}

// Each reversible preference applies live and persists per value (APP-SETTINGS commit model).
export function savePreferences(preferences) {
  return writeValue(preferencesKey, normalizePreferences(preferences, preferences.inputProfile === 'pointer'));
}

export function loadLastScreen() {
  const saved = readValue(lastScreenKey, 'start');
  return workScreens.has(saved) ? saved : 'start';
}

export function saveLastScreen(screen) {
  if (workScreens.has(screen)) writeValue(lastScreenKey, screen);
}
