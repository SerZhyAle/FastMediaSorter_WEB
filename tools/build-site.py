#!/usr/bin/env python3
"""Generate static EN, RU, and UK product site pages under docs/."""

from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
BASE_URL = "https://serzhyale.github.io/FastMediaSorter_WEB/"
REPO_URL = "https://github.com/SerZhyAle/FastMediaSorter_WEB"
RELEASES_URL = f"{REPO_URL}/releases/latest"
ISSUES_URL = f"{REPO_URL}/issues"
PORTAL_URL = "https://serzhyale.github.io/FastMediaSorter_mob_v2/docs/media-exchange-portal/"
SERVER_PAGE_URL = "https://serzhyale.github.io/FastMediaSorter_mob_v2/docs/media-exchange-portal/exchange-server.html"
FMS_A_URL = "https://serzhyale.github.io/FastMediaSorter_mob_v2/"
FMS_WIN_URL = "https://serzhyale.github.io/FastMediaSorter_Lite/"

FAMILY_ROWS = [
    (
        "Fast Media Sorter & Organizer",
        {
            "en": "Android media sorter",
            "ru": "Сортировщик медиа для Android",
            "uk": "Сортувальник медіа для Android",
        },
        FMS_A_URL,
    ),
    (
        "Fast Media Sorter & Sharing for Windows",
        {
            "en": "Windows media and file manager",
            "ru": "Файловый и медиаменеджер для Windows",
            "uk": "Файловий і медіаменеджер для Windows",
        },
        FMS_WIN_URL,
    ),
    (
        "CyrFlip",
        {
            "en": "Windows layout fixer",
            "ru": "Исправление раскладки Windows",
            "uk": "Виправлення розкладки Windows",
        },
        "https://serzhyale.github.io/CyrFlip/",
    ),
    (
        "doc-html-translate",
        {
            "en": "Windows ebook converter",
            "ru": "Конвертер электронных книг для Windows",
            "uk": "Конвертер електронних книг для Windows",
        },
        "https://serzhyale.github.io/doc-html-translate/",
    ),
    (
        "FileDO",
        {
            "en": "Windows storage CLI",
            "ru": "Консольная утилита для дисков Windows",
            "uk": "Консольна утиліта для дисків Windows",
        },
        "https://serzhyale.github.io/FileDO/",
    ),
    (
        "STREAMS Player",
        {
            "en": "Windows stream player",
            "ru": "Плеер потоков для Windows",
            "uk": "Плеєр потоків для Windows",
        },
        "https://serzhyale.github.io/StreamsPlayer/",
    ),
    (
        "OneClickRunner",
        {
            "en": "Windows tray launcher",
            "ru": "Лаунчер в трее Windows",
            "uk": "Лаунчер у треї Windows",
        },
        "https://serzhyale.github.io/OneClickRunner/",
    ),
    (
        "Universal Agent Kit",
        {
            "en": "AI-dev methodology",
            "ru": "Методология разработки с ИИ",
            "uk": "Методологія розробки з ШІ",
        },
        "https://serzhyale.github.io/universal-agent-kit/",
    ),
    (
        "SZA (hub)",
        {
            "en": "Portfolio",
            "ru": "Портфолио",
            "uk": "Портфоліо",
        },
        "https://sza.od.ua",
    ),
]

COMMON = {
    "en": {
        "lang_attr": "en",
        "sza_lang": "en",
        "prefix": "",
        "rel_root": "",
        "brand": "FastMediaSorter for Web",
        "kicker": "Browser media sorter",
        "guide_nav": "Guide",
        "privacy_nav": "Privacy",
        "support_nav": "Support",
        "theme_btn": "Theme",
        "theme_aria": "Switch theme",
        "get_btn": "Get started",
        "lang_label": "Language",
        "more_tools": "More tools by SZA",
        "author_label": "Author",
        "contact_label": "Contact",
        "license_label": "MIT License",
        "back_top": "Scroll to top",
        "open_new": ", Open in new window",
    },
    "ru": {
        "lang_attr": "ru",
        "sza_lang": "ru",
        "prefix": "ru/",
        "rel_root": "../",
        "brand": "FastMediaSorter for Web",
        "kicker": "Сортировщик медиа в браузере",
        "guide_nav": "Руководство",
        "privacy_nav": "Приватность",
        "support_nav": "Поддержка",
        "theme_btn": "Тема",
        "theme_aria": "Переключить тему",
        "get_btn": "Начать",
        "lang_label": "Язык",
        "more_tools": "Другие программы SZA",
        "author_label": "Автор",
        "contact_label": "Контакт",
        "license_label": "Лицензия MIT",
        "back_top": "Наверх",
        "open_new": ", откроется в новом окне",
    },
    "uk": {
        "lang_attr": "uk",
        "sza_lang": "ua",
        "prefix": "uk/",
        "rel_root": "../",
        "brand": "FastMediaSorter for Web",
        "kicker": "Сортувальник медіа в браузері",
        "guide_nav": "Посібник",
        "privacy_nav": "Приватність",
        "support_nav": "Підтримка",
        "theme_btn": "Тема",
        "theme_aria": "Перемкнути тему",
        "get_btn": "Почати",
        "lang_label": "Мова",
        "more_tools": "Інші програми SZA",
        "author_label": "Автор",
        "contact_label": "Контакт",
        "license_label": "Ліцензія MIT",
        "back_top": "Догори",
        "open_new": ", відкриється в новому вікні",
    },
}


def page_url(locale: str, page: str) -> str:
    prefix = COMMON[locale]["prefix"]
    if page == "index.html":
        return f"{BASE_URL}{prefix}"
    return f"{BASE_URL}{prefix}{page}"


