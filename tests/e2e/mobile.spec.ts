import { test, expect, type Page } from '@playwright/test';
import { SCENARIOS } from './fixtures';
import { gotoConcept, downloadPng, waitReady } from './helpers';

async function openPreviewTab(page: Page) {
  await page.getByRole('tab', { name: /미리보기/ }).click();
  await expect(page.locator('#preview-card')).toBeVisible();
  await waitReady(page);
}

test.describe('iPhone 폭 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  test('입력 탭: 미리보기가 화면을 가리지 않고 입력란이 첫 화면에 보인다', async ({ page }) => {
    await gotoConcept(page, 'p', { state: SCENARIOS.full });
    await expect(page.locator('#preview-card')).toBeHidden();
    const nick = (await page.locator('#inp-nickname').boundingBox())!;
    expect(nick.y + nick.height).toBeLessThanOrEqual(844);
    // 스크롤해도 화면 위에 붙어 있는 건 탭 바 하나뿐
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const tabs = (await page.locator('.mobile-tabs').boundingBox())!;
    expect(tabs.y).toBe(0);
    expect(tabs.height).toBeLessThanOrEqual(64);
  });

  for (const id of ['p', 'u']) {
    test(`concept ${id}: 미리보기 탭에서 카드 전체가 한 화면에 들어오고 PNG 는 1080×1620`, async ({ page }) => {
      await gotoConcept(page, id, { state: SCENARIOS.full });
      await page.evaluate(() => window.scrollTo(0, 600));
      await openPreviewTab(page);
      const box = (await page.locator('#preview-card').boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(350);
      expect(box.width).toBeLessThanOrEqual(360);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      await expect(page.locator('.download-btn')).toBeInViewport();
      const dl = await downloadPng(page);
      expect([dl.width, dl.height]).toEqual([1080, 1620]);
    });
  }

  test('입력 탭에서 고친 값이 미리보기 탭 카드에 반영된다', async ({ page }) => {
    await gotoConcept(page, 'p');
    await page.fill('#inp-nickname', '탭전환');
    await openPreviewTab(page);
    await expect(page.locator('#preview-card')).toContainText('탭전환');
  });
});

test.describe('좁은 폭 320', () => {
  test.use({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  test('concept p: 축소 표시 · PNG 는 레이아웃 폭 기준 1080×1620', async ({ page }) => {
    await gotoConcept(page, 'p', { state: SCENARIOS.full });
    await openPreviewTab(page);
    const box = (await page.locator('#preview-card').boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(280);
    expect(box.width).toBeLessThanOrEqual(320);
    const dl = await downloadPng(page);
    expect([dl.width, dl.height]).toEqual([1080, 1620]);
  });
});
