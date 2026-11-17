// The surface registry: every screen of the page with its route, its title string and its help
// topic (CONTEXT-HELP). The router reads it for titles; the help of S0031 resolves topics from it.

export const surfaces = Object.freeze([
  Object.freeze({ id: 'start', route: '#/', kind: 'work', titleKey: 'startTitle', helpTopic: 'start' }),
  Object.freeze({ id: 'local', route: '#/local', kind: 'work', titleKey: 'localFiles', helpTopic: 'local-files' }),
  Object.freeze({ id: 'exchange', route: '#/exchange', kind: 'work', titleKey: 'exchangeAccount', helpTopic: 'exchange-account' }),
  Object.freeze({ id: 'admin', route: '#/admin', kind: 'work', titleKey: 'serverAdministration', helpTopic: 'server-administration' }),
  Object.freeze({ id: 'settings.general', route: '#/settings/general', kind: 'settings', titleKey: 'general', helpTopic: 'settings-general', glyph: 'app.settings' }),
  Object.freeze({ id: 'settings.about', route: '#/settings/about', kind: 'settings', titleKey: 'about', helpTopic: 'settings-about', glyph: 'app.info' }),
]);

export const settingsDestinations = Object.freeze(surfaces.filter((surface) => surface.kind === 'settings'));

export function surfaceForRoute(hash) {
  const route = hash === '' || hash === '#' ? '#/' : hash;
  return surfaces.find((surface) => surface.route === route) ?? null;
}

// The administration link of REMOTE-ADMIN `administration-link`: `https://<x>/#admin` opens the operator
// sign-in. The fragment sits on this page's own address, so `<x>` is always the origin the page came from.
// Returns the route that replaces the link's fragment, or null for any other fragment.
export function entryRouteForFragment(hash) {
  return hash === '#admin' ? surfaceById('admin').route : null;
}

export function surfaceById(id) {
  return surfaces.find((surface) => surface.id === id) ?? null;
}
