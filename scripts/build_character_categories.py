#!/usr/bin/env python3
"""Build a source-referenced appearance snapshot from the read-only corpus."""
from __future__ import annotations

import argparse
import csv
import gzip
import json
import re
import sqlite3
import sys
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent.parent
DIRECTION = re.compile('[\u200e\u200f\u202a-\u202e\u2066-\u2069]')
ROLE_PATTERN = re.compile(r'\b(playable\s+characters?|mid[\s-]*boss(?:es)?|supporting\s+boss(?:es)?|support(?:er|ing)?(?:\s+enemy)?|partners?|possible\s+opponents?|opponents?|(?:generic|general)\s+enemy|background\s+character|cameo|boss(?:es)?)\b', re.I)
STAGE_PATTERN = re.compile(r'\b(?:stage\s*)?(extra|phantasm|final)\s+stage(?:\s*[- ]\s*([ab])\b)?|\bstage\s+(\d+)(?:\s*-?\s*([ab])\b)?(?!\s*-\s*\d)', re.I)
VERSUS_WORKS = frozenset({'th3', 'th9', 'th19'})


def clean_name(name: str) -> str:
    name = DIRECTION.sub('', name).replace('{{!}}', '|').strip()
    if name.startswith('[[') and name.endswith(']]'):
        name = name[2:-2]
    return re.sub(r'\s+', ' ', name.split('|')[-1]).strip()


def resolve_name(name: str, name_to_ids: dict[str, list[str]], overrides: dict[str, str]) -> str | None:
    raw = DIRECTION.sub('', name).replace('{{!}}', '|').strip()
    if raw.startswith('[[') and raw.endswith(']]'):
        raw = raw[2:-2]
    # The target disambiguates display labels such as Mai (PC-98)|Mai.
    identity = clean_name(raw.split('|', 1)[0])
    if identity in overrides:
        return overrides[identity]
    ids = name_to_ids.get(identity.casefold(), name_to_ids.get(identity, []))
    if len(set(ids)) > 1:
        raise ValueError(f'ambiguous character name {identity!r}: {ids}')
    return ids[0] if ids else None


def parse_role(role: str, *, versus: bool = False) -> list[tuple[str, int | str | None, str | None, bool]]:
    """Return separate role/stage facts; route and scene numbering is not a stage."""
    role = re.sub(r'<br\s*/?>', ';', role, flags=re.I)
    role = re.sub(r'<[^>]+>', '', role)
    result = []
    for segment in re.split(r';|\n', role):
        previous_end = 0
        previous_stages = []
        for match in ROLE_PATTERN.finditer(segment):
            word = match.group(0).lower()
            kind = ('playable' if word.startswith('playable') else
                    'midboss' if word.startswith('mid') else
                    'support' if word.startswith(('support', 'partner')) else
                    'opponent' if 'opponent' in word else
                    'other' if word.startswith(('generic', 'general', 'background', 'cameo')) else 'boss')
            prefix = segment[previous_end:match.start()]
            conditional = bool(re.search(r'\b(?:scenario|route|only|exclusive|conditional)\b', segment, re.I))
            uncertain = versus or bool(re.search(r'\b(?:scene|market|day|scenario|route)\b|\bstage\s+\d+\s*-\s*\d+', segment, re.I))
            stages = []
            if not uncertain:
                for sm in STAGE_PATTERN.finditer(prefix):
                    value = sm.group(1).lower() if sm.group(1) else int(sm.group(3))
                    stages.append((value, (sm.group(2) or sm.group(4) or '').upper() or None))
                # Explicit lists such as "Stage 4 and 5 Midboss".
                for lm in re.finditer(r'\bstage\s+(\d+)\s*(?:,\s*\d+)*\s*(?:and|&)\s*(\d+)\b', prefix, re.I):
                    # The numbers in "Extra Stage 1 and 2" are scenes, not stages.
                    if re.search(r'\b(?:extra|phantasm|final)\s+$', prefix[:lm.start()], re.I):
                        continue
                    stages.extend((int(n), None) for n in re.findall(r'\d+', lm.group(0)))
            if not stages and not prefix.strip(' ,&') and previous_stages:
                stages = previous_stages
            if not stages and re.fullmatch(r'\s*(?:and|&)\s*', prefix, re.I) and previous_stages:
                stages = previous_stages
            if kind in ('playable', 'support') and not stages:
                stages = [(None, None)]
            if not stages:
                stages = [(None, None)]
            for stage, branch in dict.fromkeys(stages):
                fact = (kind, stage, branch, conditional or branch is not None)
                if fact not in result:
                    result.append(fact)
            previous_stages = stages
            previous_end = match.end()
    return result


