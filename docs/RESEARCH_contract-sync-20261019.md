# Contract synchronization audit - 2026-10-19

**Ticket:** S0033. **Product identity:** exactly `FastMediaSorter Web` in the catalog adoption table.
**Evidence scope:** repository inventory, current contract/proposal reading and tooling checks.
The audits of 2026-10-19 to 2026-11-08 found no application source under `web/`; it exists since 2026-11-12 and the
section "Re-audit 2026-11-14" reads it. No runtime exchange, player or UI conformance is established by any of them.

## Identity and applicability findings

The synchronization ticket's original inventory mixed this product with **FastMediaSorter website**.
The latter's PAGE/SITE adoption versions are a separate product's claims. A substring query for
`FastMediaSorter Web` also matches `FastMediaSorter website`; filter the returned product by exact equality.
This repository has no declared official site. S0022 retains that decision. Its PAGE/SITE targets are
conditional and do not inherit the Android website's implementation, verification date or exceptions.

The authoritative local scope inventory is [contracts/ADOPTION.json](contracts/ADOPTION.json).
Its short generated [pointer index](contracts/README.md) distinguishes catalog target, present scope,
implementation carrier and evidence state. No target/version in that index certifies a runtime reader.
Existing adoption versions remain historical until actual implementation replay or surface evidence exists.

| Requirement family | Current applicability / result | Clauses and acceptance carrier |
| --- | --- | --- |
| UI-SIZING, BUTTONS, BOOLEAN-OPTION, COLLAPSIBLE-GROUP | Required for future DOM controls, all absent | Each contract's normative profile/component and conformance sections; S0032/S0028 |
| SETTINGS-NAVIGATION, APP-SETTINGS, APP-STYLE, APP-BEHAVIOUR | Required shared settings, theme, consent and commit behavior; absent | Settings sections 2-5 and related lifecycle rules; S0032/S0028 |
| WINDOWS-UI | Native Windows presentation not applicable to browser DOM | No native surface is implemented here; cross-platform rules still apply |
| CONTEXT-HELP | Bound to future routes and dialogs; help map/corpus absent | Section 2 rules 1-19; S0031, surface registry from S0028 |
| DEVICE-EXCHANGE | Required browser device and operator client; no implementation | Sections 5-7, 9, 22, 27-28; WEB-BINDING, REMOTE-ADMIN and 2026-10-19 recommendations; S0011-S0014/S0029/S0034 |
| LIVE-BROADCAST | Future receiver after browser research; no implementation | Descriptor/handshake, schema refusal and optional concurrency; S0015/S0016/S0035 |
| MEDIA-CLASSIFICATION, MEDIA-VIEWER | First-release local slice; no implementation | Classification plus .jxl amendment; viewer rules 1-6; S0023-S0027 |
| INPUT-CHORD, INPUT-PARITY | Physical focused keys, editor isolation, browser-owned alternatives | Accepted VIEWER-KEYBOARD and conformance; S0023-S0025/S0031 |
| ICON-SET, ICON-RENDER, ICON-EXTERNAL | Canonical geometry/meaning, colors/sizes, accessible names and no language flags | Vocabulary/rendering and current amendments; S0032/S0028/S0031 |
| DOC-INTERNAL-QUALITY | Current maintained repository documents | Registry, reverse coverage, local links/assets and generated-pointer drift check added here; full prose review is not automated |
| DOC-EXTERNAL-QUALITY | Future authored help/public corpus | S0031/S0022; no public SEO/locale/screenshot claim |
| HARNESS-PROFILE | Existing adopted profile, source tools remain in canon | Current 0.12 amendment leaves ledgerShape none behavior unchanged; fresh harness checks below |
| REPO-STAMP, REPO-LAYOUT, RULE-DELIVERY, TASK-FLOW | Existing declarations/tooling, not new product behavior | Historical verified rows preserved; R0 attended rehearsal remains owner-deferred |
| PAGE-CONTENT, PAGE-STYLE, SITE-FAMILY-MAP, SITE-STRUCTURE, SITE-EXPERIENCE | Conditional official-site scope; selected help styling separately bound by CONTEXT-HELP | S0022/S0031; no copied website adoption rows |

## Accepted proposals and later changes

All eleven proposals filed by S0010 on 2026-10-16 now have an accepted current decision dated 2026-10-17.
Earlier proposed/as-filed lines in those records are history. The automated audit reads the leading current
status, records each source hash and fails on subsequent status/version drift.

