# Feature matrix - which FMS_A and FMS_Win functions the browser offers

On 2026-10-16 the owner asked, in ticket S0002, to make the functions of FMS_A (FastMediaSorter for Android) and
FMS_Win (FastMediaSorter for Windows) available "partially" - the owner's word - in a browser: Chrome, Edge, Safari
and the other popular browsers, for people on macOS, Linux, ChromeOS, iOS/iPadOS and anyone who cannot install a
program. This page takes every function of the two programs (168 rows), says what a browser needs for it, how well
each engine group can do it, which contract governs it, and proposes a verdict. Nothing here changes the native programs.

**Goal widened (owner, 2026-11-13, S0055):** FMS_Web carries every base function of FMS_A (phone and watch) and
FMS_Win that a browser page can carry, directly or through another device of the same account; the three products
look alike, develop together and are bound by the canon and the contracts. The former "later" rows read "planned - after the
first release (S0030)"; each "never" row is re-examined for a route through another device of the account (S0055),
and only what needs the operating system itself stays with the native programs. This page is FMS_Web's detailed map:
its column of the family function register (`FUNCTION-PARITY`) was seeded from these verdicts (S0058) and agrees with them.

**Status:** Verdicts proposed 2026-10-16. The owner's decision of the same day (S0002): every group with a "first release" row is in the first release - exchange account, devices, directory, clipboard and diagnosis; operator administration; local browsing, player, images and slideshow; the move to destination folder N - on the support floor of the current and the previous major version of each browser, "IE" read as Microsoft Edge; the local and the exchange tracks run in parallel.

Proposed count: 42 rows "first release", 98 "planned", 28 "never" (rows 22 and 23 moved to the first release by the owner, 2026-11-13; rows 151-168 added by the re-read of 2026-11-14, S0055) (the per-group count closes the Matrix section).

## Sources

Every source was read on 2026-10-16 unless another date is given.

