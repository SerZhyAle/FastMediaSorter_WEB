// What this browser tells the page about itself, read once for the diagnostic report. Plain values
// only: every field is a fact the report's allowlist names (app/diagnostic-report.js). Nothing here
// reads a file, a folder, a destination, a stored value or an account. A fact the browser does not
// give is null, never a guess. Presence of an API is reported as presence: it proves nothing about
// what the API does when called.

const buildPattern = /^[A-Za-z0-9._+-]{1,64}$/;

// The build stamp is written into the served page at packaging (a `<meta name="fms-build">` tag);
// the page carries none until then.
function buildStamp(doc) {
  const content = doc.querySelector('meta[name="fms-build"]')?.getAttribute('content')?.trim();
  return content && buildPattern.test(content) ? content : null;
}

async function storagePersisted(nav) {
  try {
    if (typeof nav.storage?.persisted !== 'function') return null;
    return await nav.storage.persisted();
  } catch {
    return null;
  }
}

function brands(nav) {
  const list = nav.userAgentData?.brands;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((entry) => `${entry.brand} ${entry.version}`).join('; ');
}

export async function readBrowserFacts(win = window) {
  const nav = win.navigator;
  const doc = win.document;
  return {
    userAgent: nav.userAgent ?? null,
    brands: brands(nav),
    platform: nav.userAgentData?.platform || nav.platform || null,
    languages: Array.isArray(nav.languages) ? [...nav.languages] : (nav.language ? [nav.language] : []),
    viewport: `${win.innerWidth}x${win.innerHeight}`,
    devicePixelRatio: win.devicePixelRatio ?? null,
    online: typeof nav.onLine === 'boolean' ? nav.onLine : null,
    secureContext: typeof win.isSecureContext === 'boolean' ? win.isSecureContext : null,
    storagePersisted: await storagePersisted(nav),
    apis: {
      directoryPicker: typeof win.showDirectoryPicker === 'function',
      indexedDb: Boolean(win.indexedDB),
      webCrypto: Boolean(win.crypto?.subtle),
      shareFiles: typeof nav.canShare === 'function',
      asyncClipboard: typeof nav.clipboard?.writeText === 'function',
      wakeLock: 'wakeLock' in nav,
      fullScreen: typeof doc.documentElement.requestFullscreen === 'function',
    },
    buildStamp: buildStamp(doc),
  };
}
