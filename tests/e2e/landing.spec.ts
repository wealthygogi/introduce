import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { NEW_IDS, V1_IDS } from './fixtures';
test('landing routes into the sheet and coupling workspaces', async ({ page }) => {
  await page.goto('/introduce/');
  const sheets = page.locator('main a[href$="/sheets"]');
  const characters = page.locator('main a[href$="/characters"]');
  await expect(sheets).toBeVisible();
  await expect(characters).toBeVisible();
  await characters.click();
  await expect(page).toHaveURL(/\/characters$/);
  const coupling = page.locator('main .character-related-card[href$="/coupling"]');
  await expect(coupling).toBeVisible();
  await coupling.click();
  await expect(page).toHaveURL(/\/coupling$/);
  await expect(page.locator('main .coupling-hub-card')).toHaveCount(4);

  await page.goto('/introduce/');
  await sheets.click();
  await expect(page).toHaveURL(/\/sheets$/);
  const compact = page.locator('main a[href$="/compact"]');
  const wide = page.locator('main a[href$="/wide"]');
  await expect(compact).toBeVisible();
  await expect(wide).toBeVisible();
  await compact.click();
  await expect(page).toHaveURL(/\/compact$/);
  await expect(page.locator('main a[href*="/concept/"]')).toHaveCount(10);
  const legacy = page.locator('main a[href$="/v1/"]');
  await expect(legacy).toBeVisible();
  await expect(legacy).toHaveAttribute('href', /\/introduce\/v1\/$/);

  await page.goto('/introduce/sheets');
  await wide.click();
  await expect(page).toHaveURL(/\/wide$/);
  await expect(page.locator('main a[href*="/wide/"]')).toHaveCount(4);
});
test('landing exposes the current Compact designs by registry ID', async ({ page }) => {
  await page.goto('/introduce/compact');
  const cards = page.locator('main a[href*="/concept/"]');
  await expect(cards).toHaveCount(NEW_IDS.length);
  const hrefs = await cards.evaluateAll(elements => elements.map(element => element.getAttribute('href')));
  expect(new Set(hrefs)).toEqual(new Set(NEW_IDS.map(id => `/introduce/concept/${id}`)));
});

test('unregistered concept IDs return to the mode landing', async ({ page }) => {
  await page.goto('/introduce/concept/zzz');
  await expect(page).toHaveURL(/\/introduce\/$/);
});

for (const id of [V1_IDS[0], V1_IDS[V1_IDS.length - 1]]) {
  test(`legacy /concept/${id} keeps share query while redirecting to v1`, async ({ page }) => {
    const hop = page.waitForRequest(request => new URL(request.url()).pathname === `/introduce/v1/concept/${id}`);
    await page.goto(`/introduce/concept/${id}?c=abc`, { waitUntil: 'commit' });
    expect(new URL((await hop).url()).search).toBe('?c=abc');
  });
}

test('v1 deep links are restored through the Pages 404 route', async ({ page }) => {
  const hop = page.waitForRequest(request => new URL(request.url()).pathname === '/introduce/v1/' && request.isNavigationRequest());
  await page.goto('/introduce/v1/concept/k?c=abc');
  expect(new URL((await hop).url()).searchParams.get('p')).toBe('/concept/k?c=abc');
});

test('built v1 archive restores a deep-linked card', async ({ page }) => {
  test.skip(!process.env.CI || !existsSync('dist/v1/index.html'), 'v1 archive is served in CI preview');
  await page.goto('/introduce/concept/k');
  await expect(page).toHaveURL(/\/introduce\/v1\/concept\/k$/);
  await expect(page.locator('#preview-card.card-frame')).toBeVisible();
});