def locale_href(current_locale: str, target_locale: str, page: str) -> str:
    rel = COMMON[current_locale]["rel_root"]
    target_prefix = COMMON[target_locale]["prefix"]
    if page == "index.html":
        return f"{rel}{target_prefix}" if target_prefix else (rel or "./")
    return f"{rel}{target_prefix}{page}"


def pre_paint_script(locale: str, page: str) -> str:
    redirect = ""
    if locale == "en" and page == "index.html":
        redirect = (
            "var ql=q.get('lang')||q.get('l');"
            "var st=null;try{st=localStorage.getItem('sza-lang')}catch(e){}"
            "var ch=ql||st;"
            "if(ch){ch=ch.toLowerCase();if(ch==='ua')ch='uk';"
            "if(ch==='ru'||ch==='uk'){location.replace(ch+'/'+location.hash);return;}}"
        )
    return (
        "<script>\n(function(){\n"
        "  var q=new URLSearchParams(location.search),h=document.documentElement;\n"
        f"  {redirect}\n"
        "  var th=q.get('theme');if(th!=='light'&&th!=='dark'){try{th=localStorage.getItem('sza-theme')}catch(e){}}"
        "if(th!=='light'&&th!=='dark')th=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';\n"
        "  h.setAttribute('data-theme',th);\n"
        "  var pr=q.get('profile');if(pr!=='pointer'&&pr!=='touch')pr=matchMedia('(pointer: coarse)').matches?'touch':'pointer';\n"
        "  h.setAttribute('data-ui-profile',pr);\n"
        "})();\n</script>"
    )


def render_head(locale: str, page: str, title: str, description: str) -> str:
    c = COMMON[locale]
    rel = c["rel_root"]
    canon = page_url(locale, page)
    en_url = page_url("en", page)
    ru_url = page_url("ru", page)
    uk_url = page_url("uk", page)
    return f"""<!DOCTYPE html>
<html lang="{c['lang_attr']}" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<link rel="canonical" href="{canon}">
<link rel="alternate" hreflang="en" href="{en_url}">
<link rel="alternate" hreflang="ru" href="{ru_url}">
<link rel="alternate" hreflang="uk" href="{uk_url}">
<link rel="alternate" hreflang="x-default" href="{en_url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canon}">
<link rel="icon" href="{rel}assets/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="{rel}assets/icon.svg">
{pre_paint_script(locale, page)}
<link rel="stylesheet" href="{rel}styles/sza-kit.css">
<style>
  body{{padding-bottom:4rem}}
  .wrap{{padding:0 var(--gutter);position:relative;z-index:1}}
  .cards{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr));gap:1rem;margin:1rem 0 1.5rem}}
  .card{{border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;background:var(--card)}}
  .card h2,.card h3{{margin-top:0;font-size:1.05rem}}
  .card p:last-child{{margin-bottom:0}}
  .caveat{{color:var(--muted);font-size:.9rem;margin-top:.5rem}}
  .table-wrap{{overflow-x:auto;margin:1rem 0}}
  table{{width:100%;border-collapse:collapse;font-size:.92rem}}
  th,td{{text-align:left;padding:.55rem .7rem;border-bottom:1px solid var(--border);vertical-align:top}}
  th{{color:var(--text-2);font-family:var(--font-heading)}}
  .inline-mark{{width:20px;height:20px;vertical-align:text-bottom;margin-inline-end:.35rem}}
  .footer-meta{{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;align-items:center;color:var(--muted);font-size:.9rem}}
  .footer-meta a{{color:inherit}}
</style>
</head>"""


def render_header(locale: str, page: str, is_landing: bool) -> str:
    c = COMMON[locale]
    home_href = locale_href(locale, locale, "index.html")
    ru_href = locale_href(locale, "ru", page)
    en_href = locale_href(locale, "en", page)
    uk_href = locale_href(locale, "uk", page)
    cta = f'<a class="btn btn-primary" href="#get">{html.escape(c["get_btn"])}</a>' if is_landing else ""
    return f"""<header class="site-header">
  <a class="brand" href="{home_href}">{html.escape(c['brand'])}</a>
  <a class="btn btn-ghost" href="guide.html">{html.escape(c['guide_nav'])}</a>
  <div class="seg" role="group" aria-label="{html.escape(c['lang_label'])}">
    <a href="{ru_href}" data-set-lang="ru" aria-pressed="{'true' if locale == 'ru' else 'false'}">RU</a><a href="{en_href}" data-set-lang="en" aria-pressed="{'true' if locale == 'en' else 'false'}">EN</a><a href="{uk_href}" data-set-lang="ua" aria-pressed="{'true' if locale == 'uk' else 'false'}">UA</a>
  </div>
  <button type="button" class="theme-btn" id="themeBtn" aria-label="{html.escape(c['theme_aria'])}"><span class="gi gi-theme" aria-hidden="true"></span><span>{html.escape(c['theme_btn'])}</span></button>
  {cta}
</header>"""


