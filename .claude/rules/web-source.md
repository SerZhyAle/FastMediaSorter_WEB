---
paths:
  - "web/**"
  - "tests/**"
---

# Browser source - working rules

Loads with any file under `web/` or `tests/`. The empty-catch, console, colour, unfinished-code, long-dash, unsafe-HTML, upward-import, size-ceiling (1500 lines) and release probe rules below are gated by `tools/web-hygiene.py`; locale parity by `tools/locale-parity.py`; both run from `tools/post-change.ps1`. A rule with no gate is a discipline you apply by reading your own diff. A fixed colour over a self-painting surface carries the comment `fixed-colour: <why>` on its line or the line above.

## Code hygiene

- Layers: `web/ui/` (DOM only, no logic) -> `web/app/` (use cases, state) -> `web/data/` (network, IndexedDB, File System Access, WebCrypto). An import never points upward.
- One module, one job; past the size ceiling extract a helper module instead of routing around the limit, and end smaller than you started.
- Fix a defect in the shared component it comes from, after grepping for every host that uses it, never in the one host that was reported.
- No empty or broad `catch {}` / `.catch(() => {})`: recover, return a safe default, or log at the right level.
- Logging goes through one logging module. `console.error` is for programming errors the developer must act on; an expected fallback, a user cancel, an offline network or a server's 4xx/5xx/timeout is `info`/`warn` and a friendly localized message - never a raw "HTTP 503 GET url" on screen and never the red error surface.
- `console.debug` appears only in the probe form (`.claude/rules/spec-catalog.md`). A permanent log line never contains `Sxxxx`.
- Colours live as tokens in one stylesheet's `:root` and are redefined for dark mode there; no hex, `rgb()` or `hsl()` elsewhere and none in `style=`. Controls over a surface that paints its own colour (a canvas, a fullscreen video) use a fixed colour tracking that surface, with a comment saying why.
- No `TODO`, `FIXME` or not-implemented throw in shipped code; no typographic long dash in code; no `eval`, no `new Function`, no `innerHTML` with a non-literal, no `<script src="http..">`. Dependencies are vendored under `web/vendor/`.
- Comments: English, WHY not WHAT, only for a non-obvious invariant, edge case or workaround. A glob like `web/**/*.js` inside a block comment closes it early.
- Delete dead code, dead assets, dead keys and dead configuration in the same change, even at zero byte saving. Before deleting an unreferenced key, asset or class, grep `PLAN/` for a ticket below `Implemented` that still owns it.
- Before claiming a constant or flag gates behaviour, grep its read sites. Never infer what a control does from the condition that shows it: open its handler.
- When a library's exact behaviour decides a change, read the pinned copy under `web/vendor/`, not the docs of another version.
- Before claiming "the browser exposes X", run it in a smoke page and name the engine floor. Between releases record the browser run as `RELEASE` unless the owner names that run. Existence of an API proves nothing about runtime validation; only the real gesture does.

## Irreversible changes

- An IndexedDB schema change (version, stores, indexes) and anything touching the device's non-extractable key is the one irreversible class: prove that a database written by the previous version upgrades, not only that the page loads. Never baseline a caught migration defect.
- Clearing site data equals losing the device; say so wherever the person can trigger it.
- Every tracked file under a served root is public. Serve `web/` alone, never the repository root; `PLAN/`, `docs/`, `temp/` and `tools/` stay outside it.

## What the person sees

- The screen must never claim more than is delivered. A defect where the page shows the wrong thing is closed by restoring the capability or by saying so on the page, next to the wrong thing, in the person's words - not by a console line or a doc sentence.
- A setting whose label promises X while any path still does X is a defect: gate every entry point. Before adding a toggle, check whether an existing setting already governs the capability.
- A caption's value stays beside its caption: size the label column to the longest caption, never right-align a value to the row or screen edge.
- Buttons are sized to their content, never stretched across a wide viewport; action pairs sit end-aligned and wrap.
- A shrinking card scales its lines inside a band and keeps the data format constant; never hide a secondary line by size.
- "Resource" is a registered entity (an address, a destination); "folder" is a real directory. Never swap them in a string or an icon.
- When a change narrows what a list shows, rewrite its empty-state text in EN/RU/UK in the same edit, including why rows vanished.
- Third-party favicons or logos shown beside that producer's own content are not a licensing blocker.
- Default to a keyless, free endpoint behind a one-interface seam; never plan around a paid tier or a registered key. Any third-party call from the page needs an explicit owner decision.
- Every page carries its real build stamp in the About view and the diagnostic report.
- A date or time on screen is in the person's time zone: their explicit preference, otherwise the browser's. Europe/Malta is for development records only.

## Locales

- EN/RU/UK in the same edit as the interface. Judge how much of a page is localized from the page rendered in two locales, never from markup or a pixel-diff figure.
- `grep -i` and the Grep tool do not fold Cyrillic case: spell the first letter as a class (`[Тт]рансл`) or search from PowerShell.
- Verify RU/UK text on disk with Read or Grep, never from console output (the Bash-to-pwsh echo is cp866 mojibake even when the file is right). Author Cyrillic with the Write tool.
- A mirror check (same keys in three files) proves agreement, not validity: after a bulk write, prove each file parses and renders.
- Broadcast wording comes from the `DEVICE-EXCHANGE` vocabulary: watching a channel is «трансляция» / «трансляція», this device sending is «вещание» / «мовлення».

## Testing and evidence

- Between releases use measured checks of at most 5 s and a direct call of the changed behaviour; record each skipped browser run as `RELEASE` with its command.
- A smoke page's PASS must prove it judged something: count executed assertions against the declared count; zero executed is "could not verify", never PASS.
- A tool's exit code is not its verdict: read the `SMOKE: PASS|FAIL` line and the error lines. Never write a Done Criterion as "exits 0".
- Bound the wait, not only the work: a headless browser run gets a wall-clock ceiling, and expiry is "could not verify", distinct from FAIL.
- Before diagnosing "the fix does not work", prove the browser runs the new code: the served version, a probe line, no stale Service Worker or HTTP cache.
- A bounds check proves placement, not visibility: for a visual fix, capture the frame in the theme the complaint came from, light and dark.
- Enumerate the variants a screen change can touch - media kind, list or grid, empty or populated, narrow or wide viewport, each engine in the support floor - and open every one.
- A test that feeds events straight into a component proves nothing about a host that intercepts input first: trace each host's event path.
- When a check returns the same result after a fix, look for the footprint the fix should leave (a DOM node, a probe line, a symbol in the served file) before concluding the fix is wrong.
- Record the engine per acceptance criterion: a zero-probe run in an engine without the API reads UNOBSERVED, not FAIL.
- Before judging an animation from an automated run, read the rig: `prefers-reduced-motion`, the virtual-time budget.
- The owner's DPI-scaled Chrome reports a wider `innerWidth` than requested: check exact CSS widths through a same-origin iframe of that width and script its `contentDocument`.
- Contrast and target-size checks are measured, not claimed: Python Playwright under `py -3` with `channel="chrome"`; Chrome returns `color-mix()` as `color(srgb ..)`; `has_touch=True` is what makes `(pointer: coarse)` match.
- Public captures (help, site, README, demo) never come from the owner's test corpus unchecked: it holds private and copyrighted material. Pick files by name, prefer the owner's own photography and public-domain media, read every capture before using it.
