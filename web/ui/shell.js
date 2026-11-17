import { choiceGroup, commandButton, element, exchangeMark, glyph } from './components.js';

// Builds one complete frame of the page from the state the app layer hands over. The caller
// replaces the old frame in one step, so a page is never shown half populated.

// The help button (CONTEXT-HELP rule 2) stands at the reading-start side of the trailing group,
// so every control already in the corner keeps its place.
function header({ title, leading = [], trailing = [], strings, actions }) {
  const help = commandButton({ id: 'app.help', label: strings.help, glyphMeaning: 'app.help', iconOnly: true, onActivate: actions.openHelp });
  return element('header', { class: 'app-header' }, [
    ...leading,
    element('h1', { class: 'app-title', id: 'page-title', text: title }),
    element('div', { class: 'header-end' }, [help, ...trailing]),
  ]);
}

function settingsButton(strings, actions) {
  return commandButton({ id: 'app.settings', label: strings.settings, glyphMeaning: 'app.settings', iconOnly: true, onActivate: actions.openSettings });
}

function entry({ route, glyphMeaning, title, hint, surfaceId }) {
  const hintId = `${surfaceId}-hint`;
  return element('li', {}, [
    element('a', { class: 'entry', href: route, 'data-surface': surfaceId, 'aria-describedby': hintId }, [
      glyph(glyphMeaning),
      element('span', { class: 'entry-text' }, [
        element('span', { class: 'entry-title', text: title }),
        element('span', { class: 'entry-hint', id: hintId, text: hint }),
      ]),
      element('span', { class: 'entry-chevron' }, [glyph('nav.go-to')]),
    ]),
  ]);
}

function startView(strings, actions) {
  return [
    header({ title: strings.appName, trailing: [settingsButton(strings, actions)], strings, actions }),
    element('main', { class: 'app-main', id: 'main', 'aria-labelledby': 'start-title' }, [
      element('h2', { class: 'page-heading', id: 'start-title', text: strings.startTitle }),
      element('ul', { class: 'entries' }, [
        entry({ route: '#/local', glyphMeaning: 'content.folder', title: strings.localFiles, hint: strings.localFilesHint, surfaceId: 'local' }),
        entry({ route: '#/exchange', glyphMeaning: 'source.exchange-server', title: strings.exchangeAccount, hint: strings.exchangeAccountHint, surfaceId: 'exchange' }),
      ]),
    ]),
  ];
}

// The exchange account screen is where an account on the server is added, signed in to and
// managed, and the administration screen manages the server itself, so the server's mark stands
// beside both titles (EXCHANGE-MARK rule 8a). The administration entry sits on the exchange screen,
// not on the start screen: the operator's stream belongs to no account (REMOTE-ADMIN).
function workView(surface, scale, strings, actions) {
  const onServer = surface.id === 'exchange' || surface.id === 'admin';
  return [
    header({
      title: strings[surface.titleKey],
      leading: [
        commandButton({ id: 'nav.back', label: strings.back, glyphMeaning: 'nav.back', iconOnly: true, onActivate: surface.id === 'admin' ? actions.goExchange : actions.goStart }),
        onServer ? exchangeMark({ size: 24, scale, label: strings.exchangeServer }) : null,
      ],
      trailing: [settingsButton(strings, actions)],
      strings,
      actions,
    }),
    element('main', { class: 'app-main work-area', id: 'main', 'data-surface': surface.id, 'aria-labelledby': 'page-title' }, surface.id === 'exchange' ? [
      element('ul', { class: 'entries' }, [
        entry({ route: '#/admin', glyphMeaning: 'source.exchange-server', title: strings.serverAdministration, hint: strings.serverAdministrationHint, surfaceId: 'admin' }),
      ]),
    ] : []),
  ];
}

