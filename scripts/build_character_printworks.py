#!/usr/bin/env python3
"""Export incomplete book-related candidates, including mentions and reference entries.

A linked print work does not establish a character's debut, leading role, or
appearance in its narrative. Only explicit infobox links are recorded.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sqlite3
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

from build_character_categories import load_captured_document

ROOT = Path(__file__).resolve().parent.parent
DIRECTION = re.compile('[\u200e\u200f\u202a-\u202e\u2066-\u2069]')


def title_key(title: str) -> str:
    return DIRECTION.sub('', title).strip().casefold()


def book_names(works, aliases):
    books = [work for work in works if work['category'] == 'book']
    ids = {work['id'] for work in books}
    if len(ids) != len(books) or any(value not in ids for value in aliases.values()):
        raise ValueError('invalid or duplicate book ID')
    result = {}
    for title, wid in [(w['en'], w['id']) for w in books] + list(aliases.items()):
        key = title_key(title)
        if key in result and result[key] != wid:
            raise ValueError(f'ambiguous book title: {title}')
        result[key] = wid
    return books, result


def identity_pages(characters, rows, forced_pages):
    ids = {character['id'] for character in characters}
    if len(ids) != len(characters) or any(cid not in ids for cid in forced_pages):
        raise ValueError('invalid or duplicate character ID')
    audit = defaultdict(list)
    for row in rows:
        audit[(row['Korean'], row['Japanese'], row['English'])].append(row)
    pages = {}
    for character in characters:
        matches = audit[(character['ko'], character['ja'], character['en'])]
        if len(matches) != 1:
            raise ValueError(f'audit identity mismatch: {character["id"]}')
        title = forced_pages.get(character['id'], matches[0]['reference_title']).strip()
        if title and '#' not in title and not re.search(r'\b(?:fairies|dolls)\b', character['en'], re.I):
            pages[character['id']] = title
    # A shared page is not evidence for identifying either individual.
    counts = Counter(title_key(title) for title in pages.values())
    return {cid: title for cid, title in pages.items() if counts[title_key(title)] == 1}


def linked_books(value, names, parser):
    """Match only explicit link targets, never display text or unlinked names."""
    found, unknown = set(), Counter()
    for link in parser.parse(value).filter_wikilinks():
        title = DIRECTION.sub('', str(link.title)).strip()
        wid = names.get(title_key(title))
        if wid is None:
            unknown[title] += 1
        else:
            found.add(wid)
    return found, unknown


def printworks_field(text, parser):
    if re.match(r'\s*#redirect\b', text, re.I):
        return None, 'redirect'
    boxes = [t for t in parser.parse(text).filter_templates() if str(t.name).strip().casefold() == 'infobox character']
    if len(boxes) != 1:
        return None, 'missing or multiple infoboxes'
    if not boxes[0].has('appPrintworks'):
        return None, 'missing appPrintworks'
    return str(boxes[0].get('appPrintworks').value), None


def build(tdata_root: Path) -> dict:
    sys.path.insert(0, str(tdata_root))
    from scripts.corpus_documents import extract_document
    import mwparserfromhell

    catalog = json.loads((ROOT / 'src/data/profileCatalog.json').read_text(encoding='utf-8'))
    identity = json.loads((ROOT / 'scripts/character-category-overrides.json').read_text(encoding='utf-8'))
    overrides = json.loads((ROOT / 'scripts/character-printworks-overrides.json').read_text(encoding='utf-8'))
    books, names = book_names(catalog['works'], overrides['aliases'])
    corpus = tdata_root / '_raw/_corpus-ko-en-ja'
    with (corpus / 'sheet-exports/touhou-vote-list-audit.csv').open(encoding='utf-8-sig', newline='') as f:
        pages = identity_pages(catalog['characters'], list(csv.DictReader(f)), identity['pages'])
    facts = defaultdict(lambda: defaultdict(set))
    unknown = Counter()
    missing = Counter()
    with sqlite3.connect(f'file:{(corpus / "inventory.sqlite").as_posix()}?mode=ro', uri=True) as con:
        con.execute('PRAGMA query_only=ON')
        for character in catalog['characters']:
            cid = character['id']
            title = pages.get(cid)
            if not title:
                missing['unidentified or shared page'] += 1
                continue
            if not con.execute("SELECT 1 FROM items WHERE source='touhouwiki_en' AND status='captured' AND title=?", (title,)).fetchone():
                missing['page not captured'] += 1
                continue
            text, record = load_captured_document(con, corpus, title, extract_document)
            field, reason = printworks_field(text, mwparserfromhell)
            if reason:
                missing[reason] += 1
                continue
            found, unrecognized = linked_books(field, names, mwparserfromhell)
            unknown.update(unrecognized)
            source = (record['source_url'], str(record['revision_id']), 'Infobox Character appPrintworks')
            for wid in found:
                facts[cid][wid].add(source)
    sources = sorted({source for works in facts.values() for refs in works.values() for source in refs})
    indexes = {source: index for index, source in enumerate(sources)}
    order = {book['id']: index for index, book in enumerate(books)}
    result = {
        'schemaVersion': 1,
        'sources': [{'url': url, 'revisionId': revision, 'locator': locator} for url, revision, locator in sources],
        'characters': {
            c['id']: [{'workId': wid, 'sources': sorted(indexes[s] for s in refs)}
                      for wid, refs in sorted(facts[c['id']].items(), key=lambda item: order[item[0]])]
            for c in catalog['characters']
        },
    }
    count = sum(bool(entries) for entries in result['characters'].values())
    print(f'Book-related candidates (including mentions; incomplete): {count}/{len(catalog["characters"])}; without matched links: {len(catalog["characters"]) - count}')
    print('Missing/skipped:', ', '.join(f'{key}: {value}' for key, value in sorted(missing.items())) or 'none')
    print('Unidentified or outside-catalog link titles:', ', '.join(f'{key} ({value})' for key, value in sorted(unknown.items())) or 'none')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tdata-root', required=True, type=Path)
    parser.add_argument('--out', type=Path, default=ROOT / 'src/data/characterPrintworks.json')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        text = json.dumps(build(args.tdata_root.resolve()), ensure_ascii=False, indent=2) + '\n'
        if args.check:
            if args.out.read_text(encoding='utf-8') != text:
                raise ValueError(f'snapshot differs: {args.out}')
            print('Snapshot matches.')
        else:
            # Replace only after a complete successful build and write.
            temp_name = None
            try:
                with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=args.out.parent, delete=False) as temp:
                    temp_name = temp.name
                    temp.write(text)
                os.replace(temp_name, args.out)
            finally:
                if temp_name and os.path.exists(temp_name):
                    os.unlink(temp_name)
            print(f'Wrote {args.out}')
    except (OSError, ValueError, KeyError, sqlite3.Error) as exc:
        print(f'Printworks export failed: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
