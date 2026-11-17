# Unified browser UI - profile and migration plan

**Recorded:** 2026-10-19. **Tickets:** S0032 (UI implementation and acceptance), S0033 (contract synchronization).
**Migration deadline:** 2026-11-30, or before the first release, whichever comes first.
This is an engineering target, not authorization to release or a claim of conformance.

## Actual inventory

The audit of 2026-10-19 found no `web/` source tree, application entry page, settings page, command system,
preference store, viewer, exchange client, help corpus or official product site in this repository. Re-read
2026-11-14 (S0033): `web/` holds the shell, the local slice, the operator surface and the help layer, none of it
rendered or measured in a browser yet; the rows below name what exists and what is still missing.
The pages under `tests/` are test instruments, not an application settings surface. No installed user data needs
migration yet. Absence establishes work to do; it does not exempt the application from mandatory UI contracts.

| Surface / component | Current result | Implementation owner | Acceptance retained by |
| --- | --- | --- | --- |
| Shared size resolver, semantic colors and vector glyphs | Source in `web/styles/`, `web/vendor/icon-set/` (2026-11-12) | S0028 | S0032 |
| Shared command renderer, wrapping rows, menu and safe confirmation | Command renderer and wrapping rows in `web/ui/components.js`; menu and safe confirmation arrive with their first consumer | S0028 | S0032 |
| Preference checkbox and independent local help | Source in `web/ui/components.js`, exercised by `tests/shell.html` | S0028 | S0032 |
| Topic disclosure, retained values/focus and viewport context | Disclosure in `web/ui/components.js`; persisted group state arrives with the first multi-topic page | S0028 | S0032 |
| Main settings, optional advanced page and final About | General and About in `web/ui/shell.js`; no advanced page (nothing to put on it) | S0028 | S0032 |
| Local browser/viewer, sort destinations, player and slideshow | Source in `web/ui/local-view.js`, `viewer-pane.js`, `destinations-panel.js`, `player-pane.js` and `slideshow-bar.js` (2026-11-12, 2026-11-13); direct calls only, no rendered run | S0023-S0027 | Feature ticket plus S0032 shared-control checks |
| Account, devices/clipboard, diagnosis and operator administration | Operator administration and its `#admin` entry in `web/ui/admin-view.js` (2026-11-13); account, devices/clipboard and diagnosis missing | S0012-S0014, S0029, S0034 | Feature ticket plus S0032 shared-control checks |
| Help entry, map, page corpus, screenshots and locale checks | Help button, F1, layer and map in `web/ui/help-layer.js`, `web/app/help.js`, `web/help/help-map.json` (2026-11-12); page corpus and screenshots not built (no surface uses the page form) | S0031 with surface registry from S0028 | S0031 plus S0032 F1/button reachability |
| Official product site and public resource addresses | Undecided | S0021, S0022 | Owner decision, then applicable site checks |
| Native Windows dialogs, title bars and per-monitor process behavior | Not applicable | Browser/OS owns these | No native WINDOWS-UI claim |

The feature matrix remains the scope authority. No new page is owed merely to fill this table.
Shared components are implemented once in S0028 and exercised by their consumers, rather than rebuilt
inside S0032. S0032 remains open until the actual shared implementation and its acceptance evidence exist.

## Product profile

These are product design choices within the allowed contract variants, not expiring exemptions.
They specify a target for implementation; unmeasured compact targets must not be exposed to users.

- **Input profile:** select pointer/keyboard only when the initial capability query clearly identifies it;
  otherwise select touch. Offer explicit selection on the first settings page. Keep the choice stable
  during a pointer interaction and across mouse/touch events. Apply an explicit change after activation ends.
- **Size range:** compact 0.875, ordinary 1, comfortable 1.25, large 1.5 and very large 2.
  Ordinary targets are 32 CSS px for pointer and 48 CSS px for touch. Declared compact target minima
  are 28 by 28 CSS px for pointer and 42 by 42 CSS px for touch, subject to measured acceptance before exposure.
  Text wrapping may increase height. No invisible target extensions may overlap neighboring controls.