def render_footer(locale: str, is_landing: bool) -> str:
    c = COMMON[locale]
    grid_html = ""
    if is_landing:
        links = "\n".join(
            f'      <a href="{url}"><b>{html.escape(tool)}</b><span>{html.escape(types[locale])}</span></a>'
            for tool, types, url in FAMILY_ROWS
        )
        grid_html = f"""  <section aria-label="{html.escape(c['more_tools'])}">
    <h2>{html.escape(c['more_tools'])}</h2>
    <div class="tools-grid">
{links}
    </div>
  </section>"""
    return f"""<footer class="site-footer wrap">
{grid_html}
  <div class="footer-meta">
    <span>{html.escape(c['author_label'])}: <a href="https://sza.od.ua">SZA</a></span>
    <a href="https://github.com/SerZhyAle">GitHub: SerZhyAle</a>
    <span>{html.escape(c['contact_label'])}: <a href="mailto:sza@ukr.net">sza@ukr.net</a></span>
    <a href="privacy.html">{html.escape(c['privacy_nav'])}</a>
    <a href="guide.html">{html.escape(c['guide_nav'])}</a>
    <a href="support.html">{html.escape(c['support_nav'])}</a>
    <a href="{REPO_URL}/blob/main/LICENSE">{html.escape(c['license_label'])}</a>
  </div>
</footer>
<button type="button" class="to-top show" id="toTop" aria-label="{html.escape(c['back_top'])}" title="{html.escape(c['back_top'])}"><span class="gi gi-top" aria-hidden="true"></span></button>
<script>
(function(){{
  var h=document.documentElement;
  document.querySelectorAll('[data-set-lang]').forEach(function(a){{
    a.addEventListener('click',function(){{try{{localStorage.setItem('sza-lang',a.getAttribute('data-set-lang'))}}catch(e){{}}}});
  }});
  var tb=document.getElementById('themeBtn');
  if(tb)tb.addEventListener('click',function(){{
    var n=h.getAttribute('data-theme')==='light'?'dark':'light';
    h.setAttribute('data-theme',n);
    try{{localStorage.setItem('sza-theme',n)}}catch(e){{}}
  }});
  var tt=document.getElementById('toTop');
  if(tt)tt.addEventListener('click',function(){{window.scrollTo({{top:0,behavior:'smooth'}})}});
}})();
</script>
</body>
</html>"""


