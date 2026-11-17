# CLAUDE.md - FastMediaSorter for Web

Shared contracts live outside this repository, in the catalog at `P:\Contracts` - the one file here that names it. Cite a contract by id and section, never by path or link; pointers in `docs/contracts/`.

> **Canon:** the SZA Unified Rules, shipped as the `sza` Claude Code plugin (`/plugin marketplace add SerZhyAle/sza-unified-rules`, `/plugin install sza@sza-unified-rules`; outside Claude Code read `rules/INVARIANTS.md` at https://github.com/SerZhyAle/sza-unified-rules). Consumption model **reference**: the canon is not restated; this file keeps only this repository's deltas. Overlay **E** (a browser application served as static files; drafted from this repository and adopted by the canon in 2026.10.16.1). Adoption stamp: `.sza-canon.json`. Per-project record: `rules/contrib/fastmediasorter_web.md` in the canon repository. A universal rule that looks wrong for this repo is reported to the canon session, never patched here.

`AGENTS.md` delegates to this file.

## 1. The product

- **The goal (owner, 2026-10-16, section 3):** give people on systems the native programs do not serve - macOS,
  Linux, ChromeOS, iOS and iPadOS, and anyone who cannot install a program - a **subset** of the functions of FMS_A
  and FMS_Win, inside the current popular browsers (Chromium: Chrome, Edge and the rest; WebKit: Safari; Gecko:
  Firefox). **Widened (owner, 2026-11-13, section 3):** every base function of FMS_A (phone and watch) and FMS_Win
  that a browser page can carry, directly or through another device of the same account; only what needs the
  operating system itself (a listening port, a raw socket, work after the tab closes, an OS role, the watch pairing)
  stays with the native programs. `docs/FEATURE_MATRIX.md` is this product's column of that family map.
- **Slices.** The exchange slice - register and delete an account, work with it as one more device (devices,
  resources, broadcasts, the clipboard), run the server owner's administration - is the scope of the
  FastMediaSorter Android S4246 handoff. The local slice works on the person's own files inside the browser. The
  matrix proposes which functions of each slice ship first.
- **Names (owner, 2026-10-16):** **FMS_A** is FastMediaSorter for Android (`P:\ANDROID\FastMediaSorter_mob_v2`);
  **FMS_Win** is Fast Media Sorter & Sharing for Windows (`P:\WINDOWS\FastMediaSorter_Lite`), which also holds the
  device-exchange server under `exchange-server/`; **FMS_Web** is this repository. These are labels, never words on
  a screen (`DEVICE-EXCHANGE` item CX). The catalog's living text writes FMS_Win since 2026-10-16; its records
  (document logs, `HISTORY.md`, proposals, dated amendments), the handoff and `docs/origin/` keep the former label
  `FMS_W` (`DEVICE-EXCHANGE` item CX). Quote those verbatim, and never write `FMS_W` in new text - it reads as "Web"
  as easily as "Windows".
- **Public name (owner, 2026-11-10, section 3):** "FastMediaSorter for Web", the program name under `DEVICE-EXCHANGE`
  item CX. On a screen the name is only that: no repository name or label (`FMS_Web`, `FastMediaSorter_WEB`) and no
  "mobile". The GitHub remote is `SerZhyAle/FastMediaSorter_WEB`, public, MIT. The remote is not created and nothing
  is pushed until the owner asks for that push in the session.
- **ADR-1 (FastMediaSorter Android S4246):** in the exchange slice the browser is one more device of an account
  under the contract `DEVICE-EXCHANGE` - the same envelopes, refusal reasons, `member` and `guest` rights and
  sealed content as the native programs. No second protocol, no second set of refusal reasons, no second rights
  model for the browser.
- **ADR-2:** this product lives in its own repository and on its own release calendar, for every slice. The only
  coupling to FMS_A, FMS_Win or any other product is the shared contracts catalog: no shared code, no shared build,
  no shared release. A function that must behave like FMS_A or FMS_Win gets that parity through the catalog - its
  contract, or a proposal beside the closest one - never by copying their code and never as a web-only variant.
- **One family, developed together (owner, 2026-11-13):** FMS_A, FMS_Win and FMS_Web look alike (same names, glyphs,
  control order and keys for the same function) and change together: a function added, changed or fixed in any of
  them changes its contract or family register row in the catalog first, and that step yields a ticket in each other
  product that offers or plans the function. Calendars stay separate (ADR-2); "together" means no family change is
  left without a ticket here. A family function found with no contract gets a proposal before it is built.
- **Family register (`FUNCTION-PARITY`, section 4):** the register is the contract's `family-fastmediasorter` file in the
  catalog's `function-parity` folder. This repository seeded it from `docs/FEATURE_MATRIX.md`, which stays the detailed
  map and agrees with the FMS_Web column; a function added, changed or fixed here updates its register row and
  captures a Draft ticket in each other product whose cell is `offered` or `planned` (`spec-draft -Project <key>`,
  rules 3 and 4 of the contract). The pointer and adoption row are `docs/contracts/FUNCTION-PARITY.md` and the
  catalog registry.
- The exchange server stays in FMS_Win. This repository never edits it: a change the server must make reaches it as
  a `PROPOSAL-<date>-<slug>.md` file beside the contract in the catalog, which FMS_Win turns into its own ticket.
- Read-only from sessions in this repository: `P:\WINDOWS\FastMediaSorter_Lite` (the server, under
  `exchange-server/`) and `P:\ANDROID\FastMediaSorter_mob_v2` (the reference client for the same behaviour). Read
  their code to learn the behaviour; copy none of it.
- Origin, owner decisions and research items: `docs/BOOTSTRAP_HANDOFF.md`, written 2026-10-15 by FastMediaSorter
  Android ticket S4246 before this repository's first commit, with the verbatim spec copy in `docs/origin/`. Both
  are origin records, not edited from this repository's sessions; their open items are tickets now, and work is
  driven from the ticket store, not from the handoff.

## 2. Standing law

Each binds every ticket; a ticket that cannot meet one stops and asks.

- **Contracts are final law.** `DEVICE-EXCHANGE` and `LIVE-BROADCAST` are 1.0 or later; only a backward-compatible
  change may land - a new optional member, a new dated amendment. Every change this product needs (its own
  `product` value and name, the browser transport, the operator surface, item D's wording for a browser) is written
  in the catalog first, by the catalog's own rules, and only then implemented here.
- **Security floor** (`DEVICE-EXCHANGE` items AW, AX, AZ, DF and section 27):
  - TLS 1.2 at least; a password, a token and a pairing code travel only inside TLS.
  - At most one password check per second, no lockout.
  - No operation shows a password, a token, an invitation after its creation or a resource's `access`.
  - The device's private key never leaves the browser and never reaches a log, an export or the console; content
    is sealed by section 27 and the server cannot read it.
- **Words are the programs' words.** Connection terms, program names, the check ladder and the message table come
  from `DEVICE-EXCHANGE` section 25 (items CV to DA); this product invents no words of its own for those terms.
- **Locales:** EN, RU and UK, each in the same edit as the interface change. Other languages are this repository's
  later decision.
- **Accessibility:** full keyboard control, state never shown by colour alone, a label on every field and button.
- **Who it is for:** one person moving content between their own devices. Relatives and strangers are the edge case,
  covered by a link with a password or PIN or a guest invitation, never by a rights model. Take the simplest
  behaviour; make any limit a host setting, not a built-in guard; raise a concern only for store policy or silent
  data loss.
- **Free paths only:** no paid hosting, no paid certificate, no paid DDNS, no paid service of any kind.
- Out of scope: e-mail and password reset by e-mail, terms of use and a "report" button, registration without an
  invitation, publishing folders and broadcasting from the browser in the first release.

## 3. Owner decisions

- **Name and home** (owner, 2026-10-15): `FastMediaSorter_WEB` at `P:\WEB\FastMediaSorter_WEB`.
- **Public name, remote and visibility** (owner, 2026-11-10): "FastMediaSorter for Web"; remote
  `SerZhyAle/FastMediaSorter_WEB`; visibility public, under the MIT license. Section 1 states the rule.
- **Goal widened** (owner, 2026-10-16), verbatim: "Задача _частично_ позволить функции FMS_A и
  FMS_Win для пользователей прочих операционных систем в браузере CHROME/IE/Safari/Других популярных - так что
  прочитай про функции этих программ, контракты, составб первоначальные спецификации внутри этого проекта". "IE"
  is read as Microsoft Edge: Internet Explorer was retired in 2022 and runs neither ES modules nor the WebCrypto
  curves `DEVICE-EXCHANGE` section 27 needs (confirmed by the owner, 2026-10-16).
- **Family goal** (owner, 2026-11-13), verbatim: "это приложение будет иметь весь ,базовый функционал по
  соответствующей программы телефона (любом андроид устройстве), часах , который реализован в FMS_A  и FMS_WIN и будет
  представлен в виде самостоятельного WEB-приложения [..] эти приложения будут выглядеть более-менее одинаково,
  развиваться вместе и новый/исправленный функционал обновляется/исправляется в них паралельно, они пересекаются по
  документации, принадлежат общему семейству программ и связаны канонами и контрактами". It supersedes "partially"
  of 2026-10-16: the "later" rows are planned work after the first release, never-rows are re-examined for a route
  through another device of the account; the register and propagation rule are proposed to the catalog.
- **First release** (owner, 2026-10-16): the exchange account, devices, directory, clipboard and connection
  diagnosis; operator administration; local browsing, player, images and slideshow; the move to destination folder N
  (Chromium only, elsewhere visible and disabled with the reason). Broadcast playback, sound and video, joined it
  (owner, 2026-11-13); broadcasting from the browser stays out. Function by function: `docs/FEATURE_MATRIX.md`.
- **Support floor** (owner, 2026-10-16): the current and the previous major version of Chrome, Edge, Firefox (plus the
  current ESR), Safari macOS and Safari iOS/iPadOS, and Samsung Internet current. A function a browser in the floor
  cannot run stays visible and disabled with one line saying why - never a silently missing control.
- **Tracks** (owner, 2026-10-16): the local track and the exchange track run in parallel; the ticket priorities carry
  that order.
- **Names** FMS_A, FMS_Win, FMS_Web (owner, 2026-10-16) - section 1.
- **License:** MIT (owner, 2026-10-16).
- **Stack** (owner, 2026-10-16): static HTML, CSS and ES modules with no build step, dependencies vendored -
  the source root is `web/`, the tests and the test command are in section 5. A type checker can arrive later as
  JSDoc types checked by `tsc --noEmit`, once Node exists; it needs no bundler.
- **Owner wishes** (S4246 section 3.1): a link or connection string carrying an invitation opens a page with the
  invitation already filled in, so the person only invents a login and a password; receiving the account's
  broadcasts comes before broadcasting from the browser.
- Open owner decisions - the site, where the page lives, the transport, certificate
  trust, operator sign-in - are owner-input items inside the ticket of the phase that needs them; each is asked
  once, in question-with-options form, right before that phase and never earlier.

## 4. Ticket store and the release package plan

- **The harness is adopted from the plugin, not copied.** Run any harness script through the forwarder:
  `pwsh -NoProfile -File tools/harness.ps1 <cluster>/<script> [args]` (for example `spec_catalog/validate`,
  `spec_catalog/select -Id S0002 -Format json`, `spec_catalog/search -Query transport`). Configuration is
  `.sza-profile.json` and nothing else; never edit or copy a harness script.
- **Ticket ids:** `S0001` onward (`^S\d{4}$`, the harness grammar). They overlap the S spaces of FastMediaSorter
  Android, StreamsPlayer for Android and Tourist, so a ticket of another repository is always cited with the
  repository name next to its id ("FastMediaSorter Android S4246").
- Tickets are created only with `spec_catalog/capture-draft` (one at a time, the requester's words byte for byte),
  and their status moves only through the harness's `update`, `close` and `archive` scripts. Specs:
  `PLAN/Sxxxx_<slug>.md`; journal: `PLAN/spec-catalog.jsonl`, never edited by hand.
- **Statuses:** `Draft`, `Approved`, `Tactical`, `In Progress`, `Implemented`, `Verified`, `Partial`, `Broken`,
  `BlockByOtherTask`, `BlockNeedUserTest`, `BlockQuestions`, `BlockExternal`, `Archived`. A `Block*` status needs a
  `statusNote`; `Verified` needs a `## Last Audit` block in the spec.
- **Release package plan** - six decisions, recorded once:
  1. Files: `PLAN/RELEASE_QUEUE.md` (work remaining, the owner's order), `PLAN/RELEASE_READY.md` (ready),
     `PLAN/RELEASE_QUEUE_DONE.md` (shipped history, newest first).
  2. Single write path: every journal mutation goes through the harness's `Write-Catalog`, which calls
     `Sync-ReleaseQueue`; no skill or script maintains the files by itself.
  3. Ready set: `Implemented`, `Verified`, `BlockNeedUserTest`. Work remaining: `Draft`, `Approved`, `Tactical`,
     `In Progress`, `Partial`, `Broken`, `BlockByOtherTask`, `BlockQuestions`, `BlockExternal`. `Archived` leaves
     the plan.
  4. Package number: the `current-next-release:` marker in `PLAN/RELEASE_QUEUE.md`, starting at 1, advanced by
     `-Ship`. Not tied to a branch - this repository works on `main`. `--` is the not-scheduled bucket.
  5. Operator commands (all through `tools/harness.ps1 spec_catalog/release-queue`): `-List`, `-List -Ready`,
     `-Validate`, `-Reconcile`, `-SetCurrent N`, `-Ship -Release N [-Version X] -DryRun`. Package headings and
     line order are the owner's; no script reorders them, and the order is changed by moving lines.
  6. `PLAN/`, its journal and its archive are local and ignored by Git (owner, 2026-11-16).
- **Runners.** The portfolio dispatcher `pq` works this repository as key `fms-web`, one worker at a time; its run
  rows are `temp/spec-queue/runs-pq1.jsonl`. `r0.ps1` at the root is the standalone mono runner: one fresh agent
  process per ticket, in queue order, one lifecycle step each. Child permission mode `bypassPermissions` (owner,
  2026-10-16). Always look first: `pwsh -NoProfile -File ./r0.ps1 -DryRun`. Its first real run is one attended ticket
  (`./r0.ps1 -MaxTickets 1 -TimeoutMinutes 30`), read through its run row in `temp/spec-queue/runs-mono.jsonl` and the
  ticket's new status; it has not happened yet, and until it has no unattended `r0.ps1` run starts. Every unattended
  run carries `-MaxTickets`. `r1`-`r3` are the full runner's instances, `rs` its stop, `rm` its monitor and `rw` the
  dispatcher scoped to this repository; `r1`-`r3` stay unused until the run journal shows the single runner's idle
  time is the constraint. To stop: create `temp/STOP-SPEC-QUEUE`; never kill the process.

## 5. Repository layout and this machine

- `web/` - the source root (the stack decision, owner 2026-10-16): static HTML, CSS and ES modules, no build
  step, the served files are the source. Dependencies are vendored under `web/vendor/`, never fetched from a CDN at
  run time. Architecture:
  - `web/index.html` loads the stylesheets and `web/main.js`, the composition root. It owns the hash route, the
    preferences and the system signals, and on every change rebuilds the whole frame through `ui/shell.js`
    `buildFrame`, then mounts the per-surface views (`ui/local-view.js`, `ui/admin-view.js`). The state objects
    behind them (local browser, sorter, slideshow, admin session) outlive frames; focus is restored by key after
    each rebuild. Interface actions reach `main.js` through one `actions` object.
  - Layers `web/ui/` (DOM) -> `web/app/` (use cases, state) -> `web/data/` (browser APIs: files, storage, sockets,
    downloads, logging); an import never points upward (`.claude/rules/web-source.md`, gated by `web-hygiene.py`).
  - `web/app/surfaces.js` is the screen registry (id, hash route, `work` or `settings` kind, title key, help topic);
    a new screen starts there.
  - Interface text lives in three EN/RU/UK dictionary modules - `app/strings.js`, `app/admin-strings.js`,
    `app/help-text.js` - the inventory `locale-parity.py` checks.
  - Colour tokens, dark mode and the input profile live only in `web/styles/palette.css`.
  - Logging goes through `data/log.js`; the About diagnostic report reads its recent lines.
  - The admin session closes on leaving its surface, on a hidden page and on `pagehide`.
- `tests/` - static browser test pages report `SMOKE: PASS` / `SMOKE: FAIL`. A page is `tests/<name>.html` with a
  `#results` element and a module `tests/<name>.js` that imports `../web/...` directly and declares
  `const declaredChecks = <n>;` - the runner requires exactly that many executed checks. `tests/smoke.ps1 -ListTier
  Fast` and `-ListTier Release` print classified page paths; an empty tier exits 2, never PASS. The fast tier is
  empty; every page is release-tier. When adding a test page, classify it and retain every release page. One page:
  `pwsh -NoProfile -File tests/smoke.ps1 -Page tests/<name>.html` - it serves the repository root through `py` on
  127.0.0.1 and reads the verdict from headless Chrome or Edge. The served tree is the build.
- **Between releases** use only checks measured at 5 s or less and a direct call of the changed behaviour; a longer
  or unmeasured check runs at release or when the owner names that run (TESTING_AND_QA section 2). Record each skipped
  rung as `RELEASE` in the ticket audit with its release command and report `not built, not tested until the release`.
  **Closure facade:** close every change with `pwsh -NoProfile -File tools/post-change.ps1 -Files "<set>" -ChangeType
  <type> -Target <ticket> -Description "<text>"`. It runs the applicable fast gates in a fixed order (header of the
  script), names each skipped browser page as a `RELEASE` advisory, and only when every gate passed writes the dev-log
  row (`dev/CHANGELOG.md`, ledger shape 2, local and ignored); verdict `POST-CHANGE: PASS` / `PASS WITH ADVISORIES
  (n)`, exit 1 a gate failed, exit 2 could not verify - neither writes a row. `-SelfTest` proves its order and decision.
  The source gates it calls: `py -3 tools/web-hygiene.py` (`--release` adds the probe ban) and `py -3
  tools/locale-parity.py`, each with `--self-test` fixtures; `tests/smoke.ps1 -SelfTest` proves the smoke runner's
  timeout and declared-count logic without a browser.
  Fast commands for the ticket store are `pwsh -NoProfile -File tools/harness.ps1 spec_catalog/validate` and
  `pwsh -NoProfile -File tools/harness.ps1 spec_catalog/release-queue -Validate`; for documents and contract pointers
  they are `py -3 tools/check-docs.py` and `py -3 tools/contract-audit.py`; inspect the named verdict, not only the
  exit code. For a test-tier list change use `pwsh -NoProfile -File tests/smoke.ps1 -ListTier Release` and compare
  its output with `rg --files -g '*.html' tests`. For other areas use scoped static inspection and a direct call;
  there is no measured fast browser test.
- **Release checks:** run every page named by `pwsh -NoProfile -File tests/smoke.ps1 -ListTier Release`, each with
  `pwsh -NoProfile -File tests/smoke.ps1 -Page <page>`, and require `SMOKE: PASS` and exit 0 for each. Also run
  `py -3 tools/check-docs.py`, `py -3 tools/contract-audit.py`, both ticket-store fast commands above, and
  `rg -n 'console\.debug\("S[0-9]{4}:' web`; first require that `web/` exists, then require no matches and no search
  errors. Run `py -3 tools/web-hygiene.py --release` and `py -3 tools/locale-parity.py` and require `HYGIENE: PASS`
  and `LOCALES: PASS`. A smoke page's PASS counts only with every declared check executed; a page past
  `-TimeoutSeconds` (default 60) exits 2. Require the actual verdict of each command; an absent registry or catalog drift is not a pass. The full
  release run is not replaced by these instructions.
- **Measured direct process wall times, 2026-11-08, current tree:** catalog validation 0.840 s and release-queue
  validation 0.783 s (the two commands above, both passed); release-page listing 0.231 s (the command above, one page);
  documentation check 0.063 s and contract check 0.074 s (both passed). Measured 2026-11-12: `tools/web-hygiene.py`
  0.10 s and its self-test 0.10 s; `tools/locale-parity.py` 0.06 s; `tests/smoke.ps1 -SelfTest` 1.66 s;
  `tools/post-change.ps1 -SelfTest` 0.33 s; a facade run over a documentation set 2.25 s, over an 8-file set touching tests/, tools/ and docs 5.06 s (eight gates and three self-tests in one process tree; each part is under 5 s). These are not worst-case limits. The contract
  check fails at each later catalog version move until its inventory is re-read; browser tests and unmeasured checks
  remain release-tier until a release measures them.
- `web/help/help-map.json` - the help map (`CONTEXT-HELP` rule 17): one row per surface of `web/app/surfaces.js`.
  A new surface or control adds its map row, its entry in `web/app/help.js` and its EN/RU/UK text in
  `web/app/help-text.js` in the same edit; `tests/help.html` fails otherwise.
- `docs/` - the handoff record, `docs/origin/`, and `docs/contracts/` pointers.
- The `*token*` and `*secret*` leak globs in `.gitignore` also swallow a source file with either word in its name
  (a `session-token.js` would silently never be committed). Name such modules otherwise, or add a `!` re-include in
  the same edit, and prove it with `git check-ignore -v <path>`.
- This workstation (measured 2026-10-25): Python through the `py` launcher only (`python`/`python3` are Store stubs
  - never probe an interpreter by running it); Python Playwright importable under `py -3`. These resolve in the
  PowerShell tool and not in the Bash tool: `node` (`C:\Program Files\nodejs`), `deno`, `rg`, `ffmpeg`, `gh`
  (authenticated), Go (`C:\Program Files (x86)\Go\bin`). Node exists on the machine; the stack decision (section 3)
  still uses none of it.
- `temp/` holds scratch by ticket: `temp/Sxxxx/` for ticket work, `temp/scratch/` otherwise. Before editing a file
  over 500 lines, copy it there with a timestamp.
- The owner's test media corpus is `C:\_TEMP\test_media`; it holds private and copyrighted material (see
  `.claude/rules/web-source.md`).

## 6. Working rules

Path-scoped detail loads with the files it governs: `.claude/rules/spec-catalog.md` (`PLAN/`),
`.claude/rules/web-source.md` (`web/`, `tests/`), `.claude/rules/repo-scripts.md` (scripts, hooks, agent config),
`.claude/rules/cross-project-contracts.md` (contract pointers, tickets).

**With the owner**

- What the owner states about project state - a session is dead, a ticket has a status, a build passed - is acted on
  at once, never verified and never asked back. A refusing gate is still quoted verbatim; a contradiction met while
  doing the work gets one line after the request is done.
- A named deliverable ("create a ticket") comes first, from his words, before any research or measurement.
- A sweeping phrase never widens a scope he named item by item: write out the concrete list before acting.
- His symptom is a fact; his proposed fix is a hypothesis about the mechanism. Trace the cause first and say so
  plainly when it differs.
- Settle conventions and design forks by research and recommend; ask only when the framing itself is unclear. Never
  ask about a ticket's status, carrier or archival.
- No time, effort or predicted-size estimate anywhere - spec, plan, chat. Measured sizes of real files are fine.
- A report only he reads (audit, findings) is Russian, in chat, each item "Сейчас -> Предлагается" with its evidence.
- No narration between tool calls; an intermediate message is one line, only when the plan changes or a result is
  found.
- "Make it faster" means: rank the measured time sinks and recommend deleting tooling checks first.
- There is no installed user base to protect yet: never argue from user impact. Data loss and store policy still
  count.
- This file, the rules, agent definitions and commands are editable: propose a concrete consolidation when
  ceremony repeats.

**Size of the change**

- A trivial fix (one string, one value, a typo) or a self-contained script fix is done in the same turn and checked
  with the measured fast tier and a direct call; record slower tests for release. Never offer to file a ticket for it.
- Out-of-scope finding that is non-trivial and needs its own work: dedup, park it with `spec_catalog/capture-draft`,
  report `parked: Sxxxx <slug>`, resume the task. Never park in-scope or trivial work.
- A finished, well-scoped mechanical tail is finished in this session, not parked as a child ticket.

**Verdicts**

- Claim nothing done, fixed or passing without fresh matching evidence, its exit code and output: `expected: X | actual: Y`.
  Between releases use the fast rung and a direct call; record higher rungs as `RELEASE`, not as passing.
  "Should", "probably", "seems", "looks fixed" mean the check has not run yet.
- A verdict-bearing command - a gate, a test page, a lock or lease call - is the last thing on its line: redirect
  it to a file under `temp/`, never pipe it into `tail`/`head`/`grep`, never judge it by a trailing `echo $?`, and
  require its positive line (`acquired`, `SMOKE: PASS`) before acting on it.
- A red check outside your edit is a question: list what failed, classify each item as yours, already ticketed or
  foreign, and never repair another session's file.
- Exit 2 is "could not verify", never "my change broke it": open the raw output first.

**Parallel sessions**

- The code lock covers the edit and nothing else: `locks/enter-code-lock -Files "<set>" -Reason "<ticket>"` in its
  own tool call immediately before the first edit, `locks/exit-code-lock` after the last file. Exit 4 is "queued":
  run `locks/wait-for-lock-turn -Acquire` in the background with the printed `-Handoff` path and do lock-free work.
  Never chain an edit behind the lock call.
- A file changed by another session is that session's live work: build on it, never revert it, never strip its probe.
- "Finish Sxxxx" on a ticket another lease holds means take it over, with no liveness check.
- Never stop a process by image name and never kill a process this session did not start.

**Text agents read**

- Instructions are dry: condition, what to do instead, the escape hatch. Incident narrative, dates and ticket ids go
  in the spec or the script header, never in this file.
