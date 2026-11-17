import { log } from './log.js';

// Reads the help map (CONTEXT-HELP rule 17) that ships beside the page, so the resolver and the
// gate page read the same file. A map that cannot be read leaves the help closed, never the page.
const mapUrl = new URL('../help/help-map.json', import.meta.url);

export async function loadHelpMap() {
  try {
    const response = await fetch(mapUrl);
    if (!response.ok) {
      log.warn(`help map not read: status ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (failure) {
    log.warn(`help map not read: ${failure.message}`);
    return null;
  }
}