LANDING_COPY = {
    "en": {
        "title": "FastMediaSorter for Web - Browse, sort and exchange media in your browser",
        "desc": "FastMediaSorter for Web brings browsing, playback, quick folder sorting and Media Exchange Server access to your browser on systems where the native programs do not run.",
        "h1": "Browse, sort and exchange media in your browser.",
        "lead": "FastMediaSorter for Web brings browsing, playback, quick folder sorting and Media Exchange Server access to your browser on systems where the native programs do not run.",
        "audience": "Built for macOS, Linux, ChromeOS, iOS, iPadOS and anyone who cannot install a native program.",
        "cards": [
            ("Browse and play local media", "Open a local folder in your browser to view photos and animated images, play video and audio, and run a slideshow with Screen Wake Lock."),
            ("Sort into destination folders", "Assign up to ten destination folders and press 1 to 9 or 0 to move the open file and advance to the next one. Same-name files are never overwritten.", "Moving files to destination folders works in Chrome and Edge on desktop; in other browsers the control stays visible and disabled with the reason beside it."),
            ("Exchange account and clipboard", "Join your account as one more device on a Media Exchange Server: register from an invitation link, view devices and folders, receive broadcasts and share the clipboard."),
            ("Server administration and diagnostics", "Run Media Exchange Server administration from the browser and export a local diagnostic ZIP report on request with no file names, passwords or keys."),
        ],
        "get_h2": "Get started",
        "get_steps": [
            "Open the latest release bundle from GitHub Releases or serve the static <code>web/</code> folder from your Media Exchange Server (<code>webDir</code>) or any HTTPS static host.",
            "Open the app in Chrome, Edge, Firefox, Safari or Samsung Internet.",
            "Choose a local folder to browse and sort, or paste an invitation link to connect to your exchange account.",
        ],
        "dl_btn": "GitHub Releases",
        "src_btn": "Source on GitHub",
        "feat_h2": "Features and compatibility",
        "g1_title": "Local media, sorting and slideshow",
        "g1_body": "<p>Open any folder of images, animated images, video or audio directly in the browser. Run a timed slideshow while keeping the screen awake where Wake Lock is supported.</p><p>In Chrome and Edge on desktop, select up to ten destination folders and sort files with keys <code>1</code> to <code>9</code> and <code>0</code>.</p>",
        "g2_title": "Exchange account and Media Exchange Server",
        "g2_body": f'<p>The browser speaks the shared <code>DEVICE-EXCHANGE</code> protocol. Your device private key never leaves the browser, and sealed content cannot be read by the server.</p><p>Read more on the shared <a href="{PORTAL_URL}">Media exchange between your devices</a> portal and the <a href="{SERVER_PAGE_URL}"><img class="inline-mark" src="assets/exchange-mark-small.svg" width="20" height="20" alt="Media Exchange Server">Media Exchange Server</a> page.</p>',
        "g3_title": "Browser support floor",
        "g3_headers": ("Engine / Browser", "Browse & view", "Play audio & video", "Sort to folders (1-9, 0)", "Exchange & admin"),
        "g3_rows": [
            ("Chrome / Edge (desktop)", "Supported", "Supported", "Supported", "Supported"),
            ("Chrome / Samsung Internet (Android)", "Supported", "Supported", "Visible, disabled (no directory write access)", "Supported"),
            ("Firefox (desktop, ESR, Android)", "Supported", "Supported", "Visible, disabled (no directory write access)", "Supported"),
            ("Safari (macOS, iOS, iPadOS)", "Supported", "Supported", "Visible, disabled (no directory write access)", "Supported"),
        ],
        "g4_title": "Native family programs",
        "g4_body": f'<p>Functions that require the operating system itself - listening on a port, running after the tab closes, raw sockets or watch pairing - stay with the native programs: <a href="{FMS_A_URL}">Fast Media Sorter &amp; Organizer</a> (Android) and <a href="{FMS_WIN_URL}">Fast Media Sorter &amp; Sharing for Windows</a> (Windows, which also hosts the Media Exchange Server).</p>',
        "docs_h2": "Documentation and support",
        "docs_links": [("guide.html", "Quick-start guide"), ("privacy.html", "Privacy & permissions"), ("support.html", "Support & compatibility")],
    },
    "ru": {
        "title": "FastMediaSorter for Web - просмотр, сортировка и обмен медиа в браузере",
        "desc": "FastMediaSorter for Web приносит просмотр, воспроизведение, быструю сортировку по папкам и доступ к Media Exchange Server в браузер для систем, где не работают нативные программы.",
        "h1": "Просматривайте, сортируйте и обменивайтесь медиа в браузере.",
        "lead": "FastMediaSorter for Web приносит просмотр, воспроизведение, быструю сортировку по папкам и доступ к Media Exchange Server в браузер для систем, где не работают нативные программы.",
        "audience": "Для macOS, Linux, ChromeOS, iOS, iPadOS и всех, кто не может установить нативную программу.",
        "cards": [
            ("Просмотр и воспроизведение локальных медиа", "Откройте локальную папку в браузере, чтобы смотреть фото и анимацию, воспроизводить видео и аудио и запускать слайд-шоу с удержанием экрана."),
            ("Сортировка по папкам назначения", "Выберите до десяти папок назначения и нажимайте 1-9 или 0, чтобы переместить открытый файл и перейти к следующему. Файлы с тем же именем не перезаписываются.", "Перемещение файлов в папки назначения работает в Chrome и Edge на компьютере; в остальных браузерах элемент остаётся видимым и отключённым с указанием причины."),
            ("Учётная запись обмена и буфер", "Подключите браузер как ещё одно устройство к Media Exchange Server: регистрируйтесь по приглашению, смотрите устройства и папки, принимайте трансляции и используйте общий буфер."),
            ("Администрирование сервера и диагностика", "Управляйте сервером Media Exchange Server из браузера и сохраняйте локальный ZIP-отчёт диагностики без имён файлов, паролей и ключей."),
        ],
        "get_h2": "Начало работы",
        "get_steps": [
            "Скачайте последний релизный архив в GitHub Releases или раздавайте статическую папку <code>web/</code> с вашего Media Exchange Server (<code>webDir</code>) либо любого статического HTTPS-хостинга.",
            "Откройте приложение в Chrome, Edge, Firefox, Safari или Samsung Internet.",
            "Выберите локальную папку для просмотра и сортировки или откройте ссылку-приглашение для входа в учётную запись обмена.",
        ],
        "dl_btn": "GitHub Releases",
        "src_btn": "Исходный код на GitHub",
        "feat_h2": "Возможности и совместимость",
        "g1_title": "Локальные медиа, сортировка и слайд-шоу",
        "g1_body": "<p>Открывайте папки с изображениями, анимацией, видео и аудио прямо в браузере. Запускайте слайд-шоу с удержанием экрана там, где поддерживается Wake Lock.</p><p>В Chrome и Edge на компьютере выберите до десяти папок назначения и сортируйте файлы клавишами <code>1</code>-<code>9</code> и <code>0</code>.</p>",
        "g2_title": "Учётная запись обмена и Media Exchange Server",
        "g2_body": f'<p>Браузер работает по общему протоколу <code>DEVICE-EXCHANGE</code>. Закрытый ключ устройства никогда не покидает браузер, а сервер не может прочитать зашифрованное содержимое.</p><p>Подробнее на общем портале <a href="{PORTAL_URL}">Обмен медиа между устройствами</a> и странице <a href="{SERVER_PAGE_URL}"><img class="inline-mark" src="../assets/exchange-mark-small.svg" width="20" height="20" alt="Media Exchange Server">Media Exchange Server</a>.</p>',
        "g3_title": "Поддерживаемые браузеры",
        "g3_headers": ("Движок / Браузер", "Просмотр", "Аудио и видео", "Сортировка в папки (1-9, 0)", "Обмен и админ"),
        "g3_rows": [
            ("Chrome / Edge (компьютер)", "Поддерживается", "Поддерживается", "Поддерживается", "Поддерживается"),
            ("Chrome / Samsung Internet (Android)", "Поддерживается", "Поддерживается", "Видимо, отключено (нет записи в папку)", "Поддерживается"),
            ("Firefox (компьютер, ESR, Android)", "Поддерживается", "Поддерживается", "Видимо, отключено (нет записи в папку)", "Поддерживается"),
            ("Safari (macOS, iOS, iPadOS)", "Поддерживается", "Поддерживается", "Видимо, отключено (нет записи в папку)", "Поддерживается"),
        ],
        "g4_title": "Нативные программы семейства",
        "g4_body": f'<p>Функции, требующие самой операционной системы - прослушивание порта, работа после закрытия вкладки, прямые сокеты или связь с часами - остаются в нативных программах: <a href="{FMS_A_URL}">Fast Media Sorter &amp; Organizer</a> (Android) и <a href="{FMS_WIN_URL}">Fast Media Sorter &amp; Sharing for Windows</a> (Windows, где также находится Media Exchange Server).</p>',
        "docs_h2": "Документация и поддержка",
        "docs_links": [("guide.html", "Руководство"), ("privacy.html", "Приватность и разрешения"), ("support.html", "Поддержка и совместимость")],
    },
    "uk": {
        "title": "FastMediaSorter for Web - перегляд, сортування та обмін медіа в браузері",
        "desc": "FastMediaSorter for Web приносить перегляд, відтворення, швидке сортування за теками та доступ до Media Exchange Server у браузер для систем, де не працюють нативні програми.",
        "h1": "Переглядайте, сортуйте та обмінюйтеся медіа в браузері.",
        "lead": "FastMediaSorter for Web приносить перегляд, відтворення, швидке сортування за теками та доступ до Media Exchange Server у браузер для систем, де не працюють нативні програми.",
        "audience": "Для macOS, Linux, ChromeOS, iOS, iPadOS та всіх, хто не може встановити нативну програму.",
        "cards": [
            ("Перегляд і відтворення локальних медіа", "Відкрийте локальну теку в браузері, щоб переглядати фото й анімацію, відтворювати відео та аудіо й запускати слайд-шоу з утриманням екрана."),
            ("Сортування за теками призначення", "Виберіть до десяти тек призначення і натискайте 1-9 або 0, щоб перемістити відкритий файл і перейти до наступного. Файли з тим самим іменем не перезаписуються.", "Переміщення файлів до тек призначення працює в Chrome та Edge на комп'ютері; в інших браузерах елемент лишається видимим і вимкненим із зазначенням причини."),
            ("Обліковий запис обміну та буфер", "Під'єднайте браузер як ще один пристрій до Media Exchange Server: реєструйтеся за запрошенням, переглядайте пристрої й теки, приймайте трансляції та користуйтеся спільним буфером."),
            ("Адміністрування сервера та діагностика", "Керуйте сервером Media Exchange Server із браузера та зберігайте локальний ZIP-звіт діагностики без імен файлів, паролів і ключів."),
        ],
        "get_h2": "Початок роботи",
        "get_steps": [
            "Завантажте останній релізний архів у GitHub Releases або роздавайте статичну теку <code>web/</code> з вашого Media Exchange Server (<code>webDir</code>) чи будь-якого статичного HTTPS-хостингу.",
            "Відкрийте застосунок у Chrome, Edge, Firefox, Safari або Samsung Internet.",
            "Виберіть локальну теку для перегляду й сортування або відкрийте посилання-запрошення для входу в обліковий запис обміну.",
        ],
        "dl_btn": "GitHub Releases",
        "src_btn": "Вихідний код на GitHub",
        "feat_h2": "Можливості та сумісність",
        "g1_title": "Локальні медіа, сортування та слайд-шоу",
        "g1_body": "<p>Відкривайте теки із зображеннями, анімацією, відео та аудіо безпосередньо в браузері. Запускайте слайд-шоу з утриманням екрана там, де підтримується Wake Lock.</p><p>У Chrome та Edge на комп'ютері виберіть до десяти тек призначення та сортуйте файли клавішами <code>1</code>-<code>9</code> і <code>0</code>.</p>",
        "g2_title": "Обліковий запис обміну та Media Exchange Server",
        "g2_body": f'<p>Браузер працює за спільним протоколом <code>DEVICE-EXCHANGE</code>. Закритий ключ пристрою ніколи не залишає браузер, а сервер не може прочитати зашифрований вміст.</p><p>Докладніше на спільному порталі <a href="{PORTAL_URL}">Обмін медіа між пристроями</a> та сторінці <a href="{SERVER_PAGE_URL}"><img class="inline-mark" src="../assets/exchange-mark-small.svg" width="20" height="20" alt="Media Exchange Server">Media Exchange Server</a>.</p>',
        "g3_title": "Підтримувані браузери",
        "g3_headers": ("Рушій / Браузер", "Перегляд", "Аудіо та відео", "Сортування в теки (1-9, 0)", "Обмін і адмін"),
        "g3_rows": [
            ("Chrome / Edge (комп'ютер)", "Підтримується", "Підтримується", "Підтримується", "Підтримується"),
            ("Chrome / Samsung Internet (Android)", "Підтримується", "Підтримується", "Видимо, вимкнено (немає запису в теку)", "Підтримується"),
            ("Firefox (комп'ютер, ESR, Android)", "Підтримується", "Підтримується", "Видимо, вимкнено (немає запису в теку)", "Підтримується"),
            ("Safari (macOS, iOS, iPadOS)", "Підтримується", "Підтримується", "Видимо, вимкнено (немає запису в теку)", "Підтримується"),
        ],
        "g4_title": "Нативні програми сімейства",
        "g4_body": f'<p>Функції, що потребують самої операційної системи - прослуховування порту, робота після закриття вкладки, прямі сокети чи зв\'язок із годинником - залишаються в нативних програмах: <a href="{FMS_A_URL}">Fast Media Sorter &amp; Organizer</a> (Android) і <a href="{FMS_WIN_URL}">Fast Media Sorter &amp; Sharing for Windows</a> (Windows, де також розміщено Media Exchange Server).</p>',
        "docs_h2": "Документація та підтримка",
        "docs_links": [("guide.html", "Посібник"), ("privacy.html", "Приватність і дозволи"), ("support.html", "Підтримка та сумісність")],
    },
}