| Earlier proposal | Current governing destination | Implementation consequence |
| --- | --- | --- |
| Browser product | DEVICE-EXCHANGE 1.3 consolidation, WEB-BINDING and product roles | Accepted `fms-web` identity does not resolve the public display-name decision S0021 |
| WebSocket binding | WEB-BINDING websocket-binding and normative resolutions | Same-origin HTTPS, canonical subprotocol/path, binary framing/limits, empty-binary half-close and tab lifecycle; S0012/S0013 |
| Page served by server | WEB-BINDING page-served-by-the-server | Local fragment consumption, immediate clearing, no implicit connect and canonical trusted-operator warning; S0012/S0020 |
| Certificate trust | WEB-BINDING certificate-trust | Browser owns trust; fingerprint is a hint, never page pinning; engine limits stay explicit; S0012/S0029 |
| Device key/token store | WEB-BINDING device-key-and-token-store and normative resolutions | Non-extractable origin keys, encrypted token/PIN at rest, no password persistence; storage loss does not remove old server entry; S0011/S0012 |
| Clipboard | WEB-BINDING clipboard and later storage-guard resolution | Stream/verify before placing, temporary-byte/overhead quota guard and cleanup, explicit clipboard permissions; S0013 |
| Operator administration | WEB-BINDING, REMOTE-ADMIN (1.4) and 1.5 recommendations | Separate memory-only stream session; server-generated invitation string once; S0014/S0034 |
| Update wording | DEVICE-EXCHANGE and LIVE-BROADCAST schema-refusal amendments | Contract-localized format-unsupported, no invented mandatory minimum-version/update message; S0012/S0016 |
| Failure mapping | WEB-BINDING failure-mapping | Opaque failures use unreachable and existing ladder; no invented combined wire/local reason; S0029 |
| Viewer keyboard | INPUT-CHORD/INPUT-PARITY 0.4 and VIEWER-KEYBOARD | Defaults resolved; per-engine available-key measurements still owed by S0023 |
| Viewer behavior | New MEDIA-VIEWER 1.0, not MEDIA-CLASSIFICATION | 1-second slideshow floor, continue on manual navigation, no-overwrite destination moves and supported-feature scope; S0023-S0027 |

Later requirements read during this audit: DEVICE-EXCHANGE 1.4 exact administration operations/reply-code
table and `#admin` entry; 1.5 existing-directory concurrency, authorized clipboard versus operator-token
separation and local server audit. The server half remains owned by FMS_Win. `grant.add`, `grant.remove`,
`broadcast.list`, `clipboard.status` and `clipboard.info` are not authorized aliases or new operations.
The accepted administration corpus is evidence of its named transcript scope, not whole-contract proof.

MEDIA-CLASSIFICATION 0.12 adds .jxl as IMAGE without promising decoding. UI-SIZING 1.1 requires final-width
remeasurement on deliberate profile/scale changes. ICON-SET 0.35 separates the replayable-tour meaning from
help. LIVE-BROADCAST 1.2 preserves single-stream support; it does not require a concurrent player in this product.

## Compatibility audit and required negative cases

No browser parser or persistent application store exists to execute these cases yet. This is the implementation
checklist; source/contract inspection is not a codec test. Document versions and declared wire carriers differ:
DEVICE-EXCHANGE's current document 1.5 still uses envelope schemaVersion 2; do not reject it as schema 1.5.

| Boundary rule | Required actual result | Carrier |
| --- | --- | --- |
| Named members, unknown additions and higher compatible minor | Match fields by name; ignore allowed unknown additions; retain known meaning | S0012/S0013/S0014/S0016 |
| Unsupported schema/major or sealing version | Refuse cleanly with contract wording; no partial import/playback or clear fallback | S0011/S0012/S0016 |
| Unknown enums/capabilities | Only the contract's stated default, inert unknown or refusal; never a guessed member/guest privilege | S0012-S0014/S0016/S0023 |
| Absence versus deletion | Preserve manual entries and user settings; only producer-owned live rows may be removed by valid snapshot/change semantics | S0013/S0035/S0028 |
| Optional presence/defaults | Distinguish absent metrics from zero; do not invent a bitrate, permission, credential or endpoint | S0013/S0016/S0035 |
| Bounds and malformed framing | Enforce pre/post-auth frame bounds, length agreement and half-close phase; cleanup quota/hash/tag failures | S0011-S0013 |
| Operator isolation | Operator session never becomes an enrolled device token or content key; grant mutations remain uncarried | S0014/S0034 |
| Saved settings/remaps and scale | Preserve existing stored values; unknown new values degrade per field; no broad reset or repeated scale multiplication | S0028/S0023 |

## Artifacts and evidence

`py tools/contract-audit.py` reads the live catalog, checks inventory targets against both headers and registry,
checks current proposal decisions, and compares generated pointers with their source inventory. It records hashes
in `temp/S0033/contract-audit.json` for the original sealing/connection/server-frame artifacts and available
fmsw-224/fmsw-245 corpus files. These artifacts stay in the catalog and are never hand-edited or copied as proof.

