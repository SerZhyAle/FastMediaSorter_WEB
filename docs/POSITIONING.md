# FastMediaSorter for Web - Positioning and Hub Copy

This document is the single source of truth for the public positioning, audience, browser support floor and hub card copy of **FastMediaSorter for Web** across `README.md`, the product site (`docs/`) and the `sza.od.ua` hub handoff (`docs/HUB_HANDOFF.md`).

## 1. Product identity

- **Public name (all languages):** FastMediaSorter for Web
- **Map type label:**
  - **EN:** Browser media sorter
  - **RU:** Сортировщик медиа в браузере
  - **UK:** Сортувальник медіа в браузері
- **Canonical landing URL:** `https://serzhyale.github.io/FastMediaSorter_WEB/`
- **Repository:** `https://github.com/SerZhyAle/FastMediaSorter_WEB`
- **Contact:** `sza@ukr.net` | GitHub `SerZhyAle`

## 2. One-sentence positioning

- **EN:** FastMediaSorter for Web brings browsing, playback, quick folder sorting and Media Exchange Server access to your browser on systems where the native programs do not run.
- **RU:** FastMediaSorter for Web приносит просмотр, воспроизведение, быструю сортировку по папкам и доступ к Media Exchange Server в браузер для систем, где не работают нативные программы.
- **UK:** FastMediaSorter for Web приносить перегляд, відтворення, швидке сортування за теками та доступ до Media Exchange Server у браузер для систем, де не працюють нативні програми.

## 3. Audience

- People on operating systems the native programs do not serve: macOS, Linux, ChromeOS, iOS and iPadOS.
- Anyone who cannot install a desktop or mobile program and needs to browse, sort or exchange media directly from a browser.

## 4. Browser support floor

Current and previous major version of each supported engine, plus current ESR for Firefox and current Samsung Internet:

| Engine / Browser | Browse & view | Play audio & video | Slideshow | Sort to destination folders (1-9, 0) | Exchange account & admin |
| --- | --- | --- | --- | --- | --- |
| Chrome / Edge (desktop) | Supported | Supported | Supported | Supported (File System Access) | Supported |
| Chrome / Samsung Internet (Android) | Supported | Supported | Supported | Visible, disabled (no directory write access) | Supported |
| Firefox (desktop, ESR, Android) | Supported | Supported | Supported | Visible, disabled (no directory write access) | Supported |
| Safari (macOS, iOS, iPadOS) | Supported | Supported | Supported | Visible, disabled (no directory write access) | Supported |

What needs the operating system itself - listening on a port, running after the tab closes, raw sockets, or pairing with a watch - stays with the native programs ([Fast Media Sorter & Organizer](https://serzhyale.github.io/FastMediaSorter_mob_v2/) for Android and [Fast Media Sorter & Sharing for Windows](https://serzhyale.github.io/FastMediaSorter_Lite/)).

## 5. Hub card copy (EN / RU / UK)

| Locale | Title | Type | Description | Landing button | Source button |
| --- | --- | --- | --- | --- | --- |
| `en` | FastMediaSorter for Web | Web app | Browse and play your media, sort files into folders and connect your devices through an exchange account in your browser. | Product page | GitHub |
| `ru` | FastMediaSorter for Web | Веб-приложение | Просматривайте и воспроизводите медиа, сортируйте файлы по папкам и связывайте устройства через учётную запись обмена в браузере. | Страница продукта | GitHub |
| `uk` | FastMediaSorter for Web | Вебзастосунок | Переглядайте й відтворюйте медіа, сортуйте файли за теками та зв'язуйте пристрої через обліковий запис обміну в браузері. | Сторінка продукту | GitHub |

## 6. The Windows family program as these surfaces name it (S0037)

Source of truth: the Windows product's own positioning source (its `docs/guides/POSITIONING.md`
and `tools/site-facts.json`). This section copies, it never restates from memory; re-read that source
when Windows facts change.

- **Cross-link blurb, copied verbatim beside every link to it** (the source's `positioning.blurb`):
  - **EN:** Media and file manager for Windows: sort photos and videos with one key
  - **RU:** Медиа- и файловый менеджер для Windows: сортировка фото и видео одной клавишей
  - **UK:** Медіа- та файловий менеджер для Windows: сортування фото й відео однією клавішею
- **Components, in the source's order:** media and file manager; local sharing (SFTP folder
  sharing); scheduled file operations (installed together with the Share Manager); Media Exchange
  Server - a server you run yourself. FileDO virtual disks stay a capability of sharing, not a
  component.
- **Availability, as stated by that source:** the manager ships in every package; local sharing and
  scheduled file operations are shipped, optional, off until switched on; the Media Exchange Server
  is built but **not included in any published package of the Windows program in any channel**. No
  surface of this repository offers it, links a download for it, or ties it to a store listing.
- **Install intents:** start with the manager, or start with the folder-sharing server (the Server
  edition). Neither entry requires the other. Channel and edition facts (Store, winget, installer,
  ZIP) live on the Windows product's own pages; this repository names none of them.
- **Boundary sentence, on every surface that names the exchange account:** connecting a browser to
  an exchange account is distinct from installing the Windows program's local SFTP folder sharing;
  an exchange account lives on a Media Exchange Server that its owner runs, the browser has no SFTP
  of its own, and no Windows installation is required to use this web app.
