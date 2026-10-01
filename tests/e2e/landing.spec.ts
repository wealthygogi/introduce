import { test, expect } from '@playwright/test';
import { NEW_IDS, LEGACY_IDS } from './fixtures';

test('랜딩은 신규 포토카드 10종만 노출한다', async ({ page }) => {
  await page.goto('/introduce/');
  const cards = page.locator('.concept-card');
  await expect(cards).toHaveCount(NEW_IDS.length);
  const hrefs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(new Set(hrefs)).toEqual(new Set(NEW_IDS.map((id) => `/introduce/concept/${id}`)));
  for (const id of LEGACY_IDS) expect(hrefs).not.toContain(`/introduce/concept/${id}`);
});

test('레거시 컨셉은 직접 접근 가능하고 구버전 배너를 띄운다', async ({ page }) => {
  await page.goto('/introduce/concept/a');
  await expect(page.locator('.legacy-banner')).toBeVisible();
  await expect(page.locator('#preview-card')).toBeVisible();

  await page.goto('/introduce/concept/p');
  await expect(page.locator('#preview-card')).toBeVisible();
  await expect(page.locator('.legacy-banner')).toHaveCount(0);
});

test('미등록 컨셉 id 는 랜딩으로 보낸다', async ({ page }) => {
  await page.goto('/introduce/concept/zzz');
  await expect(page).toHaveURL(/\/introduce\/$/);
});
