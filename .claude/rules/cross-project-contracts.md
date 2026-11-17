---
paths:
  - "docs/contracts/**"
  - "PLAN/**"
---

# Contracts and sibling products - working rules

Loads with a contract pointer or any ticket. The law itself is `CLAUDE.md` section 2 and the canon's `CONTRACTS.md`.

## Reading the catalog

- Find a contract through the pointers in `docs/contracts/`, read it in the catalog, cite it by id and section. A memory, comment or plan naming an in-repo contract file is stale.
- Large contract READMEs (`DEVICE-EXCHANGE` runs to thousands of lines) are read by section window, never whole.
- `[PROPOSED]`, `[CONTRACT]`, `[NEW]` and `[BREAKING, draft]` tags name the revision that wrote an item, nothing more. Conformance ladder rungs are evidence in the registry row, not contract conditions.
- Before building any consumer, decoder or second contract file for a cross-product format, read the registry's adoption table and the contract's function folder and grep `PLAN/` for an existing consumer - even when an earlier plan says to build one.
- Before writing a spec Non-goal from a refusal found in one code path, check how FMS_A and FMS_Win handle that case elsewhere. A gate on one path is not a product limit.
- Read FMS_A and FMS_Win code to learn behaviour; copy none of it.

## Writing to the catalog

- A change this product needs reaches a contract it does not own as a `PROPOSAL-<date>-<slug>.md` beside the contract. Vectors this product produces go to `proposed-vectors/<ticket>-<date>/`; the contract owner adopts them.
- A justified local deviation is recorded in this product's own registry row: clause, scope, evidence, impact, compensation, review condition - temporary debt with `until` and a ticket.
- The registry file is hand-written by sessions of many repositories: copy it to `temp/Sxxxx/` first, change it with exact-string Edit only (never a whole-file rewrite), expect a pure-addition diff, and read foreign hunks before calling them yours.
- Before Write-ing a file you believe is new in a shared folder, re-check it on disk in the same turn; the tool saying "updated" instead of "created" means someone else's file is gone - restore it.
- Files outside this repository have no domain lock. Re-grep the anchors of an outside edit in the same step that produces the verdict; treat "modified on disk" as a second writer. If a landing is in flight, keep the change as an anchored patch under `temp/Sxxxx/` and block on the owning ticket.
- An icon and its EN/RU/UK name come from the iconography vocabulary by meaning; a missing meaning is a catalog amendment first. Glyph files are generated, never hand-edited. The brand visual is the waves-and-particles reference script, used as served, not ported.

## The exchange slice

- The server lives in FMS_Win under `exchange-server/` (Go). This repository never edits it.
- A stored `host:port` is a claim: measure the live listener (`Get-NetTCPConnection -State Listen`), then probe from the client, before theorising about transport. This workstation carries a Hyper-V virtual adapter with a LAN-looking address beside the real one.
- The owner's test exchange server address, certificate pin and login are recorded in FMS_A's agent memory; its password lives only in FMS_A's gitignored debug credentials file. Never copy the password into a tracked file.
- Design for one person moving his own content between his own devices: no rights model, no lockouts, no anti-abuse guards; any limit is a host setting.

## Sibling products

- FMS_Win's display name is "Fast Media Sorter & Sharing for Windows" (`DEVICE-EXCHANGE` item CX; the form "Fast Media Sorter for Windows" is retired); its repository URL, Pages URL, winget id and Store identity are frozen under the old FastMediaSorter_Lite name and are never "fixed". It is not FMS_A's `lite` flavor.
- FMS_A's version string is a build timestamp: compare it at date granularity, never as semver.
- StreamsPlayer (Windows) consumes the stream catalog; any stream feature here is a further consumer of `STREAM-BANK`, not a copy.
- The canon authoring checkout is `P:\WEB\sza-unified-rules`; a rule that looks wrong goes to a canon session, never patched here. A profile key crosses the deploy gap at once; a new harness library function arrives only with the next plugin version, and a local test of an undeployed harness change skips with exit 2, never fails.