- **Composition:** multiply shared component geometry by interface scale once. Independent text enlargement
  changes text and natural layout; companion glyphs remain at the chosen interface tier rather than
  multiplying by text scale. Browser zoom is owned by the browser and must not be multiplied a second time.
  Explicit profile/scale changes invalidate old text-height measurements and remeasure at final width
  (UI-SIZING section 5). Unknown saved values fall back to ordinary size and a safe input profile.
- **Palette:** one semantic light/dark palette for text, muted text, surfaces, control faces, borders,
  accent/ink, danger/ink, group headers, focus and selected states. System high contrast overrides colors.
  Keep visible focus, checked/expanded markers and a current-page cue independent of hue.
- **Commands:** content-fit rectangles, shared padding/glyph/gap/radius tokens from BUTTONS, logical
  start alignment and whole-button wrapping. Equalize heights per actual visual row after reflow.
  Reserve widest known busy/state caption. First implementation keeps all commands visible and wraps;
  no secondary overflow policy is selected. At most one primary action per task surface.
- **Confirmation:** Cancel first, action last, neutral dismissal and destructive acting rank where needed.
  The safe answer receives initial/default focus; Escape and outside dismissal do nothing. Empty actions
  have no destructive confirmation. One command id binds every enabled invocation route.
- **Boolean rows:** native checkbox at reading start, associated heading/glyph label, explanation below;
  help outside the label. Only checkbox/heading/glyph activate. A recognized scroll cancels pending
  activation. Space, disabled state and screen-reader semantics use the same value path.
- **Groups:** a single-topic settings page has no wrapper. Multiple genuine topics may open independently;
  groups are not packed in the first shell, to keep order and anchors simple. General controls start visible;
  optional advanced detail starts collapsed. A distinct header uses the current-state triangle at start.
  Restore values, focus and stable-id anchor/offset context without firing edit handlers.
- **Settings navigation:** one start-side rail, monochrome canonical glyphs throughout, no grandchildren.
  No empty advanced destination. The first page contains theme, language and essential settings; About is last.
  Below 48 rem, switch the same menu into a start-side drawer rather than creating another destination list.
  Test final-fit behavior at large text and revise the breakpoint if measurements require it.
  Recorded breakpoint (S0028, 2026-11-12): `max-width: 48rem` in `web/styles/shell.css`; the drawer opens from
  the `nav.menu` command in the settings header, Escape closes it first and the settings second.
- **Commit model:** reversible preferences apply live and persist per value. Navigation, restoration,
  expansion, focus and diagnostics never change unrelated settings or execute destructive operations.
  Irreversible operations have dedicated buttons and explicit confirmations.
- **Locales:** EN/RU/UK, endonym language selector and no flags. RTL is not shipped; use logical layout
  properties now, and record RTL as not covered rather than presenting synthetic RTL as a shipped locale.
- **Help:** S0028 produces the authoritative surface registry; S0031 consumes it. F1 and the trailing
  app.help button use one resolver. Local option help cannot toggle the option or replace surface help.

## About resource inventory

Keep one authoritative resource inventory in S0028, with localized labels, purpose, origin and availability.
The table below is the migration inventory, not a set of invented public URLs or inoperative UI links.

| Required resource | Present authority / missing input | Carrier |
| --- | --- | --- |
| Concise description | README product purpose; display name "FastMediaSorter for Web" (owner, 2026-11-10) | S0021, S0028 |
| Running version | No release metadata/version shape yet; derive mechanically at packaging | S0020 |
| License | Root MIT LICENSE | S0028 |
| Privacy page and permission inventory | Must describe actual runtime data paths and origin handling | S0028, S0020 |
| Help/documentation | Localized local help corpus not implemented | S0031 |
| Official product site or portal | Owner decision pending; no address inferred from a sibling | S0022 |
| Support/contact | Owner-selected official route required; no automatic messages or uploads | S0022 |
| Diagnostic export | Delivered 2026-11-12: About block, `web/app/diagnostic-report.js`. User action only, allowlisted fields, redaction and inspectable local download (a stored ZIP, DIAGNOSTIC-REPORT 0.15); the build stamp reads `unavailable` until S0020 writes the release metadata | S0048 |
| Download/update information | Serving/package shape and real release metadata | S0020 |
| Repository access page | Remote `SerZhyAle/FastMediaSorter_WEB`, public (owner, 2026-11-10); not created until the owner asks for the push, so no link is shown yet | S0021 |
| Necessary resource index | Local help, license/privacy, notices and actual vendored dependencies | S0028, S0031 |
| Related products | FMS_A and FMS_Win purposes are recorded in CLAUDE.md; official destinations need verification | S0022, S0028 |