def load_captured_document(connection, corpus_root: Path, title: str, extract_document) -> tuple[str, dict]:
    rows = connection.execute("SELECT record FROM items WHERE source='touhouwiki_en' AND status='captured' AND title=?", (title,)).fetchall()
    if len(rows) != 1:
        raise ValueError(f'expected one captured page for {title!r}, got {len(rows)}')
    record = json.loads(rows[0][0])
    relative = PurePosixPath(record['payload_ref'])
    if relative.is_absolute() or '..' in relative.parts or not relative.parts or relative.parts[0] != 'objects':
        raise ValueError(f'unsafe payload for {title}')
    path = corpus_root
    for component in relative.parts:
        path = path / component
        if path.is_symlink():
            raise ValueError(f'symlink payload for {title}')
    if not path.resolve().is_relative_to((corpus_root / 'objects').resolve()):
        raise ValueError(f'payload escapes corpus for {title}')
    payload = path.read_bytes()
    extract_document(record, payload, root=corpus_root)
    document = json.loads(gzip.decompress(payload))
    pages = [p for p in document['query']['pages'] if p.get('pageid') == record['metadata']['pageid']]
    if len(pages) != 1:
        raise ValueError(f'pageid mismatch for {title}')
    return pages[0]['revisions'][0]['slots']['main']['content'], record