- **Primary browser data:** MDN browser-compat-data (BCD) **8.1.6**, build timestamp `2026-10-15T13:35:41Z` (`__meta`
  of `data.json`; the version confirmed from the package's `package.json`).
- **Secondary browser data:** caniuse `fulldata-json/data-2.0.json` at commit `50f75b6` (2026-10-13T05:12:54Z). caniuse
  lists only the latest version for mobile agents, so BCD gives the mobile versions.
- **Live check:** a read-only probe (feature detection, `canPlayType`, `MediaSource.isTypeSupported`,
  `MediaRecorder.isTypeSupported`, WebCodecs `isConfigSupported`, WebCrypto `generateKey`) in Google Chrome 151 on
  Windows 11, on the owner's machine, 2026-10-16. Chrome 151 is four releases behind stable 155, and its HEVC results
  describe that machine only. Cited as "live Chrome 151 Win".

Machine-readable data and source code:

| # | URL | Read | What it gave |
|---|-----|------|--------------|
| S1 | https://unpkg.com/@mdn/browser-compat-data/data.json and https://unpkg.com/@mdn/browser-compat-data/package.json | 2026-10-16 | BCD 8.1.6; feature rows; `browsers.*.releases` (current, ESR, beta) |
| S2 | https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json ; commit via https://api.github.com/repos/Fyrd/caniuse/commits?path=fulldata-json/data-2.0.json&per_page=1 | 2026-10-16 | codecs, containers, HLS, PDF viewer, image formats |
| S3 | https://product-details.mozilla.org/1.0/firefox_versions.json | 2026-10-16 | Firefox 158.0, ESR 153.5.0esr, ESR115 115.43.0esr |
| S4 | https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=2 ; same with `platform=Android&num=1` ; https://chromiumdash.appspot.com/fetch_milestones?only_branched=true | 2026-10-16 | Chrome 155.0.8059.85 (Windows), 155.0.8059.84 (Android); milestone-to-branch map (M155 = 8059) |
| S5 | https://edgeupdates.microsoft.com/api/products | 2026-10-16 | Edge Stable 155.0.4283.60 (published 2026-10-15) |
| S6 | https://api.github.com/repos/mdn/browser-compat-data/pulls/30732 | 2026-10-16 | the iOS 27 getDisplayMedia row rests on a collector (API-presence) test, merged 2026-10-14 |
| S7 | https://chromium.googlesource.com/chromium/src/+/refs/branch-heads/8059/media/media_options.gni (also `+/main/`, `+/refs/tags/140.0.7339.1/`, `+/refs/tags/120.0.6099.1/`) | 2026-10-16 | build flags: HLS demuxer, MP2T MSE parser, AC-3/E-AC-3, HEVC |
| S8 | https://chromium.googlesource.com/chromium/src/+/main/media/filters/stream_parser_factory.cc | 2026-10-16 | MSE container list including `video/mp2t` |
| S9 | https://chromium.googlesource.com/chromium/src/+/refs/branch-heads/8059/media/base/mime_util_internal.cc (and branch-heads 7390, 7444, 7499, 7559, 7632 .. 8037) | 2026-10-16 | `video/matroska` registered from M145 (branch 7632); HLS MIME types; AC-3 gating |
| S10 | https://chromium.googlesource.com/chromium/src/+/refs/branch-heads/8059/third_party/blink/renderer/modules/webcodecs/audio_encoder.cc ; same branch: `media/mojo/clients/mojo_audio_encoder.cc`, `media/base/media_switches.cc` | 2026-10-16 | AAC encoding = platform encoder; on by default on Windows (not N editions), macOS, Android |
| S11 | https://raw.githubusercontent.com/mozilla-firefox/firefox/main/dom/media/mp4/MP4Decoder.cpp ; same tree: `dom/media/mediasource/MediaSource.cpp`, `dom/media/webcodecs/AudioEncoder.cpp`, `dom/media/webcodecs/WebCodecsUtils.cpp` | 2026-10-16 | Firefox MP4 codecs (no AC-3); MSE accepts only MP4 and WebM; AudioEncoder encodes only Opus and Vorbis; WebCodecs off on Android |
| S12 | https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/Modules/webcodecs/WebCodecsAudioEncoder.cpp ; same tree: `Source/WebCore/platform/audio/cocoa/AudioEncoderCocoa.cpp`, `Source/WebCore/platform/graphics/avfoundation/objc/SourceBufferParserAVFObjC.mm` | 2026-10-16 | WebKit AudioEncoder allows AAC (not ADTS); the WebKit MSE type check delegates to AVFoundation |
| S13 | https://raw.githubusercontent.com/shaka-project/shaka-player/main/lib/polyfill/mediasource.js | 2026-10-16 | Shaka rejects `mp2t` in MSE on all browsers ("TS content is broken on all browsers in general") |

Documentation and articles:

| # | URL | Published / modified | What it gave |
|---|-----|------|--------------|
| D1 | https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ | 2020-03-24 | 7-day cap on script-writable storage; Home Screen web apps keep their own day counter |
| D2 | https://webkit.org/blog/14403/updates-to-storage-policy/ | 2023-08-10 | Safari 17 quotas; `persist()` heuristics; `estimate()` |
| D3 | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | 2023-02-16 | iOS 16.4 push only for Home Screen web apps; third-party browsers can Add to Home Screen |
| D4 | https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/ | 2025-06-09 | iOS 26: every site added to the Home Screen opens as a web app by default; File System WritableStream; WebCodecs audio |
| D5 | https://webkit.org/blog/16574/webkit-features-in-safari-18-4/ | 2025-03-31 | iOS webkitdirectory; MediaRecorder WebM/fMP4/HEVC/AV1; Ogg Opus; Wake Lock in Home Screen apps |
| D6 | https://webkit.org/blog/14735/webkit-features-in-safari-17-1/ | 2023-10-25 | ManagedMediaSource on iPhone, needs an AirPlay alternative or remote playback disabled |
| D7 | https://webkit.org/blog/10855/async-clipboard-api/ | 2020-06-23 | Safari clipboard gesture rule, Paste callout, 4 MIME types |
| D8 | https://webkit.org/blog/18325/webkit-features-for-safari-27-0/ | 2026-09-17 | Safari 27.0 ships with macOS 27, iOS 27, iPadOS 27; also on macOS 26 and 15 |
| D9 | https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/ | 2026-06-08 | Safari 27 beta items (JSPI and others) |
| D10 | https://bugs.webkit.org/show_bug.cgi?id=263608 | last change 2026-05-19, status NEW | iOS Safari opens some downloads in a tab instead of downloading |
| D11 | https://bugs.webkit.org/show_bug.cgi?id=212934 | - | iPhone: full screen only for video; non-video WONTFIX |
| D12 | https://developer.chrome.com/docs/capabilities/web-apis/fetch-streaming-requests | - | request streams from Chromium 105; `duplex: 'half'`; rejected on HTTP/1.x; only 303 redirects |
| D13 | https://developer.chrome.com/docs/capabilities/web-apis/file-system-access | updated 2024-08-19 | Brave "only available behind a flag"; readwrite mode; blocked system folders |
| D14 | https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api | updated 2024-01-09 | persistent permissions from Chrome 122; otherwise access ends when the last tab closes |
| D15 | https://developer.chrome.com/release-notes/132 | - | "File System Access for Android and WebView" in Chrome 132 (pickers not named) |
| D16 | https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock | - | Keyboard Lock only in a script-started full screen; permission since Chrome 130 |
| D17 | https://github.com/brave/brave-browser/issues/44411 | 2025-03-04 / closed 2025-03-14 | Brave blocks File System Access by default; `brave://flags/#file-system-access-api` |
| D18 | https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/158 | release 2026-10-13 | JPEG XL on by default; request streaming in Nightly only; WebTransport not over HTTP/2 |
| D19 | https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/145 | release 2025-11-11 | Matroska supported (AVC, HEVC, VP8, VP9, AV1, AAC, Opus, Vorbis) |
| D20 | https://www.firefox.com/en-US/firefox/143.0/releasenotes/ | 2025-09-16 | Firefox web apps pinned to the Windows taskbar |
| D21 | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs | modified 2026-09-07 | HEVC per browser and OS; AV1 on Safari needs hardware |
| D22 | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs | modified 2026-10-13 | AAC, FLAC, Opus notes (no AC-3 entry) |
| D23 | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm (modified 2025-06-29) ; https://w3c.github.io/webcrypto/#cryptokey-interface (ED 2026-08-11) | - | CryptoKey is `[Serializable]`, listed as structured-cloneable |
| D24 | https://web.dev/articles/persistent-storage | updated 2020-05-12 | Chromium grants `persist()` silently by heuristics; Firefox prompts |
| D25 | https://developer.apple.com/app-store/review/guidelines/ (guideline 2.5.6) | - | iOS apps that browse the web must use WebKit unless they hold the EU/Japan alternative-engine entitlement |
| D26 | https://www.theregister.com/software/2026/06/17/apples-webkit-performance-tax-leaves-ios-browsers-stuck-in-the-slow-lane-says-microsoft/5257384 | 2026-06-17 | no vendor has shipped a Blink or Gecko iOS browser under the DMA |
| D27 | https://learn.microsoft.com/en-us/lifecycle/announcements/internet-explorer-11-end-of-support-windows-10 | - | the IE11 desktop app retired 2022-06-15 (Windows 10 SAC) |
| W1 | Web-search results only, not primary: https://alternativeto.net/news/2026/10/google-ships-jpeg-xl-image-format-support-in-latest-chrome-155-update/ ; https://pingoru.io/providers/mux/incidents/70280 (Mux: Chrome 142 rolls out native HLS) ; https://blog.addpipe.com/mediarecorder-api (Chrome 126 MP4 recording) ; https://github.com/mdn/browser-compat-data/issues/16823 (Web Share absent on Chrome Linux) ; the developer.dolby.com macOS OS-support page (AC-3 in Safari; unreachable on 2026-10-16) | 2026-10-16 | corroboration only |

**The two programs**, read read-only on 2026-10-16 (paths relative to each program's repository):

- FMS_A: `docs/FEATURES.md` (the eight pillars), `docs/ALL_FEATURES.jsonl` (1380 rows, grouped by `area`),
  `docs/CROSS_PROJECT_CONTRACTS.md`, the contract pointers `docs/contracts/DEVICE-EXCHANGE.md`, `LIVE-BROADCAST.md`
  and `INPUT-PARITY.md`, `docs/SETTINGS_REFERENCE.md` (section headings), `app_v2/src/main/res/menu/*.xml`,
  `app_v2/src/main/assets/input/default_bindings.json`, and its tickets S4203 (section 5.4), S4223, S4226, S4236, S4240.
- FMS_Win: `README.md`, `CHANGELOG.md` (Unreleased and recent releases), `docs/specifications/` (titles and statuses,
  active and `done/`), the `docs/contracts/*` pointers, `src/CustomHotkeys.vb`, `src/Main_Form.KeyboardInput.vb`,
  `src/Localization/Localization.ExchangeEntries.vb`, `src/Exchange/`, `src/FastMediaSorterCompanion/` (the Share
  Manager: `Core/`, `Forms/`), `exchange-server/README.md`.
- Also the section headings of the `DEVICE-EXCHANGE` catalog page (for current section numbers) and this
  repository's `docs/BOOTSTRAP_HANDOFF.md`.
- **Re-read 2026-11-14 (S0055):** FMS_A `docs/ALL_FEATURES.jsonl` (1459 rows), `docs/WHATS_NEW.md`; FMS_Win `CHANGELOG.md`
  (Unreleased and the releases since 2026-10-16). Functions found without a row are rows 151-168; smaller ones are folded
  into rows 26, 27, 128, 141 and 150. `AF:n` and `CL:n` in those rows are line numbers as of 2026-11-14. The FMS_Win
  viewer's floating toolbar panels (CL:27, SP 281) are window chrome, not a function, and got no row.

**Where - abbreviations** used in the Matrix (line numbers as of 2026-10-16):

| Short form | Means |
|---|---|
| `AF:n` | FMS_A `docs/ALL_FEATURES.jsonl:n` |
| `FE:n` | FMS_A `docs/FEATURES.md:n` |
| `KB:n` | FMS_A `app_v2/src/main/assets/input/default_bindings.json:n` |
| `MN/<file>:n` | FMS_A `app_v2/src/main/res/menu/<file>:n` |
| `src/..` after FMS_Win | FMS_Win `src/..` |
| `SM/..` | FMS_Win `src/FastMediaSorterCompanion/..` (the Share Manager) |
| `HK:n` | FMS_Win `src/CustomHotkeys.vb:n` |
| `RM:n` | FMS_Win `README.md:n` |
| `CL:n` | FMS_Win `CHANGELOG.md:n` |
| `XS:n` | FMS_Win `exchange-server/README.md:n` |
| `SP nnn` | FMS_Win `docs/specifications/nnn_*` (or `docs/specifications/done/nnn_*`) |

## Engine groups

The matrix has four engine columns. A cell covers every browser of its group; where the platforms inside a group
differ, the cell names the platform.

| Group | Browsers | Where the group splits |
|---|---|---|
| **Chromium desktop** | Chrome, Edge, Opera, Brave (Windows, macOS, Linux, ChromeOS) | Brave blocks File System Access by default (`brave://flags/#file-system-access-api`; its 2026 default is unverified). Edge: BCD shows JPEG XL as false and caniuse shows no native HLS, though the Chromium code has both; AC-3 in Edge is unverified. Opera 137 runs Chromium 153. By OS: BarcodeDetector only on macOS and ChromeOS; AAC encoding not on Linux or ChromeOS; HEVC needs a hardware decoder on Windows and Linux; Web Share on Linux unverified; whole-system audio capture only on Windows and ChromeOS. |
| **Chromium Android** | Chrome, Samsung Internet | Samsung Internet 30.0 runs Chromium 143 while Chrome is at 155, so it lacks newer engine work (MKV from 145, JPEG XL from 155). Against Chromium desktop: no screen capture, no built-in PDF viewer, notifications only through a service worker, no streaming uploads, folder input only from Chrome 132; File System Access pickers are listed by BCD (Chrome 132, Samsung 29) but caniuse says no and nobody ran them on a device. |
| **WebKit** | Safari on macOS, and nearly every iOS/iPadOS browser | Every iOS/iPadOS browser - Chrome, Edge and Firefox on iPhone included - is WebKit (App Store guideline 2.5.6; no Blink or Gecko iOS browser had shipped by 2026-06-17 - "nearly" covers the EU/Japan alternative-engine entitlement nobody has used). macOS and iOS differ: iPhone has no MediaSource (ManagedMediaSource 17.1+ with conditions), takes only video to full screen (iPad with an overlay button), shows notifications only in a Home Screen web app, opens some downloads in a tab (bug 263608), shows only the first page of an inline PDF, reads folders only from iOS 18.4, and has screen capture only as an API-presence row on iOS 27; macOS has full screen, downloads, the PDF viewer and screen capture. |
| **Gecko** | Firefox desktop and Firefox Android | Android has no WebCodecs, no screen capture and no built-in PDF viewer, but has native HLS (desktop has none); Web Share is absent on desktop and without files on Android; manifest install is absent on desktop (Windows taskbar pinning from 143), Add to Home screen on Android; folder input on Android from 142. |

## Deciding facts

The verified facts that decide most cells, each with its source (BCD feature ids are given as BCD paths).

1. **Writing back into a person's real folder is Chromium-only.** `showDirectoryPicker({mode:'readwrite'})` works in
   Chrome and Edge 86+ and Opera 72+; BCD also lists Chrome Android 132+ and Samsung Internet 29+, while caniuse says
   no for Android. Safari and Firefox have no pickers on any OS. Brave blocks it by default. (BCD
   api.Window.showDirectoryPicker; D13, D15, D17)
2. **Every iOS/iPadOS browser is WebKit**, so Chrome, Edge and Firefox on iPhone fall under the WebKit column. (D25, D26)
3. **Outside Chromium the only ways to get a file out** are an `<a download>` with a `blob:` URL (iOS 13+, with the open
   bug where some files open in a tab), Web Share with files (WebKit 14+, Chromium Android 76+, not Firefox), or OPFS,
   which the person cannot see. (BCD html.elements.a.download, api.Navigator.share.data_files_parameter; D10)
4. **Reading a whole folder works everywhere:** `<input webkitdirectory>` is in every engine, including iOS 18.4+,
   Firefox Android 142+ and Chrome Android 132+. Dropped folders give read-only entries outside Chromium. (BCD
   api.HTMLInputElement.webkitdirectory, api.DataTransferItem.webkitGetAsEntry; D5)
5. **OPFS with `createWritable` works in all three engines** (Chromium 86, Firefox 111, Safari 26), and the worker-only
   `createSyncAccessHandle` since Chrome 102, Firefox 111 and Safari 15.2. It is the only portable writable local
   store. (BCD api.StorageManager.getDirectory, api.FileSystemFileHandle.createWritable; D4)
6. **Safari may delete local state:** after 7 days of Safari use with no interaction on the site, it deletes all
   script-writable storage (IndexedDB, localStorage, service worker registrations and caches). Home Screen web apps
   keep their own day counter and WebKit does "not expect" their first-party data to be deleted - not a documented
   exemption. `persist()` is granted by heuristics. (D1, D2)
7. **Install and push on iOS are manual and Home-Screen-only:** no `beforeinstallprompt` outside Chromium; on iOS the
   person uses Share > Add to Home Screen (from iOS 26 every added site opens as a web app by default). Notifications
   exist on iOS 16.4+ only inside Home Screen web apps, and permission is asked only on a user gesture. (D3, D4)
8. **iPhone has no `MediaSource`:** BCD 8.1.6 still marks it iPad-only. iPhone gets `ManagedMediaSource` (17.1+) only
   with an AirPlay alternative source or remote playback disabled. (BCD api.ManagedMediaSource; D6)
9. **MPEG-TS needs transmuxing to be portable:** no engine plays a raw `.ts` in the video element
   (`canPlayType('video/mp2t')` empty in live Chrome 151 Win). Chromium MSE accepts `video/mp2t`, Firefox MSE rejects
   it, WebKit was not verified, and Shaka treats TS in MSE as broken everywhere. Native HLS works in Safari, Chrome
   142+ desktop, Chrome Android and Firefox Android, not in Firefox desktop or Edge. (S7, S8, S11, S13; caniuse
   http-live-streaming)
10. **H.264 + AAC in MP4 is the only universally safe pair**, and Firefox gets it from the OS. HEVC needs a hardware
    decoder on Windows and Linux in Chrome and Edge (Edge also needs the Store extension) and in Firefox, but works
    on all Apple devices. AV1 in Safari needs a hardware decoder (M3 Macs, iPhone 15 Pro and later). AC-3/E-AC-3 is
    absent from Chrome (Cast and tvOS build flag, confirmed live) and from Firefox. (caniuse mpeg4, hevc, av1; D21;
    S7, S9, S11)
11. **MKV plays in the video element in Chromium 145+ and Firefox 145+, never through MSE**; Safari support was not
    found. HEIC decodes only in Safari 17+. JPEG XL shipped this month in Chrome 155 and Firefox 158, and as stills
    in Safari 17+. (S9, D18, D19; BCD mediatypes.image.heif, mediatypes.image.jxl)
12. **AAC encoding in WebCodecs is not portable:** Chromium has it only through OS encoders (Windows except N editions,
    macOS, Android; not Linux or ChromeOS); WebKit from Safari 26 (source); Firefox desktop encodes only Opus and
    Vorbis, and Firefox Android has no WebCodecs. A WASM AAC encoder is needed for full coverage. (S10, S11, S12)
13. **The planned crypto suite is in every current engine:** ECDH P-256 `deriveBits`, HKDF, HMAC and AES-GCM in a
    secure context; X25519 in Chrome 133+, Firefox 130+, Safari 17+; Ed25519 in Chrome 137+, Firefox 129+, Safari 17+
    (Safari's signatures are randomized). Legacy Edge and IE lack ECDH and HKDF. (BCD api.SubtleCrypto.deriveBits,
    api.SubtleCrypto.importKey.ECDH, api.SubtleCrypto.deriveKey.derivedKeyAlgorithm_option_hkdf; live Chrome 151 Win)
14. **Streaming uploads work only in Chromium desktop 105+**, over HTTP/2 or HTTP/3, with `duplex:'half'`. Chrome
    Android, Safari and Firefox (Nightly only) lack them; uploads fall back to chunked requests, a WebSocket or
    WebTransport. WebTransport now ships in all engines (Safari 26.4); WebSocketStream is Chromium-only. (BCD
    api.fetch.options_parameter.duplex, api.WebTransport, api.WebSocketStream; D12, D18)
15. **Screen capture is a desktop feature:** Chromium Android and Firefox Android have none; iOS 27 exposes
    `getDisplayMedia` only by BCD's API-presence test. BarcodeDetector is missing on Windows, Linux, Safari and
    Firefox, so QR scanning needs a WASM fallback. (BCD api.MediaDevices.getDisplayMedia, api.BarcodeDetector; S6)

**Not verified** - the cells say "unverified" for these:

- Chromium Android File System Access pickers and read-write folders (132+): BCD yes, caniuse no, not run-tested.
- Brave's 2026 default for File System Access, and Brave on Android.
- Edge divergences from Chromium (JPEG XL, native HLS, AC-3).
- WebKit MSE with `video/mp2t`; AC-3/E-AC-3 in Safari; Matroska in WebKit and on Firefox Android; native HLS in
  Chrome 142 (caniuse and a third-party page only).
- iOS 27 screen capture beyond API presence; iOS blob downloads inside a Home Screen web app.
- Storing a CryptoKey in IndexedDB: the spec says `[Serializable]`, but no per-engine data exists; Firefox private
  browsing was not checked.
- Firefox MediaRecorder's 2026 format list; Chrome Web Share on Linux; practical Keyboard Lock on Chrome Android.
- APIs outside the researched key list: Picture-in-Picture, speech synthesis, WebGL and WebXR, Media Session, manifest
  shortcuts, FileSystemObserver, the camera torch, canvas WebP encoding.
- The live probe ran on Chrome 151, not stable 155, on one Windows 11 machine.

## Matrix

How to read it:

- One table per inventory group; `#` is the S0002 inventory number. Function and Program are the programs' own words.
- **Browser needs** names the Web APIs in words; "exchange server (DEVICE-EXCHANGE n)" when the function is a
  conversation with the exchange server; "impossible - reason" when no page can do it.
- Every exchange-server row reaches the server through a WebSocket on its one port. That binding is not in
  `DEVICE-EXCHANGE` 7.1 yet: it is the browser transport amendment (S0005, S0010). The engine cells show the browser
  side only - WebSocket is full in every engine. Operator rows also need an operator surface on the wire (item BR)
  and an operator sign-in (S0007).
- **Engine cells:** "full"; "degraded - how"; "none"; "unverified" (the research could not confirm it, or the API was
  outside the researched key list). A cell is the weakest key the row needs in that engine, with the fallback named.
- Streaming downloads work in every engine; only streaming uploads are Chromium-desktop-only (fact 14), so streaming
  fetch lowers a cell only where the row uploads.
- "per BCD only" marks the Chromium Android File System Access rows (fact 1 and "Not verified").
- **Contract** is the inventory's governing contract, by id and section; "none - parity proposal (S0010)" marks a
  proposed first-release row with no contract, for which S0010 owes a parity proposal.
- **Verdict** is a proposal. *never*: needs what no page can do - raw TCP/UDP (SMB, FTP, SFTP, NFS, RTSP), mDNS, a
  listening port, work after the tab closes, OS integration. *first release*: the exchange core, and the local
  functions that work in all four groups at least degraded with a stated fallback and no heavy WASM library. *planned*
  (called *later* until 2026-11-13; built after the first release, S0030):
  everything else a page can do with extra libraries or engine-specific APIs.

### Exchange account

The account rows are the handoff's product (goals 1 and 2, acceptance 1 and 3).

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 151 | Save the ticked groups of settings to the account's exchange server and read them back on another device (the settings standard); sign-in data, keys and paths stay on the device | both | FMS_A AF:1450; FMS_Win CL:29 (SP L0296) | exchange server (DEVICE-EXCHANGE section 35); IndexedDB; sealing (row 9) | full | full | full | full | DEVICE-EXCHANGE section 35 | planned - after the first release (S0030) - after the settings of rows 138-145 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Connect to an exchange server from one connection string - paste it, open a .fmsexch file, scan its QR code, or take it from another app | both | FMS_A AF:1338; FMS_Win `src/Exchange/ExchangeConnectionString.vb:29`, `src/Exchange/ExchangeQrDecoder.vb:13` | exchange server (DEVICE-EXCHANGE 5.5); Async Clipboard text for paste; file input for a .fmsexch; camera and a QR decoder (Barcode Detection, else WASM); file handling of an installed web app | degraded - QR through a WASM decoder on Windows and Linux; .fmsexch opens by itself only in the installed web app | degraded - no .fmsexch association: pick the file | degraded - paste, link or picked file; QR through a WASM decoder; no file association | degraded - paste, link or picked file; QR through a WASM decoder; no file association | DEVICE-EXCHANGE 5.5 (items AR, BN) | first release, after the browser transport amendment (S0005, S0010) - the string by link, paste or picked file; QR scan and file association later |
| 2 | Register an account by invitation: a string with the invitation key opens "Create account", password typed twice | both | FMS_A AF:1360; FMS_Win `src/Localization/Localization.ExchangeEntries.vb:143`, SP 226 | exchange server (DEVICE-EXCHANGE 5.1); WebCrypto for the device key (row 9); IndexedDB | full | full | full | full | DEVICE-EXCHANGE 5.1 (items AO-AR) | first release, after the browser transport amendment (S0005, S0010) - account register (handoff goal 1) |
| 3 | Register with the server's shared invitation password | both | FMS_A AF:1360; FMS_Win SP 226, `src/Exchange_Connect_Form.vb:25` | exchange server (DEVICE-EXCHANGE 5.1); WebCrypto | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AP) | first release, after the browser transport amendment (S0005, S0010) - account register |
| 4 | Sign in by login and password or a one-time pairing code after accepting the server certificate fingerprint; sign in again after "signed out" | both | FMS_A AF:1344, `MN/menu_exchange_server_card.xml:20`; FMS_Win `src/Exchange_Connect_Form.vb:25` | exchange server (DEVICE-EXCHANGE 5.2, 5.3); IndexedDB; persistent storage; the certificate fingerprint shown for comparison (S0006) | full | full | degraded - data may be erased after 7 days of Safari use without a visit (a Home Screen web app is safer, not exempt) | full | DEVICE-EXCHANGE 5.2, 5.3, items AT, AX-AY | first release, after the browser transport amendment (S0005, S0010) - account sign-in; certificate trust by S0006 |
| 5 | Change the account password (the old one is required) | both | FMS_A `MN/menu_exchange_server_card.xml:23`; FMS_Win `src/Exchange_Password_Change_Form.vb:22` | exchange server (DEVICE-EXCHANGE 5.1); IndexedDB | full | full | full | full | DEVICE-EXCHANGE 5.1 (items AO-AV) | first release, after the browser transport amendment (S0005, S0010) - account password change |
| 6 | Sign out on this device | both | FMS_A `MN/menu_exchange_server_card.xml:26`; FMS_Win `src/Localization/Localization.ExchangeEntries.vb:97` | exchange server (DEVICE-EXCHANGE 5.1); IndexedDB | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AV) | first release, after the browser transport amendment (S0005, S0010) - account sign-out; warns that clearing site data loses the device |
| 7 | Delete my account on the server | FMS_A | FMS_A `MN/menu_exchange_server_card.xml:29`, AF:1360; FMS_Win SP 226 section 3 item 7 (portal link only) | exchange server (DEVICE-EXCHANGE 5.1, item AU) | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AU) | first release, after the browser transport amendment (S0005, S0010) - account deletion (handoff goal 2) |
| 8 | Keep several exchange account entries, one deviceId each | both | FMS_A AF:1344; FMS_Win `src/Exchange/ExchangeEntries.vb:114` | IndexedDB; persistent storage | full | full | degraded - data may be erased after 7 days of Safari use without a visit (a Home Screen web app is safer, not exempt) | full | DEVICE-EXCHANGE items AA-AB | first release, with the account rows - the stored entry and its deviceId are what register and sign-in act on |
| 9 | Seal everything sent through the server end to end: a device key per entry, trust on first sight, "key changed", the honest text of what the server still sees | both | FMS_A AF:1375; FMS_Win SP 234 (draft, no sealing code in src) | WebCrypto ECDH P-256, HKDF, AES-GCM (HPKE Auth built from them); a non-extractable key kept in IndexedDB; persistent storage | unverified - non-extractable key in IndexedDB (no per-engine data) | unverified - non-extractable key in IndexedDB (no per-engine data) | unverified - key in IndexedDB; also degraded - data may be erased after 7 days without a visit | unverified - key in IndexedDB (Firefox private browsing not checked) | DEVICE-EXCHANGE section 27 (items DE-DR) | first release, after the browser transport amendment (S0005, S0010) - clipboard content is sealed (section 27, item DN); the proof is the section 27 vectors (S0008, S0011) |