An unresolved required resource blocks full SETTINGS-NAVIGATION conformance. It is not waived by a disabled
placeholder. Reading About sends no network request; every external navigation requires an explicit click.

## Ordered milestones and coverage

No milestone consumes an artifact assigned to a later one. Dates are planned completion targets;
missing evidence keeps the corresponding milestone open, with no automatic adoption-version advancement.
Existing release package assignments remain unchanged by this plan.

| Milestone / target | Produces | Consumes | Owner / static exit predicate |
| --- | --- | --- | --- |
| M0 / 2026-10-19 | Current targets, applicability, proposal decisions, profile and migration record | Current catalog; existing specs and tree | S0033/S0032: contract inventory and document gates exit 0; registry contains this product's due date |
| M1 / 2026-10-26 | Shared style/size resolver, commands, boolean/group primitives, settings shell and surface registry | M0; static-stack decision S0003 | S0028 with S0032: source modules and EN/RU/UK inventories exist; focused browser checks exit 0 |
| M2 / 2026-11-09 | Feature consumers, complete settings inventory, safe command/dialog paths and help links | M1 components/registry; accepted feature contracts | S0012-S0014, S0023-S0027, S0029/S0034/S0031: source and help maps resolve; focused suites exit 0 |
| M3 / 2026-11-16 | Complete About resources, diagnostic export and real version metadata | M1; decisions S0021/S0022; packaging metadata from S0020 | S0028/S0031/S0020: resource validation and redaction checks exit 0; no missing mandatory entry |
| M4 / 2026-11-30 | Actual rendered/input/accessibility, geometry, contrast, timing and browser-floor evidence | M1-M3 delivered implementation | S0032: every applicable acceptance row has fresh PASS or justified catalog exception; no open manual item under Verified |

Coverage: S0032 outcomes 1 and 8 map to M0 and this record; outcomes 2-6 map to M1-M3;
outcome 7 maps to M1 architecture and M4 measurement. Its evidence/acceptance bullets map to M4,
document/pointer changes and the resource inventory. Shared-contract boundary changes require catalog-first
proposals; permanent variants above remain within current contract options. Unknown future functionality
does not authorize a second protocol or a change to native products.

## Reproducible acceptance to retain

Capture the actual components and main/advanced/About destinations at narrow/wide widths, smallest/ordinary/
largest sizes, independent 200% text enlargement, EN/RU/UK, light/dark/system and supported high contrast.
Record browser/device/OS/build, viewport, zoom, locale, profile and size for each artifact. Include intermediate
vector sizes. Test ordinary and compact dimensions separately and measure actual text/glyph contrast against
normal/hover/pressed/selected surfaces. No screenshots or measurements exist yet.

Drive pointer/keyboard and deliberate touch/scroll sequences: label/glyph toggles once; background/help
does not; disabled paths stay inert; a scroll cancels activation; help is hoverable, dismissible and
returns focus; groups preserve values, viewport and focused descendants; safe dialogs cancel by default;
navigation neither commits nor executes operations; stale async results cannot replace the current page.
Use real accessibility-tree names/states and focus traversal, not screenshot similarity alone.

For each baseline destination record at least 20 independent first visits and 20 warm transitions,
activation through complete usable frame, raw samples, nearest-rank p95 and maximum. Budgets are first
visit p95 below 500 ms and warm p95 below 150 ms. Report every outlier and fail repeatable delays even
when aggregate p95 passes. Frame/trace evidence must establish no partially populated intermediate frames.
Exercise the declared browser floor and name untested configurations; Chromium alone is insufficient.

