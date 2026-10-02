import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { NEW_IDS, V1_IDS } from './fixtures';

test('랜딩은 포토카드 10종을 노출한다', async ({ page }) => {
  await page.goto('/introduce/');
  const cards = page.locator('.concept-card');
  await expect(cards).toHaveCount(NEW_IDS.length);
  const hrefs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(new Set(hrefs)).toEqual(new Set(NEW_IDS.map((id) => `/introduce/concept/${id}`)));
});

test('미등록 컨셉 id 는 랜딩으로 보낸다', async ({ page }) => {
  await page.goto('/introduce/concept/zzz');
  await expect(page).toHaveURL(/\/introduce\/$/);
});

test('v1 컨셉 링크(a~o)는 공유 쿼리를 유지한 채 /v1/ 사본으로 넘긴다', async ({ page }) => {
  for (const id of [V1_IDS[0], V1_IDS[V1_IDS.length - 1]]) {
    const hop = page.waitForRequest((r) => new URL(r.url()).pathname === `/introduce/v1/concept/${id}`);
    await page.goto(`/introduce/concept/${id}?c=abc`);
    expect(new URL((await hop).url()).search).toBe('?c=abc');
  }
});

test('404 페이지는 v1 딥링크를 v1 index 의 ?p= 로 넘긴다', async ({ page }) => {
  const hop = page.waitForRequest((r) => new URL(r.url()).pathname === '/introduce/v1/' && r.isNavigationRequest());
  await page.goto('/introduce/v1/concept/k?c=abc');
  expect(new URL((await hop).url()).searchParams.get('p')).toBe('/concept/k?c=abc');
});

test('v1 사본이 빌드돼 있으면 딥링크가 v1 카드로 복원된다', async ({ page }) => {
  // dist/v1 은 npm run build:site(CI) 가 만든다. dev 서버만 띄운 로컬 실행에는 v1 사본이 없다.
  test.skip(!process.env.CI || !existsSync('dist/v1/index.html'), 'v1 사본은 CI 모드(vite preview + dist/v1)에서만 서빙됨');
  await page.goto('/introduce/concept/k');
  await expect(page).toHaveURL(/\/introduce\/v1\/concept\/k$/);
  await expect(page.locator('#preview-card.card-frame')).toBeVisible();
});