def build(tdata_root: Path) -> dict:
    sys.path.insert(0, str(tdata_root))
    from scripts.corpus_documents import extract_document
    import mwparserfromhell

    catalog = json.loads((ROOT / 'src/data/profileCatalog.json').read_text(encoding='utf-8'))
    overrides = json.loads((ROOT / 'scripts/character-category-overrides.json').read_text(encoding='utf-8'))
    characters = catalog['characters']
    works = [w for w in catalog['works'] if w['category'] == 'game']
    ids = {c['id'] for c in characters}
    if len(ids) != len(characters) or any(v not in ids for v in overrides['names'].values()) or any(k not in ids for k in overrides['pages']):
        raise ValueError('invalid or duplicate character ID in catalog or overrides')
    work_ids = {w['id'] for w in works}
    if (len(work_ids) != len(works) or any(v not in work_ids for v in overrides['works'].values())
            or any(wid not in work_ids or not isinstance(entry['number'], int)
                   or isinstance(entry['number'], bool) or entry['number'] <= 0 or not entry['evidence']
                   for wid, entry in overrides['finalStages'].items())):
        raise ValueError('invalid or duplicate work ID or final stage')
    corpus = tdata_root / '_raw/_corpus-ko-en-ja'
    con = sqlite3.connect(f'file:{(corpus / "inventory.sqlite").as_posix()}?mode=ro', uri=True)
    con.execute('PRAGMA query_only=ON')
    audit_path = corpus / 'sheet-exports/touhou-vote-list-audit.csv'
    with audit_path.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    audit = defaultdict(list)
    for row in rows:
        audit[(row['Korean'], row['Japanese'], row['English'])].append(row)
    names = defaultdict(list)
    pages = {}
    for c in characters:
        matches = audit[(c['ko'], c['ja'], c['en'])]
        if len(matches) != 1:
            raise ValueError(f'audit identity mismatch: {c["id"]}')
        names[clean_name(c['en']).casefold()].append(c['id'])
        title = matches[0]['reference_title'].strip()
        if title and '#' not in title:
            pages[c['id']] = title
    pages.update(overrides['pages'])
    # Never infer individual identities for aggregate character entries.
    for c in characters:
        if re.search(r'\b(?:fairies|dolls)\b', c['en'], re.I):
            pages.pop(c['id'], None)
    work_names = {w['en'].casefold(): w['id'] for w in works}
    work_names.update({k.casefold(): v for k, v in overrides['works'].items()})
    facts = defaultdict(lambda: defaultdict(set))
    unknown_names = Counter()
    unknown_roles = Counter()
    unknown_works = Counter()
    source_set = set()

    def add(cid, wid, parsed, record, locator):
        source = (record['source_url'], str(record['revision_id']), locator)
        source_set.add(source)
        for role, stage, branch, conditional in parsed:
            facts[cid][(wid, role, stage, branch, conditional)].add(source)

    for w in works:
        title = w['en'] + '/Characters'
        text, record = load_captured_document(con, corpus, title, extract_document)
        templates = [t for t in mwparserfromhell.parse(text).filter_templates() if str(t.name).strip().casefold() == 'character short']
        for index, template in enumerate(templates, 1):
            if not template.has('name') or not template.has('role'):
                continue
            name = str(template.get('name').value).strip()
            cid = resolve_name(name, names, overrides['names'])
            if not cid:
                unknown_names[name] += 1
                continue
            role_text = str(template.get('role').value).strip()
            parsed = parse_role(role_text, versus=w['id'] in VERSUS_WORKS)
            if not parsed:
                unknown_roles[title] += 1
                continue
            add(cid, w['id'], parsed, record, f'Character Short {index} role')

    for cid, title in pages.items():
        row = con.execute("SELECT 1 FROM items WHERE source='touhouwiki_en' AND status='captured' AND title=?", (title,)).fetchone()
        if not row:
            continue
        text, record = load_captured_document(con, corpus, title, extract_document)
        if re.match(r'\s*#redirect\b', text, re.I):
            continue
        boxes = [t for t in mwparserfromhell.parse(text).filter_templates() if str(t.name).strip().casefold() == 'infobox character']
        if len(boxes) != 1 or not boxes[0].has('appOfficialgames'):
            continue
        for line in str(boxes[0].get('appOfficialgames').value).splitlines():
            if not line.lstrip().startswith('*'):
                continue
            links = mwparserfromhell.parse(line).filter_wikilinks()
            if not links:
                continue
            work_title = DIRECTION.sub('', str(links[0].title)).strip()
            wid = work_names.get(work_title.casefold())
            if not wid:
                unknown_works[work_title] += 1
                continue
            # Roles following the work link only; do not classify the work title.
            suffix = line.split(str(links[0]), 1)[1]
            parsed = parse_role(suffix, versus=wid in VERSUS_WORKS)
            if not parsed:
                unknown_roles[title] += 1
                continue
            add(cid, wid, parsed, record, 'Infobox Character appOfficialgames')
    con.close()
    ordered_sources = sorted(source_set)
    source_index = {s: i for i, s in enumerate(ordered_sources)}
    work_order = {w['id']: i for i, w in enumerate(works)}
    def sort_fact(item):
        wid, role, stage, branch, conditional = item[0]
        stage_key = (0, 0) if stage is None else (1, stage) if isinstance(stage, int) else (2, stage)
        return (work_order[wid], role, stage_key, branch or '', conditional)
    output = {'schemaVersion': 1, 'finalStageByWork': {wid: entry['number'] for wid, entry in overrides['finalStages'].items()}, 'sources': [{'url': u, 'revisionId': r, 'locator': loc} for u, r, loc in ordered_sources], 'characters': {}}
    for c in characters:
        entries = []
        for (wid, role, stage, branch, conditional), sources in sorted(facts[c['id']].items(), key=sort_fact):
            entries.append({'workId': wid, 'role': role, 'stage': stage, 'branch': branch, 'conditional': conditional, 'sources': sorted(source_index[s] for s in sources)})
        output['characters'][c['id']] = entries
    print(f'Characters with facts: {sum(bool(v) for v in output["characters"].values())}/{len(characters)}; without facts: {sum(not v for v in output["characters"].values())}')
    for c in characters:
        entries = output['characters'][c['id']]
        print(f'{c["id"]}: {len(entries)} facts in {len({entry["workId"] for entry in entries})} works' if entries else f'{c["id"]}: unconfirmed')
    for w in works:
        print(f'{w["id"]}: {sum(any(a["workId"] == w["id"] for a in entries) for entries in output["characters"].values())} characters')
    print('Unidentified names:', ', '.join(f'{n} ({count})' for n, count in sorted(unknown_names.items())) or 'none')
    print('Unparsed role entries:', sum(unknown_roles.values()), '; pages:', ', '.join(f'{n} ({count})' for n, count in sorted(unknown_roles.items())) or 'none')
    print('Works outside catalog:', ', '.join(f'{n} ({count})' for n, count in sorted(unknown_works.items())) or 'none')
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tdata-root', required=True, type=Path)
    parser.add_argument('--out', type=Path, default=ROOT / 'src/data/characterAppearances.json')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        snapshot = build(args.tdata_root.resolve())
        text = json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if args.out.read_text(encoding='utf-8') != text:
                raise ValueError(f'snapshot differs: {args.out}')
            print('Snapshot matches.')
        else:
            args.out.write_text(text, encoding='utf-8')
            print(f'Wrote {args.out}')
    except (OSError, ValueError, KeyError, sqlite3.Error) as exc:
        print(f'Appearance export failed: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