The fmsw-245 generated files retain their original `contractVersion` 1.1 and PROVENANCE. DEVICE-EXCHANGE 1.5
recommendations section A explicitly adopts their 1.4 transcript scope without rewriting that history.
Hashing or reading these files is not replay. Actual sealing replay in every supported engine belongs to S0011,
account transcripts to S0012, administration codec/joint runs to S0014/S0034, and end-to-end use to S0020.

Before the first catalog edit, `check-contracts.ps1 -Json` exited 1 on one existing error:
CTR-EXPIRE, FastMediaSorter_Lite's exception expired on 2026-10-15. This product may not renew that other
product's row. Pending/lag aggregate warnings are portfolio diagnostics, not browser runtime evidence.
Compare the after-run error set with `temp/S0033/catalog-before.json`; a new error attributable to this
product fails this synchronization. The global gate remains red until its owning project resolves its error.

## Exceptions, migration and release boundary

The project retains catalog RULES section 15 and VERSIONING section 8 rights: record justified own exceptions
without prior owner approval, propose corrections/additions to sealed contracts, and preserve a dated supported
design variant. A proposal alone is not a waiver. There is no new contract defect needing a proposal in this audit.

The product's catalog migration/exception record names exact scope, absent-code evidence, responsible product,
compensating release gates, remediation tickets and **until 2026-11-30 or before first release**. The UI plan is
[DESIGN_unified-ui.md](DESIGN_unified-ui.md). This migration record makes the gap visible; it never authorizes
insecure credential storage, unsealed content, silent user-data loss or claiming an untested browser supported.

S0010 retains its unresolved public-name, keyboard-measurement and broadcast-research follow-ups. Its eleven
proposals no longer wait for acceptance, and its old two-error checker note is historical, not today's baseline.
No counterpart repository, other product's adoption row, frozen origin/manifest identity or release package
is changed by this synchronization. No commit, push, publish, account creation or message transmission is implied.

**Verdict:** contract reading, scope reconciliation and migration preparation can be checked now. S0033's full
acceptance still includes implemented browser behavior and per-engine/joint evidence. Keep it Partial until
those owned implementation tickets and S0032 acceptance provide that evidence; do not close it from a plan.

## Re-audit 2026-10-28

`py tools/contract-audit.py` exited 1 against the live catalog on eight version drifts. Every step since
2026-10-19 is additive; none changes an envelope, a `schemaVersion`, a vector or a required repository key.

| Contract | Read on 2026-10-19 -> now | Consequence for this product |
| --- | --- | --- |
| DEVICE-EXCHANGE | 1.5 -> 1.10 | Sections 29-33, items DS-DY: broadcast lifecycle. WEB-BINDING and REMOTE-ADMIN unchanged. The browser declares no `broadcaster`, so DS-DW bind only a receiver; DX-DY add the relay `410` and the tunnel refusal `ended` (7.10, item CZ) to the reasons a receiver maps. S0016/S0029 |
| LIVE-BROADCAST | 1.2 -> 1.6 | Item R: consumers change nothing. Item S: `pending {until}` shows a waiting state and probes the relay at most every 30 s. Items T-U, consumer rule 9: a deliberate end is told from a lost connection. S0016 |
| APP-BEHAVIOUR | 0.12 -> 0.13 | Rule 4 relaxed: a standing consent may be its own setting, off by default, captioned, revoked in one action, each use logged. No obligation changes. S0028 |
| HARNESS-PROFILE, REPO-STAMP | 0.12 -> 0.14, 0.12 -> 0.13 | Optional wire-version markers (absence means 1.0) and optional runner/portfolio keys. The profile and stamp stay valid unchanged; the stale canon stamp belongs to S0042 |
| TASK-FLOW | 0.2 -> 0.8 | Harness-gap corrections; portfolio dispatcher, event log and occupancy rules whose files live outside the repository. The canon `Sxxxx` scheme needs no rule-50 exception; rule 61 (the owner sets the repository `hold` before an R0 run) binds once the repository is registered in the portfolio |
| PAGE-STYLE, SITE-FAMILY-MAP | 3.1 -> 3.4, 1.5 -> 1.9 | In-app help page role, kit revision `4aba1dee..` (re-vendored when help or a site is built), the exchange mark in section 9; family-map columns that list only answering URLs. Conditional on S0022/S0031 |

