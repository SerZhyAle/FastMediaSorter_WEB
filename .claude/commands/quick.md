---
description: "Smallest tier for FastMediaSorter Web: one string, one value, a typo, one CSS token - no ticket, no gates beyond the touched file. Triggers: 'quick fix', 'just fix this typo/value/string'. Never for queue tickets."
argument-hint: "<one-line description of the trivial change>"
---

# /quick - one trivial edit

The smallest change tier (`CLAUDE.md` section 6, "Size of the change"): one string, one value, a typo, one
colour token. No ticket, no spec, no plan. Done in this turn and closed with the gates of the touched file only.

## Refuse when

Any one of these is true - answer in one line and stop, naming the tier that fits:

- the change alters behaviour, a handler, a condition, an import, state or a data flow -> `/skill-fix`;
- it adds a file, a module, a surface, a control or a setting -> `/spec-draft`, then `/spec-all`;
- it decides placement, visibility or a fallback per viewport or engine -> `/ui-clarify`;
- it touches more than one file, except one interface string edited in its EN, RU and UK files together;
- it touches IndexedDB schema, the device key, the exchange wire shape or a contract pointer;
- it is a queue ticket (`Sxxxx`) - tickets run through `/spec-all` and `r0.ps1`, never through `/quick`.

## Steps

1. Locate the file from `$ARGUMENTS` with one Grep or Glob; read only the lines around the change.
2. Lock, in its own tool call: `pwsh -NoProfile -File tools/harness.ps1 locks/enter-code-lock -Files "<file set>" -Reason "/quick: <what>"`.
   Exit 4 is "queued": wait as `locks/wait-for-lock-turn` prints, never edit without the lock.
3. Edit with the Edit tool. Interface text: the same key in EN, RU and UK in this edit, Cyrillic authored with
   Edit or Write, house style in prose and UI (`..`, plain hyphen, `ё`).
4. Release: `pwsh -NoProfile -File tools/harness.ps1 locks/exit-code-lock`.
5. Close with the facade over the touched file set only - it runs that set's gates and nothing wider:
   `pwsh -NoProfile -File tools/post-change.ps1 -Files "<file set>" -ChangeType <fix|docs|config> -Target "<file or key>" -Description "<short EN text>" *> temp/scratch/quick-post-change.txt`,
   then read that file. `PASS` or `PASS WITH ADVISORIES (n)` closes; a browser page named as an advisory is a
   `RELEASE` item, not a run. `FAIL` or `CANNOT VERIFY`: read the failing gate's output under
   `temp/post-change/` and fix or report it - never end the turn on an unread red verdict.

## Do not

- create or update a ticket, touch `PLAN/`, run `tests/smoke.ps1 -Page`, a browser, a build or git.

## Report

One sentence: what changed, in which file, and the facade verdict line.
