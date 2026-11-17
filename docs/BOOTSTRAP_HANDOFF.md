# Bootstrap handoff - FastMediaSorter Web (the exchange web client)

The starting brief for this repository, written on 2026-10-15 by the FastMediaSorter Android session of its
ticket S4246 (`P:\ANDROID\FastMediaSorter_mob_v2\PLAN\S4246_exchange-web-client-skeleton.md`; a verbatim copy
of that strategic spec, in Russian, is `docs/origin/S4246_exchange-web-client-skeleton.md`). It is an input,
not a living document: once this repository has its own ticket store, the open items below become tickets
here, and this file is kept as the record of where the product came from.

## 1. Decision

- The web client of the device-exchange server lives in this separate repository (ADR-2 of S4246, owner
  2026-10-14). The owner named the home on 2026-10-15: `P:\WEB\FastMediaSorter_WEB`.
- The web client is **one more device of an account** under the contract `DEVICE-EXCHANGE` (ADR-1 of S4246):
  the same envelopes, the same refusal reasons, the same `member` and `guest` rights, the same sealed content
  as the native programs. No second protocol is invented for the browser.
- The exchange server stays where it is - in FMS_W, `P:\WINDOWS\FastMediaSorter_Lite\exchange-server` (Go). This
  product does not replace it, fork it or ship it.
- The only coupling to the other products is the shared contracts catalog. No shared code, no shared build, no
  shared release.
- Why a separate repository: the web client belongs neither to the phone program nor to the desktop program and
  must evolve on its own calendar; a module inside either would tie two release cycles together for good.

## 2. Product

Goals:

1. A person with an invitation registers an account and signs in from a current browser on any operating
   system, without installing a program.
2. A person deletes the account from the browser; the server erases everything by item AU of the contract.
3. A person works with the account as with one more device: sees the account's devices, resources and
   broadcasts, sends and receives the clipboard.
4. The server's owner (the operator) performs the operator operations from a browser, without sitting at the
   server machine.
5. No existing program changes: the web client is an ordinary participant, and the contract only gains members.

Non-goals:

- Not the exchange server, and not a replacement for it.
- Not a public server and not registration without an invitation (item AZ).
- No e-mail and no password reset by e-mail: a forgotten password is reset by the operator, or a new account is
  made (owner answer В9 of milestone S4203).
- No terms of use and no "report" button (owner answer В38; item AZ says why).
- No paid path: no paid hosting, no paid certificate, no paid DDNS (owner answer М1).
- Not a replacement for the native programs: schedules, sharing a phone's folders and background work stay with
  them.
- No publishing of folders and no broadcasting from the browser in the first release (research items 5 and 6).

## 3. Owner decisions already taken

- **Name and home:** `FastMediaSorter_WEB` at `P:\WEB\FastMediaSorter_WEB` (2026-10-15). Whether that is also
  the public name is open (section 4).
- **Who it is for:** the device exchange is designed for one person moving content between his own devices.
  Relatives and strangers are the edge case, covered by a link with a password or PIN or a guest invitation,
  never by a rights model. Take the simplest behaviour; make any limit a host setting, not a built-in guard;
  raise a concern only for store policy or silent data loss (owner, 2026-10-14, answering the S4203
  questionnaire).
- **Owner wishes** (S4246 section 3.1):
  - A link or connection string carrying an invitation opens a page with the invitation already filled in: the
    person only invents a login and a password.
  - The same EN/RU/UK words and the same table of connection messages as the programs - section 25 of
    `DEVICE-EXCHANGE` (items CV to DA; dictionary, program names in item CX, the check ladder in item CY, the
    message table in item CZ). No words of this product's own for those terms.
  - Receiving the account's broadcasts comes before broadcasting from the browser.
- **Hard constraints** (S4246 section 3.2):
  - TLS 1.2 at least (item AX); a password, a token and a pairing code travel only inside TLS.
  - At most one password check per second, no lockout (item AW).
  - No operation shows a password, a token, an invitation after its creation or a resource's `access` (item AZ).
  - The device's private key never leaves the browser and never reaches a log or an export (item DF); content is
    sealed by section 27 and the server cannot read it.
  - Localization: EN/RU/UK in the same edit as the interface; other languages are this repository's decision.
  - Accessibility: full keyboard control, state never shown by colour alone, a label on every field and button.
