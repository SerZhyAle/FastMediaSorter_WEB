---
description: "Narrow-fix tier for FastMediaSorter Web: one understood defect, one smallest patch, its smoke page named, closed through tools/post-change.ps1 at the fast tier. Triggers: 'skill fix', 'fix this bug quickly', a regression with a clear anchor. Not for new behaviour and never for queue tickets."
argument-hint: "<defect: symptom, and the file, page, control or console line it shows in>"
---

# /skill-fix - one narrow defect fix

The fix tier (`CLAUDE.md` section 6, "Size of the change"): an existing defect closed by the smallest patch in
the module that owns it. No ticket and no spec; the evidence is the fast tier plus a direct call, and the
browser page that covers the fix is named for the release.

## Refuse when

Answer in one line and stop, naming the tier that fits:

- a single string, value or typo with no behaviour -> `/quick`;
- new behaviour, a new control, surface, setting or module -> `/spec-draft`, then `/spec-all`;
- the fix needs a decision on placement, visibility or a fallback per viewport or engine -> `/ui-clarify`;
- the cause is still diffuse after one routing hop from the anchor, or the patch would touch more than three files;
- it touches IndexedDB schema, the device key, the exchange wire shape or a contract - those are tickets;
- it is a queue ticket (`Sxxxx`) - tickets run through `/spec-all` and `r0.ps1`.

## Steps

1. **Anchor.** From `$ARGUMENTS` take the file, page, control, console line or symbol. Read only enough to
   state one falsifiable cause and the cheapest check that would disprove it. Fix a defect in the shared
   module it comes from: grep every host that uses that module before patching (`.claude/rules/web-source.md`).
2. **Lock**, in its own tool call: `pwsh -NoProfile -File tools/harness.ps1 locks/enter-code-lock -Files "<file set>" -Reason "/skill-fix: <defect>"`.
   Exit 4 is "queued": wait as `locks/wait-for-lock-turn` prints.
3. **Patch** the narrowest code path. Interface text in EN, RU and UK in the same edit; help rows
   (`web/help/help-map.json`, `web/app/help.js`, `web/app/help-text.js`) move with a changed control.
4. **Direct call.** Run the cheapest check that exercises the changed behaviour without a browser - a module
   function called from a script, a grep for the changed footprint. Iterate once if it shows a defect in the
   same slice; if the fix spreads, stop and redirect to `/spec-draft`.
5. **Release the lock:** `pwsh -NoProfile -File tools/harness.ps1 locks/exit-code-lock`.
6. **Name the smoke page.** List the release pages with `pwsh -NoProfile -File tests/smoke.ps1 -ListTier Release`
   and pick the page that covers the touched module. Between releases it is not run: write it as
   `RELEASE: pwsh -NoProfile -File tests/smoke.ps1 -Page <page>`. Run it only when the owner names that run.
   A test page added or changed by the fix is classified in its tier in the same edit (`CLAUDE.md` section 5).
7. **Close through the facade:**
   `pwsh -NoProfile -File tools/post-change.ps1 -Files "<file set>" -ChangeType fix -Target "<module or surface>" -Description "<short EN text>" *> temp/scratch/skill-fix-post-change.txt`,
   then read that file. The facade runs the fast gates for the set (catalog, docs, hygiene, locale parity,
   self-tests) and prints each Release-tier page as an advisory. `PASS` or `PASS WITH ADVISORIES (n)` closes.
   `FAIL` (exit 1) or `CANNOT VERIFY` (exit 2): read the failing gate's output under `temp/post-change/`,
   attribute it (yours, ticketed, foreign) and fix yours; never end the turn on an unread red verdict.

## Do not

- create or update a ticket or touch `PLAN/`; run `-Release`, a full release check or git;
- claim the browser behaviour is fixed - it is "not tested in a browser until the release".

## Report

What was fixed and where; the direct-call result as `expected: X | actual: Y`; the facade verdict line; the
`RELEASE:` smoke page line.