## Counterpart screens in FMS_A and FMS_Win

`FUNCTION-PARITY` rule 6: each product names, per screen, the counterpart screen in the other products. One row per
surface id of `web/app/surfaces.js`; source paths are repository-relative in each program (read-only, 2026-11-14,
S0055). FMS_A paths are under `app_v2/src/main/` (`java/com/sza/fastmediasorter/` shortened to `ui/..`); FMS_Win
paths are under `src/`, `SM/` being `src/FastMediaSorterCompanion/`. The watch app of FMS_A has no counterpart of these
screens: a browser never runs on the watch (`docs/FEATURE_MATRIX.md`, rows 15, 134, 167).

| Surface id | FMS_A counterpart | FMS_Win counterpart | Differences (deviation to fix / declared exception) |
|---|---|---|---|
| `start` | `ui/main/MainActivity.kt`, `res/layout/activity_main.xml` (the resource list with its top bar) | `Main_Form.vb` (viewer) and `SM/Forms/MainWindow.vb` (Share Manager); first run `Welcome/Welcome_Form.vb:23` | Declared exception: FMS_Web opens on a two-entry chooser (files on this device, exchange account), the programs on their resource list - the browser's first release has no resource list of its own. Declared exception (S0060, 2026-11-14): header order Help then Settings (`web/ui/shell.js`) against FMS_A's top bar, where `btnSettings` (`activity_main.xml:190`) precedes `btnFavorites` and `btnHelp` (`:272`), which stands on the reading-start side of the trailing Start Player. `IN-APP-HELP` rule 2 puts Help on the reading-start side of the trailing group; FMS_Web's trailing group is Settings alone because its start screen has no Favorites or Start Player, so both programs obey the same rule and the orders differ only by what trails. |
| `local` | `ui/main/MainActivity.kt` browse list; the player family `ui/player/` (`PhotoVideoStandaloneActivity.kt`, `SlideshowSettingsDialogFragment.kt`) | `Main_Form.vb` with `Main_Form.Slideshow.vb`, `Main_Form.VideoPlayer.vb`, `Main_Form.AudioView.vb`; the grid `Image_Panel_Form.vb`, `Image_Panel_Form.Grid.vb` | Declared exception: the folder is opened through the browser's picker, read-only outside Chromium; the destinations panel is Chromium-only and elsewhere visible and disabled with the reason (`FEATURE_MATRIX.md` fact 1). Keys and behaviour follow `INPUT-PARITY` `VIEWER-KEYBOARD` and `MEDIA-VIEWER`; their deviations are recorded in this product's registry rows, not here. |
| `exchange` | `ui/exchange/MyDevicesActivity.kt` (My devices), `ui/exchange/ExchangeSignInActivity.kt` (`res/layout/dialog_exchange_sign_in.xml`), the device list (`dialog_exchange_directory.xml`, `item_exchange_device.xml`, `item_exchange_server_card.xml`, `menu/menu_exchange_server_card.xml`), `ExchangeClipboardActivity.kt` | `Exchange_Devices_Panel.vb:28`, `Exchange_Connect_Form.vb:25`, `Exchange_Password_Change_Form.vb:22`; Share Manager `SM/Forms/Share_Settings_Form.Exchange.vb:30`, `Share_Settings_Form.ExchangeAccount.vb:27`, `Share_Settings_Form.Clipboard.vb:17`, `Exchange_Connection_String_Form.vb` | Deviation to fix: the title - FMS_Web "Exchange account" (`web/app/strings.js` `exchangeAccount`), both programs "My devices" (FMS_A `res/values/strings_exchange.xml:3`, FMS_Win `Localization/Localization.Resources.vb:135`); carrier S0013, whose device view is modelled on FMS_A's My devices screen. The surface holds only the administration entry today; its sign-in, device, clipboard and broadcast controls follow the FMS_A order (address, login, password with the pairing-code toggle, then Sign in; `strings_exchange.xml:17-23`) when built. |
| `admin` | `ui/exchange/ExchangeServerAdminActivity.kt`, `res/layout/activity_exchange_server_admin.xml` (and `-land`) | `SM/Forms/Exchange_Admin_Browser_Form.vb:16`, `Exchange_Account_Admin_Form.vb`, `Exchange_Account_Limits_Form.vb`, `Exchange_Invitation_Create_Form.vb`, `Exchange_Admin_Audit_Form.vb`, `Share_Settings_Form.ExchangeAdmin.vb:27`, `Share_Settings_Form.ExchangeRemoteAdmin.vb:16` | Fixed (S0060, 2026-11-14): the title is "Manage server" (`strings.js` `serverAdministration`; RU "Управление сервером", UK "Керування сервером") as in FMS_A (`strings_exchange.xml:295`). FMS_Win's wording differs again, "Exchange server administration" (`FastMediaSorterCompanion/Localization/Localization.RemoteAdmin.vb:50`), and `DEVICE-EXCHANGE` item CW does not fix a word for this screen, so the choice follows FMS_A as the dictionary owner (item CV); the disagreement between the two programs is the dictionary owner's to settle. Fixed: a Status block (`adminStatus`) holds the signed-in line and Sign out, as FMS_A's first card does (`activity_exchange_server_admin.xml:49-55`), and the blocks run Accounts, Invitations, Shared invitation (`:57-77`), the one-time secret standing directly above the block that made it; the block is named "Shared invitation" as in FMS_A. Declared exceptions: Refresh follows Sign out in the Status block (a page has no pull-to-refresh); FMS_A's Limits block holds the server defaults and the maximum of accounts (`ExchangeServerAdminActivity.kt:160-169`) and FMS_Web has per-account limits only, the server-wide block belonging to F038 (planned, S0030). No difference: the kind words are "Own device or family" and "Guest" in both programs (`strings_exchange.xml:323-324`, FMS_Win `Localization.DeviceVocabulary.vb:33`), the words of `DEVICE-EXCHANGE` item CW. |
| `settings.general` | `ui/settings/SettingsActivity.kt`, `res/layout/activity_settings.xml`; category "General interface settings" (`res/values/strings_settings.xml:23`) | `SM/Forms/MainWindow.Settings.vb` and the `Share_Settings_Form.*.vb` pages (Share Manager); the viewer's settings dialogs `ExpandedSettingsDialogs.vb` with `SettingsCollapsibleGroup.vb` | Declared exception: FMS_Web has two settings destinations against about twenty categories in FMS_A (`strings_settings.xml:12-30`); the others arrive with their planned rows (`FEATURE_MATRIX.md` rows 138-145). Theme, interface language, input method and interface size follow `SETTINGS-NAVIGATION`, `BOOLEAN-OPTION` and `UI-SIZING`. |
| `settings.about` | the "About" category (`strings_settings.xml:12`), `ui/settings/fragments/OpenSourceLicensesFragment.kt` | `SM/Forms/Share_Settings_Form.About.vb:22` | None established. The order description, license, privacy, diagnostic report, related programs follows `SETTINGS-NAVIGATION` 2.1 section 3; the programs' About bodies are compared when S0032 closes the shared-UI acceptance. |

## Review condition and current verdict

Review on M1 completion, any applicable contract change, before first release, and no later than 2026-11-30.
Responsible product: FastMediaSorter Web. No user/data/security impact is introduced by this plan: no runtime,
stored format or shipped surface changes. The compensating behavior is a release gate: no feature/adoption
claim or publication until the owning implementation and acceptance prove it. The catalog migration entry
references this record and deadline. It cannot waive TLS, secret storage, sealing or data-preservation rules.

**Current verdict:** M1 delivered by S0028 (2026-11-12, source under `web/`; a static review against this
profile on 2026-11-12 found no divergence); its rendered acceptance is still absent and runs with the release
browser rungs. S0032 cannot be closed as Implemented or Verified from this document. Its execution blockers
are the About resources carried by S0020, S0021, S0022 and S0031 and the M2 feature consumers; the diagnostic
export of S0048 is delivered (its rendered acceptance runs with the release browser rungs). Its final shared-UI
acceptance stays in S0032.
