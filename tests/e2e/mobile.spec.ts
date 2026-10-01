import { test, expect } from '@playwright/test';
import { SCENARIOS } from './fixtures';
import { gotoConcept, downloadPng } from './helpers';

test.describe('iPhone 폭 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  for (const id of ['p', 'u']) {
    test(`concept ${id}: 화면 안에 들어가고 PNG 는 1080×1620`, async ({ page }) => {
      await gotoConcept(page, id, { state: SCENARIOS.full });
      const box = (await page.locator('#preview-card').boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(350);
      expect(box.width).toBeLessThanOrEqual(360);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      const dl = await downloadPng(page);
      expect([dl.width, dl.height]).toEqual([1080, 1620]);
    });
  }
});

test.describe('좁은 폭 320', () => {
  test.use({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  test('concept p: 축소 표시 · PNG 는 레이아웃 폭 기준 1080×1620', async ({ page }) => {
    await gotoConcept(page, 'p', { state: SCENARIOS.full });
    const box = (await page.locator('#preview-card').boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(280);
    expect(box.width).toBeLessThanOrEqual(320);
    const dl = await downloadPng(page);
    expect([dl.width, dl.height]).toEqual([1080, 1620]);
  });
});
