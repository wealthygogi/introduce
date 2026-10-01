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

test('레거시 concept a 는 기존 캡처(여백 48 · ×2)를 유지한다', async ({ page }) => {
  await gotoConcept(page, 'a', { state: SCENARIOS.full });
  // 데스크톱 레거시 카드 폭은 min(640px, 100%) 라 패널 폭에 따라 달라진다 → 실제 폭 기준
  const cardW = await page.locator('#preview-card').evaluate((e) => (e as HTMLElement).offsetWidth);
  const dl = await downloadPng(page);
  expect(dl.width).toBe((cardW + 96) * 2);
});