### Exchange devices and directory

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | My devices: the account's devices with presence, and the resources and broadcasts they publish, kept live | both | FMS_A AF:1344; FMS_Win `src/Exchange_Devices_Panel.vb:28` | exchange server (DEVICE-EXCHANGE 6.1-6.3, 7.3, 7.4) | full | full | full | full | DEVICE-EXCHANGE 6.1-6.3, 7.3, 7.4 | first release, after the browser transport amendment (S0005, S0010) - device list and directory (handoff goal 3) |
| 11 | Remove (revoke) one of my devices | both | FMS_A AF:1344; FMS_Win `SM/Core/ExchangeAdmin.vb:65` | exchange server (DEVICE-EXCHANGE 5.2) | full | full | full | full | DEVICE-EXCHANGE 5.2 | first release, after the browser transport amendment (S0005, S0010) - revoke a device (handoff acceptance 2) |
| 12 | Issue a one-time pairing code so a new device joins without the password | both | FMS_A AF:1344; FMS_Win `SM/Core/ExchangeAdmin.vb:69` | exchange server (DEVICE-EXCHANGE 5.3) | full | full | full | full | DEVICE-EXCHANGE 5.3 | planned - after the first release (S0030) - not in the first-release core; a new device can join by password |
| 13 | Attach new resources of my devices automatically (per entry, off by default) | both | FMS_A `MN/menu_exchange_server_card.xml:16`; FMS_Win `src/Exchange_Devices_Panel.vb:28` | exchange server (directory changes); IndexedDB | full | full | full | full | none | planned - after the first release (S0030) - meaningful only once folders work (row 27) |
| 14 | Hand the server to another device: show, copy or share its connection string and QR | both | FMS_A `MN/menu_exchange_server_card.xml:13`; FMS_Win `SM/Forms/Exchange_Connection_String_Form.vb:22` | Async Clipboard text; Web Share; a QR code drawn in the page | degraded - Web Share on Linux unverified: copy instead | full | full | degraded - desktop has no Web Share: copy or show the QR | DEVICE-EXCHANGE 5.5 (item AE) | planned - after the first release (S0030) - not in the first-release core |
| 15 | Connect the paired watch to the server | FMS_A | FMS_A `MN/menu_exchange_server_card.xml:10` | impossible - no phone-to-watch link from a page | none | none | none | none | DEVICE-EXCHANGE items CF-CG | never - needs a paired-watch link |

### Exchange clipboard

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 16 | Send the clipboard text to my devices | both | FMS_A AF:1364; FMS_Win `SM/Core/ClipboardExchange.vb:21` | exchange server (DEVICE-EXCHANGE section 22); Async Clipboard text, read on a click; sealing (row 9) | full | full | full | full | DEVICE-EXCHANGE section 22 (items BU-CA), section 27 (item DN) | first release, after the browser transport amendment (S0005, S0010) - clipboard send (handoff goal 3, acceptance 5) |
| 17 | Send a picture from the clipboard | both | FMS_A AF:1364; FMS_Win `SM/Core/ClipboardExchange.vb:21` | exchange server (DEVICE-EXCHANGE section 22); Async Clipboard image - one PNG item, on a click; sealing (row 9) | full (PNG) | full (PNG) | full (PNG) | full (PNG) | DEVICE-EXCHANGE section 22, section 27 (item DN) | first release, after the browser transport amendment (S0005, S0010) - clipboard send |
| 18 | Send one file as the clipboard value | both | FMS_A AF:1364; FMS_Win `SM/Core/ClipboardExchange.vb:21` | exchange server (DEVICE-EXCHANGE section 22); file input or the file picker; sealed 64 KiB segments read from the file; WebCrypto | full (Brave: file input) | degraded - file input (picker per BCD only); upload as WebSocket segments, no request streams | degraded - file input; upload as WebSocket segments, no request streams | degraded - file input; upload as WebSocket segments, no request streams | DEVICE-EXCHANGE section 22, section 27 (item DN) | first release, after the browser transport amendment (S0005, S0010) - clipboard send; size limits by S0009 |
| 19 | Get the latest clipboard value into this device - text, picture or file | both | FMS_A AF:1364; FMS_Win `SM/Core/ClipboardExchange.vb:21` | exchange server (DEVICE-EXCHANGE section 22); Async Clipboard text and PNG written on a click; save picker or a download; WebCrypto | full | degraded - a file is assembled in OPFS, then saved by download (save picker per BCD only) | degraded - a file is assembled in OPFS, then saved by download (iOS: some files open in a tab) | degraded - a file is assembled in OPFS, then saved by download | DEVICE-EXCHANGE section 22 (items BU-CB) | first release, after the browser transport amendment (S0005, S0010) - clipboard receive (acceptance 5) |
| 20 | Send or get the clipboard from a shortcut without opening the main window | both | FMS_A AF:1364; FMS_Win `SM/Core/ClipboardShortcuts.vb:7` | shortcuts of an installed web app; Async Clipboard text, still only after focus | degraded - installed web app only | degraded - installed web app only | unverified - manifest shortcuts not in the support data | none - desktop has no manifest install; Android unverified | DEVICE-EXCHANGE section 22 | planned - after the first release (S0030) - the open page already has the buttons |

### Exchange broadcasts

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 152 | Prepare a broadcast's link, QR code and .fmsbcast file before it starts: kind, 1 to 30 days, password choice, guests, up to five live links with Share and Revoke | FMS_A | FMS_A AF:1420 | exchange server (DEVICE-EXCHANGE section 31); Async Clipboard text; Web Share; a QR code drawn in the page | degraded - Web Share on Linux unverified: copy instead | full | full | degraded - desktop has no Web Share: copy or show the QR | DEVICE-EXCHANGE section 31; LIVE-BROADCAST | planned - after the first release (S0030) - with row 26, broadcasting from the browser |
| 153 | Change the link password of a running broadcast (automatic, own or none); the old password stops opening it at once | both | FMS_A AF:1376, AF:1379; FMS_Win CL:41 (SP 263) | exchange server (DEVICE-EXCHANGE section 30, section 20 item BF) | full | full | full | full | DEVICE-EXCHANGE section 30, section 20 (item BF); LIVE-BROADCAST | planned - after the first release (S0030) - with row 26, broadcasting from the browser |
|---|---|---|---|---|---|---|---|---|---|---|
| 21 | Broadcasts of my devices: the account's live broadcasts listed on open, grouped by device | both | FMS_A AF:1345; FMS_Win SP 201, `src/LiveBroadcast_Form.vb:13` | exchange server (DEVICE-EXCHANGE 6.3, item CI) | full | full | full | full | DEVICE-EXCHANGE 6.3, item CI; LIVE-BROADCAST | first release, after the browser transport amendment (S0005, S0010) - broadcasts listed (handoff goal 3); playing them is rows 22-24 |
| 22 | Play an audio broadcast through the exchange relay | both | FMS_A AF:1345; FMS_Win SP 201, `src/Main_Form.LiveBroadcast.vb:27` | streaming fetch from the relay (DEVICE-EXCHANGE 7.6); Media Source Extensions with ADTS AAC, or WebCodecs audio decoding into Web Audio; WebCrypto to open sealed records | full | full | degraded - iPhone has only ManagedMediaSource (17.1+, remote playback off) | degraded - AAC only inside MP4 through OS codecs: repackage ADTS into fragmented MP4 | DEVICE-EXCHANGE 7.6; LIVE-BROADCAST item Q | first release (owner, 2026-11-13) - after the browser transport amendment (S0005, S0010); Safari, iOS and iPadOS visible and disabled with the reason until measured |
| 23 | Play a video broadcast (MPEG-TS with H.264 and AAC) | both | FMS_A AF:1345; FMS_Win SP 201, `src/Main_Form.LiveBroadcast.vb:27` | streaming fetch from the relay; MPEG-TS transmuxed in the page (JS or WASM) into fragmented MP4 for Media Source Extensions; H.264 and AAC; WebCrypto | full (MSE takes MPEG-TS; transmuxing stays the portable path) | full (as desktop) | degraded - transmux to fragmented MP4 (MSE with MPEG-TS unverified); iPhone: ManagedMediaSource only | degraded - transmux to fragmented MP4 (MSE rejects MPEG-TS); AAC through OS codecs | DEVICE-EXCHANGE 7.6; LIVE-BROADCAST item Q | first release (owner, 2026-11-13) - with row 22, one pipeline; Safari, iOS and iPadOS visible and disabled with the reason until measured |
| 24 | Import a broadcast by link, QR code or descriptor file and play it through the servers it names, typing its link password once | both | FMS_A AF:1337, AF:1376; FMS_Win `src/LiveBroadcast_Form.vb:13` | Async Clipboard text; camera and a QR decoder (Barcode Detection, else WASM); file input; streaming fetch; Media Source Extensions; WebCrypto | degraded - QR through WASM on Windows and Linux; relay endpoints only (no LAN, no RTSP) | degraded - relay endpoints only (no LAN, no RTSP) | degraded - QR through WASM; iPhone: ManagedMediaSource only; relay endpoints only | degraded - QR through WASM; AAC only inside MP4; relay endpoints only | LIVE-BROADCAST items M, Q; DEVICE-EXCHANGE 7.7 (item AF), section 20 (item BF) | planned - after the first release (S0030) - broadcast playback; LAN and RTSP endpoints stay native |
| 25 | Cast a broadcast to one of my devices, and receive a cast | both | FMS_A AF:1345; FMS_Win `src/Main_Form.LiveBroadcast.vb:27` | exchange server (DEVICE-EXCHANGE 7.8, item CJ); notifications | degraded - a cast arrives only while the tab is open | degraded - only while the tab is open; notifications through the service worker | degraded - only while the tab is open; iOS notifications only in a Home Screen web app | degraded - only while the tab is open | DEVICE-EXCHANGE 7.8 (item CJ) | planned - after the first release (S0030) - after broadcast playback |
| 26 | Broadcast the microphone, the camera, the screen or a stored file from this device; on a desktop the screen or one chosen window | both | FMS_A AF:1042, AF:1174, AF:1369, AF:1372; FMS_Win `SM/Forms/Live_Broadcast_Form.vb:20`, SP 199, CL:86 (SP 263) | camera and microphone (getUserMedia), screen capture (getDisplayMedia); WebCodecs H.264 and AAC encoding and an MPEG-TS/ADTS muxer in the page; exchange server (DEVICE-EXCHANGE 7.6) with a contract amendment | degraded - no AAC encoder on Linux and ChromeOS (WASM encoder) | degraded - no screen capture: camera and microphone only | degraded - AAC encoder from Safari 26, not ADTS (framed in the page); iOS 27 screen capture unverified | degraded - no AAC encoder (WASM); Android: no WebCodecs, no screen capture | LIVE-BROADCAST; DEVICE-EXCHANGE 7.6 | planned - after the first release (S0030) - handoff non-goal for release 1; needs a LIVE-BROADCAST amendment |

