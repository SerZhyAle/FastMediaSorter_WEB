"""Check the maintained documentation registry, reverse coverage and local links.

Usage: py tools/check-docs.py [--root DIRECTORY]
Exit codes: 0 PASS, 1 documentation findings, 2 invocation/read error.
This is an offline structural check, not a prose, runtime or external-URL audit.
"""

import argparse
import fnmatch
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


def heading_ids(text):
    counts, result = {}, set()
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.MULTILINE):
        # Markdown-rendered headings: retain Unicode letters/numbers and hyphens.
        heading = re.sub(r'<[^>]+>', '', heading).lower()
        slug = ''.join(c for c in heading if c.isalnum() or c in ' _-').replace(' ', '-')
        suffix = counts.get(slug, 0)
        counts[slug] = suffix + 1
        result.add(slug if suffix == 0 else f'{slug}-{suffix}')
    result.update(re.findall(r'\b(?:id|name)=[\"\']([^\"\']+)[\"\']', text))
    return result


def validate(root):
    failures = []
    config = json.loads((root / 'docs/DOCUMENT_REGISTRY_CONFIG.json').read_text(encoding='utf-8-sig'))
    records = [json.loads(line) for line in (root / 'docs/DOCUMENT_REGISTRY.jsonl').read_text(encoding='utf-8-sig').splitlines() if line.strip()]
    seen = set()
    ignored = config['ignores']
    for ignore in ignored:
        if not ignore.get('reason'):
            failures.append('Ignore entry has no reason')

    def excluded(name):
        return any(fnmatch.fnmatchcase(name, item['pattern']) for item in ignored)

    actual = set(config['rootDocuments'])
    for name in config['directories']:
        for path in (root / name).rglob('*'):
            relative = path.relative_to(root).as_posix()
            if path.is_file() and path.suffix in config['extensions'] and not excluded(relative):
                actual.add(relative)
    for record in records:
        name = record['path']
        if name in seen:
            failures.append(f'Duplicate registry entry: {name}')
        seen.add(name)
        path = root / name
        if not path.resolve().is_relative_to(root.resolve()):
            failures.append(f'Registry path escapes corpus: {name}')
            continue
        if not path.is_file():
            failures.append(f'Missing registered document: {name}')
            continue
        for key in ['topic', 'area', 'triggers']:
            if not record.get(key):
                failures.append(f'Missing {key}: {name}')
        if record.get('role') not in {'source', 'render'}:
            failures.append(f'Invalid role: {name}')
        if record.get('role') == 'render' and not record.get('renderer'):
            failures.append(f'Missing renderer: {name}')
        if record.get('paths') != [name]:
            failures.append(f'Conflicting harness paths: {name}')
        if record.get('area') not in record.get('product_areas', []):
            failures.append(f'Conflicting harness area: {name}')
        if set(record.get('triggers', [])) != set(record.get('update_triggers', [])):
            failures.append(f'Conflicting harness triggers: {name}')
        if record.get('generated') is not (record.get('role') == 'render'):
            failures.append(f'Conflicting harness generated flag: {name}')
        if path.suffix != '.md':
            continue
        text = re.sub(r'```.*?```', '', path.read_text(encoding='utf-8-sig'), flags=re.DOTALL)
        for target in re.findall(r'!?\[[^\]]*\]\(([^)\n]+)\)', text):
            target = target.strip()
            if target.startswith('<') and '>' in target:
                target = target[1:target.index('>')]
            else:
                target = re.split(r'\s+[\"\']', target, maxsplit=1)[0]
            address = urlsplit(target)
            if address.scheme:
                if address.scheme != 'https':
                    failures.append(f'Non-HTTPS documentation link: {name}: {target}')
                continue
            if address.netloc:
                failures.append(f'Protocol-relative link: {name}: {target}')
                continue
            linked = path.parent / unquote(address.path) if address.path else path
            if not linked.resolve().is_relative_to(root.resolve()):
                failures.append(f'Link escapes repository: {name}: {target}')
                continue
            if not linked.exists():
                failures.append(f'Broken local link/asset: {name}: {target}')
            elif address.fragment and linked.suffix == '.md':
                fragment = unquote(address.fragment)
                if fragment not in heading_ids(linked.read_text(encoding='utf-8-sig')):
                    failures.append(f'Broken local anchor: {name}: {target}')
    for name in sorted(actual - seen):
        failures.append(f'Unregistered document: {name}')
    for name in sorted(seen - actual):
        failures.append(f'Registered document outside maintained corpus: {name}')
    for failure in failures:
        print('FAIL ' + failure)
    print(f'DOCS: {"FAIL" if failures else "PASS"} - {len(records)} records; '
          f'{len(actual)} maintained files; {len(failures)} findings (offline structural check)')
    return 1 if failures else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        sys.exit(validate(args.root))
    except (OSError, ValueError, KeyError) as error:
        print(f'DOCS: ERROR - {error}', file=sys.stderr)
        sys.exit(2)