Newly applicable: **EXCHANGE-MARK 0.3** (this product is named among its consumers; rules 8, 13, 16; carrier S0036)
and **TEST-LAB 0.1** (every product files its inventory report, section 3; carrier S0038). Both are now inventory
rows. Three open FMS_Win proposals name this product as a consumer of their vectors or fixtures:
`PROPOSAL-2026-10-19-fmsw-245-complete-websocket-vectors`, `PROPOSAL-2026-10-19-management-visibility` and
`PROPOSAL-2026-10-20-websocket-negative-vectors`. They bind nothing until accepted; the inventory tracks their
status lines so acceptance shows as drift. Carriers on acceptance: S0012, S0014.

DOC-INTERNAL-QUALITY was recorded above as implemented here. On 2026-10-28 `py tools/check-docs.py` exits 2: the
registry records file it reads does not exist. The row now names S0040, which owns that file and the loop.

The catalog registry still carried this product's 2026-10-16 rows (DEVICE-EXCHANGE `Reads` 1.1, proposals named as
`proposed`). They are brought to the versions read here, rows are added for the contracts whose consumer lists name
this product, and a dated migration entry records the gap. No `Implements` cell advances: nothing is built.

## Re-audit 2026-10-29

The catalog's proposal consolidation of 2026-10-29 moved 18 of this product's 33 targets and decided the three
FMS_Win proposals tracked above; `py tools/contract-audit.py` exited 1 on 18 version drifts and 3 proposal-status
drifts. Every step is additive or a clarification: no envelope, member, reason, `schemaVersion` or adopted vector
moves. After the inventory update it exits 0 (33 targets, 14 proposal decisions, 12 artifact hashes).

| Contract | Read on 2026-10-28 -> now | Consequence for this product |
| --- | --- | --- |
| DEVICE-EXCHANGE | 1.10 -> 1.11 | Section 34, items DZ-EM. DZ: `vectors/fmsw-245-completion/` (eight administration streams over the WebSocket opening) is the superset the operator replay may use (S0014). EA: the eight proposed listing operations stay uncarried and no operator view returns content (S0014, S0034). EB: a later connection-string prefix shows the local row `format-unsupported`, no update demand (S0012). EC: the WebSocket refusal artifacts are separate and not filed yet; this product's own tests stay the evidence (S0012). ED: `host:port` on the face of every password or pairing-code surface before the field takes focus (S0012, S0034). EF: one answered request awaits per control stream (S0012, S0013). EG: roles at `enroll` are capabilities, no `broadcaster` (S0012). EH, EI: a sealed relay receiver finds the record flag by trial and reads `user`, else `username` (S0016). EL: a nameless received value is saved as `clipboard-<yyyyMMdd-HHmmss><ext>` from `storedAt` in UTC (S0013). Not applicable: EE (the browser owns trust, the page never pins), EJ-EK (Drive channel, feature matrix row 127, later), EM (publishing a folder, row 31, never) |
| APP-SETTINGS, APP-STYLE, APP-BEHAVIOUR, WINDOWS-UI | 0.7 -> 0.8, 0.13 -> 0.14, 0.13 -> 0.14, 0.10 -> 0.11 | APP-STYLE: a state-filled surface carries a word and a `status.*` glyph (S0029, S0013). APP-BEHAVIOUR rule 10: a page persists after a settled interval and flushes once on `pagehide` (S0028). APP-SETTINGS rule 9 concerns a settings surface that is the main window, which the browser's settings route is not. WINDOWS-UI stays not applicable |
| CONTEXT-HELP | 0.1 -> 0.2 | Section 7: `inherit` surfaces answer F1 with the parent's help, `ask: "off"` where an input contract forbids a control, help pages `noindex` and out of the sitemap, targets by BUTTONS / UI-SIZING; the catalog's reference `help.css` owes the COLLAPSIBLE-GROUP triangle before it is vendored (S0031) |
| MEDIA-CLASSIFICATION | 0.12 -> 0.13 | `.tif`, `.cb7`, `.cbt`, `.azw3`, `.html`, `.htm` join the categories; classification promises no viewer (S0023) |
| INPUT-PARITY, INPUT-CHORD | 0.4 -> 0.5 | "Applicable" defined, the viewer table governs viewers, `help` / F1 added; the regenerated chord vectors are owed by their generator, no replay claimed (S0023, S0031) |
| ICON-SET | 0.36 -> 0.37 | `nav.menu`; `source.exchange-server` drawn as the exchange mark's one-tone glyph; Skip split into `media.next` and `action.skip`; the exporter run is owed by its owner (S0028, S0036) |
| EXCHANGE-MARK | 0.3 -> 0.4 | Text only (rules 8, 10, 14); `artwork/VERSION` stays 0.3 (S0036) |
| DOC-INTERNAL-QUALITY, DOC-EXTERNAL-QUALITY | 0.10 -> 0.11, 0.12 -> 0.13 | The registry path the configuration names governs (S0040); help pages from a CONTEXT-HELP source carry `noindex` (S0031) |
| TASK-FLOW | 0.8 -> 0.10 | Rule 26 stop-with-kill scope and the dispatcher's `run.error` event: canon harness behaviour, nothing changes here |
| PAGE-STYLE, SITE-FAMILY-MAP, SITE-STRUCTURE, SITE-EXPERIENCE | 3.4 -> 3.5, 1.9 -> 1.10, 0.3 -> 0.4, 0.4 -> 0.5 | Conditional on S0022: locale queries (`ua` read as `uk`), the Windows row type, no roadmap or "planned" label (already canon invariant 17 here), touch targets by BUTTONS / UI-SIZING |

