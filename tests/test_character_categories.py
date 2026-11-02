"""Consumer-facing checks for the character appearance snapshot exporter.

Run with the tdata virtual environment, as for the exporter itself. All corpus
inputs used here are synthetic; the real captured source is never modified.
"""

import gzip
import hashlib
import importlib.util
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TDATA = ROOT.parent / "tdata"
SCRIPT = ROOT / "scripts" / "build_character_categories.py"
OVERRIDES = ROOT / "scripts" / "character-category-overrides.json"

# Import the exporter independently of the tdata scripts package, which is also
# needed below for its public, validating corpus document extractor.
spec = importlib.util.spec_from_file_location("build_character_categories", SCRIPT)
exporter = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = exporter
spec.loader.exec_module(exporter)
sys.path.insert(0, str(TDATA))
from scripts.corpus_documents import extract_document  # noqa: E402


def captured_page(root, *, record_pageid=42):
    """Build a two-page MediaWiki batch and its matching inventory record."""
    timestamp = "2024-01-01T00:00:00Z"
    title = "Example/Characters"

    def page(pageid, page_title, content, revision):
        return {
            "pageid": pageid,
            "ns": 0,
            "title": page_title,
            "pagelanguage": "en",
            "lastrevid": revision,
            "revisions": [{
                "revid": revision,
                "timestamp": timestamp,
                "slots": {"main": {"contentmodel": "wikitext", "content": content}},
            }],
        }

    payload = json.dumps({"query": {"pages": [
        page(1, "Unrelated", "Wrong first page", 10),
        page(42, title, "{{Character Short|name=Example|role=Stage 1 Boss}}", 99),
    ]}}).encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    payload_ref = f"objects/{digest[:2]}/{digest}.gz"
    path = root / payload_ref
    path.parent.mkdir(parents=True)
    path.write_bytes(gzip.compress(payload))
    record = {
        "schema_version": "1.0.0",
        "source": "touhouwiki_en",
        "source_url": "https://example.org/wiki/Example/Characters",
        "item_key": "42",
        "title": title,
        "namespace": "0",
        "kind": "page",
        "lang": "en",
        "revision_id": "99",
        "source_updated_at": timestamp,
        "retrieved_at": timestamp,
        "payload_ref": payload_ref,
        "payload_format": "mediawiki_json",
        "content_sha256": digest,
        "metadata": {"pageid": record_pageid, "current_title": title},
        "redistribution": "private_only",
    }
    return record


def inventory(record):
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.execute("CREATE TABLE items (source TEXT, status TEXT, title TEXT, record TEXT)")
    connection.execute(
        "INSERT INTO items VALUES (?, ?, ?, ?)",
        (record["source"], "captured", record["title"], json.dumps(record)),
    )
    return connection


class CapturedDocumentTests(unittest.TestCase):
    def test_selects_matching_pageid_not_first_batch_page(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            record = captured_page(root)
            with inventory(record) as connection:
                text, metadata = exporter.load_captured_document(
                    connection, root, record["title"], extract_document
                )
            self.assertIn("name=Example", text)
            self.assertNotIn("Wrong first page", text)
            self.assertEqual(metadata["metadata"]["pageid"], 42)
            self.assertEqual(metadata["revision_id"], "99")

    def test_missing_matching_pageid_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            record = captured_page(root, record_pageid=12345)
            with inventory(record) as connection:
                with self.assertRaises(ValueError):
                    exporter.load_captured_document(
                        connection, root, record["title"], extract_document
                    )

    def test_missing_captured_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            record = captured_page(root)
            with inventory(record) as connection:
                connection.execute("DELETE FROM items")
                with self.assertRaises(ValueError):
                    exporter.load_captured_document(
                        connection, root, record["title"], extract_document
                    )


class IdentityTests(unittest.TestCase):
    def test_homonyms_have_distinct_explicit_page_identities(self):
        overrides = json.loads(OVERRIDES.read_text(encoding="utf-8"))
        names, pages = overrides["names"], overrides["pages"]
        self.assertEqual(names["Mai (PC-98)"], "char-8c08177f8798")
        self.assertEqual(pages["char-8c08177f8798"], "Mai (PC-98)")
        self.assertEqual(pages["char-8c682b0ac9c4"], "Reisen (Bougetsushou)")
        # An explicitly qualified identity must not resolve to its namesake.
        candidates = {"Mai (PC-98)": ["mai"], "Reisen": ["reisen"]}
        self.assertEqual(
            exporter.resolve_name("Mai (PC-98)", candidates, names),
            "char-8c08177f8798",
        )
        self.assertEqual(exporter.resolve_name("Reisen", candidates, names), "reisen")
        self.assertNotEqual(pages["char-8c682b0ac9c4"], "Reisen")


class RoleTests(unittest.TestCase):
    def test_scene_market_and_scenario_are_not_normal_stage_one(self):
        for role in ("Scene 3-3 Boss", "Stage 1-2 Boss", "Market 1 Boss",
                     "Scenario 1 Boss"):
            with self.subTest(role=role):
                facts = exporter.parse_role(role)
                self.assertTrue(facts, role)
                self.assertTrue(all(stage is None for _, stage, _, _ in facts), facts)
        scenario = exporter.parse_role("Scenario 1 Boss")
        self.assertTrue(all(conditional for _, _, _, conditional in scenario))

    def test_multiple_roles_preserved_without_treating_midboss_as_boss(self):
        facts = exporter.parse_role("Stage 5 Boss and Midboss")
        self.assertIn(("boss", 5, None, False), facts)
        self.assertIn(("midboss", 5, None, False), facts)
        self.assertEqual(
            exporter.parse_role("Stage 1 Midboss"), [("midboss", 1, None, False)]
        )
        self.assertEqual(
            exporter.parse_role("Stage 1 mid-boss"), [("midboss", 1, None, False)]
        )
        # A playable and enemy appearance in the same work remain separate facts.
        facts = exporter.parse_role("Playable Character") + exporter.parse_role("Stage 4-A Boss")
        self.assertIn(("playable", None, None, False), facts)
        self.assertIn(("boss", 4, "A", True), facts)


class OutputSafetyTests(unittest.TestCase):
    def test_missing_corpus_does_not_replace_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "snapshot.json"
            original = b'{"existing": "must remain intact"}\n'
            output.write_bytes(original)
            result = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), "--tdata-root", str(root / "missing"),
                 "--out", str(output)],
                cwd=ROOT, capture_output=True, text=True, check=False,
            )
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(output.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