### Exchange folders (tunnel)

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 27 | Attach a folder of another device ("From my devices") and browse it like a folder; the native programs try the LAN, a forwarded port and the tunnel and take the fastest ("one resource, any path"), a page reaches only the tunnel | both | FMS_A AF:1344, AF:1362; FMS_Win `src/Exchange_Devices_Panel.vb:28`, SP 171 (done) | exchange server tunnel (DEVICE-EXCHANGE 6.2, 7.5); an SFTP client in WASM over the WebSocket; WebCrypto | full | full | full | full | DEVICE-EXCHANGE 6.2, 7.5; ANYWHERE-ACCESS; SHARE-SESSION | planned - after the first release (S0030) - folders through a tunnel, after S0017 (research item 5) |
| 28 | Open or download one file from an attached folder | both | FMS_A AF:1344; FMS_Win `src/Main_Form.Resource.vb:108`, SP 171 (done) | the row 27 tunnel; streaming fetch; save picker or a download | full | degraded - saved by download (save picker per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download | DEVICE-EXCHANGE 7.5; SHARE-SESSION | planned - after the first release (S0030) - folders through a tunnel (S0017, S0018) |
| 29 | Copy, move, upload or delete files on an attached folder | both | FMS_A AF:1362; FMS_Win SP 221 (done) | the row 27 tunnel; read-write folder access for local copies; file input for uploads | full | unverified - local folder writes per BCD only; uploads by file input | degraded - uploads by file input; downloads instead of local folder writes | degraded - uploads by file input; downloads instead of local folder writes | SHARE-SESSION | planned - after the first release (S0030) - folders through a tunnel |
| 30 | Attach a PIN-protected folder of another device: type its PIN once, proved at the producer | both | FMS_A AF:1352; FMS_Win SP 216 (done) | the row 27 tunnel; WebCrypto; the PIN kept encrypted under a non-extractable key in IndexedDB | unverified - non-extractable key in IndexedDB (no per-engine data) | unverified - non-extractable key in IndexedDB (no per-engine data) | unverified - non-extractable key in IndexedDB (no per-engine data) | unverified - non-extractable key in IndexedDB (no per-engine data) | DEVICE-EXCHANGE section 17 (items AG-AJ) | planned - after the first release (S0030) - folders through a tunnel |
| 31 | Publish this device's folders through the server, or give one to a guest or by a link with a password | both | FMS_A AF:1319, AF:1362; FMS_Win `SM/Core/ExchangeDeviceAgent.vb:24`, `SM/Forms/Folder_Outside_Access_Form.vb:14` (SP 228 draft) | exchange server (DEVICE-EXCHANGE section 20); read-write folder access; serving only while the tab is open | degraded - serves only while the tab is open | unverified - folder access per BCD only; serves only while the tab is open | degraded - a read-only picked folder, only while the tab is open | degraded - a read-only picked folder, only while the tab is open | DEVICE-EXCHANGE section 20 (items BA-BE); ANYWHERE-ACCESS | never - a published folder must outlive the tab; the handoff leaves folder sharing to the native programs |

### Operator administration

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 32 | Create a one-time invitation for a member or a guest and hand over its code, connection string and QR | FMS_Win | FMS_Win `SM/Forms/Exchange_Invitation_Create_Form.vb:10`, CL:13 | exchange server (DEVICE-EXCHANGE 5.1, item AP) through an operator surface not yet on the wire (item BR); Async Clipboard text | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AP) | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator invitations (acceptance 4) |
| 33 | List and withdraw invitations; turn the shared invitation password on, change or clear it | FMS_Win | FMS_Win `SM/Core/ExchangeAdmin.vb:70-74`, `SM/Forms/Exchange_Shared_Invitation_Form.vb:10` | exchange server (DEVICE-EXCHANGE 5.1, item AP), operator surface | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AP) | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator invitations |
| 34 | List accounts, add one with a password generated and shown once, set its limits (clipboard size, devices, folders, broadcasts) | FMS_Win | FMS_Win XS:98, `SM/Core/ExchangeAdmin.vb:60-63`, `SM/Forms/Exchange_Account_Limits_Form.vb:12` | exchange server (DEVICE-EXCHANGE 5.1), operator surface | full | full | full | full | DEVICE-EXCHANGE 5.1 | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator accounts and limits |
| 35 | Reset an account's password, optionally signing out its devices | FMS_Win | FMS_Win XS:99, `SM/Core/ExchangeAdmin.vb:61` | exchange server (DEVICE-EXCHANGE 5.1), operator surface | full | full | full | full | DEVICE-EXCHANGE 5.1 | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator password reset (acceptance 4) |
| 36 | Delete an account | FMS_Win | FMS_Win `SM/Core/ExchangeAdmin.vb:62`, SP 224 (done) | exchange server (DEVICE-EXCHANGE 5.1, item AU), operator surface | full | full | full | full | DEVICE-EXCHANGE 5.1 (item AU) | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator account deletion (acceptance 4) |
| 37 | List an account's devices and revoke one; list and withdraw guest grants | FMS_Win | FMS_Win XS:100, `SM/Core/ExchangeAdmin.vb:64-65`, `SM/Core/ExchangeAdmin.vb:76-78` | exchange server (DEVICE-EXCHANGE 5.2, section 20 item BD), operator surface | full | full | full | full | DEVICE-EXCHANGE 5.2, section 20 (item BD) | first release, after the browser transport amendment (S0005, S0010) and the operator sign-in (S0007) - operator device revoke (acceptance 4) |
| 38 | Server status and host settings: public address, listen port, the connection string for clients, keep the PC awake, log retention, certificate renewal, the operator statement | FMS_Win | FMS_Win XS:185-195, SP 225 (done), SP 168 (done) | exchange server (DEVICE-EXCHANGE 5.5, 7.9), operator surface; Async Clipboard text | full | full | full | full | DEVICE-EXCHANGE 5.5, 7.9, items AX-AY | planned - after the first release (S0030) - host settings, not an operation on accounts, invitations or devices |
| 39 | Server first-run wizard, the Windows Firewall rule and the Windows service mode | FMS_Win | FMS_Win `SM/Forms/Exchange_Server_Wizard_Form.vb:23`, `SM/Core/ExchangeFirewall.vb:20` | impossible - OS integration on the server machine (wizard, firewall rule, service) | none | none | none | none | none | never - OS integration |

### Local browsing and viewing