def render_landing(locale: str) -> str:
    c = COMMON[locale]
    d = LANDING_COPY[locale]
    rel = c["rel_root"]
    cards_html = []
    for item in d["cards"]:
        title, body = item[0], item[1]
        caveat = f'<p class="caveat">{html.escape(item[2])}</p>' if len(item) > 2 else ""
        cards_html.append(f'    <article class="card"><h2>{html.escape(title)}</h2><p>{html.escape(body)}</p>{caveat}</article>')
    steps_html = "\n".join(f"      <li>{s}</li>" for s in d["get_steps"])
    th_html = "".join(f"<th>{html.escape(h)}</th>" for h in d["g3_headers"])
    tr_html = "\n".join(
        "          <tr>" + "".join(f"<td>{html.escape(cell)}</td>" for cell in row) + "</tr>"
        for row in d["g3_rows"]
    )
    doc_btns = "\n".join(
        f'      <a class="btn" href="{href}">{html.escape(label)}</a>' for href, label in d["docs_links"]
    )
    body = f"""<body>
<div class="bg-blobs"><div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div></div>
{render_header(locale, "index.html", is_landing=True)}
<main class="wrap">
  <section class="hero">
    <div class="identity">
      <img class="product-icon" src="{rel}assets/icon.svg" width="104" height="104" alt="">
      <div>
        <p class="product-name">{html.escape(c['brand'])}</p>
        <p class="kicker">{html.escape(c['kicker'])}</p>
      </div>
    </div>
    <h1>{html.escape(d['h1'])}</h1>
    <p class="lead">{html.escape(d['lead'])}</p>
    <p class="caveat">{html.escape(d['audience'])}</p>
  </section>

  <section class="cards" aria-label="Scenarios">
{chr(10).join(cards_html)}
  </section>

  <section id="get">
    <h2>{html.escape(d['get_h2'])}</h2>
    <ol>
{steps_html}
    </ol>
    <div class="btn-row">
      <a class="btn btn-primary" href="{RELEASES_URL}" target="_blank" rel="noopener noreferrer"><span>{html.escape(d['dl_btn'])}</span><span class="gi gi-external gi-mirror" aria-hidden="true"></span><span class="sr">{html.escape(c['open_new'])}</span></a>
      <a class="btn" href="{REPO_URL}" target="_blank" rel="noopener noreferrer"><span>{html.escape(d['src_btn'])}</span><span class="gi gi-external gi-mirror" aria-hidden="true"></span><span class="sr">{html.escape(c['open_new'])}</span></a>
    </div>
  </section>

  <section>
    <h2>{html.escape(d['feat_h2'])}</h2>
    <details class="sec" open><summary><span class="secnum">01</span><span>{html.escape(d['g1_title'])}</span></summary>
      {d['g1_body']}
    </details>
    <details class="sec" open><summary><span class="secnum">02</span><span>{html.escape(d['g2_title'])}</span></summary>
      {d['g2_body']}
    </details>
    <details class="sec"><summary><span class="secnum">03</span><span>{html.escape(d['g3_title'])}</span></summary>
      <div class="table-wrap">
        <table>
          <thead><tr>{th_html}</tr></thead>
          <tbody>
{tr_html}
          </tbody>
        </table>
      </div>
    </details>
    <details class="sec"><summary><span class="secnum">04</span><span>{html.escape(d['g4_title'])}</span></summary>
      {d['g4_body']}
    </details>
  </section>

  <section>
    <h2>{html.escape(d['docs_h2'])}</h2>
    <div class="btn-row">
{doc_btns}
    </div>
  </section>
</main>
{render_footer(locale, is_landing=True)}"""
    return render_head(locale, "index.html", d["title"], d["desc"]) + "\n" + body


