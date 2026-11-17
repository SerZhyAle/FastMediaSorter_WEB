# FastMediaSorter for Web

FastMediaSorter for Web brings browsing, playback, quick folder sorting and Media Exchange Server access to your browser on systems where the native programs do not run - macOS, Linux, ChromeOS, iOS and iPadOS - and for anyone who cannot install a program.

- **Product page:** [serzhyale.github.io/FastMediaSorter_WEB](https://serzhyale.github.io/FastMediaSorter_WEB/) ([RU](https://serzhyale.github.io/FastMediaSorter_WEB/ru/) · [UK](https://serzhyale.github.io/FastMediaSorter_WEB/uk/))
- **Guide:** [Quick-start guide](https://serzhyale.github.io/FastMediaSorter_WEB/guide.html)
- **Privacy:** [Privacy & permissions](https://serzhyale.github.io/FastMediaSorter_WEB/privacy.html)
- **Support:** [Support & compatibility](https://serzhyale.github.io/FastMediaSorter_WEB/support.html)
- **Releases:** [GitHub Releases](https://github.com/SerZhyAle/FastMediaSorter_WEB/releases/latest)

## Your own files

- Browse a folder, view images and animated images, play video and audio, and run a slideshow.
- Sort: choose up to ten destination folders, then press `1` to `9` or `0` to move the open file into that folder and open the next one. A file with the same name in the destination is never replaced. Moving files to destination folders requires Chrome or Edge on a computer; in other browsers the control stays visible and disabled, with the reason beside it.

## Your exchange account

The browser acts as one more device of your account on a [Media Exchange Server](https://serzhyale.github.io/FastMediaSorter_mob_v2/docs/media-exchange-portal/exchange-server.html), using the shared `DEVICE-EXCHANGE` protocol. Connecting to an exchange account is distinct from installing the Windows program's local SFTP folder sharing: the account lives on a server its owner runs, the browser has no SFTP of its own, and no Windows installation is required to use this web app.

- Register from an invitation: a link or connection string opens the page with the invitation filled in, and you choose a login and a password. Delete the account from the same place.
- View your devices and resources, receive your account's broadcasts and use the shared clipboard.
- Connection diagnosis explains why a connection fails, in the same words as the native programs.
- The server owner runs server administration directly from the browser.
- The device's private key never leaves the browser, and the server cannot read sealed content.

Learn more on the shared [Media exchange between your devices](https://serzhyale.github.io/FastMediaSorter_mob_v2/docs/media-exchange-portal/) portal.

## Native family programs

What only an operating system can do - listen on a port, work after the tab closes, use raw sockets or pair with a watch - stays with the native programs:

- [Fast Media Sorter & Organizer](https://serzhyale.github.io/FastMediaSorter_mob_v2/) (Android)
- [Fast Media Sorter & Sharing for Windows](https://serzhyale.github.io/FastMediaSorter_Lite/) (Windows) - Media and file manager for Windows: sort photos and videos with one key

The Windows program installs as four optional parts - a media and file manager, local SFTP folder sharing, scheduled file operations and a Media Exchange Server that you run yourself - and you start with the manager or with the folder-sharing server; neither needs the other. The Media Exchange Server is not included in any published package of the Windows program at present, and this exchange account works on a server run by its owner; neither the Windows viewer nor any of its components is required to use this web app. The [Windows program's own page](https://serzhyale.github.io/FastMediaSorter_Lite/) names its components and its install choices.

## About and diagnostics

- The About page saves a diagnostic report on request: a ZIP archive with a summary of the browser, page settings and the current visit log. It holds no file or folder names, passwords or account details, is created on the device only when you press the button, and is never sent anywhere.

## Browsers

Current and previous major version of Chrome, Edge, Firefox (plus current ESR), Safari on macOS and Safari on iOS and iPadOS, and current Samsung Internet. A function a browser cannot run stays visible and disabled, with one line saying why.

## Project & contact

- Static HTML, CSS and ES modules under `web/` with no build step; dependencies vendored under `web/vendor/`.
- License: MIT ([LICENSE](LICENSE)).
- Author: [SZA](https://sza.od.ua) · GitHub: [SerZhyAle](https://github.com/SerZhyAle) · Email: `sza@ukr.net`