- **Contracts are final law.** `DEVICE-EXCHANGE` and `LIVE-BROADCAST` were declared 1.0 on 2026-10-15
  (FastMediaSorter S4245). Only a backward-compatible change may land - a new optional member, a new dated
  amendment; anything an older reader would do wrong is a MAJOR. Every change this product needs (section 6) is
  therefore an additive amendment written in the catalog first.

## 4. Open owner decisions

Ask each one once, in question-with-options form, before the phase that needs it - never before. Research items
of section 5 that end in an owner choice are marked there.

1. **Stack** (S4246 item 10 - the owner's decision when the project is created; not yet taken). Facts measured
   on this workstation on 2026-10-15: Go 1.26.4 at `C:\Program Files\Go` (not on the Git Bash `PATH`), Python
   3.12.10, git 2.53; Node, npm and npx are **not installed**. Candidates to put to the owner:
   - Static HTML, CSS and ES modules with no build step, dependencies vendored. Needs no toolchain, can be
     served by any host or by the server itself, and the browser's own WebCrypto already has ECDH P-256, HKDF
     and AES-GCM - the primitives section 27 is built from.
   - Go compiled to WebAssembly. Go is installed; the binary is large, and no code may be shared with the FMS_W
     server (section 1), so the gain is the language only.
   - TypeScript with a bundler. Type safety; requires installing Node first.
2. **Public name, GitHub remote and visibility.** Nothing is pushed until the owner names them.
3. **License.** The sibling products are MIT.
4. **Site.** Whether the product gets a page and joins the family map (`SITE-FAMILY-MAP`).

## 5. Research items carried from S4246

Each is its own research ticket here. Status on 2026-10-15: all Open.

1. **Where the page lives.** Served by the server itself on its one port (an HTTP path inside TLS already
   exists for the relay), a separate static address of the operator, or the portal page. A portal page cannot
   talk to a server with a self-signed certificate - the browser refuses; a page served by the server lets the
   server substitute the script (risk 1 below). Ends in an owner choice.
2. **How the browser talks to the server.** A browser opens no raw TCP stream. Candidates: the contract's frames
   inside a WebSocket on the same port; a gateway beside the server; HTTP endpoints with the same refusal
   reasons. Lead, not a conclusion: inside TLS the server already treats a first byte that is an ASCII letter as
   an HTTP/1.1 request (`DEVICE-EXCHANGE` 7.1), and its HTTP handling is in `internal/wire/http.go` and
   `internal/rendezvous/relay_handler.go` - a WebSocket upgrade on that path is the candidate to measure first.
   Whatever is chosen is an amendment to 7.1 and an FMS_W change (section 6). ADR-1 forbids a second protocol.
3. **Certificate trust in the browser.** A page cannot pin a self-signed leaf by fingerprint the way item D
   asks. Candidates: show the fingerprint and ask the person to compare it; recommend a free CA certificate for
   a server with a domain (М1 allows only free paths); accept the browser's warning as the one step. Needs the
   wording of item D for a client that cannot see the certificate. Ends in an owner choice.
4. **Operator sign-in for web administration.** Today the operator channel is local to the server machine and
   absent from the wire (item BR). Candidates: a separate operator password in the server settings; the same
   account with a kind `operator`; access from the server machine's own address only. Needs brute-force
   protection on a public port, its own pace rule after item AW, and a contract amendment. Off by default.
   Ends in an owner choice.
5. **Folders in the browser.** Folder content travels inside SSH between consumer and producer through a tunnel;
   reading it needs an SSH client in the page. Candidates: not in the first release; list and download one file;
   full browsing.
6. **Broadcasts in the browser.** Playing MPEG-TS (H.264 and AAC) from sealed records - transmuxing in the page
   and Media Source Extensions; sound only in the first release; broadcasting from the browser later, by a
   contract amendment. Check which format browser encoding gives and whether it fits the shapes of 7.6.
7. **Clipboard and browser memory.** The account limit `clipboardBytes` defaults to 5 GiB (item BZ); a page
   cannot hold that in memory. Candidates: stream to disk through the browser; a smaller page limit with a clear
   refusal. Which contract reasons fit a limit the server did not set.
8. **Device key and HPKE in the browser.** HPKE Auth by RFC 9180 (DHKEM P-256) - built from WebCrypto primitives
   or taken from a reviewed library. The proof is passing every vector of `vectors/e2e-v1.json`; the key is kept
   as a non-extractable WebCrypto key between sessions. Clearing site data equals losing the device: the account
   gains a new device with a new `deviceId`.
9. **Account-deletion address for the stores.** Each user runs his own server, so no single deletion URL exists.
   Candidates: the FastMediaSorter portal page explaining it with a link to the action on the server; the web
   client's page on the owner's server. What Play's Data safety form requires for a server the app does not
   have. The answer also changes FastMediaSorter Android (it keeps S4246 open for that, section 9).
10. **Name, stack and home.** Home and working name are decided (section 3); the stack is open decision 1.

## 6. Contracts

The catalog is `P:\Contracts`; name it in exactly one place in this repository's rules, cite contracts by id
everywhere else. Versions as read from the catalog registry on 2026-10-15 - re-read the registry, do not trust
these numbers later.

- `DEVICE-EXCHANGE` 1.1 (`device-exchange/`) - this product is a device client. Sections to read first:
  - 3 roles, with items Z (a consumer is complete alone), AZ (who registers, what the operator does) and CE (the
    one list of `product` values and roles).
  - 5 accounts: items AO to AU (kinds, invitations, `register`, limits, password change, deletion), AW (pace),
    5.5 and item AR (connection string and its invitation key `i`).
  - 6.1 device record; 7.1 framing, TLS and the one port, with items D, T, V, AX, AY; 7.4 directory; 7.6 the
    relay (`GET /v2/b/<broadcastId>/stream`); 7.10 reasons.
  - 22 the clipboard (items BU to BZ); 25 words, names and messages (items CV to DA); 27 sealed content (items
    DF to DH, DK to DM).
  - Vectors: `vectors/e2e-v1.json` (section 27; its replay by a second product is owed before that product's
    first sealed send), `vectors/fmsw-224/` (account lifecycle frames, items AO to AZ),
    `vectors/connection-string-v1.json`, `vectors/server-frames-v2.json`.
  - Amendments this product will need, each additive and written in the catalog first: a `product` value for
    the web client in item CE and its name in item CX; the browser transport in 7.1 (research item 2); the
    operator surface on the wire, if web administration uses it (research item 4); item D's wording for a
    browser (research item 3).
- `LIVE-BROADCAST` 1.0 (`live-broadcast/`) - receiver of `RELAY` endpoints, including the optional `seal` member
  (item Q, the mirror of `DEVICE-EXCHANGE` items DK to DM).
- `REPO-STAMP` / `HARNESS-PROFILE` / `REPO-LAYOUT` / `RULE-DELIVERY` (`rule-adoption/`) and `TASK-FLOW`
  (`task-flow/`) - this repository is an adopter; the canon adoption and the task-flow set-up cover them.
- `PAGE-CONTENT` / `PAGE-STYLE` / `SITE-FAMILY-MAP` - only if the owner decides on a site (decision 4).

A change the FMS_W server must make reaches it as a proposal file in the catalog beside the contract (the
`PROPOSAL-<date>-<slug>.md` pattern already used in `device-exchange/`), which FMS_W turns into its own ticket.
This repository never edits the server.

## 7. Where to read first

- The exchange server, **read-only from this repository**: `P:\WINDOWS\FastMediaSorter_Lite\exchange-server`.
  Packages under `internal/`: `wire` (framing, `http.go`), `rendezvous` (`stream.go`, `relay_handler.go`),
  `accounts`, `admin`, `clipboard`, `connstr`, `password`, `limits`, `tlsid`, `tunnel`. FMS_W's ticket 224 is the
  account lifecycle the vectors in `vectors/fmsw-224/` come from.
- FastMediaSorter Android, **read-only**, the reference client for the same behaviour:
  - Section 27 sealing, unit-proven against `vectors/e2e-v1.json`:
    `app_v2/src/main/java/com/sza/fastmediasorter/data/security/e2e/` (`E2eHpke`, `E2eKdf`, `E2eAead`,
    `E2eP256`, `E2eDeviceKey`, `E2eClipboard`, `E2eBroadcastSeals`).
  - The connection-string reader: `app_v2/src/main/java/com/sza/fastmediasorter/domain/model/ExchangeConnectionString.kt`.
  - Tickets in `P:\ANDROID\FastMediaSorter_mob_v2\PLAN\` (moved to `PLAN/archive/` after the release that ships
    them): S4223 (registration and account lifecycle in the phone program - the behaviour model), S4219 (section 25
    words and messages), S4243 (the portal page about accounts and deletion - the stand-in until this product
    exists), S4214, S4216, S4217, S4239 (the contract amendments for accounts, clipboard, roles, sealing), S4203
    (the exchange milestone; this product is key SK1 of its section 12; the owner answers cited here as В and М
    numbers are recorded there).

## 8. Suggested phase order

Each phase is its own ticket in this repository's store, with its own verification level.

1. Canon adoption (`/sza:adopt-canon`, new-repository mode), contract pointers (`/sza:contract-sync`), the ticket
   store and the release queue (`/sza:task-flow-init`); sections 4 and 5 of this file become tickets.
2. Research tickets for items 1 to 4 and 8, then the owner's choices: stack, where the page lives, the transport,
   certificate trust, operator sign-in.
3. Contract amendments in the catalog (section 6), and the proposal to FMS_W for its server half.
4. Crypto core: the device key pair as a non-extractable key, HPKE Auth seal and open passing `vectors/e2e-v1.json`.
5. Account: the connection string and invitation (`vectors/connection-string-v1.json`), `register`, `enroll`,
   password change, sign-out, `account-delete`, replayed against `vectors/fmsw-224/`.
6. The device view: devices, resources and broadcasts of the account from `directory` and `changed`; the
   clipboard sent and received.
7. Operator administration (after research item 4).
8. Receiving broadcasts (after research item 6).
9. Folders through a tunnel - only if research item 5 says so.
10. How the product is served or distributed, and a first dry run against a real FMS_W server.

## 9. Acceptance - the product is done when

1. A person with an invitation, in a browser on a system without any of our programs, registers an account and
   signs in.
2. That browser's entry is in the account's device list under a clear name and can be deleted from another device.
3. A person deletes the account from the browser; the server erased everything by item AU, the login is free
   again, and the browser forgot the entry and the key.
4. The operator, in a browser, creates and withdraws an invitation, resets a password, deletes a device and an
   account; no operation shows a password, a token or an invitation after its creation.
5. A clipboard value sent from the browser reaches another device of the account, and the other way round; the
   server never sees the content.
6. An account broadcast opens and plays in the browser, if receiving made the first release.
7. Every existing program works unchanged against a server where the web client is enabled.
8. Error texts are the programs' texts, from `DEVICE-EXCHANGE` section 25, in EN, RU and UK.
9. The honest text of section 27 is shown verbatim, together with whose page this is when the server itself
   serves it.

What stays in FastMediaSorter Android: its ticket S4246 waits (`BlockExternal`) for this product's public address
- then the portal page about accounts (S4243) and the account-deletion address of research item 9 point here.

## 10. Risks carried from S4246

- A page served by the server can be substituted by the operator, who then reads keys and content - that breaks
  the promise of section 27. Mitigation: the honesty text says so plainly; research item 1; a page with an
  integrity check.
- Self-signed certificates teach people to click "accept", so an interception goes unnoticed. Mitigation: show
  the fingerprint; research item 3.
- Web administration on a public port invites password guessing and account deletion. Mitigation: research item
  4, its own pace rule, off by default.
- Clearing site data erases the device key: the device list fills with dead entries and sealed content becomes
  unreadable to that browser. Mitigation: a warning on sign-out; deleting a device entry from another device.
- SSH and MPEG-TS in a browser may prove too heavy. Mitigation: the first release is account, administration,
  clipboard and lists; the rest follows research items 5 and 6.
- A second HTTP surface on the server port widens the attack surface. Mitigation: no new authentication path -
  the same `enroll`, the same pace.

## 11. Do not

- Edit `P:\ANDROID\FastMediaSorter_mob_v2` or `P:\WINDOWS\FastMediaSorter_Lite` from this repository's sessions;
  a server change goes through a catalog proposal and FMS_W's own ticket.
- Edit a contract anywhere but the catalog, and never silently - follow `P:\Contracts\_meta\RULES.md`.
- Copy a contract document into this repository - a pointer under `docs/contracts/` only.
- Invent a second protocol, a second set of refusal reasons or a second rights model for the browser (ADR-1).
- Add a paid service of any kind.
- Show a password, a token, an invitation after its creation or a resource's `access`; put a private key in a log
  or an export.
- Hand-copy the FastMediaSorter harness scripts (spec catalog, locks, leases, chat): the harness ships with the
  `sza` plugin and is adopted, not copied.
- Commit secrets, keys or certificates.
- Tag, upload or publish anything unless the owner asked for that exact release.