CHILD_COPY = {
    "privacy.html": {
        "en": {
            "title": "Privacy & permissions - FastMediaSorter for Web",
            "desc": "Browser permissions, local storage and network addresses used by FastMediaSorter for Web.",
            "h1": "Privacy and browser permissions",
            "intro": "FastMediaSorter for Web runs locally in your browser with no telemetry, no analytics and no advertising.",
            "sections": [
                ("Browser permissions", [
                    "<strong>Read local folder</strong> (<code>showDirectoryPicker</code> read mode): requested only when you choose a folder to browse.",
                    "<strong>Move to destination folders</strong> (<code>showDirectoryPicker</code> readwrite mode): requested on Chrome and Edge desktop only when you bind destination folders for sorting.",
                    "<strong>Clipboard</strong> (<code>navigator.clipboard.writeText</code>): used only when you press a copy button.",
                    "<strong>Screen Wake Lock</strong> (<code>navigator.wakeLock</code>): requested only while a slideshow is running.",
                    "<strong>Local storage</strong> (<code>localStorage</code>): stores your interface language, theme, preferences and destination folder list on this device.",
                ]),
                ("Network addresses", [
                    "The product site and local media mode make no third-party network requests.",
                    "When you connect an exchange account, the browser communicates over HTTPS/WSS exclusively with the Media Exchange Server address you entered or opened from an invitation.",
                    "Your device private key stays inside the browser and is never sent to the server, logged or exported.",
                ]),
                ("Diagnostic report", [
                    "The About screen can create a local diagnostic ZIP archive on request. It contains browser capabilities, page settings and the current visit log, with no file names, folder names, passwords, tokens or private keys.",
                ]),
            ],
        },
        "ru": {
            "title": "Приватность и разрешения - FastMediaSorter for Web",
            "desc": "Разрешения браузера, локальное хранилище и сетевые адреса, используемые FastMediaSorter for Web.",
            "h1": "Приватность и разрешения браузера",
            "intro": "FastMediaSorter for Web работает локально в вашем браузере без телеметрии, аналитики и рекламы.",
            "sections": [
                ("Разрешения браузера", [
                    "<strong>Чтение локальной папки</strong> (<code>showDirectoryPicker</code>, режим чтения): запрашивается только при выборе папки для просмотра.",
                    "<strong>Перемещение в папки назначения</strong> (<code>showDirectoryPicker</code>, режим чтения и записи): запрашивается в Chrome и Edge на компьютере только при выборе папок сортировки.",
                    "<strong>Буфер обмена</strong> (<code>navigator.clipboard.writeText</code>): используется только при нажатии кнопки копирования.",
                    "<strong>Удержание экрана</strong> (<code>navigator.wakeLock</code>): запрашивается только во время работы слайд-шоу.",
                    "<strong>Локальное хранилище</strong> (<code>localStorage</code>): хранит язык интерфейса, тему, настройки и список папок назначения на этом устройстве.",
                ]),
                ("Сетевые адреса", [
                    "Страница продукта и режим локальных файлов не выполняют сторонних сетевых запросов.",
                    "При подключении учётной записи обмена браузер общается по HTTPS/WSS только с тем адресом Media Exchange Server, который вы ввели или открыли из приглашения.",
                    "Закрытый ключ устройства остаётся в браузере и никогда не отправляется на сервер, не попадает в журнал и экспорт.",
                ]),
                ("Отчёт диагностики", [
                    "Экран «О программе» может создать локальный ZIP-архив диагностики по вашему нажатию. В нём содержатся сведения о возможностях браузера, настройках и журнале текущего визита, без имён файлов, папок, паролей, токенов и ключей.",
                ]),
            ],
        },
        "uk": {
            "title": "Приватність і дозволи - FastMediaSorter for Web",
            "desc": "Дозволи браузера, локальне сховище та мережеві адреси, які використовує FastMediaSorter for Web.",
            "h1": "Приватність і дозволи браузера",
            "intro": "FastMediaSorter for Web працює локально у вашому браузері без телеметрії, аналітики та реклами.",
            "sections": [
                ("Дозволи браузера", [
                    "<strong>Читання локальної теки</strong> (<code>showDirectoryPicker</code>, режим читання): запитується лише під час вибору теки для перегляду.",
                    "<strong>Переміщення до тек призначення</strong> (<code>showDirectoryPicker</code>, режим читання та запису): запитується в Chrome та Edge на комп'ютері лише під час вибору тек сортування.",
                    "<strong>Буфер обміну</strong> (<code>navigator.clipboard.writeText</code>): використовується лише після натискання кнопки копіювання.",
                    "<strong>Утримання екрана</strong> (<code>navigator.wakeLock</code>): запитується лише під час роботи слайд-шоу.",
                    "<strong>Локальне сховище</strong> (<code>localStorage</code>): зберігає мову інтерфейсу, тему, налаштування та список тек призначення на цьому пристрої.",
                ]),
                ("Мережеві адреси", [
                    "Сторінка продукту та режим локальних файлів не виконують сторонніх мережевих запитів.",
                    "Під час під'єднання облікового запису обміну браузер спілкується через HTTPS/WSS лише з тією адресою Media Exchange Server, яку ви ввели або відкрили із запрошення.",
                    "Закритий ключ пристрою залишається в браузері й ніколи не надсилається на сервер, не потрапляє до журналу та експорту.",
                ]),
                ("Звіт діагностики", [
                    "Екран «Про програму» може створити локальний ZIP-архів діагностики за вашим натисканням. Він містить відомості про можливості браузера, налаштування та журнал поточного візиту без імен файлів, тек, паролів, токенів і ключів.",
                ]),
            ],
        },
    },
    "guide.html": {
        "en": {
            "title": "Quick-start guide - FastMediaSorter for Web",
            "desc": "How to open folders, sort media with number keys and connect to a Media Exchange Server.",
            "h1": "Quick-start guide",
            "intro": "Start with local files or connect to your Media Exchange Server in three steps.",
            "sections": [
                ("1. Browse local media", [
                    "Open the Local screen and choose a folder on your device.",
                    "Use arrow keys or on-screen controls to step through images, animated images, audio and video.",
                    "Press <code>F1</code> or the Help button on any screen for context help.",
                ]),
                ("2. Sort into destination folders", [
                    "In Chrome or Edge on desktop, assign up to ten destination folders (slots 1-9 and 0).",
                    "Press <code>1</code>-<code>9</code> or <code>0</code> while viewing a file to move it into that folder and open the next file. Same-name files are never replaced.",
                    "In browsers without directory write access, sorting controls remain visible and disabled with the reason shown beside them.",
                ]),
                ("3. Connect to an exchange account", [
                    "Open an invitation link or paste a connection string: the invitation fills in automatically so you only choose a login and password.",
                    "Manage devices, browse shared folders, receive account broadcasts and share clipboard text.",
                ]),
            ],
        },
        "ru": {
            "title": "Руководство - FastMediaSorter for Web",
            "desc": "Как открывать папки, сортировать медиа клавишами с цифрами и подключаться к Media Exchange Server.",
            "h1": "Краткое руководство",
            "intro": "Начните с локальных файлов или подключитесь к Media Exchange Server за три шага.",
            "sections": [
                ("1. Просмотр локальных медиа", [
                    "Откройте экран локальных файлов и выберите папку на устройстве.",
                    "Перелистывайте изображения, анимацию, аудио и видео стрелками или кнопками на экране.",
                    "Нажмите <code>F1</code> или кнопку справки на любом экране для подсказки по текущему разделу.",
                ]),
                ("2. Сортировка по папкам назначения", [
                    "В Chrome и Edge на компьютере назначьте до десяти папок (слоты 1-9 и 0).",
                    "Нажимайте <code>1</code>-<code>9</code> или <code>0</code> при просмотре, чтобы переместить файл в выбранную папку и открыть следующий. Файлы с тем же именем не перезаписываются.",
                    "В браузерах без права записи в папку кнопки сортировки остаются видимыми и отключёнными с объяснением причины.",
                ]),
                ("3. Подключение к учётной записи обмена", [
                    "Откройте ссылку-приглашение или вставьте строку подключения: приглашение подставится автоматически, останется задать логин и пароль.",
                    "Просматривайте устройства и папки, принимайте трансляции и используйте общий буфер обмена.",
                ]),
            ],
        },
        "uk": {
            "title": "Посібник - FastMediaSorter for Web",
            "desc": "Як відкривати теки, сортувати медіа цифровими клавішами та підключатися до Media Exchange Server.",
            "h1": "Короткий посібник",
            "intro": "Почніть із локальних файлів або під'єднайтеся до Media Exchange Server за три кроки.",
            "sections": [
                ("1. Перегляд локальних медіа", [
                    "Відкрийте екран локальних файлів і виберіть теку на пристрої.",
                    "Гортайте зображення, анімацію, аудіо та відео стрілками або кнопками на екрані.",
                    "Натисніть <code>F1</code> або кнопку довідки на будь-якому екрані для контекстної підказки.",
                ]),
                ("2. Сортування за теками призначення", [
                    "У Chrome та Edge на комп'ютері призначте до десяти тек (слоти 1-9 та 0).",
                    "Натискайте <code>1</code>-<code>9</code> або <code>0</code> під час перегляду, щоб перемістити файл до вибраної теки й відкрити наступний. Файли з тим самим іменем не перезаписуються.",
                    "У браузерах без права запису в теку кнопки сортування залишаються видимими та вимкненими з поясненням причини.",
                ]),
                ("3. Під'єднання до облікового запису обміну", [
                    "Відкрийте посилання-запрошення або вставте рядок під'єднання: запрошення заповниться автоматично, залишиться обрати логін і пароль.",
                    "Переглядайте пристрої й теки, приймайте трансляції та користуйтеся спільним буфером обміну.",
                ]),
            ],
        },
    },
    "support.html": {
        "en": {
            "title": "Support & compatibility - FastMediaSorter for Web",
            "desc": "Contact, issue reporting, browser support floor and known platform limits.",
            "h1": "Support and compatibility",
            "intro": "Reach the author or check browser requirements and platform limits.",
            "sections": [
                ("Contact and bug reports", [
                    f'Email: <a href="mailto:sza@ukr.net">sza@ukr.net</a>',
                    f'GitHub Issues: <a href="{ISSUES_URL}">{ISSUES_URL}</a>',
                    "Attach the diagnostic ZIP saved from the About screen when reporting a browser or connection issue.",
                ]),
                ("Platform limits", [
                    "Moving files to destination folders requires Chrome or Edge on desktop (File System Access API).",
                    "Listening on a port, running after the tab closes, raw sockets and watch pairing belong to the native Android and Windows programs.",
                ]),
            ],
        },
        "ru": {
            "title": "Поддержка и совместимость - FastMediaSorter for Web",
            "desc": "Контакты, сообщения об ошибках, поддерживаемые браузеры и ограничения платформы.",
            "h1": "Поддержка и совместимость",
            "intro": "Свяжитесь с автором или проверьте требования к браузерам и ограничения платформы.",
            "sections": [
                ("Контакты и сообщения об ошибках", [
                    'Почта: <a href="mailto:sza@ukr.net">sza@ukr.net</a>',
                    f'GitHub Issues: <a href="{ISSUES_URL}">{ISSUES_URL}</a>',
                    "При сообщении о сбое в браузере или подключении приложите диагностический ZIP-архив с экрана «О программе».",
                ]),
                ("Ограничения платформы", [
                    "Перемещение файлов в папки назначения требует Chrome или Edge на компьютере (File System Access API).",
                    "Прослушивание порта, работа после закрытия вкладки, прямые сокеты и связь с часами остаются в нативных программах для Android и Windows.",
                ]),
            ],
        },
        "uk": {
            "title": "Підтримка та сумісність - FastMediaSorter for Web",
            "desc": "Контакти, повідомлення про помилки, підтримувані браузери та обмеження платформи.",
            "h1": "Підтримка та сумісність",
            "intro": "Зв'яжіться з автором або перевірте вимоги до браузерів та обмеження платформи.",
            "sections": [
                ("Контакти та повідомлення про помилки", [
                    'Пошта: <a href="mailto:sza@ukr.net">sza@ukr.net</a>',
                    f'GitHub Issues: <a href="{ISSUES_URL}">{ISSUES_URL}</a>',
                    "Повідомляючи про збій у браузері чи під'єднанні, додайте діагностичний ZIP-архів з екрана «Про програму».",
                ]),
                ("Обмеження платформи", [
                    "Переміщення файлів до тек призначення потребує Chrome або Edge на комп'ютері (File System Access API).",
                    "Прослуховування порту, робота після закриття вкладки, прямі сокети та зв'язок із годинником залишаються в нативних програмах для Android і Windows.",
                ]),
            ],
        },
    },
}