No new contract names this product as a consumer. The TEST-LAB-WEB profile that the consolidation leaves to the
sza.od.ua hub will be the browser profile S0038 reports against; TEST-LAB 0.1 is unchanged. No defect in the new
text needs a proposal from this product. The registry rows of section 2 (DEVICE-EXCHANGE, MEDIA-CLASSIFICATION,
INPUT-PARITY, INPUT-CHORD, ICON-SET, CONTEXT-HELP, EXCHANGE-MARK) and the section 4 migration entry are brought to
these versions; no `Implements` cell advances and the entry's `until` stays 2026-11-30.

**Verdict 2026-10-29:** the reading side is current and its gate is green; every remaining obligation sits in a
named carrier ticket, all of them still `Draft` or `In Progress`. S0033 waits on those carriers' closing audits and
re-reads the catalog when they land; the release check `py -3 tools/contract-audit.py` fails again at the next
catalog version move until the inventory is re-read.

## Re-audit 2026-11-08

The canon re-sync S0042 ran contract-sync. `py tools/contract-audit.py` exited 1 on one drift, TASK-FLOW 0.10 -> 0.13:
rule 65 (the queue sync registers a ticket file that has no row), the `rank` order of rules 44, 45 and 63, and
`pq arrange`. All three are dispatcher behaviour of the canon harness; nothing changes here. Every other target is at
its catalog version.

Every contract whose `consumers` line names this product or every product is in the inventory, except INSTALL-TRUST
("every product shipping an unsigned or unreputed artifact"), which does not apply: a page served by a browser ships no
installer. Proposals filed since 2026-10-29 against contracts read here bind nothing until decided, and none names this
product. Rows were added or corrected in the catalog registry: the tooling rows are re-verified at REPO-STAMP 0.13,
HARNESS-PROFILE 0.14, REPO-LAYOUT 0.11 and RULE-DELIVERY 0.12; TASK-FLOW stays `pending` at 0.13; new rows hold the
consumed contracts that had none (APP-SETTINGS, APP-STYLE, APP-BEHAVIOUR, DOC-INTERNAL-QUALITY, TEST-LAB). The one
`Implements` value is `partial 0.11` on the DOC-INTERNAL-QUALITY row, for the document registry that exists; no
application row advances and the section 4 entry's `until` stays 2026-11-30.

The seven compatibility questions of contract-sync have no code to answer them: `web/` does not exist, so the checklist
above stays the implementation checklist of its carriers. The catalog's vectors have no product test to run against.

**Verdict 2026-11-08:** the reading side is current; every remaining obligation stays in its carrier.

## Re-audit 2026-11-12 (S0049)

The catalog consolidation of 2026-11-12 moved 15 of this product's 33 targets after the inventory of 2026-11-11 was
written; `py tools/contract-audit.py` exited 1 on 15 version drifts (CONTEXT-HELP, the sixteenth, was read at 0.3 by
S0031 the same day). Every step is additive or a clarification: no envelope, member, reason, `schemaVersion` or adopted
vector moves, and a product that recorded the earlier version does less, not wrong. After the inventory update and
`--render` the check exits 0 (33 targets, 14 proposal decisions, 12 artifact hashes).

