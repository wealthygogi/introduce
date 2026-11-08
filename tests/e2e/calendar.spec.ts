import { expect, test } from '@playwright/test';

test('calendar switches between today, weekly, and monthly browsing', async ({ page }) => {
  await page.goto('/introduce/calendar');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/환상향|幻想郷|Gensokyo/);
  await expect(page.getByRole('tab', { name: /Today|오늘/ })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: /Week|주간/ }).click();
  await expect(page.locator('.calendar-week-day')).toHaveCount(7);
  await page.getByRole('tab', { name: /Month|월간/ }).click();
  await expect(page.locator('.calendar-month-grid .calendar-month-cell')).toHaveCount(42);
  await expect(page.locator('.calendar-month-detail')).toBeVisible();
});

test('character view reuses portraits, filters names, and links to platform tag searches on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/introduce/calendar');
  await page.getByRole('tab', { name: /Characters|캐릭터별/ }).click();
  await page.getByRole('searchbox', { name: /Choose a character|캐릭터를 선택하세요/ }).fill('하쿠레이');
  const reimu = page.getByRole('button', { name: /Reimu Hakurei|하쿠레이 레이무/ });
  await expect(reimu).toBeVisible();
  await reimu.click();

  await expect(page.locator('.calendar-character-heading')).toContainText(/Reimu Hakurei|하쿠레이 레이무/);
  await expect(page.locator('.calendar-character-heading img')).toBeVisible();
  const pixivLink = page.getByRole('link', { name: /Find illustrations on pixiv|pixiv 일러스트 검색/ }).first();
  const xLink = page.getByRole('link', { name: /Search images on X|X 이미지 검색/ }).first();
  await expect(pixivLink).toHaveAttribute('href', /pixiv\.net\/tags\/.+\/illustrations/);
  await expect(xLink).toHaveAttribute('href', /x\.com\/search\?q=%23/);
  expect(await page.locator('body').evaluate(element => element.scrollWidth <= window.innerWidth)).toBe(true);
});
