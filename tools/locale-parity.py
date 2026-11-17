"""Locale parity gate over the EN/RU/UK inventories of the browser source (ticket S0039).

The shipped languages are EN, RU and UK (CLAUDE.md section 2). Their texts live in three ES modules,
each holding one frozen object per language:

  web/app/strings.js     const dictionaries = Object.freeze({ en: Object.freeze({ .. }), ru: .., uk: .. })
  web/app/help-text.js   const texts = Object.freeze({ en: Object.freeze({ .. }), ru: .., uk: .. })
  web/app/admin-strings.js  const dictionaries = Object.freeze({ en: Object.freeze({ .. }), ru: .., uk: .. }) (S0014)

Inside a language block every entry is one line `    key: 'text',` (the key bare or quoted, the text
a single- or double-quoted literal). For each inventory the gate proves:

  L01 parse     the file is read as UTF-8, has exactly the blocks en, ru and uk, and every line inside
                a block is one entry of that shape (a line it cannot read fails the file, it is never
                skipped)
  L02 keys      the three blocks carry the same keys, none twice
  L03 empty     no text is empty or blank
  L04 promise   no text carries a promise or readiness hedge (coming soon, planned, not yet,
                in development, experimental, beta and their RU/UK forms - canon invariant 17)

Usage:
  py -3 tools/locale-parity.py              check the inventories of this repository
  py -3 tools/locale-parity.py --root DIR   check DIR/web/app/.. instead (fixtures)
  py -3 tools/locale-parity.py --self-test  run the passing and failing fixtures of every rule

Verdict line: `LOCALES: PASS (<files> files, <keys> keys x 3 languages)`, `LOCALES: FAIL (<n> findings)`
or `LOCALES: CANNOT VERIFY - <reason>`; under --self-test `SELFTEST: PASS|FAIL (<n> cases)`.

Exit codes: 0 parity; 1 at least one finding (or a failed self-test case); 2 could not verify - an
inventory file is absent or unreadable. A missing input is never reported as parity.
"""

from __future__ import annotations

import argparse
import contextlib
import io
import re
import shutil
import sys
import tempfile
from pathlib import Path

INVENTORIES = ('web/app/strings.js', 'web/app/help-text.js', 'web/app/admin-strings.js')
LANGUAGES = ('en', 'ru', 'uk')

RE_BLOCK_OPEN = re.compile(r'^  (?P<lang>[a-z]{2}): Object\.freeze\(\{\s*$')
RE_BLOCK_CLOSE = re.compile(r'^  \}\),?\s*$')
RE_ENTRY = re.compile(
    r"""^    (?:(?P<bare>[A-Za-z_$][\w$]*)|'(?P<squoted>[^'\\]+)'|"(?P<dquoted>[^"\\]+)"): """
    r"""(?:'(?P<s>(?:\\.|[^'\\])*)'|"(?P<d>(?:\\.|[^"\\])*)"),\s*$"""
)
PROMISE_WORDS = [
    r'coming soon', r'planned', r'not yet', r'in development', r'under development', r'experimental',
    r'beta', r'not fully tested', r'work in progress',
    r'скоро', r'планиру\w*', r'[её]щ[её] не', r'в разработке', r'эксперимент\w*', r'бета',
    r'незабаром', r'планує\w*', r'заплановано', r'ще не', r'[ув] розробці', r'експеримент\w*',
]
RE_PROMISE = re.compile(r'(?<!\w)(' + '|'.join(PROMISE_WORDS) + r')(?!\w)', re.IGNORECASE)


def decode(raw: str) -> str:
    return re.sub(r'\\(.)', r'\1', raw)


def check_inventory(path: Path, relpath: str, findings: list[str]) -> int:
    """Returns the key count of the en block; appends findings."""
    lines = path.read_text(encoding='utf-8').splitlines()
    blocks: dict[str, dict[str, str]] = {}
    current: str | None = None
    for number, line in enumerate(lines, start=1):
        if current is None:
            opened = RE_BLOCK_OPEN.match(line)
            if opened:
                current = opened.group('lang')
                if current in blocks:
                    findings.append(f'{relpath}:{number} L01 parse: block {current} appears twice')
                blocks[current] = {}
            continue
        if RE_BLOCK_CLOSE.match(line):
            current = None
            continue
        if not line.strip():
            continue
        entry = RE_ENTRY.match(line)
        if not entry:
            findings.append(f'{relpath}:{number} L01 parse: not one entry `key: \'text\',` in block {current}')
            continue
        key = entry.group('bare') or entry.group('squoted') or entry.group('dquoted')
        text = decode(entry.group('s') if entry.group('s') is not None else entry.group('d'))
        if key in blocks[current]:
            findings.append(f'{relpath}:{number} L02 keys: {current}.{key} appears twice')
        blocks[current][key] = text
        if not text.strip():
            findings.append(f'{relpath}:{number} L03 empty: {current}.{key}')
        promise = RE_PROMISE.search(text)
        if promise:
            findings.append(f'{relpath}:{number} L04 promise: {current}.{key} says "{promise.group(1)}"')
    if current is not None:
        findings.append(f'{relpath}:{len(lines)} L01 parse: block {current} is never closed')
    found = set(blocks)
    if found != set(LANGUAGES):
        findings.append(f'{relpath}:1 L01 parse: language blocks {sorted(found)}, expected {list(LANGUAGES)}')
    present = [lang for lang in LANGUAGES if lang in blocks]
    all_keys = set().union(*(blocks[lang].keys() for lang in present)) if present else set()
    for lang in present:
        for key in sorted(all_keys - blocks[lang].keys()):
            findings.append(f'{relpath}:1 L02 keys: {lang}.{key} is missing')
    return len(blocks.get('en', {}))