| Contract | Read on 2026-11-11 -> now | Consequence for this product |
| --- | --- | --- |
| BUTTONS | 2.0 -> 2.1 | Section 9: the touch naming sentence binds every icon-only command on a touch surface; the accessible name serves assistive technology, a `title` is never a touch route, and a sighted touch user gets a caption under `pointer: coarse`, a menu listing or a press-and-hold (S0028, S0032) |
| SETTINGS-NAVIGATION | 2.0 -> 2.1 | A panel of settings controls inside another screen is a destination of the one settings surface; a phone in portrait is a narrow viewport; a child row that only names a block may carry no glyph (S0028, S0032) |
| APP-STYLE, WINDOWS-UI | 0.14 -> 0.15, 0.11 -> 0.12 | APP-STYLE items F and G: optional refining glyphs `status.stopped` and `status.not-proven` on the warning and unknown fills. WINDOWS-UI section 17, a movable floating panel of a native viewer: the browser viewer offers none, so it stays not applicable |
| DEVICE-EXCHANGE | 1.11 -> 1.12 | Two files. Binding: EU (`admin-disabled` and the administration wrong-password row), EV (idle window, `admin-session-ended`, no client clock), EX (a typed `host:port` names an administration target, no default port), FB (`e2e-missing-peer`), FE (the message table is eleven places, a consumer vendors all), ET (a limit may be a working default), FF (item DW is a permission; the browser prepares nothing) - S0012, S0013, S0014, S0029, S0034. Bound to nothing: EN-ER (a web device holds no `appId` in 1.12), EW (the browser never pins), ES and FC-FD (the Drive channel, feature matrix row 127), EZ and FA, EY (the producer's evidence) |
| LIVE-BROADCAST | 1.6 -> 1.7 | Items V-X: what a missing optional endpoint member means to the future receiver - latency defaults by transport, the descriptor's mode, transport from a plain scheme, an unreadable endpoint skipped, 2000 for an unread `keyframeIntervalMs` (S0016) |
| INPUT-PARITY | 0.5 -> 0.6 | A rotary crown (Wear OS) column is seeded in section 4; nothing changes for a browser, INPUT-CHORD stays 0.5 |
| ICON-SET | 0.37 -> 0.39 | `app.behavior` (0.38) and `action.unarchive` (0.39) are added; no surface here uses either (a text search over `web/` and `tests/` finds no match); the exporter run stays owed |
| DOC-INTERNAL-QUALITY, DOC-EXTERNAL-QUALITY | 0.11 -> 0.12, 0.13 -> 0.14 | Items V and W: a generated file is a render with a registered generator and a drift check - the pointers here are registry rows with role `render`, renderer `py -3 tools/contract-audit.py --render`, and this tool is their drift check. Items T and U: `hreflang` and canonical rules for `?lang=` views, when a page is published (S0022) |
| HARNESS-PROFILE | 0.14 -> 0.16 | Optional `commands.compileCheck` (not declared: no compile step here) and `runner.effortByModel`; the profile stays valid unchanged |
| TASK-FLOW | 0.16 -> 0.24 | Canon harness behaviour and optional run-row fields (rules 7, 23, 26, 46, 62, 67 and the cross-repository blocker); nothing changes here |
| PAGE-STYLE, SITE-FAMILY-MAP, SITE-EXPERIENCE | 3.9 -> 3.10, 1.11 -> 1.12, 0.5 -> 0.6 | Conditional on S0022: release facts are build-time facts rendered from a release manifest and never typed by hand (this stack has no build step, so S0022 decides how); the family map's Type cell may be rendered in the page's language |

No contract outside the inventory names this product as a consumer: the catalog's `consumers` lines were searched, and
INSTALL-TRUST ("every product shipping an unsigned or unreputed artifact") stays the one that does not apply. The older
sentences of the interface rows ("No buttons exist", "No settings surface exists", and the like) predate the shell of
S0028 and are carried unchanged: their re-read belongs to S0032, the carrier of those rows, which waits on its own
blockers. The catalog registry rows of this product (`Reads` cells, at the versions of the earlier re-audits) are not
touched by this pass: the registry is a shared file with a writer active today, and S0033 re-reads the catalog and its
registry rows when its carriers land.

**Verdict 2026-11-12:** the reading side is current at the catalog versions of 2026-11-12 and its gate is green; every
remaining obligation stays in its carrier.

## New target 2026-11-12 (S0051): DIAGNOSTIC-REPORT 0.15

`SETTINGS-NAVIGATION` 2.1 section 3 rule 3 lists a user-initiated diagnostic bundle export among the resources every
About page carries, and S0048 built that export, so this product consumes `DIAGNOSTIC-REPORT` although the contract's
`consumers` line does not name it. The inventory has a row for it (role consumer, state partial, carrier S0048) with its
pointer `DIAGNOSTIC-REPORT.md`, rendered by the tool; the check exits 0 (34 targets, 14 proposal decisions, 12 artifact
hashes) and the document registry holds the pointer as a render record.

| Clause | Reading for this product |
| --- | --- |
| Rule 2, section 8 B | `environment.txt` is `KEY=value` lines opening `schema_version=1`, every key from one allowlist; no volume-metric family exists to count, which section 8 B and the 2026-10-29 item 3 allow |
| Rule 3, sections 7 and 8 C | Redaction by value at the log sink and again at export, before truncation; the three structured-value vectors, userinfo, signed query parameters, the credential-in-path shape |
| Section 10 | Exchange login, server address, device token, pairing code and certificate fingerprints are redacted; no account file or identity enters the bundle |
| Rule 5 | The archive is built only on the person's command; the export path holds no network call |
| Section 8 A, 8 D | Stored ZIP named `FastMediaSorterWeb-logs[-version]-yyyyMMdd-HHmmss.zip`; no JSON envelope (no copy-to-clipboard diagnostic surface); the session log is an in-memory ring, tail-only, with the `LOG COMPACTED` marker and `kept_head_bytes=0` |
| Amendment 2026-10-29 items 2 and 3 | The personal-path placeholder carries no profile name; an unreadable value is written `unavailable` |
| Amendment 2026-10-17 and 2026-10-29 item 1 | Bind nothing today: the `LOG OMITTED` marker is written only for an oversized untrusted source or an archive budget, and the product has neither |

Evidence is the direct call of S0048 (45 checks, 0 failed; the archive read by Python and .NET). The release rung
(`tests/diagnostic.html`, and the About block observed in each engine of the support floor) is owed and keeps the row at
`partial`. The catalog registry row for this product is added under the registry's own rule (a project session edits
its own rows): role C, `Reads` 0.15, `Verified` pending.

