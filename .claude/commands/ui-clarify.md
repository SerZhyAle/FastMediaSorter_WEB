---
description: "UI decision gate for FastMediaSorter Web: before a user-facing change is designed or built, resolve placement, visibility and fallback per viewport width and per engine of the support floor. Outputs READY with the decisions or BLOCKED with the questions. Triggers: 'ui-clarify', any interface change with an open placement, visibility or fallback choice."
argument-hint: "<interface change, or a ticket id Sxxxx>"
---

# /ui-clarify - settle the interface before building it

Writes no code. Produces one decision table and one of two outcomes. A ticket id in `$ARGUMENTS` is read
from its spec; the decisions are written back into that spec only by the ticket's own pipeline
(`/spec-all`), never by this command.

## Read first

- the request or the ticket spec;
- the surfaces and controls it touches: `web/app/surfaces.js`, the `web/ui/` modules, `web/app/strings.js`,
  the help rows (`web/help/help-map.json`, `web/app/help-text.js`);
- `docs/FEATURE_MATRIX.md` for the function's engine reach, `docs/DESIGN_unified-ui.md` for shared patterns;
- `DEVICE-EXCHANGE` section 25 when the change shows a connection term or a message - those words are the
  programs' words, never invented here.

## The table - four passes

1. **Placement per viewport width.** Narrow phone portrait (about 360 CSS px), phone landscape and small
   tablet (about 768), desktop (1280 and wider). For each: where the control sits (toolbar, overflow menu,
   panel, dialog, settings row), what moves when it does not fit, and which actions outrank it.
2. **Per engine of the support floor** (`CLAUDE.md` section 3): Chromium (Chrome, Edge, Samsung Internet),
   WebKit (Safari macOS, Safari iOS and iPadOS), Gecko (Firefox, current and ESR). For each: does the engine
   run the API it needs; if not, the control stays **visible and disabled with one line saying why** - never
   silently missing. Name the API and the fallback line in EN, RU and UK.
3. **Visibility and wording.** Which media kinds, states and slices show it; hidden versus disabled; label,
   tooltip, help row; empty, loading, error and confirmation states, each with a human next step; a
   destructive action's confirmation.
4. **Input and accessibility.** Full keyboard path and shortcut, focus order, touch target on a coarse
   pointer, a label on every field and button, state never shown by colour alone.

## Outcome

READY only when every row is explicit or the owner delegated the choice:

```markdown
## UI Clarification Status
Status: READY
### Decisions
- <width band or engine> - <decision>
### Delegated
- <only rows the owner explicitly delegated>
```

Otherwise:

```markdown
## UI Clarification Status
Status: BLOCKED
### Confirmed
- <explicit decisions>
### Open
1. <question> - options: <a (recommended) - consequence> / <b - consequence>
### Why building waits
<one to three sentences>
```

## Rules

- Wording that names two or more options without choosing one is an open row, unless the owner delegated it.
- Settle by research what the architecture, a contract or a recorded owner decision already answers, and
  list it as decided with its source; ask only what only the owner can decide.
- In an unattended queue pass the ticket pipeline takes a researched, reversible recommendation and records
  it under `### Assumed (unattended, <date>)`; this command never asks on its behalf.
