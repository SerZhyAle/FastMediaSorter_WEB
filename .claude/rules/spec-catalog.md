---
paths:
  - "PLAN/**"
---

# Ticket lifecycle - working rules

Loads with any `PLAN/` file. Every harness call goes through `pwsh -NoProfile -File tools/harness.ps1 <cluster>/<script>`.

## Starting or resuming a ticket

- First action for any `Sxxxx`: `spec_catalog/select -Id Sxxxx -Format json`. An empty result (`[]`, which is truthy) is a typo, not a ticket: stop and name the candidate.
- Claim the ticket lease (`locks/ticket-lease -Verb Claim`) before research, not before the first edit. A granted lease proves only that no lease-taking session holds it: also read `chat/agent-chat -Verb Read -Last 25` for your id under another nickname.
- Re-claim the lease at every stretch with no catalog write: a lock-queue wait, an owner-named test batch, a phase close.
- On resume, the live tree beats every record about it. Status note, ticked steps, phase notes, evidence prose and a `Resolved` research item are claims written by an earlier session: re-run each step's Verification and grep the spec's new symbols before trusting them, then fix the tracking to match.
- A capture, a quoted comment, a log older than a day or a `(recommended..)` quiz answer is a premise. Re-run its reproduction once before building on it; if refuted, record the refutation and do not build the imagined feature.
- Re-read the spec file immediately before the first Edit. "File modified since read" means a sibling wrote it: reconcile, never overwrite with your earlier draft.
- Re-read status and `grep -n '^#\{1,2\} '` the spec right before writing `## Last Audit` or flipping a status. An existing Last Audit block means a sibling finished: verify it, add nothing.
- After a multi-hour gap, re-check the round state, the lease and the phase table before the next edit.

## Creating tickets

- Dedup by symptom before creating: grep `PLAN/*.md` bodies and run several one-word `spec_catalog/search` queries with `-IncludeArchived`, using the mechanism's domain nouns, not only the idea's words. "(no records)" proves only that no ticket is named like that.
- Create with `spec_catalog/capture-draft -Slug <slug> -TextFile <utf8 file>` (the safe form for quotes and Cyrillic). Never allocate an id separately: `next-id` reserves nothing.
- The owner rethinking a delivered, working feature is a NEW ticket citing the old id. Reopen only for a defect in an unreleased or unverified ticket.
- Work the owner defers to "after milestone X" stays a Draft or Tactical with a `- Blocker: Sxxxx` line naming the milestone ticket, never archived and never `BlockExternal`. Confirm with `spec_catalog/preview -Id <id>` that it reports `blocker-not-verified`.
- Write `**Complexity:** light|medium|hard - <reason>` in every spec: the runner picks the child model from it.
- Never write an inferred user motivation in the owner's voice. Only his verbatim words are his; the rest is labelled hypothesis.
- No time, effort or predicted-size figure anywhere in a spec or plan.

## Statuses and gates

- `Draft -> Approved` reads only the literal heading `### 3.3 Owner inputs (Approval gate)`; every bullet filled, at least `- **Related tickets:** ..`. Never pad with `n/a` to pass it.
- A `-StatusNote` never contains a double-quote character (it can overwrite the record's name). Read the record back with `select -Format json` after every `Block*` transition.
- `BlockQuestions` does not stop the pipeline for others: put the stop and the resolving command in the status note.
- A dependent leaves `BlockByOtherTask` when its blocker reaches `BlockNeedUserTest` or later, unless the blocker's shippable work is absent. State a blocker's readiness as a behaviour question about the tree, never a grep for an identifier the waiting ticket invented.
- A defect found on a `BlockNeedUserTest` ticket moves it out in the same action: `update -Status <Broken|Partial|In Progress> -StatusNote '<finding; next step>'`, probes deleted. Exception: every finding is already its own ticket in the same package.
- A feature is not done while its headline action is a stub. No `Implemented`, no `BlockNeedUserTest`, no "please test it" before it works end to end.
- `Block* -> Verified` is refused by `close`/`complete`: go `update -Status Implemented`, then `-Status Verified`.
- Keep `## Last Audit` the spec's last heading; check with `grep -n "^## "` after every audit.
- Evidence a closing audit cites lives in `PLAN/Sxxxx_<slug>/` (measurements, console lines, the reproduce command; small captures under `evidence/`), never in `temp/` - not even in a sentence. Write each run's verdicts into the spec at the end of that run.

## Probes (`console.debug("Sxxxx: ..")`)

- A probe exists in `web/` if and only if the ticket is `BlockNeedUserTest`. Order: probes as the last edits, checks green, Last Audit, `update -Status BlockNeedUserTest`, then closure. No per-phase probes.
- One statement alone on one line, never wrapped; after placing, grep the literal and match the count to the probes intended.
- A probe of a ticket outside `BlockNeedUserTest` is stale: delete it on sight after `select` confirms.
- A ticket that changes no JS cannot host a probe: capture the evidence yourself and close `Implemented -> Verified`, or write a `Probe none: <named evidence>` line. A probe marker in a status note counts only when it starts a line; `(contracts: 0)` means the gate examined nothing.
- The canon's probe gates read the file types from the profile's `probes.sourceExtensions`, so they see a JS probe. Before release, `grep -rn 'console.debug("S[0-9]\{4\}:' web/` must still be empty: there is no build step, so a probe ships to every visitor.

## Queue files

- `PLAN/RELEASE_QUEUE.md` order is the owner's. Do not run `release-queue -Reconcile` to place one new ticket: it re-homes existing rows. Before any queue mutator, copy the file to `temp/Sxxxx/` and diff package membership afterwards.
- The `[taken ..]` marker is a snapshot; `locks/ticket-lease -Verb List` is the live read.
- Release the lease on the same command line as the final status transition, guarded by its exit code.
- Never ask the owner what to do with a ticket's status, carrier or archival. Decide, report in one line, and prove the work is scheduled: package number and row position.

## Plans

- Order phases producer before consumer; start from a coverage inventory of the spec; no steps that only reshuffle plan text; self-review before the status flip.
- A phase's Files Touched list is a hypothesis: resolve every file, id and selector before editing, distrust its negative claims hardest, amend the plan with a dated correction.
- A plan touching UI needs a `/ui-clarify` record or the owner's quoted ruling. A placement section filled by an agent is inference.
- Phase files are `PHASE_<NN>__*.md`; the INDEX table is `| # | Name | .. | Status | Steps |` because `plan-tick` writes cells by position. `plan-tick -Steps` takes a quoted string: `-Steps '2,3'`.
- A superseded plan: delete the obsolete phase files and rewrite the INDEX to what shipped. Never tick undone phases.
- Never pin a whole-tree count as an acceptance predicate; pin a property of this ticket's own set.
- A "zero hits for X" predicate must not be satisfied or violated by the text that explains X.
- A "not scriptable" or "owner only" note on a test scenario is a guess: read the mechanism first. Split a `BlockNeedUserTest` acceptance into grep-decidable, gate-decidable and browser-only clauses; settle the first two with measured fast checks and record the browser-only clause as `RELEASE` unless the owner names that run.