## Re-audit 2026-11-14 (S0033)

Twelve of the eighteen carriers of S0033 have landed since 2026-10-29, and the catalog moved eleven of this product's
targets after the inventory of 2026-11-13. `py -3 tools/contract-audit.py` exited 1 on eleven version drifts; after
the inventory update and `--render` it exits 0 (34 targets, 14 proposal decisions, 12 artifact hashes). Every step is
additive or a clarification: no envelope, member, reason, `schemaVersion` or adopted vector moves.

| Contract | Read on 2026-11-13 -> now | Consequence for this product |
| --- | --- | --- |
| UI-SIZING, BUTTONS, BOOLEAN-OPTION, COLLAPSIBLE-GROUP | 1.1 -> 1.2, 2.1 -> 2.2, 2.0 -> 2.1, 1.1 -> 1.2 | Wear OS app surfaces under a watch profile: the toolkit's chips, toggles and group header on a round display are permanent variants or dated exceptions. A browser has no round display, so no clause binds here |
| CONTEXT-HELP | 0.3 -> 0.4 | Section 9, items L-O: a Wear OS app screen is a surface with no button and no key by default. Nothing changes for a browser route |
| INPUT-PARITY | 0.6 -> 0.7 | Section 3.3, items K-L: a touch-locked screen and the exit of it. A browser has none; no filled cell changes, INPUT-CHORD stays 0.5 |
| ICON-SET | 0.39 -> 0.40 | Six `proposed` meanings (`view.compact`, `app.animations`, `app.units`, `media.visualizer`, `view.full-resolution`, `view.halo`) for the reference product. A text search over `web/` and `tests/` finds no use |
| ICON-RENDER | 0.24 -> 0.25 | Section 25: a sibling set draws a glyph on every member or on none. The one obligation of this pass that touches the interface; read against the tree below |
| DOC-INTERNAL-QUALITY | 0.12 -> 0.13 | Item X: the optional `contract` field of a registry record. 22 records of `docs/DOCUMENT_REGISTRY.jsonl` carry it; a reader that ignores it conforms, there is no gate |
| HARNESS-PROFILE | 0.16 -> 0.17 | Rule 13: the optional `extraction` block of a derived product. This product is not derived; the profile stays valid unchanged |
| TASK-FLOW | 0.25 -> 0.26 | Rule 69: the status tool writes `Blocks:` lines under `## Blocked tickets` in each blocker's spec and releases the waiting ticket on the blocker's next move. Canon harness behaviour, nothing changes here |

**ICON-RENDER 0.25 section 25 against the tree.** The start screen's entries, the settings rail's destinations and the
settings page's two group headers (theme, language) carry a glyph on every member. The choice groups of the local screen
and the viewer, player and slideshow bars carry none on any member. The local list draws `content.folder` on a folder row
and, on a file row, the file's own thumbnail or a kind badge, which reads as the stand-in of rule 3. One pair is mixed:
in the command row of the local screen, Open folder carries `content.folder` and Open files carries none
(`web/ui/local-view.js`, `openRow`). Section 25 names a toolbar only as a set boundary (rule 2), so whether a command row is
a sibling set is not stated. Recommended correction, carried to S0032: decide in its acceptance walk, then either give
both commands a glyph or file a dated clarification proposal beside `ICONOGRAPHY`; until then the row says `partial`.