def render_child(locale: str, page: str) -> str:
    d = CHILD_COPY[page][locale]
    sec_html = []
    for heading, items in d["sections"]:
        lis = "\n".join(f"      <li>{item}</li>" for item in items)
        sec_html.append(f"  <section>\n    <h2>{html.escape(heading)}</h2>\n    <ul>\n{lis}\n    </ul>\n  </section>")
    body = f"""<body>
<div class="bg-blobs"><div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div></div>
{render_header(locale, page, is_landing=False)}
<main class="wrap">
  <section class="hero">
    <h1>{html.escape(d['h1'])}</h1>
    <p class="lead">{html.escape(d['intro'])}</p>
  </section>
{chr(10).join(sec_html)}
</main>
{render_footer(locale, is_landing=False)}"""
    return render_head(locale, page, d["title"], d["desc"]) + "\n" + body


def main() -> int:
    for locale in ("en", "ru", "uk"):
        out_dir = DOCS if locale == "en" else DOCS / locale
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(render_landing(locale) + "\n", encoding="utf-8", newline="\n")
        for page in ("privacy.html", "guide.html", "support.html"):
            (out_dir / page).write_text(render_child(locale, page) + "\n", encoding="utf-8", newline="\n")
    print("SITE: generated 12 HTML pages under docs/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
