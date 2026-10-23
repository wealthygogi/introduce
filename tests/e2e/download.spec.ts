import { test, expect } from '@playwright/test';
import { NEW_IDS, SCENARIOS, type Lang, type PlainState } from './fixtures';
import { gotoConcept, downloadPng, diffRatio, cardScreenshot } from './helpers';

test.use({ deviceScaleFactor: 3 });

const CASES: [name: string, state: PlainState, lang: Lang][] = [
  ['long', SCENARIOS.long, 'ko'],
  ['ja', SCENARIOS.ja, 'ja'],
];

/**
 * 화면 대비 PNG 픽셀 차이 상한. WebKit 은 foreignObject 래스터가 서브픽셀만큼 어긋나
 * (줄 위치 · 줄바꿈은 같고 글리프 외곽 · 1px 괘선만 다름) 실측 최대 1.6% → 2%.
 * 줄 위치가 달라지는 회귀(폰트 fallback · 빈 이미지)는 수십 % 로 나와 둘 다 잡힌다.
 */
const MAX_DIFF: Record<string, number> = { chromium: 0.01, webkit: 0.02 };

for (const id of NEW_IDS) {
  for (const [name, state, lang] of CASES) {
    test(`concept ${id} · ${name}: PNG 1080×1620 이고 화면과 일치`, async ({ page }, testInfo) => {
      await gotoConcept(page, id, { lang, state });
      const dl = await downloadPng(page);
      expect([dl.width, dl.height]).toEqual([1080, 1620]);

      const shot = await cardScreenshot(page.locator('#preview-card'));
      const project = testInfo.project.name;
      const ratio = await diffRatio(shot, dl.png, `tests/e2e/output/${project}-${id}-${name}-diff.png`);
      expect(ratio).toBeLessThanOrEqual(MAX_DIFF[project]);
    });
  }
}

test('compact QR footer remains inside the full export and PNG dimensions', async ({ page }) => {
  await gotoConcept(page, 'p', { state: SCENARIOS.full });
  const socialSettings = page.locator('details.social-settings');
  if (!(await socialSettings.evaluate((element: HTMLDetailsElement) => element.open))) await socialSettings.locator('summary').click();
  await page.locator('#social-platform').selectOption('other');
  await page.locator('#social-account').fill('https://example.com/profile');
  const exportRoot = page.locator('#card-export');
  await expect(exportRoot.locator('.social-qr-footer')).toHaveCount(1);
  const box = await exportRoot.evaluate((element: HTMLElement) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  const png = await downloadPng(page);
  expect([png.width, png.height]).toEqual([box.width * 3, box.height * 3]);
  expect(png.height).toBeGreaterThan(1620);
});