function generalPage(strings, preferences, languageNames, sizeOptions, actions) {
  return [
    choiceGroup({
      id: 'theme',
      legend: strings.theme,
      glyphMeaning: 'app.theme',
      hint: strings.themeHint,
      value: preferences.theme,
      options: [
        { value: 'system', label: strings.system },
        { value: 'light', label: strings.light },
        { value: 'dark', label: strings.dark },
      ],
      onChange: actions.setTheme,
    }),
    choiceGroup({
      id: 'language',
      legend: strings.language,
      glyphMeaning: 'app.language',
      value: preferences.language,
      options: Object.entries(languageNames).map(([code, name]) => ({ value: code, label: name, lang: code })),
      onChange: actions.setLanguage,
    }),
    choiceGroup({
      id: 'input-profile',
      legend: strings.inputProfile,
      hint: strings.inputProfileHint,
      value: preferences.inputProfile,
      options: [
        { value: 'touch', label: strings.touch },
        { value: 'pointer', label: strings.pointer },
      ],
      onChange: actions.setInputProfile,
    }),
    choiceGroup({
      id: 'size',
      legend: strings.interfaceSize,
      value: String(preferences.size),
      options: sizeOptions.map(({ value, key }) => ({ value: String(value), label: strings[key] })),
      onChange: (value) => actions.setSize(Number(value)),
    }),
  ];
}

function aboutBlock(id, title, children) {
  return element('section', { class: 'about-block', 'aria-labelledby': id }, [
    element('h3', { class: 'block-heading', id, text: title }),
    ...children,
  ]);
}

// The status line is a live region that exists before the person acts, so its change is announced.
function diagnosticBlock(strings, note, actions) {
  return aboutBlock('about-diagnostic', strings.diagnosticReport, [
    element('p', { text: strings.diagnosticIntro }),
    element('div', { class: 'about-actions' }, [
      commandButton({ id: 'about.diagnostic', label: strings.diagnosticSave, rank: 'secondary', onActivate: actions.saveDiagnosticReport }),
    ]),
    element('p', { class: 'diagnostic-status', id: 'about-diagnostic-status', role: 'status', text: note }),
  ]);
}

function aboutPage(strings, diagnosticNote, actions) {
  console.debug("S0037: about related programs list rendered")
  return [
    element('p', { class: 'about-description' }, [
      element('strong', { text: strings.appName }),
      document.createTextNode(` - ${strings.aboutDescription}`),
    ]),
    aboutBlock('about-license', strings.license, [element('p', { text: strings.licenseText })]),
    aboutBlock('about-privacy', strings.privacy, [element('p', { text: strings.privacyText })]),
    diagnosticBlock(strings, diagnosticNote, actions),
    aboutBlock('about-related', strings.relatedProducts, [
      element('ul', { class: 'plain-list' }, [
        element('li', { text: strings.relatedAndroid }),
        element('li', { text: strings.relatedWindows }),
      ]),
    ]),
  ];
}

function settingsView(state, strings, actions) {
  const { surface, destinations, preferences, languageNames, sizeOptions, drawerOpen, diagnosticNote = '' } = state;
  const rail = element('nav', {
    class: `settings-rail${drawerOpen ? ' is-open' : ''}`,
    id: 'settings-rail',
    'aria-label': strings.menu,
  }, [
    element('ul', { class: 'rail-list' }, destinations.map((destination) => element('li', {}, [
      element('a', {
        class: 'rail-item',
        href: destination.route,
        'data-surface': destination.id,
        'aria-current': destination.id === surface.id ? 'page' : null,
      }, [glyph(destination.glyph), element('span', { text: strings[destination.titleKey] })]),
    ]))),
  ]);
  const page = surface.id === 'settings.about'
    ? aboutPage(strings, diagnosticNote, actions)
    : generalPage(strings, preferences, languageNames, sizeOptions, actions);
  return [
    header({
      title: strings.settings,
      leading: [
        commandButton({ id: 'nav.back', label: strings.back, glyphMeaning: 'nav.back', iconOnly: true, onActivate: actions.closeSettings }),
        commandButton({
          id: 'nav.menu',
          label: strings.menu,
          glyphMeaning: 'nav.menu',
          iconOnly: true,
          onActivate: actions.toggleDrawer,
          attributes: { class: 'command command-ordinary command-icon drawer-toggle', 'aria-expanded': drawerOpen ? 'true' : 'false', 'aria-controls': 'settings-rail' },
        }),
      ],
      strings,
      actions,
    }),
    element('div', { class: 'settings' }, [
      rail,
      element('main', { class: 'settings-page', id: 'main', 'data-surface': surface.id, 'aria-labelledby': 'settings-page-title' }, [
        element('h2', { class: 'page-heading', id: 'settings-page-title', text: strings[surface.titleKey] }),
        ...page,
      ]),
    ]),
  ];
}

export function buildFrame(state, strings, actions) {
  if (state.surface.kind === 'settings') return settingsView(state, strings, actions);
  if (state.surface.id === 'start') return startView(strings, actions);
  return workView(state.surface, state.preferences.size, strings, actions);
}