**What the carriers' closing audits evidence** (read, not re-run; every statement below is the carrier's own at its own
rung, and every browser rung is `RELEASE`):

| Carrier (status 2026-11-14) | Evidence of the closing audit | Rows it moves |
| --- | --- | --- |
| S0014 operator client, S0034 `#admin` entry (BlockNeedUserTest) | `run-replay.mjs` `REPLAY: PASS` 15 of 15 executed; `tests/admin.html` headless Chrome `SMOKE: PASS` 23 and 26 checks; `REPLY-CODES: PASS` 10 codes, 30 texts; QR decode `PASS` 17 of 17. Real server and hidden-tab run are the owner's | DEVICE-EXCHANGE (operator slice) |
| S0023 browsing and viewing (Implemented) | `direct.mjs` 17 ok, `direct2.mjs` 18 ok, 0 FAIL | MEDIA-CLASSIFICATION, MEDIA-VIEWER, INPUT-PARITY |
| S0024 sort to destination folders (BlockNeedUserTest) | `move-check.mjs` `DIRECT: PASS` 13, `app-check.mjs` 33, `static-check.mjs` `STATIC: PASS`; the owner's floor-browser run is open | MEDIA-VIEWER rule 4, INPUT-PARITY |
| S0025 player (Implemented) | `direct.mjs` 49 ok, 0 FAIL | MEDIA-VIEWER, INPUT-PARITY |
| S0026 animated images (Implemented) | fixture builders by direct call, `ffprobe -count_frames` matches; EXIF cases in `tests/images.js` | MEDIA-VIEWER rules 3 and 6 |
| S0027 slideshow (Implemented) | `direct.mjs` 50 ok, 0 FAIL | MEDIA-VIEWER, INPUT-PARITY |
| S0028 shell, languages, themes (Implemented) | key parity 34/34/34, routes, fallbacks by direct call; `tests/shell.html` is release tier | UI rows (source only), SETTINGS-NAVIGATION, APP-SETTINGS, APP-STYLE, APP-BEHAVIOUR, ICON-SET, ICON-RENDER, ICON-EXTERNAL |
| S0031 help (Implemented, audit outcome Partial) | `DIRECT: PASS`, 56 entries; 8 PASS, 1 WARN, 3 MANUAL, 2 RELEASE | CONTEXT-HELP |
| S0036 exchange mark (Implemented) | `exchange-mark: PASS (5 of 45 manifest files vendored, 1 inline)` | EXCHANGE-MARK (row already `partial 0.3`) |
| S0038 test lab report (Verified), S0040 document registry (Verified), S0048 diagnostic export (Implemented) | rows already advanced by their own tickets | TEST-LAB, DOC-INTERNAL-QUALITY, DIAGNOSTIC-REPORT |

`Implements` cells moved to `partial` in the catalog registry on 2026-11-14: DEVICE-EXCHANGE 1.12 (operator slice only),
MEDIA-CLASSIFICATION 0.13, MEDIA-VIEWER 1.0, INPUT-PARITY 0.6, INPUT-CHORD 0.5, CONTEXT-HELP 0.3, ICON-SET 0.39,
ICON-RENDER 0.24, ICON-EXTERNAL 0.12, SETTINGS-NAVIGATION 2.1, APP-SETTINGS 0.8, APP-STYLE 0.14, APP-BEHAVIOUR 0.14,
DOC-INTERNAL-QUALITY 0.13. UI-SIZING, BUTTONS, BOOLEAN-OPTION and COLLAPSIBLE-GROUP keep `-`: their contracts ask for
showcases, captures and measurements that do not exist yet. LIVE-BROADCAST keeps `-`. `Verified` stays `pending` on every
advanced row except DOC-INTERNAL-QUALITY and HARNESS-PROFILE, which carry 2026-11-14 for the checks named in their rows;
no row claims an engine observation. The catalog's own gate, `check-contracts.ps1 -Json`, exits 0 with the
informational warnings CTR-STALE and CTR-LAG only.

**Still open, by carrier.** S0011 (sealing replay and the device key; BlockExternal, the environments of S0008), S0012,
S0013, S0016, S0029 (all behind S0011 or S0012) and S0032 (the acceptance walk of the unified UI; About's version, site and
support addresses wait on S0020 and S0022). The catalog migration entry's `until` is 2026-11-30 and is renewed only by a
dated plan: S0032 owns that plan, because the entry names it as the source of the date.

**Verdict 2026-11-14:** the reading side is current at the catalog versions of 2026-11-14, the registry rows and the
migration entry describe the tree as it is, and the gate is green. Browser, device and joint-replay evidence stays
unperformed and is not claimed.
