"""Source hygiene gate over the browser source tree web/ (ticket S0039).

Reads every .js, .css, .html and .json file under web/ (web/vendor/ excluded: vendored code is not
ours to restyle) and reports each line that breaks one of the rules of .claude/rules/web-source.md
"Code hygiene":

  H01 empty-catch    an empty `catch {}` or `.catch(() => {})`
  H02 console        a console.* call outside the one logging module web/data/log.js, other than a
                     ticket probe in the probe form `console.debug("Sxxxx: ..")`
  H03 colour         a hex, rgb() or hsl() colour outside the token stylesheet web/styles/palette.css,
                     or inside a style= attribute; a fixed colour over a surface that paints its own
                     colour is allowed when the line or the line above carries the comment `fixed-colour:`
  H04 unfinished     TODO, FIXME, XXX or "not implemented"
  H05 long-dash      a typographic long dash (U+2013, U+2014) anywhere in source
  H06 unsafe         eval(, new Function(, innerHTML/outerHTML assigned a non-literal,
                     insertAdjacentHTML, document.write, a remote <script src> or a remote import
  H07 upward-import  an import pointing up the layers web/ui -> web/app -> web/data (or at web/main.js)
  H08 size           a module past the size ceiling (1500 lines)
  H09 probe          release scope only (--release): any ticket probe `console.debug("Sxxxx:`;
                     no build step strips it from the served files

The baseline is zero: there is no allow-list file, every finding fails.

Usage:
  py -3 tools/web-hygiene.py              scan web/ of this repository
  py -3 tools/web-hygiene.py --release    the same, plus H09
  py -3 tools/web-hygiene.py --root DIR   scan DIR/web instead (fixtures)
  py -3 tools/web-hygiene.py --self-test  run the passing and failing fixtures of every rule

Verdict line: `HYGIENE: PASS (<files> files, <rules> rules)` or `HYGIENE: FAIL (<n> findings)` or
`HYGIENE: CANNOT VERIFY - <reason>`; under --self-test `SELFTEST: PASS|FAIL (<n> cases)`.

Exit codes: 0 no finding; 1 at least one finding (or a failed self-test case); 2 could not verify -
web/ absent, no source file found, or a file could not be read as UTF-8. An absent or empty tree is
never reported as a clean scan.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
import tempfile
from pathlib import Path

SIZE_CEILING = 1500
EXTENSIONS = {'.js', '.css', '.html', '.json'}
LOG_MODULE = 'web/data/log.js'
TOKEN_STYLESHEET = 'web/styles/palette.css'
LAYER_RANK = {'web/data': 1, 'web/app': 2, 'web/ui': 3}
ROOT_MODULE_RANK = 4

RE_EMPTY_CATCH = re.compile(r'\bcatch\s*(\([^)]*\))?\s*\{\s*\}')
RE_EMPTY_PROMISE_CATCH = re.compile(r'\.catch\(\s*(\(\s*\w*\s*\)|\w+)\s*=>\s*(\{\s*\}|undefined|null|void 0)\s*\)')
RE_CONSOLE = re.compile(r'\bconsole\.(\w+)\s*\(')
RE_PROBE = re.compile(r'console\.debug\(\s*"S\d{4}:')
RE_PROBE_LINE = re.compile(r'^\s*console\.debug\(\s*"S\d{4}:[^"]*"\s*\)\s*;?\s*$')
RE_COLOUR = re.compile(r'#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\s*\(')
RE_JS_COLOUR_LITERAL = re.compile(r"""(['"`])(#[0-9a-fA-F]{3,8}|(rgba?|hsla?)\s*\([^'"`]*\))\1""")
RE_STYLE_ATTR = re.compile(r"""\bstyle\s*=\s*(["'])(.*?)\1""")
RE_CSS_DECL = re.compile(r'^\s*(--)?[-a-zA-Z]+\s*:\s*(?P<value>[^{]*?)\s*;?\s*$')
RE_UNFINISHED = re.compile(r'\b(TODO|FIXME|XXX)\b|not[ _-]implemented', re.IGNORECASE)
RE_LONG_DASH = re.compile('[\u2013\u2014]')
RE_UNSAFE = [
    (re.compile(r'\beval\s*\('), 'eval('),
    (re.compile(r'\bnew\s+Function\s*\('), 'new Function('),
    (re.compile(r'\binsertAdjacentHTML\s*\('), 'insertAdjacentHTML'),
    (re.compile(r'\bdocument\.write(ln)?\s*\('), 'document.write'),
    (re.compile(r"""<script\b[^>]*\bsrc\s*=\s*["']?(https?:)?//""", re.IGNORECASE), 'remote <script src>'),
    (re.compile(r"""\bimport\s*(\(\s*|[^'"();]*\bfrom\s*)?["'](https?:)?//"""), 'remote import'),
]
RE_HTML_ASSIGN = re.compile(r'\.(innerHTML|outerHTML)\s*\+?=\s*(?P<rhs>.*)$')
RE_PLAIN_LITERAL = re.compile(r"""^(['"])[^'"\\$]*\1\s*;?\s*$""")
RE_IMPORT = re.compile(r"""(?:\bimport\s*(?:[^'"();]*?\bfrom\s*)?|\bexport\s+[^'";]*?\bfrom\s*|\bimport\s*\(\s*)["'](?P<spec>\.{1,2}/[^'"]+)["']""")
FIXED_COLOUR_MARK = 'fixed-colour:'


def rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def layer_rank(relpath: str) -> int | None:
    for prefix, rank in LAYER_RANK.items():
        if relpath.startswith(prefix + '/'):
            return rank
    if relpath.startswith('web/') and relpath.count('/') == 1 and relpath.endswith('.js'):
        return ROOT_MODULE_RANK
    return None


def scan_file(path: Path, root: Path, release: bool, findings: list[str]) -> None:
    relpath = rel(path, root)
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    ext = path.suffix.lower()

    def add(lineno: int, rule: str, message: str) -> None:
        findings.append(f'{relpath}:{lineno} {rule} {message}')

    if ext != '.json' and len(lines) > SIZE_CEILING:
        add(1, 'H08', f'size: {len(lines)} lines, ceiling {SIZE_CEILING}')

    in_block_comment = False
    for index, line in enumerate(lines, start=1):
        previous = lines[index - 2] if index > 1 else ''
        if RE_LONG_DASH.search(line):
            add(index, 'H05', 'long-dash: typographic dash in source')
        if RE_UNFINISHED.search(line):
            add(index, 'H04', 'unfinished: TODO/FIXME/XXX or not implemented')
        if ext == '.json':
            continue

        fixed_colour = FIXED_COLOUR_MARK in line or FIXED_COLOUR_MARK in previous
        if ext == '.css':
            stripped = line
            if in_block_comment:
                end = stripped.find('*/')
                if end < 0:
                    continue
                stripped = stripped[end + 2:]
                in_block_comment = False
            stripped = re.sub(r'/\*.*?\*/', '', stripped)
            if '/*' in stripped:
                stripped = stripped[:stripped.index('/*')]
                in_block_comment = True
            if relpath != TOKEN_STYLESHEET and not fixed_colour:
                for part in stripped.split(';'):
                    decl = RE_CSS_DECL.match(part.rsplit('{', 1)[-1].rsplit('}', 1)[-1] + ';')
                    if decl and RE_COLOUR.search(decl.group('value')):
                        add(index, 'H03', 'colour: literal outside the token stylesheet')
                        break
            continue

        for attr in RE_STYLE_ATTR.finditer(line):
            if RE_COLOUR.search(attr.group(2)):
                add(index, 'H03', 'colour: literal inside style=')
        if ext == '.js' and not fixed_colour and RE_JS_COLOUR_LITERAL.search(line):
            add(index, 'H03', 'colour: literal outside the token stylesheet')

        if RE_EMPTY_CATCH.search(line) or RE_EMPTY_PROMISE_CATCH.search(line):
            add(index, 'H01', 'empty-catch: recover, return a safe default or log')

        for call in RE_CONSOLE.finditer(line):
            if RE_PROBE.match(line, call.start()):
                if release:
                    add(index, 'H09', 'probe: ticket probe in release scope')
                elif not RE_PROBE_LINE.match(line):
                    add(index, 'H02', 'console: probe not alone on its line')
            elif relpath != LOG_MODULE:
                add(index, 'H02', f'console: console.{call.group(1)} outside {LOG_MODULE}')

        for pattern, label in RE_UNSAFE:
            if pattern.search(line):
                add(index, 'H06', f'unsafe: {label}')
        assign = RE_HTML_ASSIGN.search(line)
        if assign and not RE_PLAIN_LITERAL.match(assign.group('rhs').strip()):
            add(index, 'H06', f'unsafe: {assign.group(1)} with a non-literal')

        if ext == '.js':
            source_rank = layer_rank(relpath)
            for imported in RE_IMPORT.finditer(line):
                target = (path.parent / imported.group('spec')).resolve()
                try:
                    target_rel = target.relative_to(root.resolve()).as_posix()
                except ValueError:
                    add(index, 'H07', f'upward-import: {imported.group("spec")} leaves the repository')
                    continue
                target_rank = layer_rank(target_rel)
                if source_rank is not None and target_rank is not None and target_rank > source_rank:
                    add(index, 'H07', f'upward-import: {relpath} imports {target_rel}')


def run_scan(root: Path, release: bool) -> int:
    web = root / 'web'
    if not web.is_dir():
        print(f'HYGIENE: CANNOT VERIFY - {web.as_posix()} does not exist')
        return 2
    files = sorted(
        p for p in web.rglob('*')
        if p.is_file() and p.suffix.lower() in EXTENSIONS and 'vendor' not in p.relative_to(web).parts
    )
    if not files:
        print(f'HYGIENE: CANNOT VERIFY - no .js/.css/.html/.json file under {web.as_posix()}')
        return 2
    findings: list[str] = []
    for path in files:
        try:
            scan_file(path, root, release, findings)
        except (OSError, UnicodeDecodeError) as error:
            print(f'HYGIENE: CANNOT VERIFY - {rel(path, root)} unreadable: {error}')
            return 2
    for finding in findings:
        print(finding)
    rules = 9 if release else 8
    if findings:
        print(f'HYGIENE: FAIL ({len(findings)} findings)')
        return 1
    print(f'HYGIENE: PASS ({len(files)} files, {rules} rules)')
    return 0


# Each case: name, files {relpath: content}, release flag, expected exit code, expected rule id or None.
SELF_TEST_CASES = [
    ('absent web/', None, False, 2, None),
    ('empty web/', {}, False, 2, None),
    ('clean tree', {'web/app/a.js': "import { b } from '../data/b.js';\nexport const a = b;\n",
                    'web/data/b.js': 'export const b = 1;\n'}, False, 0, None),
    ('H01 empty catch', {'web/app/a.js': 'try { x(); } catch (e) {}\n'}, False, 1, 'H01'),
    ('H01 empty promise catch', {'web/app/a.js': 'p.catch(() => {});\n'}, False, 1, 'H01'),
    ('H01 catch with recovery', {'web/app/a.js': 'try { x(); } catch (e) { y(); }\n'}, False, 0, None),
    ('H02 console outside the log module', {'web/app/a.js': "console.log('x');\n"}, False, 1, 'H02'),
    ('H02 console inside the log module', {'web/data/log.js': "console.info('x');\n"}, False, 0, None),
    ('H02 probe in the probe form', {'web/app/a.js': '  console.debug("S0001: entered")\n'}, False, 0, None),
    ('H02 probe not alone', {'web/app/a.js': 'x(); console.debug("S0001: entered");\n'}, False, 1, 'H02'),
    ('H03 hex outside the palette', {'web/styles/a.css': '.a { color: #fff; }\n'}, False, 1, 'H03'),
    ('H03 hex in the palette', {'web/styles/palette.css': ':root { --a: #fff; }\n'}, False, 0, None),
    ('H03 id selector is not a colour', {'web/styles/a.css': '#add { color: var(--a); }\n'}, False, 0, None),
    ('H03 rgb in style=', {'web/index.html': '<p style="color: rgb(1, 2, 3)">x</p>\n'}, False, 1, 'H03'),
    ('H03 js colour literal', {'web/ui/a.js': "el.style.color = '#123456';\n"}, False, 1, 'H03'),
    ('H03 fixed colour with reason', {'web/styles/a.css': '/* fixed-colour: over the video */\n.a { color: #000; }\n'}, False, 0, None),
    ('H04 TODO', {'web/app/a.js': '// TODO later\n'}, False, 1, 'H04'),
    ('H04 not implemented', {'web/app/a.js': "throw new Error('not implemented');\n"}, False, 1, 'H04'),
    ('H05 long dash', {'web/app/a.js': "const a = 'x \u2014 y';\n"}, False, 1, 'H05'),
    ('H05 long dash in json', {'web/help/a.json': '{"a": "x \u2013 y"}\n'}, False, 1, 'H05'),
    ('H06 eval', {'web/app/a.js': 'eval(code);\n'}, False, 1, 'H06'),
    ('H06 new Function', {'web/app/a.js': "const f = new Function('a', 'return a');\n"}, False, 1, 'H06'),
    ('H06 innerHTML non-literal', {'web/ui/a.js': 'el.innerHTML = text;\n'}, False, 1, 'H06'),
    ('H06 innerHTML template', {'web/ui/a.js': 'el.innerHTML = `<b>${text}</b>`;\n'}, False, 1, 'H06'),
    ('H06 innerHTML literal', {'web/ui/a.js': "el.innerHTML = '';\n"}, False, 0, None),
    ('H06 remote script', {'web/index.html': '<script src="https://cdn.example/x.js"></script>\n'}, False, 1, 'H06'),
    ('H06 remote import', {'web/app/a.js': "import x from 'https://cdn.example/x.js';\n"}, False, 1, 'H06'),
    ('H07 data imports app', {'web/data/a.js': "import { b } from '../app/b.js';\n",
                              'web/app/b.js': 'export const b = 1;\n'}, False, 1, 'H07'),
    ('H07 app imports ui', {'web/app/a.js': "import { b } from '../ui/b.js';\n",
                            'web/ui/b.js': 'export const b = 1;\n'}, False, 1, 'H07'),
    ('H07 ui imports main', {'web/ui/a.js': "import { b } from '../main.js';\n",
                             'web/main.js': 'export const b = 1;\n'}, False, 1, 'H07'),
    ('H07 ui imports app', {'web/ui/a.js': "import { b } from '../app/b.js';\n",
                            'web/app/b.js': 'export const b = 1;\n'}, False, 0, None),
    ('H08 past the ceiling', {'web/app/a.js': 'x;\n' * (SIZE_CEILING + 1)}, False, 1, 'H08'),
    ('H08 at the ceiling', {'web/app/a.js': 'x;\n' * SIZE_CEILING}, False, 0, None),
    ('H09 probe in release scope', {'web/app/a.js': '  console.debug("S0001: entered")\n'}, True, 1, 'H09'),
    ('vendor is not scanned', {'web/vendor/x/a.js': 'eval(code);\n', 'web/app/a.js': 'export const a = 1;\n'}, False, 0, None),
]


def self_test(repo_root: Path) -> int:
    import contextlib
    import io

    scratch_parent = repo_root / 'temp' / 'S0039'
    scratch_parent.mkdir(parents=True, exist_ok=True)
    scratch = Path(tempfile.mkdtemp(prefix='hygiene-', dir=scratch_parent))
    failures = 0
    try:
        for number, (name, files, release, expected_code, expected_rule) in enumerate(SELF_TEST_CASES):
            case_root = scratch / f'case{number:02d}'
            case_root.mkdir()
            if files is not None:
                (case_root / 'web').mkdir()
                for relpath, content in files.items():
                    target = case_root / relpath
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(content, encoding='utf-8')
            buffer = io.StringIO()
            with contextlib.redirect_stdout(buffer):
                code = run_scan(case_root, release)
            output = buffer.getvalue()
            ok = code == expected_code and (expected_rule is None or f' {expected_rule} ' in output)
            if expected_code == 0 and 'HYGIENE: PASS' not in output:
                ok = False
            print(f"{'ok' if ok else 'FAIL'} {name} (exit {code}, expected {expected_code}"
                  f"{', rule ' + expected_rule if expected_rule else ''})")
            if not ok:
                failures += 1
                print('  ' + output.strip().replace('\n', '\n  '))
    finally:
        shutil.rmtree(scratch, ignore_errors=True)
    verdict = 'PASS' if failures == 0 else 'FAIL'
    print(f'SELFTEST: {verdict} ({len(SELF_TEST_CASES)} cases, {failures} failed)')
    return 0 if failures == 0 else 1


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description='Source hygiene gate over web/.')
    parser.add_argument('--root', type=Path, default=repo_root)
    parser.add_argument('--release', action='store_true')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if args.self_test:
        return self_test(repo_root)
    return run_scan(args.root.resolve(), args.release)


if __name__ == '__main__':
    sys.exit(main())
