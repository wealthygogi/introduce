import { test, expect } from '@playwright/test';
import { NEW_IDS, SCENARIOS, type Lang, type PlainState } from './fixtures';
import { gotoConcept, downloadPng, diffRatio, cardScreenshot } from './helpers';

test.use({ deviceScaleFactor: 3 });

const CASES: [name: string, state: PlainState, lang: Lang][] = [
  ['long', SCENARIOS.long, 'ko'],
  ['ja', SCENARIOS.ja, 'ja'],
];

for (const id of NEW_IDS) {
  for (const [name, state, lang] of CASES) {
    test(`concept ${id} · ${name}: PNG 1080×1620 이고 화면과 일치`, async ({ page }) => {
      await gotoConcept(page, id, { lang, state });
      const dl = await downloadPng(page);
      expect([dl.width, dl.height]).toEqual([1080, 1620]);

      const shot = await cardScreenshot(page.locator('#preview-card'));
      const ratio = await diffRatio(shot, dl.png, `tests/e2e/output/${id}-${name}-diff.png`);
      expect(ratio).toBeLessThanOrEqual(0.01);
    });
  }
}