def run_check(root: Path) -> int:
    findings: list[str] = []
    keys = 0
    for relpath in INVENTORIES:
        path = root / relpath
        if not path.is_file():
            print(f'LOCALES: CANNOT VERIFY - {relpath} does not exist')
            return 2
        try:
            keys += check_inventory(path, relpath, findings)
        except (OSError, UnicodeDecodeError) as error:
            print(f'LOCALES: CANNOT VERIFY - {relpath} unreadable: {error}')
            return 2
    for finding in findings:
        print(finding)
    if findings:
        print(f'LOCALES: FAIL ({len(findings)} findings)')
        return 1
    if keys == 0:
        print('LOCALES: CANNOT VERIFY - the inventories hold no entries')
        return 2
    print(f'LOCALES: PASS ({len(INVENTORIES)} files, {keys} keys x {len(LANGUAGES)} languages)')
    return 0


def inventory(en: str, ru: str, uk: str) -> str:
    return (f"const t = Object.freeze({{\n  en: Object.freeze({{\n{en}  }}),\n"
            f"  ru: Object.freeze({{\n{ru}  }}),\n  uk: Object.freeze({{\n{uk}  }}),\n}});\n")


GOOD = inventory("    a: 'Open',\n    'b.c': \"It's here\",\n",
                 "    a: 'Открыть',\n    'b.c': 'Здесь',\n",
                 "    a: 'Відкрити',\n    'b.c': 'Тут',\n")

# Each case: name, {inventory index: content} (None = absent tree), expected exit, expected rule or None.
SELF_TEST_CASES = [
    ('absent inventories', None, 2, None),
    ('one inventory absent', {0: GOOD}, 2, None),
    ('parity', {0: GOOD, 2: GOOD, 1: GOOD}, 0, None),
    ('L01 unreadable line', {0: GOOD, 2: GOOD, 1: GOOD.replace("    a: 'Open',", '    a: buildText(),')}, 1, 'L01'),
    ('L01 language missing', {0: GOOD, 2: GOOD, 1: GOOD.replace('  uk: Object.freeze({', '  de: Object.freeze({')}, 1, 'L01'),
    ('L01 block not closed', {0: GOOD, 2: GOOD, 1: GOOD.rsplit('  }),\n', 1)[0] + '});\n'}, 1, 'L01'),
    ('L02 key missing', {0: GOOD, 2: GOOD, 1: GOOD.replace("    'b.c': 'Тут',\n", '')}, 1, 'L02'),
    ('L02 key twice', {0: GOOD, 2: GOOD, 1: GOOD.replace("    a: 'Відкрити',\n", "    a: 'Відкрити',\n    a: 'Ще',\n")}, 1, 'L02'),
    ('L03 empty text', {0: GOOD, 2: GOOD, 1: GOOD.replace("'Здесь'", "'  '")}, 1, 'L03'),
    ('L04 promise EN', {0: GOOD, 2: GOOD, 1: GOOD.replace("'Open'", "'Coming soon'")}, 1, 'L04'),
    ('L04 promise RU', {0: GOOD, 2: GOOD, 1: GOOD.replace("'Здесь'", "'Ещё не готово'")}, 1, 'L04'),
    ('L04 promise UK', {0: GOOD, 2: GOOD, 1: GOOD.replace("'Тут'", "'Бета'")}, 1, 'L04'),
    ('L04 word inside a word is not a promise', {0: GOOD, 2: GOOD, 1: GOOD.replace("'Здесь'", "'Скорость'")}, 0, None),
]


def self_test(repo_root: Path) -> int:
    scratch_parent = repo_root / 'temp' / 'S0039'
    scratch_parent.mkdir(parents=True, exist_ok=True)
    scratch = Path(tempfile.mkdtemp(prefix='locales-', dir=scratch_parent))
    failures = 0
    try:
        for number, (name, files, expected_code, expected_rule) in enumerate(SELF_TEST_CASES):
            case_root = scratch / f'case{number:02d}'
            case_root.mkdir()
            for index, content in (files or {}).items():
                target = case_root / INVENTORIES[index]
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content, encoding='utf-8')
            buffer = io.StringIO()
            with contextlib.redirect_stdout(buffer):
                code = run_check(case_root)
            output = buffer.getvalue()
            ok = code == expected_code and (expected_rule is None or f' {expected_rule} ' in output)
            if expected_code == 0 and 'LOCALES: PASS' not in output:
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
    parser = argparse.ArgumentParser(description='EN/RU/UK locale parity gate.')
    parser.add_argument('--root', type=Path, default=repo_root)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if args.self_test:
        return self_test(repo_root)
    return run_check(args.root.resolve())


if __name__ == '__main__':
    sys.exit(main())
