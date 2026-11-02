"""Regression tests for conservative print-work identity and title matching."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import mwparserfromhell

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import build_character_printworks as exporter


class PrintworksTests(unittest.TestCase):
    def test_forced_homonyms_and_shared_or_unidentified_pages(self):
        characters = [
            {'id': 'old-mai', 'ko': '구작', 'ja': '旧', 'en': 'Mai'},
            {'id': 'mai', 'ko': '마이', 'ja': '舞', 'en': 'Mai Teireida'},
            {'id': 'moon', 'ko': '달', 'ja': '月', 'en': 'Reisen II'},
            {'id': 'undonge', 'ko': '우동게', 'ja': '鈴仙', 'en': 'Reisen'},
            {'id': 'unknown', 'ko': '미상', 'ja': '不明', 'en': 'Unknown'},
            {'id': 'shared', 'ko': '공유', 'ja': '共有', 'en': 'Shared'},
        ]
        titles = ['Mai', 'Mai', 'Reisen', 'Reisen', 'Minor Characters#Unknown', 'Mai']
        rows = [dict(Korean=c['ko'], Japanese=c['ja'], English=c['en'], reference_title=title)
                for c, title in zip(characters, titles)]
        pages = exporter.identity_pages(characters, rows, {'old-mai': 'Mai (PC-98)', 'moon': 'Reisen (Bougetsushou)'})
        self.assertEqual(pages, {'old-mai': 'Mai (PC-98)', 'moon': 'Reisen (Bougetsushou)', 'undonge': 'Reisen'})

    def test_redirect_and_multiple_infobox_pages_are_not_identified(self):
        field, reason = exporter.printworks_field('#REDIRECT [[Someone]]\n{{Infobox Character|appPrintworks=[[Real Book]]}}', mwparserfromhell)
        self.assertIsNone(field)
        self.assertEqual(reason, 'redirect')
        field, reason = exporter.printworks_field('{{Infobox Character|appPrintworks=[[Real Book]]}}{{Infobox Character}}', mwparserfromhell)
        self.assertIsNone(field)
        self.assertEqual(reason, 'missing or multiple infoboxes')

    def test_explicit_matching_does_not_infer_unrelated_titles_or_display_text(self):
        works = [{'id': 'book', 'category': 'book', 'en': 'Real Book'},
                 {'id': 'game', 'category': 'game', 'en': 'Game'}]
        _, names = exporter.book_names(works, {'Verified Volume': 'book'})
        found, unknown = exporter.linked_books('[[Real Book|A mention]] [[Verified Volume]] [[Game|Real Book]] [[Mystery]] Real Book', names, mwparserfromhell)
        self.assertEqual(found, {'book'})
        self.assertEqual(unknown, {'Game': 1, 'Mystery': 1})
        with self.assertRaises(ValueError):
            exporter.book_names(works, {'Game': 'game'})

    def test_actual_overrides_do_not_map_unrelated_works(self):
        catalog = json.loads((ROOT / 'src/data/profileCatalog.json').read_text(encoding='utf-8'))
        aliases = json.loads((ROOT / 'scripts/character-printworks-overrides.json').read_text(encoding='utf-8'))['aliases']
        _, names = exporter.book_names(catalog['works'], aliases)
        self.assertEqual(names[exporter.title_key('Silent Sinner in Blue')], 'book-3cac6f6a7f4c')
        self.assertEqual(names[exporter.title_key('Oriental Sacred Place')], 'book-e9c222ac2afe')
        self.assertNotIn(exporter.title_key('Strange Creators of Outer World'), names)
        self.assertNotIn(exporter.title_key("Who's Who of Humans & Youkai in Gensokyo"), names)

    def test_failed_build_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'snapshot.json'
            output.write_text('existing', encoding='utf-8')
            with patch.object(sys, 'argv', ['export', '--tdata-root', directory, '--out', str(output)]), \
                 patch.object(exporter, 'build', side_effect=ValueError('invalid source')), \
                 contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(exporter.main(), 1)
            self.assertEqual(output.read_text(encoding='utf-8'), 'existing')


if __name__ == '__main__':
    unittest.main()