Reading a folder works in every engine; only Chromium can write back into it (facts 1 and 4).

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 154 | Swipe a file row left or right to run an action chosen in settings (default delete and Send to..) | FMS_A | FMS_A AF:976 | pointer events; the write path of row 61 for delete; Web Share for Send to.. | full | full | full | full | none | planned - after the first release (S0030) - with the write operations of rows 56-63 |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | Open a folder of media - pick it or drag it onto the window - and page through it; SD cards and plugged-in drives too | both | FMS_A AF:33, AF:642; FMS_Win RM:126, `src/Main_Form.DragDrop.vb:32` | read-write folder access (File System Access); folder input; folder drag and drop | full (Brave: read-only folder input unless its flag is on) | degraded - read via folder input (132+); read-write picker per BCD only | degraded - read via folder pick (iOS 18.4+), dropped folders read-only; save by download or OPFS | degraded - read via folder pick (Android 142+), dropped folders read-only; save by download or OPFS | MEDIA-CLASSIFICATION | first release - open a folder or files |
| 41 | Next / previous file (Right, Space, PgDn / Left, Backspace, PgUp; mouse wheel) | both | FMS_A KB:234, KB:246; FMS_Win HK:90-91 | keyboard events; Gamepad; mouse wheel; on-screen buttons on touch screens | full | full | full | full | INPUT-PARITY | first release - keyboard navigation |
| 42 | First / last file; back or forward 10 and 100 files | both | FMS_A KB:258, KB:270; FMS_Win HK:95-100 | keyboard events | full | full | full | full | INPUT-PARITY | first release - keyboard navigation |
| 43 | Random file (Y); jump to a file number (N); choose a file (F, F4: FMS_Win's system Open dialog, not a list) | both | FMS_A `MN/overflow_menu_player.xml:52`, `JA/ui/player/helpers/PlayerNavigationManager.kt:178-198` (AF:66 is the random sort); FMS_Win HK:92, HK:101-102 | keyboard events; a file list in the page | full | full | full | full | MEDIA-VIEWER section 1 rule 2 | first release - keyboard navigation |
| 44 | Thumbnail grid of the folder (F3 panel), list or grid view, cell size | both | FMS_A AF:68, AF:70; FMS_Win `src/Image_Panel_Form.Modern.vb`, CL:181 (AF:760 is the main window's resource grid) | folder access or folder input; OPFS for the thumbnail cache; IndexedDB | full | degraded - read via folder input, picked again each visit; thumbnails in OPFS | degraded - read via folder pick, picked again each visit; thumbnails in OPFS (writes from Safari 26) | degraded - read via folder pick, picked again each visit; thumbnails in OPFS | none - parity proposal (S0010) | first release - grid and list browsing; F3 is the browser's find (see Keyboard) |
| 45 | Sort order (name, date, size, manual, shuffle), filter by name or type, live search, favourites | both | FMS_A AF:65-67, AF:69, AF:861, AF:74; FMS_Win `src/Main_Form.FileScanning.vb:575-598` (sort only: FMS_Win's viewer has no filter, live search, favourites or manual order) | IndexedDB; file name, size and last-modified date (a page sees no created date) | full | full | full | full | MEDIA-VIEWER section 1 rule 1 | first release - sort and filter by name, date and size (date = last modified) |
| 46 | Choose which kinds join paging (video, audio, documents); file manager mode with hidden and non-media files; subfolders with a path stack | both | FMS_A AF:59, AF:60, AF:64; FMS_Win RM:44, CL:173 | folder access or folder input with relative paths | full (hidden = dot-files only) | degraded - read via folder input; hidden = dot-files only | degraded - read via folder pick; hidden = dot-files only | degraded - read via folder pick; hidden = dot-files only | MEDIA-CLASSIFICATION | first release - kinds and subfolders are part of folder browsing |
| 47 | Select many files (range, mouse band) and run one operation on all of them | both | FMS_A AF:73, AF:341; FMS_Win `src/Main_Form.Batch.vb:81`, CL:171 | read-write folder access; keyboard events | full | unverified - read-write folders per BCD only; selection works | degraded - selection works; operations only as downloads | degraded - selection works; operations only as downloads | none | planned - after the first release (S0030) - batch operations follow the single-file move (row 56) |
| 48 | File information (size, dates, EXIF, codec) and the on-image overlay with name and position | both | FMS_A AF:358, AF:72; FMS_Win `src/File_Details_Form.vb:25`, RM:36 | EXIF parsed in JS; a demuxer (JS or WASM) for codec details | full | full | full | full | none | planned - after the first release (S0030) - not in the first-release list |
| 49 | Recent folders; resume the last file and the video position at start | both | FMS_A AF:154; FMS_Win RM:23-24 | IndexedDB for stored folder handles and positions; read-write folder access; persistent storage | full (the folder asks for permission again unless 'Allow on every visit', Chrome 122+) | unverified - stored folder handles per BCD only | degraded - positions kept, the folder picked again; data may be erased after 7 days without a visit | degraded - positions kept, the folder picked again | none | planned - after the first release (S0030) - a folder pick cannot be reopened outside Chromium |
| 50 | Follow changes made to the folder outside the program | both | FMS_A AF:77; FMS_Win `src/Main_Form.FolderWatch.vb:77` | a folder handle to rescan; FileSystemObserver (not in the support data) | degraded - rescan the handle on focus (FileSystemObserver unverified) | unverified - folder handles per BCD only | none - a picked folder is a snapshot: pick it again | none - a picked folder is a snapshot: pick it again | none | planned - after the first release (S0030) - needs a folder handle |
| 51 | Zoom at the cursor and pan (grey `+`, `-`, `/`, `*`; pinch); rotate the view either way; EXIF auto-orientation | both | FMS_A AF:656, `JA/ui/player/VideoZoomGestureManager.kt:208-210` (AF:168 is a video pinch), `MN/overflow_menu_player.xml:286`; FMS_Win HK:108-109, HK:116-119, RM:34, RM:42 | keyboard events; pointer and pinch gestures; CSS transforms (the browser applies EXIF orientation) | full | full | full | full | MEDIA-VIEWER section 1 rule 3 | first release - part of viewing images |
| 52 | Full screen with the toolbar (F7) and picture only (F11); Esc steps back one layer | both | FMS_A KB:366, KB:534; FMS_Win HK:112, `src/Main_Form.KeyboardInput.vb:244` | Fullscreen API; keyboard events | degraded - F11 and Esc belong to the browser in full screen (Keyboard Lock takes Esc only in a page-started full screen) | full | degraded - iPad: overlay button and swipe-down exit; iPhone: only video goes full screen | degraded - F11 and Esc belong to the browser in full screen (no Keyboard Lock) | INPUT-PARITY | first release - full screen; F7 and F11 by the parity proposal |
| 53 | Perspective background: bars filled from the photo's own edges, optionally as a fading halo | both | FMS_A AF:1253; FMS_Win `src/Main_Form.PerspectiveBackground.vb:21`, `src/Main_Form.PerspectiveHalo.vb:179` | canvas (no listed key); the LETTERBOX-BARS and LETTERBOX-HALO vectors | full | full | full | full | LETTERBOX-BARS, LETTERBOX-HALO | planned - after the first release (S0030) - must replay the catalog vectors; not in the first-release list |
| 54 | Open a file handed over by another app and keep paging through its folder | both | FMS_A AF:1322; FMS_Win RM:38, RM:167 | file handling of an installed web app; a folder pick for the neighbours | degraded - installed web app only; neighbours need a folder pick | none - no file handling | none - no file handling | none - no file handling | none | planned - after the first release (S0030) - Chromium desktop installed web app only |
| 55 | Browse a ZIP, CBZ, 7z, RAR or CBR like a folder | FMS_Win | FMS_Win RM:30, `src/Main_Form.Archive.vb:84` | file input or picker; ZIP in JS; 7z and RAR through a WASM unpacker | full | degraded - file input (picker per BCD only) | degraded - file input instead of the picker | degraded - file input instead of the picker | none | planned - after the first release (S0030) - archives; 7z and RAR need WASM |

### Local sorting and file operations

A sort planned in the page and downloaded as a list of moves was considered as the WebKit and Gecko fallback and is not proposed: neither program reads such a list and no contract defines one, so it would be a dead end. A download is a copy into the downloads folder, not a move into folder N. Those engines therefore say "none", and the page shows why (section "When a function is unavailable in this browser").

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 56 | Move the current file to destination folder N with key N (1..9, 0) | both | FMS_A KB:714-822, AF:345; FMS_Win HK:139-143 | read-write handles on the source and destination folders (File System Access); keyboard events matched by code | full (Brave: only with its flag on) | unverified - read-write folders per BCD (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | INPUT-PARITY; MEDIA-VIEWER section 1 rule 4 | first release (Chromium desktop) - elsewhere the page says why it is unavailable |
| 57 | Copy the current file to destination folder N with Shift+N | both | FMS_A AF:113, AF:1246; FMS_Win HK:144-149, RM:27 | read-write folder handles; keyboard events matched by code (Shift+digit) | full (Brave: only with its flag on) | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into folder N (a download lands in the downloads folder) | none - no writes into folder N (a download lands in the downloads folder) | MEDIA-VIEWER section 1 rule 4 | planned - after the first release (S0030) - same write path as row 56, added once the move works |
| 58 | Destination panel over the media: click a row to move, the side zone to copy; auto-advance to the next file; a colour per destination | both | FMS_A AF:106-109, AF:115; FMS_Win RM:28, `src/Main_Form.RecipientsOverlay.vb:50`, SP 129 (done) | read-write folder handles; pointer events | full (Brave: only with its flag on) | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | none | planned - after the first release (S0030) - the key sort first; the panel adds click and touch |
| 59 | Rename the file (F6 in FMS_Win, F2 in FMS_A) | both | FMS_A AF:89, KB:630; FMS_Win HK:104 | read-write folder access (handle move, file-only, Chromium 102+) | full | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - a picked file cannot be renamed | none - a picked file cannot be renamed | none | planned - after the first release (S0030) - write path as row 56; F2 and F6 conflict (see Keyboard) |
| 60 | Delete to the Recycle Bin (D, Del) | FMS_Win | FMS_Win RM:26, HK:105 | impossible - no recycle bin from a page (row 61 is the substitute) | none | none | none | none | none | never - OS integration |
| 61 | Delete to an app trash with restore, or permanently (Shift+Del), with automatic trash cleanup | both | FMS_A AF:90-93; FMS_Win HK:106, RM:204-211 | read-write folder access; OPFS for a kept copy | full | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | none | planned - after the first release (S0030) - needs the write path |
| 62 | Undo the last operation (U; up to 50 steps, renames and deletions included) | both | FMS_A AF:104, AF:110, KB:570; FMS_Win HK:107, RM:26 | read-write folder access; IndexedDB for the journal | full | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | none | planned - after the first release (S0030) - follows the write operations |
| 63 | Copy or move whole folders and undo a folder transfer; create a folder | FMS_A | FMS_A AF:620, AF:975, AF:83 | read-write folder access | full | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | none | planned - after the first release (S0030) - needs the write path |
| 64 | Overwrite and name-conflict control, skipped files reported, progress with speed and ETA | both | FMS_A AF:116, AF:1245, AF:101; FMS_Win `src/FreeNameRule.vb:15`, CL:11 | read-write folder access | full | unverified - read-write folders per BCD only (Chrome 132, Samsung 29), not run-tested | none - no writes into a picked folder; the page says why | none - no writes into a picked folder; the page says why | none | planned - after the first release (S0030) - the first-release move never overwrites: it stops and names the file |
| 65 | Find duplicate files (size, partial hash, SHA-256); delete files by size | FMS_A | FMS_A AF:94, AF:95 | folder input to find; read-write folder access to delete; WebCrypto digest, streamed hashing in WASM | full | degraded - find via folder input; deleting per BCD only (unverified) | degraded - find via folder pick; no deleting | degraded - find via folder pick; no deleting | none | planned - after the first release (S0030) - WASM hashing for big files; deleting needs the write path |
| 66 | Create a ZIP of selected files; extract a ZIP with a password | FMS_A | FMS_A AF:99, AF:61 | file picker or input; a download; WebCrypto AES for AES ZIP, JS or WASM for ZipCrypto | full | degraded - saved by download (save picker per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download | none | planned - after the first release (S0030) - archives |

### Player (video/audio)

Plain audio files (AAC in MP4, Opus in WebM, FLAC) play in the same element as row 67; the music screen of row 75 is planned after the first release.

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 157 | Video hue and brightness offset | FMS_A | FMS_A AF:173 | CSS filters on the video element | full | full | full | full | none | planned - after the first release (S0030) - with the image adjustments of row 93 |
| 158 | Audio screen extras: online lyrics, online cover-art search (iTunes, Deezer, Cover Art Archive), a YouTube Music search hand-off, MIDI playback, downloadable looping video backdrops | FMS_A | FMS_A AF:205, AF:206, AF:207, AF:208, AF:212 | fetch of services that answer with CORS; a MIDI synthesizer in JS or WASM; a search link opened in a new tab | unverified - each service's CORS not checked | unverified - each service's CORS not checked | unverified - each service's CORS not checked | unverified - each service's CORS not checked | none | planned - after the first release (S0030) - free services only |
| 159 | Immersive VR session on a headset: virtual cinema, head-up display, hand tracking, haptics (the VR and XR builds) | FMS_A | FMS_A AF:178-200, AF:703-705 | WebXR (not in the researched key list) | unverified - WebXR not researched | unverified - WebXR not researched | unverified - WebXR not researched | unverified - WebXR not researched | none | planned - after the first release (S0030) - after the stereo playback of row 79 |
|---|---|---|---|---|---|---|---|---|---|---|
| 67 | Play video in the window: H.264/MP4, MKV, VP9, AV1, HEVC, AVI, WMV, Blu-ray .m2ts | both | FMS_A AF:160, AF:1057, AF:1251; FMS_Win RM:48 | the video element: H.264/AAC in MP4, VP9/Opus in WebM; MKV, HEVC, AV1 where the engine plays them; AVI, WMV and .m2ts only through a WASM decoder | degraded - MP4, WebM, AV1 native; MKV in the video element 145+; HEVC only with a hardware decoder (Windows, Linux); no AVI, WMV, .m2ts | degraded - MP4, WebM, HEVC, AV1 native; MKV 145+ not run-tested (Samsung 30 is Chromium 143); no AVI, WMV, .m2ts | degraded - MP4 and HEVC native, WebM VP9 (macOS 16, iOS 17.4); AV1 hardware only; MKV unverified; no AVI, WMV, .m2ts | degraded - MP4 through OS codecs, WebM, MKV 145+ (Android unverified); HEVC only with OS support; no AVI, WMV, .m2ts | none - parity proposal (S0010) | first release - MP4 (H.264/AAC) and WebM (VP9/Opus) where the engine plays them; AVI, WMV and .m2ts later (WASM) |
| 68 | Video control bar: play/pause (K, Space), seek bar and short/medium/long steps, speed (`[`, `]`, `\`), frame step (.), A-B loop (Shift+L), mute (M), volume | both | FMS_A KB:6, KB:102-174, KB:438, AF:162; FMS_Win HK:120-134, RM:43 | media element controls; keyboard events; WebCodecs for the backward frame step | full | full | full | degraded - Android: no backward frame step (no WebCodecs) | INPUT-PARITY | first release - the player's controls; [ and ] by the parity proposal |
| 69 | Choose the audio track (A), remembered by language | both | FMS_A AF:164, AF:165; FMS_Win HK:135, RM:192-194 | a demuxer in the page (JS or WASM) feeding Media Source Extensions; AAC, AC-3 and Opus decoding; audioTracks (not in the support data) | degraded - tracks by demuxing into MSE; no AC-3 | degraded - tracks by demuxing into MSE; no AC-3 | degraded - iPhone: ManagedMediaSource only; AC-3 unverified | degraded - demuxing into MSE (MP4 and WebM only); no AC-3 | none | planned - after the first release (S0030) - a demuxer; AC-3 is not universal |
| 70 | Subtitles: choose the track (V), set font, size and colour | both | FMS_A AF:163, AF:700; FMS_Win HK:136 | WebVTT tracks; SRT and ASS converted in JS; a demuxer for tracks inside MKV or MP4 | full | full | full | full | none | planned - after the first release (S0030) - a demuxer for embedded tracks |
| 71 | Repeat one, shuffle, what happens when a track ends, sleep timer up to 3 hours | both | FMS_A AF:166, AF:214, AF:215; FMS_Win RM:44 | page timers (throttled in background tabs, still firing) | full | full | full | full | none | planned - after the first release (S0030) - after the first-release player |
| 72 | Configurable 3x3 touch zones, swipe navigation, vertical brightness and volume bars | FMS_A | FMS_A AF:351, AF:352, AF:167 | pointer events; brightness only by dimming the page | degraded - brightness only by dimming the page | degraded - brightness only by dimming the page | degraded - brightness only by dimming the page | degraded - brightness only by dimming the page | INPUT-PARITY | planned - after the first release (S0030) - a touch layer with the parity proposal |
| 73 | Picture-in-picture | FMS_A | FMS_A AF:158, AF:856 | Picture-in-Picture API (not in the support data) | unverified - Picture-in-Picture not researched | unverified - Picture-in-Picture not researched | unverified - Picture-in-Picture not researched | unverified - Picture-in-Picture not researched | none | planned - after the first release (S0030) - not researched |
| 74 | Cast to Chromecast, stereo video one eye only | FMS_A | FMS_A AF:204, AF:353, AF:697 | impossible - a local file needs an HTTP server the TV can reach (listening on a port) | none | none | none | none | none | never - needs a listening port |
| 75 | Music file screen: embedded or found cover art, tags, wave-and-particle animation, equalizer bars | both | FMS_A AF:208-210; FMS_Win RM:44 | Web Audio; tags and cover art parsed in JS; online cover search only with CORS | full | full | full | full | WAVE-PARTICLES | planned - after the first release (S0030) - the music screen follows plain audio playback |
| 76 | Audio in the background with notification and lock-screen controls; black screen while it plays (B); keep the screen on | FMS_A | FMS_A AF:201, AF:202, KB:834, AF:170 | Screen Wake Lock; Fullscreen; Media Session (not in the support data) | degraded - only while the tab lives; lock-screen controls unverified | degraded - only while the tab lives; lock-screen controls unverified | degraded - only while the tab lives; Wake Lock from iOS 18.4; iPhone: black screen without full screen | degraded - only while the tab lives; lock-screen controls unverified | none | planned - after the first release (S0030) - ends with the tab; background audio stays native |
| 77 | Mono audio and stereo balance presets | FMS_A | FMS_A AF:997, AF:925 | Web Audio | full | full | full | full | none | planned - after the first release (S0030) - not in the first-release list |
| 78 | Open URL: play a video straight off http(s)://, smb://, sftp://, ftp://, nfs:// or rtsp:// | FMS_Win | FMS_Win RM:195-196, `src/Main_Form.OpenUrl.vb:44` | http(s) with CORS for Media Source Extensions; impossible for smb, sftp, ftp, nfs and rtsp (raw TCP) | degraded - http(s) with CORS only | degraded - http(s) with CORS only | degraded - http(s) with CORS only | degraded - http(s) with CORS only | none | planned - after the first release (S0030) (http(s) only) - smb, sftp, ftp, nfs and rtsp never: raw TCP |
| 79 | Stereo 3D (side by side, over-under), VR180 and 360 playback; single-eye crop of stereo photos | FMS_A | FMS_A AF:171, AF:182, AF:179, AF:1264 | WebGL and WebXR (not in the support data); Fullscreen | unverified - WebGL and WebXR not researched | unverified - WebGL and WebXR not researched | unverified - WebGL and WebXR not researched; iPhone: no element full screen | unverified - WebGL and WebXR not researched | none | planned - after the first release (S0030) - not researched |

### Images and documents

Plain viewing of JPEG, PNG, GIF, WebP, AVIF and APNG has no row of its own in the inventory: it is part of paging through a folder (rows 40-41, first release), and every engine shows these formats natively (IMG-WEBP, IMG-AVIF and IMG-APNG are "full" in all six columns of the research; JPEG, PNG and GIF need no listed key).

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 155 | Open an HTML page in the viewer with navigation, search and presentation controls | FMS_Win | FMS_Win CL:21 (SP 275) | a sandboxed frame for the picked page; find by script; the picked folder for the page's linked files | degraded - linked images and styles load only when their folder is picked | degraded - linked files only from a picked folder | degraded - linked files only from a picked folder | degraded - linked files only from a picked folder | none | planned - after the first release (S0030) |
| 156 | Read text with syntax colours, regular-expression and whole-word search; open any file as text with a binary warning; large files read in parts | FMS_Win | FMS_Win CL:24 (SP 277) | Blob slicing; TextDecoder; a highlighter in JS | full | full | full | full | none | planned - after the first release (S0030) - with the text viewer of row 87 |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | Animated GIF, WebP and APNG with pause and speed; export one frame or all frames | both for playback; pause, speed and export are FMS_A only | FMS_A AF:129-132; FMS_Win RM:175-177, `src/Main_Form.GifPlayback.vb:16` (playback only) | native animated GIF, WebP and APNG; ImageDecoder (WebCodecs) or a WASM decoder for pause, speed and frames; a download | full | full | degraded - plays natively; pause, speed and frames need a WASM decoder (no ImageDecoder) | degraded - Android: pause, speed and frames need a WASM decoder (no WebCodecs) | MEDIA-VIEWER section 1 rule 6 | first release - animations play as the engine shows them; pause, speed and frame export later |
| 81 | HEIC, HEIF and AVIF photos | both | FMS_A AF:546; FMS_Win RM:178-181 | native AVIF; HEIC/HEIF native only in Safari 17+, else a libheif-class WASM decoder | degraded - AVIF native; HEIC/HEIF through WASM | degraded - AVIF native; HEIC/HEIF through WASM | full | degraded - AVIF native; HEIC/HEIF through WASM | none | planned - after the first release (S0030) - HEIC/HEIF need WASM outside Safari; AVIF already shows in the first-release viewer |
| 82 | JPEG XL pictures | FMS_Win | FMS_Win SP 236 (draft) | native JPEG XL where shipped, else a WASM decoder | degraded - Chrome 155+ (154 needs WASM); Edge none per BCD (unverified) | degraded - Chrome 155+; Samsung Internet none (WASM) | degraded - stills only (Safari 17+), no animation or progressive decoding | degraded - Firefox 158+ (157 and ESR 153 need WASM) | none | planned - after the first release (S0030) - shipped this month; keep a WASM fallback |
| 83 | Decode cache for slow formats - visible, capped, clearable | FMS_Win | FMS_Win RM:33 | OPFS; persistent storage | full | full | degraded - the cache may be erased after 7 days without a visit | full | none | planned - after the first release (S0030) - only slow formats need it |
| 84 | PDF viewer: pages, continuous scroll, thumbnails, search, text selection, colour modes, links, last page; export pages as JPG | both | FMS_A AF:238-248; FMS_Win `src/Main_Form.PdfView.vb:41` | pdf.js in the page (the built-in viewers differ); Async Clipboard text; a download for page export | full | degraded - no built-in viewer: pdf.js | degraded - iOS shows only the first page inline: pdf.js | degraded - Android has no built-in viewer: pdf.js | none | planned - after the first release (S0030) - PDF beyond the built-in viewer |
| 85 | EPUB reader: font, size, themes, spacing, margins, chapter map, search across chapters | FMS_A | FMS_A AF:227-234 | JS unzip and a sandboxed iframe (no listed key) | full | full | full | full | none | planned - after the first release (S0030) - EPUB |
| 86 | Read aloud for PDF, EPUB and text | FMS_A | FMS_A AF:235, AF:244, AF:258 | speech synthesis (not in the support data); voices differ per OS | unverified - speech synthesis not researched | unverified - speech synthesis not researched | unverified - speech synthesis not researched | unverified - speech synthesis not researched | none | planned - after the first release (S0030) - not researched |
| 87 | Text and Markdown viewer: encoding picker, line numbers, font size, select and copy; print | both | FMS_A AF:249-253, AF:380; FMS_Win `src/Main_Form.TextView.vb:68`, CL:34 | TextDecoder; Async Clipboard text; window.print | full | full | full | full | none | planned - after the first release (S0030) - not in the first-release list |
| 88 | Office documents: open in their own program (Enter) or hand off to another app | both | FMS_A AF:62; FMS_Win HK:103 | impossible - launching a native app is OS integration; a page can only download | none | none | none | none | none | never - OS integration |

### Slideshow

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 89 | Slideshow with interval, S again shortens it; countdown before the next slide; videos play to the end | both | FMS_A AF:219, AF:220, AF:222; FMS_Win HK:93, RM:37 | page timers; keyboard events; Screen Wake Lock; Fullscreen | full | full | degraded - iPhone: full-window view, no element full screen; Wake Lock from iOS 18.4 | full | MEDIA-VIEWER section 1 rule 5 | first release - slideshow |
| 90 | Random-order slideshow (I, F5) | both | FMS_A no key (`MN/menu_resource_ops.xml:36` is Play Random in browse); FMS_Win HK:94 | keyboard events (F5 reloads the page: take it or keep I) | full | full | full | full | MEDIA-VIEWER section 1 rule 5 | first release - slideshow |
| 91 | Background music from a chosen folder during a slideshow; photos behind audio | FMS_A | FMS_A AF:221, AF:226, AF:213 | folder input or folder access for the music folder | full | degraded - music folder picked again each visit | degraded - music folder picked again each visit | degraded - music folder picked again each visit | none | planned - after the first release (S0030) - not in the first-release list |

### Editing

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 160 | Notes: the notes of the Documents/Notes folder newest first with a one-line excerpt, a filter on caption and body, one-tap new note, share, confirmed delete | FMS_A | FMS_A AF:1457 | read-write folder access, else the origin private file system; Web Share | full | unverified - folder writes per BCD only; else the private file system | degraded - notes kept in the private file system, not visible as files | degraded - notes kept in the private file system; no Web Share on desktop | none | planned - after the first release (S0030) - with the note editor of row 96 |
|---|---|---|---|---|---|---|---|---|---|---|
| 92 | Rotate, flip and crop (live frame with handles; crop to a new file) | both | FMS_A AF:117-120, AF:415; FMS_Win RM:229-231, CL:147, `src/Image_Editor_Form.vb:33` | canvas; read-write folder access to save over the original, else a download | full | degraded - a copy saved by download (folder write per BCD only) | degraded - a copy saved by download (iOS: some files open in a tab) | degraded - a copy saved by download | none | planned - after the first release (S0030) - editing |
| 93 | Brightness, contrast, saturation; grayscale, sepia and negative | FMS_A | FMS_A AF:122-127 | canvas filters; saving as row 92 | full | degraded - a copy saved by download (folder write per BCD only) | degraded - a copy saved by download (iOS: some files open in a tab) | degraded - a copy saved by download | none | planned - after the first release (S0030) - editing |
| 94 | Draw on a picture: brush, rectangle, ellipse, text, eraser, colour and thickness, undo and redo | both | FMS_A AF:133-138, AF:354-355; FMS_Win RM:227-234 | canvas drawing; saving as row 92 | full | degraded - a copy saved by download (folder write per BCD only) | degraded - a copy saved by download (iOS: some files open in a tab) | degraded - a copy saved by download | none | planned - after the first release (S0030) - editing |
| 95 | Save over the original or Save as.. PNG, JPEG, BMP, TIFF, WebP keeping EXIF; a compressed copy | both | FMS_A AF:139, AF:121, AF:1281; FMS_Win RM:231-233 | canvas encoding (PNG, JPEG, WebP); BMP, TIFF and EXIF re-insertion in JS or WASM; save picker or a download | full | degraded - saved by download (save picker per BCD only) | degraded - saved by download (iOS: some files open in a tab); WebP encoding unverified | degraded - saved by download | none | planned - after the first release (S0030) - editing |
| 96 | Create a text note or a blank canvas; edit TXT and Markdown in place with auto-save, undo and redo, find and replace | FMS_A | FMS_A AF:254-257, AF:263, AF:140 | file picker or folder access to save in place, else a download | full | degraded - saved by download (save picker per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download | CAPTURE-OUTPUT | planned - after the first release (S0030) - editing |
| 97 | Turn an animated WebP, APNG or GIF into an MP4 that replaces the original | FMS_Win | FMS_Win RM:32, `src/Video/AnimationToVideo.vb:30` | WebCodecs H.264 encoding; an MP4 muxer in JS; read-write folder access to replace the original | full (H.264 encoding in live Chrome 151 Win) | degraded - result by download (folder write per BCD only) | degraded - result by download; the original stays | degraded - desktop: result by download; Android: none (no WebCodecs) | none | planned - after the first release (S0030) - editing |

### Streams and playlists

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 98 | Internet Streams: a ready catalog of radio, video and webcam channels in rubrics; filter by category, language, country, topic; pin and reorder | FMS_A | FMS_A AF:366, AF:662, AF:663, AF:371, AF:573 | fetch of the catalog (served with CORS); IndexedDB; OPFS for previews and logos | full | full | full | full | STREAM-BANK | planned - after the first release (S0030) - streams |
| 99 | Play internet radio with live now-playing (ICY) metadata | FMS_A | FMS_A AF:569, AF:450 | audio element; CORS fetch for ICY metadata; only https stations on an https page | full | full | full | degraded - AAC only inside MP4 through OS codecs | none | planned - after the first release (S0030) - streams |
| 100 | Play HLS and other video streams; quality steps down on stalls; per-channel track memory | FMS_A | FMS_A AF:421, AF:556, AF:587 | hls.js on Media Source Extensions, or native HLS | full (hls.js on MSE; native HLS in Chrome 142+ unverified, none in Edge) | full (native HLS) | full (native HLS) | degraded - desktop: hls.js transmuxes TS (MSE rejects MPEG-TS); Android: native HLS | none | planned - after the first release (S0030) - streams |
| 101 | RTSP sources | both | FMS_A AF:366; FMS_Win RM:196 | impossible - RTSP is raw TCP/UDP | none | none | none | none | none | never - raw TCP/UDP |
| 102 | Import an M3U/M3U8 playlist - FMS_A into the channel list, FMS_Win into a stream catalog | both | FMS_A AF:366; FMS_Win `src/Streams/M3uPlaylistReader.vb:17`, `src/Main_Form.Streams.vb:16` | file input; fetch of a playlist URL (CORS); a download | full | full | full | full | USER-PLAYLIST, STREAM-BANK | planned - after the first release (S0030) - streams |
| 103 | Download a stream or a copied link as one playable MP4 | FMS_A | FMS_A AF:1283, AF:346 | fetch of the segments (the source's CORS decides); remux to MP4 in JS or WASM; save picker or a download | full | degraded - assembled in OPFS, saved by download (save picker per BCD only) | degraded - assembled in OPFS, saved by download (iOS: some files open in a tab) | degraded - assembled in OPFS, saved by download | none | planned - after the first release (S0030) - streams |

### Capture

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 161 | Opt-in GPS geotag written into the EXIF of photos taken by the in-app camera | FMS_A | FMS_A AF:442 | Geolocation; EXIF written in JS | full | full | full | full | none | planned - after the first release (S0030) - with row 104 |
|---|---|---|---|---|---|---|---|---|---|---|
| 104 | Take a photo straight into a chosen folder; lens, zoom, aspect and scenario | FMS_A | FMS_A AF:96, AF:580, AF:618, AF:717 | camera (getUserMedia); read-write folder access, else a download | full | degraded - saved by download (folder write per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download | CAPTURE-OUTPUT | planned - after the first release (S0030) - capture |
| 105 | Record video or a voice note into a chosen folder | FMS_A | FMS_A AF:97, AF:98 | camera and microphone; MediaRecorder (WebM or MP4 by engine); folder access or a download | full | degraded - saved by download (folder write per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download; 2026 format list unverified | CAPTURE-OUTPUT | planned - after the first release (S0030) - capture |
| 106 | Screenshot, then copy, share, send, open in the player or the editor, or translate | FMS_A | FMS_A AF:409, AF:1237-1243 | screen capture (getDisplayMedia, asks every time); Async Clipboard image; Web Share | degraded - Web Share on Linux unverified | none - no screen capture | degraded - macOS only; iOS 27 capture unverified | degraded - desktop: no Web Share; Android: none (no screen capture) | CAPTURE-OUTPUT | planned - after the first release (S0030) - capture |
| 107 | Record the screen | FMS_A | FMS_A AF:447 | screen capture; MediaRecorder | full (whole-system audio only on Windows and ChromeOS) | none - no screen capture | degraded - macOS, no audio capture; iOS 27 unverified | degraded - desktop, no audio capture; Android: none | CAPTURE-OUTPUT | planned - after the first release (S0030) - capture |
| 108 | Save a video frame as PNG/JPG named by timecode, or copy it to the clipboard | FMS_A | FMS_A AF:156, AF:157, AF:330 | canvas frame grab (local files only); Async Clipboard image; folder access or a download | full | degraded - saved by download or copied (folder write per BCD only) | degraded - saved by download or copied (iOS: some files open in a tab) | degraded - saved by download or copied | CAPTURE-OUTPUT | planned - after the first release (S0030) - capture |

### OCR and translation

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 168 | Open a document in doc-html-translate (browser translate, convert only, a local Ollama model, or Google within a cost limit) | FMS_Win | FMS_Win CL:13, CL:23 (SP 276) | impossible - launching another installed program is OS integration | none | none | none | none | none | never - OS integration |
|---|---|---|---|---|---|---|---|---|---|---|
| 109 | Recognize text on a picture (T; Shift+T automatic in FMS_Win) | both | FMS_A AF:265, AF:268; FMS_Win HK:110-111, RM:40 | a Tesseract-class engine in WASM; models in OPFS | full | full | full | full | OCR-OVERLAY | planned - after the first release (S0030) - OCR in WASM |
| 110 | Translation overlay over pictures, PDF pages and EPUB chapters, plates in the picture's own colours | both | FMS_A AF:271, AF:269, AF:270, AF:237; FMS_Win `src/Main_Form.OcrOverlay.vb:42` | OCR in WASM; pdf.js for PDF pages; a WASM model or a CORS-reachable LibreTranslate | full | degraded - PDF pages through pdf.js | degraded - iOS: PDF pages through pdf.js | degraded - Android: PDF pages through pdf.js | OCR-OVERLAY | planned - after the first release (S0030) - OCR and translation |
| 111 | Photo or screenshot to text: capture, crop, recognize, translate, save as text | FMS_A | FMS_A AF:272, AF:273, AF:524 | camera and screen capture; OCR in WASM; folder access or a download | full | degraded - camera only (no screen capture); text saved by download | degraded - text saved by download; iOS screen capture unverified | degraded - text saved by download; Android: camera only | OCR-OVERLAY, CAPTURE-OUTPUT | planned - after the first release (S0030) - OCR |
| 112 | Download OCR and translation language packs on demand | FMS_A | FMS_A AF:280, AF:282 | OPFS; persistent storage | full | full | degraded - models may be erased after 7 days without a visit | full | none | planned - after the first release (S0030) - OCR |

### Secure containers

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 113 | Open a FileDO .fd-sec container in the viewer after its password; remember the password | both | FMS_A AF:1217, AF:1220; FMS_Win `src/Secure/FdSecContainer.vb:27`, CL:32 | Argon2id (64 MiB) and XChaCha20-Poly1305 in a libsodium-class WASM; IndexedDB; WebCrypto | full | full | full | full | FDSEC-FORMAT | planned - after the first release (S0030) - secure containers (WASM) |
| 114 | Pack a file into a password-protected .fd-sec container and unpack it | FMS_A | FMS_A AF:1217, AF:1223 | WASM as row 113; folder access or a download | full | degraded - saved by download (save picker per BCD only) | degraded - saved by download (iOS: some files open in a tab) | degraded - saved by download | FDSEC-FORMAT | planned - after the first release (S0030) - secure containers |
| 115 | PIN on a source before it opens | FMS_A | FMS_A AF:44, AF:81 | IndexedDB; WebCrypto | full | full | full | full | none | planned - after the first release (S0030) - secure containers |

### Network sources

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 116 | SMB/NAS shares as sources | both | FMS_A AF:34, AF:48; FMS_Win RM:217-226 | impossible - SMB is raw TCP | none | none | none | none | none | never - raw TCP |
| 117 | FTP and SFTP servers as sources with host-key pinning and a connection test; a server folder as a destination | both | FMS_A AF:35, AF:36, AF:52, AF:50; FMS_Win RM:217-226, CL:167 | impossible - FTP and SFTP are raw TCP; only the exchange tunnel (rows 27-29) reaches an SFTP folder | none | none | none | none | SHARE-SESSION | never - raw TCP |
| 118 | Find NAS hosts and companion servers on the local network | FMS_A | FMS_A AF:47, AF:520 | impossible - mDNS | none | none | none | none | LAN-DISCOVERY | never - mDNS |
| 119 | Import or export a shared folder as a .fmscfg file or a QR code | both | FMS_A AF:39, AF:40, AF:507, AF:525; FMS_Win SP 227, `SM/Core/ShareConfigBuilder.vb:37`, `src/Resources/FmsConfigReader.vb:61` | impossible - the code opens a direct SFTP endpoint (raw TCP) | none | none | none | none | FMSCFG, ANYWHERE-ACCESS | never - raw TCP |
| 120 | Google Drive, Dropbox and OneDrive as sources; copy between them and local folders | FMS_A | FMS_A AF:37, AF:53-55, AF:85 | OAuth and REST of each service with web client registrations; IndexedDB; folder access or a download | full | degraded - copies to local folders by download (folder write per BCD only) | degraded - copies to local folders by download | degraded - copies to local folders by download | none | planned - after the first release (S0030) - outside the handoff scope; needs web client registrations |

### Sharing and serving

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 121 | "Send to..": one list of Share, Telegram, e-mail, Lens, Keep, print and other targets | FMS_A | FMS_A AF:142 | Web Share with files | degraded - Linux unverified (older reports: no share target) | full | full | none - desktop has no Web Share; Android shares no files | none | planned - after the first release (S0030) - not in the first-release list |
| 122 | Receive files and links shared from other apps | FMS_A | FMS_A AF:143 | Web Share Target of an installed web app | degraded - installed web app only | degraded - installed web app only | none - no share target | none - no share target | none | planned - after the first release (S0030) - installed Chromium web app only |
| 123 | Serve my folders over SFTP: the phone's embedded server or this PC's Android Folder Share, paired by QR, always-on service | both | FMS_A AF:1233, AF:1361; FMS_Win RM:39, RM:75-118, `SM/Core/ShareController.vb:19` | impossible - listening on a port, serving with nobody signed in | none | none | none | none | ANYWHERE-ACCESS, SHARE-SESSION | never - needs a listening port |
| 124 | Live broadcast over Wi-Fi with QR or link, listener count and acoustic feedback guard | FMS_A | FMS_A AF:1174, AF:1206, FE:78-79 | impossible - a page cannot serve HTTP or RTSP on the LAN (through the exchange see row 26) | none | none | none | none | LIVE-BROADCAST | never - needs a listening port |
| 125 | Broadcast a file or folder to StreamsPlayer (.spres, QR, quick link, HTTP gateway) | FMS_Win | FMS_Win RM:122, CL:19 | impossible - the HTTP gateway listens on a port | none | none | none | none | BROADCAST-RESOURCE | never - needs a listening port |
| 126 | Share FileDO virtual disks with clients | FMS_Win | FMS_Win RM:73, `SM/Core/FileDoDiskManager.vb:14` | impossible - mounting disks needs an administrator worker | none | none | none | none | DISK-SHARE | never - OS integration |
| 127 | Files, schedules and the clipboard between own devices via Google Drive, with no server | FMS_A | FMS_A AF:1371, AF:1187; FMS_Win `src/Exchange/ExchangeDriveAuth.vb:25`, SP 203 (planned) | Google Drive REST with a web client id in FMS_A's Google project (drive.appdata); WebCrypto; IndexedDB | full | degraded - uploads in chunks (no request streams) | degraded - uploads in chunks (no request streams) | degraded - uploads in chunks (no request streams) | DEVICE-EXCHANGE section 8, section 24 (items CL-CU) | planned - after the first release (S0030) - needs a web client id in FMS_A's Google project; schedules stay native |

### Scheduling and background

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 165 | Scheduled folder backup: numbered copies, copies to keep 1 to 999, the oldest replaced only after the new copy is verified, an optional password container | FMS_Win | FMS_Win CL:14 (SP L0298) | impossible - background work after the tab closes (one manual copy is the write path of row 56) | none | none | none | none | none | never - work after the tab closes |
| 166 | Fill a folder's free space with temporary files and delete them, keeping a system reserve; scheduled fill and wipe of free space | both | FMS_A AF:1444, AF:1445; FMS_Win CL:26 (SP L0299) | impossible - a page sees its own storage quota, never a volume's free space, and a schedule needs work after the tab closes | none | none | none | none | FILLER-RESERVE | never - OS integration and work after the tab closes |
|---|---|---|---|---|---|---|---|---|---|---|
| 128 | Scheduled copy, move, delete and archive operations with run history; a stalled schedule notified, a schedule paused when its resource is deleted | both | FMS_A AF:1210, AF:100, AF:1440, AF:1435; FMS_Win CL:23, `SM/Forms/MainWindow.Scheduled.vb:11` | impossible - background work after the tab closes | none | none | none | none | none | never - work after the tab closes |
| 129 | Scheduled operations over exchange resources and the Drive path, with the kept PIN | both | FMS_A AF:1366; FMS_Win SP 231 (draft) | impossible - unattended runs need a process that outlives the tab | none | none | none | none | DEVICE-EXCHANGE section 17 (items BG-BH) | never - work after the tab closes |
| 130 | Transfers, sync and playback that go on after the screen is left | FMS_A | FMS_A AF:57, AF:102, AF:1350 | impossible - a page works only while its tab lives | none | none | none | none | none | never - work after the tab closes |

### System shell (launcher, widgets, watch, sensors)

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 162 | SOS distress signal: Morse siren, torch and screen strobe in three modes; the phone and the watch raise each other | FMS_A | FMS_A AF:1179, AF:1205, AF:1276 | Web Audio; Fullscreen; Screen Wake Lock; the camera torch (a track constraint, not in the support data); the watch part impossible - paired-watch link | degraded - torch unverified; no watch | degraded - torch unverified; no watch | degraded - iPhone: no element full screen; torch unverified; no watch | degraded - torch unverified; no watch | none | planned - after the first release (S0030) - siren and strobe; the watch part stays native |
| 163 | Dim-screen clock and status overlay: clock, date, battery, burn-in shift, auto-fade | FMS_A | FMS_A AF:1191, AF:1209 | Screen Wake Lock; Fullscreen; Battery Status (not in the researched key list) | unverified - battery level not researched | unverified - battery level not researched | degraded - Wake Lock from iOS 18.4; battery level unverified | unverified - battery level not researched | none | planned - after the first release (S0030) |
| 167 | Watch sensors: heart-rate history and Motion Monitor; a scheduled message or picture shown on the paired watch | FMS_A | FMS_A AF:1041, AF:989, AF:1421 | impossible - watch sensors and the paired-watch link | none | none | none | none | none | never - OS sensors and the paired-watch link |
|---|---|---|---|---|---|---|---|---|---|---|
| 131 | Launcher mode (device home screen), edge-swipe gestures, Quick Settings tiles, notification strip | FMS_A | FMS_A AF:547, AF:508, AF:218, FE:21-39 | impossible - OS launcher role and system overlays | none | none | none | none | none | never - OS integration |
| 132 | Home-screen widgets: photo frame, random music, favourites, streams, capture, stopwatch, scheduled tasks | FMS_A | FMS_A AF:313-326 | impossible - home-screen widgets | none | none | none | none | none | never - OS integration |
| 133 | App-icon shortcuts to sub-programs, streams and clipboard actions | FMS_A | FMS_A AF:1173, AF:387 | shortcuts of an installed web app | degraded - installed web app only | degraded - installed web app only | unverified - manifest shortcuts not in the support data | none - desktop has no manifest install; Android unverified | none | planned - after the first release (S0030) - installed web app only |
| 134 | Wear OS companion: player on the watch, the watch as a file destination, phone camera on the watch, broadcast to the watch, watch face | FMS_A | FMS_A FE:108-123, AF:798, AF:1107 | impossible - paired-watch link | none | none | none | none | DEVICE-EXCHANGE items CF-CH; LIVE-BROADCAST item P | never - the paired-watch link |
| 135 | Small tools: screen flashlight, water flashlight, mirror, camera torch, stopwatch, calculator, tally counter, mini-game | FMS_A | FMS_A AF:744, AF:986, AF:978, AF:1037, AF:994, AF:860, AF:1346, AF:347 | Fullscreen; Screen Wake Lock; camera (torch as a track constraint, not in the support data); IndexedDB | degraded - display brightness cannot be raised; torch unverified | degraded - display brightness cannot be raised; torch unverified | degraded - display brightness cannot be raised; torch unverified; iPhone: no element full screen | degraded - display brightness cannot be raised; torch unverified | none | planned - after the first release (S0030) - not in the first-release list |
| 136 | Tourist screen: pressure, altitude, compass, trip, level, light, weather tiles | FMS_A | FMS_A AF:1332, AF:1310 | impossible - barometer, magnetometer and light sensors the web lacks (weather tiles alone would work) | none | none | none | none | none | never - OS sensors |
| 137 | Set as the default media app; register as the default image viewer and video player | both | FMS_A AF:302, AF:14; FMS_Win RM:38, `src/Main_Form.FileAssociation.vb:16` | impossible - an OS default app (the nearest is row 54, Chromium desktop) | none | none | none | none | none | never - OS integration |

### Settings, languages, themes

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 138 | Interface in 13 languages, right to left for Arabic and Urdu | both | FMS_A AF:643, AF:696; FMS_Win RM:47 | page text and right-to-left layout (no listed key) | full | full | full | full | APP-STYLE, APP-SETTINGS, APP-BEHAVIOUR | first release - EN/RU/UK (handoff); the other ten languages and right-to-left later |
| 139 | Theme: auto, light, dark, accent themes; big buttons, compact elements, animations off; one unit system | both | FMS_A AF:295, AF:367, AF:306, AF:308, AF:970, AF:1050; FMS_Win SPEC-060, CL:188 (`src/Main_Form.Theme.vb:25` is the content-coloured stub) | prefers-color-scheme and prefers-reduced-motion (no listed key) | full | full | full | full | APP-STYLE, APP-SETTINGS, APP-BEHAVIOUR | first release - themes |
| 140 | Settings search (Ctrl+F) that jumps to the row | both | FMS_A AF:294, KB:558; FMS_Win RM:19 | keyboard events (Ctrl+F taken only while settings is open) | full | full | full | full | none | planned - after the first release (S0030) - not in the first-release list |
| 141 | Back up and restore all settings to a file or Google Drive, an import previewed as Replace or Merge with a way back; reset everything after an automatic backup | both | FMS_A AF:300, AF:301, AF:1136; FMS_Win `src/SettingsImport.vb:20`, SP 169 (done), CL:314 | a download; file input or picker; fetch for Drive | full | degraded - backup by download (picker per BCD only) | degraded - backup by download (iOS: some files open in a tab) | degraded - backup by download | none | planned - after the first release (S0030) - no device token, PIN or private key in a backup |
| 142 | Customize keyboard shortcuts with a conflict check; F1 shows the key card or the help page of the current screen | both | FMS_A AF:297, AF:1234, KB:546; FMS_Win `src/Hotkeys_Form.vb:19`, HK:89, `src/Main_Form.KeyboardInput.vb:541` | keyboard events; IndexedDB; Keyboard Lock for browser keys (Chromium, page-started full screen) | degraded - browser keys (Ctrl+N, Ctrl+T, Ctrl+W) only under Keyboard Lock in full screen | degraded - browser-reserved keys cannot be bound | degraded - browser-reserved keys cannot be bound (no Keyboard Lock) | degraded - browser-reserved keys cannot be bound (no Keyboard Lock) | INPUT-PARITY (FMS_Win also INPUT-CHORD) | planned - after the first release (S0030) - after the parity proposal (INPUT-PARITY) |
| 143 | Gamepad and TV-remote navigation with remappable actions | FMS_A | FMS_A AF:338, AF:344, KB:1002-1074 | Gamepad API (polled); keyboard events | full | full | full | full | INPUT-PARITY | planned - after the first release (S0030) - not in the first-release list |
| 144 | First-launch welcome wizard: language, theme, capabilities, where each choice lives | both | FMS_A AF:1-3; FMS_Win `src/Main_Form.Welcome.vb:45` | plain page (no listed key) | full | full | full | full | none | planned - after the first release (S0030) - after languages and themes |
| 145 | Storage page: cache budgets, thumbnail size tiers, cleanup | FMS_Win | FMS_Win RM:20 | OPFS; persistent storage; storage estimate | full | full | degraded - estimate from Safari 17; data may be erased after 7 days without a visit | full | none | planned - after the first release (S0030) - not in the first-release list |

### Diagnostics

| # | Function | Program | Where | Browser needs | Chromium desktop | Chromium Android | WebKit | Gecko | Contract | Verdict |
| 164 | Send feedback: one form with text, a picture and a voice note, handed to Send to.. (off by default) | FMS_A | FMS_A AF:1459 | file input; MediaRecorder; Web Share with files, else a download | degraded - Web Share on Linux unverified: download | full | full | degraded - no Web Share with files: download | none | planned - after the first release (S0030) - with the log sending of row 146 |
|---|---|---|---|---|---|---|---|---|---|---|
| 146 | Send the logs to the author: secrets redacted, shown first, then opened in mail | both | FMS_A AF:292, AF:293; FMS_Win RM:347, `src/Table_Form.SendLogs.vb:28` | a download (mailto cannot attach); Web Share with a file where supported | degraded - download, then attach (Web Share on Linux unverified) | full | full (Web Share with files) | degraded - download, then attach (no Web Share with files) | DIAGNOSTIC-REPORT | planned - after the first release (S0030) - DIAGNOSTIC-REPORT; not in the first-release list. The About page's own diagnostic export (SETTINGS-NAVIGATION 2.1 section 3 rule 3, S0048) already saves the same kind of report as a download; the send step stays later |
| 147 | A failed connection shown in the shared message table, with check steps (Next) and the code only under Details | both | FMS_A AF:1370; FMS_Win `src/Exchange/Connection_Diagnosis_Dialog.vb:15` | exchange server (DEVICE-EXCHANGE 7.10, items CY-DA); a page sees TLS and certificate failures as one opaque error | full | full | full | full | DEVICE-EXCHANGE 7.10 (items CY-DA) | first release, after the browser transport amendment (S0005, S0010) - connection diagnosis texts (acceptance 8) |
| 148 | System information report: searchable sections, copy, save, share | FMS_A | FMS_A AF:1358, AF:765 | Async Clipboard text; a download; Web Share; the little hardware information a browser reveals | degraded - little hardware information; Web Share on Linux unverified | degraded - little hardware information | degraded - little hardware information | degraded - little hardware information; no Web Share on desktop | none | planned - after the first release (S0030) - not in the first-release list |
| 149 | Usage statistics kept on the device, with a report to export | FMS_A | FMS_A AF:21, AF:31, AF:32 | IndexedDB; a download | full | full | degraded - iOS: the report may open in a tab | full | none | planned - after the first release (S0030) - not in the first-release list |
| 150 | Network checks: Network Monitor with the connected Bluetooth devices, ping, traceroute, speed test (FMS_A); "Is my server visible from outside" (FMS_Win) | both | FMS_A AF:687, AF:800, AF:801, AF:49, AF:763; FMS_Win `src/Exchange/OutsideVisibilityChecker.vb:22` | impossible - raw sockets, ICMP, probing a listening port from outside | none | none | none | none | none | never - raw sockets |

### Verdicts per group

| Group | Rows | First release | Planned | Never |
|---|---|---|---|---|
| Exchange account | 1-9, 151 | 9 | 1 | 0 |
| Exchange devices and directory | 10-15 | 2 | 3 | 1 |
| Exchange clipboard | 16-20 | 4 | 1 | 0 |
| Exchange broadcasts | 21-26, 152-153 | 3 | 5 | 0 |
| Exchange folders (tunnel) | 27-31 | 0 | 4 | 1 |
| Operator administration | 32-39 | 6 | 1 | 1 |
| Local browsing and viewing | 40-55, 154 | 9 | 8 | 0 |
| Local sorting and file operations | 56-66 | 1 | 9 | 1 |
| Player (video/audio) | 67-79, 157-159 | 2 | 13 | 1 |
| Images and documents | 80-88, 155-156 | 1 | 9 | 1 |
| Slideshow | 89-91 | 2 | 1 | 0 |
| Editing | 92-97, 160 | 0 | 7 | 0 |
| Streams and playlists | 98-103 | 0 | 5 | 1 |
| Capture | 104-108, 161 | 0 | 6 | 0 |
| OCR and translation | 109-112, 168 | 0 | 4 | 1 |
| Secure containers | 113-115 | 0 | 3 | 0 |
| Network sources | 116-120 | 0 | 1 | 4 |
| Sharing and serving | 121-127 | 0 | 3 | 4 |
| Scheduling and background | 128-130, 165-166 | 0 | 0 | 5 |
| System shell (launcher, widgets, watch, sensors) | 131-137, 162-163, 167 | 0 | 4 | 6 |
| Settings, languages, themes | 138-145 | 2 | 6 | 0 |
| Diagnostics | 146-150, 164 | 1 | 4 | 1 |
| **All** | 1-168 | **42** | **98** | **28** |

## Left to the native programs

Only rows whose verdict is still "never" are listed here, each with the reason a page physically cannot carry it (the
reason classes of `FUNCTION-PARITY` rule 1: a listening port, a raw socket, work after the tab closes, an operating-system
role, a sensor, a device pairing). Each row was re-examined on 2026-11-14 (S0055) for a route through another device of
the same account under `DEVICE-EXCHANGE`: the browser asks, a native device of the account does the part a page cannot.
A route exists only where the contract already carries the request; where it would need a new envelope the row stays
"never" and the route is named as the missing piece. No row moved to "planned" by this re-read: every route the contract
carries is already a row of its own, named beside the row it serves.

**No raw sockets and no listening port** - a page opens no TCP or UDP stream, listens on no port and cannot do mDNS:

- SMB and NAS shares as sources (116) and FTP and SFTP servers as sources (117): raw TCP. Route examined: a folder that
  a native device of the account publishes is reached through the tunnel (rows 27-29, `DEVICE-EXCHANGE` 7.5); the
  resource record has one kind, `sftp-share` (6.2), so a share the native device mounts is reachable only as a folder it
  publishes, never as the share itself.
- Finding NAS hosts and companion servers on the local network (118): mDNS. Route examined: the account's device list
  (row 10) is the browser's way to find the account's own devices; LAN hosts outside the account stay unreachable.
- `.fmscfg` folders and their QR codes (119): the code opens a direct SFTP endpoint, raw TCP. Route examined: none - the
  same folder published by its device is rows 27-29.
- RTSP sources (101): raw TCP and UDP. Route examined: the tunnel carries `rtsp` only for a broadcast of the account's
  own devices (7.5), which the page plays through the relay (rows 22-24); an arbitrary RTSP camera stays native.
- Network checks: Network Monitor with the Bluetooth devices, ping, traceroute, speed test, "Is my server visible from
  outside" (150): raw sockets and ICMP. Route examined: a page that reaches the server from another network is itself the
  outside visibility check, shown by the connection diagnosis (row 147, items CY-DA); the rest has no route.
- Casting a local file to Chromecast (74): needs an HTTP server the television can reach. Route examined: a cast in
  `DEVICE-EXCHANGE` 7.8 goes only to a receiver of the account (row 25, item CJ), never to a television.
- Serving folders over SFTP (123), the Wi-Fi live broadcast (124) and the StreamsPlayer HTTP gateway (125): a listening
  port. Route examined: the account's relay carries a browser broadcast (row 26, `DEVICE-EXCHANGE` 7.6); serving on the
  LAN stays native.

**No background work** - a page works only while its tab lives (a hidden tab still runs):

- Scheduled copy, move, delete and archive operations (128), those over exchange resources and the Drive path (129), a
  scheduled folder backup (165): work after the tab closes. Route examined: a schedule run by FMS_Win or FMS_A at the
  browser's request needs an envelope that asks another device of the account to create or run an operation;
  `DEVICE-EXCHANGE` has none (section 17 items BG-BH keep a PIN, they schedule nothing). Proposed 2026-11-14 (S0059,
  catalog `device-exchange/PROPOSAL-2026-11-14-remote-schedule.md`, `proposed`): two sealed frames on the control stream
  ask a device that declares `schedule-v1` to list, create, change, delete or run a schedule over resources of the
  directory. The rows stay "never" until the contract's owner accepts it. After that rows 128, 129 (the exchange-resource
  half; the Drive path stays native) and 165 (without a password container) move to "planned".
- Transfers, sync and playback that go on after the screen is left (130): work after the tab closes. Route examined:
  none - the work is the page's own.
- Publishing this device's folders through the server, or giving one to a guest or by a link with a password (31): a
  published folder must outlive the tab. Route examined: a grant or a public link is created by the producing device
  (section 20); nothing lets another device ask for one.

**Operating-system role:**

- The server machine: first-run wizard, firewall rule, service mode (39). Route examined: the host settings an operator
  changes remotely are row 38 (first release); the wizard, the rule and the service stay on the machine.
- The Recycle Bin (60); Office documents opened in their own program (88); FileDO virtual disks (126); a document opened
  in doc-html-translate (168): launching or mounting through the operating system. Route examined: none.
- Filling and wiping a folder's free space (166, `FILLER-RESERVE`): a page sees its own storage quota, never a volume's
  free space, and the scheduled form also needs work after the tab closes. Route examined: none.
- Launcher mode, edge gestures, Quick Settings tiles and the notification strip (131); home-screen widgets (132); the
  default media app or default viewer (137 - the nearest a page gets is the file handling of row 54, installed Chromium
  desktop web app only). Route examined: none.

**Sensors and device pairing:**

- Connecting the paired watch to the server (15): the watch enrolls by a pairing code the phone hands over the
  phone-to-watch link (`DEVICE-EXCHANGE` item CG). Route examined: the browser can issue a pairing code (row 12), but
  only the phone carries it to the watch.
- The Wear OS companion: player on the watch, the watch as a file destination, phone camera on the watch, broadcast to
  the watch, watch face (134); watch sensors and a scheduled message on the watch (167): the paired-watch link and the
  watch's sensors. Route examined: an enrolled watch is one more device of the account - the browser sees it in the
  device list (row 10) and casts a broadcast to it (row 25, `DEVICE-EXCHANGE` 7.8 item CJ); the watch is never a
  resource producer (item CH), so it is never a file destination for a page.
- Barometer, magnetometer and light sensors of the tourist screen (136): sensors the web lacks. Route examined: none;
  the weather tiles alone would work in a page and are not a row of their own.

## Parts of planned rows that stay native until built

Not "never": these rows are planned, and until their part is built it is the native programs' work.

- **Heavy formats**, possible in a page only through large WASM libraries: AVI, WMV and Blu-ray `.m2ts` (67 - there is
  no browser twin of LibVLC); AC-3/E-AC-3 tracks (69 - absent from Chrome and Firefox); HEIC/HEIF outside Safari (81);
  JPEG XL before Chrome 155 and Firefox 158 (82); 7z and RAR (55); `.fd-sec` containers (113, 114 - Argon2id and
  XChaCha20-Poly1305 are not in WebCrypto); OCR and translation models (109-112).
- **The parts that would outlive the tab**: background audio with lock-screen controls (76), a cast received with the
  tab closed (25), the schedules of the Drive channel (127), the watch part of the SOS signal (162).

## Proposed support floor

Proposal: the current and the previous major version of each listed browser, the current Firefox ESR, and the
current Samsung Internet. Versions as of 2026-10-16:

| Browser | Floor | Versions on 2026-10-16 | Source |
|---|---|---|---|
| Chrome, desktop and Android | current and previous major | 155 (155.0.8059.85 Windows, 155.0.8059.84 Android; stable since 2026-10-06) and 154 (2026-09-22) | S4, S1 |
| Microsoft Edge | current and previous major | 155 (155.0.4283.60; 155 since 2026-10-08) and 154 | S5, S1 |
| Firefox, desktop and Android | current and previous major, plus the current ESR | 158.0 (2026-10-13) and 157; ESR 153.5.0esr (ESR 153 since 2026-07-21) | S3, S1 |
| Safari macOS | current and previous major | 27.0 (2026-09-14; also installable on macOS 26 Tahoe and 15 Sequoia) and 26 | S1, D8 |
| Safari iOS/iPadOS (and so every iOS/iPadOS browser) | current and previous major | 27.0 (iOS 27, iPadOS 27; 2026-09-14) and 26 | S1, D8 |
| Samsung Internet | current | 30.0 (Chromium 143; 2026-05-11) | S1 |
| Opera, Brave | not in the floor; treated as Chromium desktop, best effort | Opera 137 (Chromium 153; 2026-10-07) | S1 |
| Firefox legacy ESR 115 | not supported | 115.43.0esr is still published | S3 |
| Internet Explorer | not supported | the IE11 desktop app retired 2022-06-15 | D27, S1 |

- **"IE" in the owner's request is read as Microsoft Edge.** Internet Explorer cannot run this product: it has no ES
  modules (BCD `ie: false` for javascript.statements.import and html.elements.script.type.module), and its WebCrypto
  has no promise-based ECDH P-256 or HKDF (BCD `ie: false` for api.SubtleCrypto.deriveBits and
  api.SubtleCrypto.importKey.ECDH; IE11 returns `CryptoOperation`/`KeyOperation` objects instead of a Promise).
  Legacy Edge (12-18) lacked ECDH and HKDF too.
- **Chrome now ships a milestone every two weeks** (151 on 07-28, 152 on 08-25, 153 on 09-08, 154 on 09-22, 155 on
  10-06; 156 due 10-20), so "previous major" spans about a month. The floor is re-read at each FMS_Web release, not
  copied from this table.
- **What the floor gives the first-release rows:** the oldest engines in it - Safari 26, Firefox ESR 153 and Samsung
  Internet 30 on Chromium 143 - all have WebSocket, WebCrypto ECDH P-256 / HKDF / AES-GCM, IndexedDB, OPFS with
  `createWritable` (Safari 26), folder input (iOS 18.4, Firefox Android 142, Chrome Android 132), Async Clipboard text
  and PNG, Fullscreen (iPad; iPhone video only), Screen Wake Lock (iOS 18.4, Firefox 126) and WebM VP9 (iOS 17.4). No
  first-release row needs a feature newer than its floor engine, except where its cell says so (for example MKV,
  which Samsung Internet 30 lacks).

## When a function is unavailable in this browser

Proposal:

- **The control stays visible but disabled** - never a silently missing button. It stays reachable by keyboard and
  screen reader (`aria-disabled`, not the `disabled` attribute, so focus lands on it and the reason is read), in line
  with the handoff's accessibility constraints: full keyboard control, a label on every button, state never by colour
  alone.
- **One line says what is unavailable and why, and names the browser that has it.** It shows beside the control, and
  on focus or tap.
- **The wording follows the `DEVICE-EXCHANGE` message-table form**: "what happened", then "what to try"
  (`DEVICE-EXCHANGE` 7.10, items CZ and DA; program names by item CX). The handoff's "section 25" no longer exists in
  the catalog page: the message items now sit in 7.10, the dictionary in section 2 (items CV-CX).
- **Words from the table's form, not from its rows.** These texts say "this browser", so no native program would show
  one. S0010 (2026-10-16) therefore did **not** file them as rows of the shared message table: no second implementation
  reads them, which is the test of the catalog's rules page (section 2) for a product's private decision. They stay this
  product's, in the table's form, in EN, RU and UK in the same edit as the interface; the drafts below are in English
  only. The clipboard rows that do belong to the exchange were filed in the clipboard proposal.
- **Detection is by feature test** (`'showDirectoryPicker' in window`, `canPlayType`, `MediaSource.isTypeSupported`,
  `navigator.storage.persisted()`), never by the user-agent string.

Draft rows (proposals; `{..}` marks a value the page fills in):

| Case | Rows | What happened | What to try |
|---|---|---|---|
| No folder writes - sorting | 56 (planned 47, 57-59, 61-64) | "This browser cannot move or copy files between folders on your device." | "Open this page in Chrome or Edge on a computer." |
| No folder writes - saving a result | planned 92-97, 104-108, 114 | "This browser cannot write into a folder on your device." | "Open this page in Chrome or Edge on a computer, or save the result as a download." |
| Folder access turned off (Brave) | 40, 56 | "Folder access is turned off in this browser." | "Turn on File System Access in brave://flags and reload this page, or open it in Chrome or Edge." |
| Picked folder is read-only | 40, 44, 46 | "This browser opened the folder for reading only." | "You can browse and view here. To sort into folders, open this page in Chrome or Edge on a computer." |
| Format not playable | 67, 80 | "This browser cannot play {format}." | "Open the file in {browsers that play it}, or in FastMediaSorter for Android or Windows." |
| Full screen on iPhone | 52, 89 | "This browser shows only videos in full screen." | "The picture fills the window instead. For full screen, use an iPad or a computer." |
| Storage may be erased (WebKit) | 4, 8, 9 | "This browser may erase this page's data, including this device's key, after 7 days without a visit." | "Add this page to the Home Screen and open it from there, or use it at least once every 7 days. If the data is gone, sign in again: this browser becomes a new device." |
| No file association | 1 | "This browser cannot open .fmsexch files from your file manager." | "Use Open file on this page, or install this page as an app in Chrome or Edge on a computer." |
| Clipboard read refused | 16, 17 | "This browser did not let this page read the clipboard." | "Allow clipboard access for this page in the browser's site settings, or paste into the box with Ctrl+V (Cmd+V on a Mac)." |
| Download may open in a tab (iOS) | 19 | "On this device a received file may open in a new tab instead of being saved." | "If it does, save it from that tab with the Share button." |
| No backward frame step (Firefox Android) | 68 | "This browser cannot step a video back frame by frame." | "Step forward instead, or open this page in a browser on a computer." |

## Keyboard

From the inventory's key-binding tables (FMS_A `KB:` lines, FMS_Win `HK:` lines and `src/Main_Form.KeyboardInput.vb`).

**Shared keys - the two programs agree:**

| Key | Action | FMS_A | FMS_Win |
|---|---|---|---|
| 1..9, 0 (top row and number pad) | move the current file to destination folder N (FMS_A numbers its Copy buttons before its Move buttons and has no Shift+digit; FMS_Win copies on Shift+digit) | KB:714-822 | HK:139-143 |
| PgDn / PgUp | next / previous file | KB:234, KB:246 | HK:90-91 (extra keys) |
| M | mute | KB:438 | HK:131-134 |
| . (period) | next frame (bound but inert in FMS_A's player) | KB:102 | HK:129 |
| F1 | help | KB:546 | HK:112-115 |
| Esc | step back or leave: the same direction, other layers (FMS_Win has a ladder of ten, FMS_A leaves the player after its overlays) | KB:534 | `src/Main_Form.KeyboardInput.vb:244` |

Corrected on 2026-10-16 by the key re-read of S0010 (the key line of an FMS_A entry is five lines after its `command_id`
line; every `KB:` number here and in the inventory is the `command_id` line): `Home` and `End` are not first and last
file in FMS_A, they act on the pages of a PDF, EPUB or text only; `R` is not shared (below); FMS_A's seek steps are 10 s
and 60 s, not 5 s and 30 s, so they match FMS_Win's medium and long steps and only the keys differ.

**Conflicts - the same key does different things:**

| Key | FMS_A | FMS_Win | In a browser |
|---|---|---|---|
| F2 | rename (KB:630) | settings (HK:112-115) | no browser meaning listed |
| F3 | file information (KB:510) | thumbnail panel (HK:112-115) | the browser's "find next" - the page must take it, to be measured per browser |
| F5 | copy (KB:606) | random slideshow (HK:94) | reload - the page must take it, to be measured |
| F6 | move (KB:594) | rename (HK:104) | moves focus to the address bar - to be measured |
| F7 | create folder (KB:666) | full screen (HK:112) | has a browser meaning - to be measured |
| F | full screen (KB:366) | choose a file (HK:101) | no browser meaning listed |
| B | black screen (KB:834) | previous file (HK:91, extra) | no browser meaning listed |
| Backspace | delete (KB:618) | previous file (HK:91, extra) | no browser meaning listed |
| R | toggles the screen-rotation sensor, not the picture (KB:378; `PlayerViewModel.kt` 798-807) | rotates the picture clockwise, `Shift+R` the other way (HK:108-109) | no browser meaning listed |
| `[` / `]` | seek 10 s back / forward (KB:150, KB:138) | slower / faster (HK:120-121) | no browser meaning listed |
| Space | pause / play (KB:6) | next file (HK:90, extra) | scrolls the page unless the page takes it |
| Shift+Left / Shift+Right | seek 60 s (KB:174, KB:162) | seek 3 s (HK:123-124) | no browser meaning listed |

**Keys the browser does not give a page:**

- Never reachable in Chrome: Ctrl+N, Ctrl+Shift+N (FMS_A's second key for create folder, KB:666), Ctrl+T, Ctrl+W.
- In full screen: F11 is the browser's own key and Esc always leaves the browser's full screen first. Without
  Keyboard Lock, keys the browser or the OS reserve (Esc, Alt+Tab, Ctrl+N in Chrome's documentation) never reach the
  page. Keyboard Lock exists only in Chromium, only in a full screen the page started, with a permission since Chrome
  130, and a long Esc still exits (D16). FMS_Win's reserved keys (F11, F10, Esc, Win, Menu, Alt+Tab, Alt+F4,
  Ctrl+Alt+Del; `src/CustomHotkeys.vb:266-275`) stay out of reach in a browser too.
- Keys with a browser meaning that a focused page must take with `preventDefault`, to be measured per browser: F1, F3,
  F5, F6, F7, Ctrl+F, Ctrl+P, Ctrl+R, Ctrl+S, Ctrl+B, BrowserBack, BrowserForward.
- On iOS/iPadOS keys arrive only from a hardware keyboard; touch needs on-screen controls.
- Shift+digit and the Oem keys change `KeyboardEvent.key` with the keyboard layout; binding by `KeyboardEvent.code`
  keeps FMS_Win's physical-key meaning (`src/CustomHotkeys.vb:70-75`).

**Parity needs a proposal.** FMS_Web needs one default key column, and it should be the same column for all three
programs: a proposal to the `INPUT-PARITY` keyboard column settles the conflicts above and, for every default key a
browser cannot receive, names the second key that all three programs accept. There is no web-only key map. The proposal
was filed on 2026-10-16 (S0010) beside the contract; its status is in this product's registry row, and the per-engine list
of keys a page cannot receive is the measurement of S0023, which the proposal waits for as an addendum.
