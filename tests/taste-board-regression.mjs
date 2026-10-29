import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function pageFor(t, route = '/characters/tastes', viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ locale: 'ko-KR', viewport });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(`${base}${route}`);
  return page;
}

test('taste board offers editable grid presets and keeps empty positions', async t => {
  const page = await pageFor(t);
  await page.getByRole('heading', { level: 1, name: '캐릭터 취향 모음표' }).waitFor();
  assert.equal(await page.locator('.taste-board-cell').count(), 9);
  await page.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  await page.locator('.taste-board-cell').nth(1).click();
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  assert.equal(await page.locator('.taste-board-cell').nth(0).getAttribute('data-empty'), 'true');
  assert.equal(await page.locator('.taste-board-cell').nth(1).getAttribute('data-empty'), 'false');
  await page.reload();
  await page.locator('.taste-board-cell').first().waitFor();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  assert.equal(await page.locator('.taste-board-cell').nth(1).getAttribute('data-empty'), 'false');
  await page.getByLabel('행 수').selectOption('2');
  await page.getByLabel('열 수').selectOption('5');
  assert.equal(await page.locator('.taste-board-cell').count(), 10);
});

test('taste board supports groups and independent visual themes on a mobile viewport', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  await page.getByRole('button', { name: '그룹 추가' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 2);
  await page.locator('.taste-group-heading input').nth(1).fill('작품별 분류');
  assert.equal(await page.locator('.taste-group-heading input').nth(1).inputValue(), '작품별 분류');
  await page.getByRole('button', { name: '나이트 테마' }).click();
  assert.equal(await page.locator('.taste-board').getAttribute('data-theme'), 'night');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false);
});

test('shrinking a populated grid requires confirmation and can be cancelled without data loss', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').nth(8).click();
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 9);
  assert.equal(await page.locator('.taste-board-cell').nth(8).getAttribute('data-empty'), 'false');
});

test('grid editing and character dialog stay usable without horizontal overflow at mobile, tablet, and desktop widths', async t => {
  for (const width of [360, 390, 430, 768, 1440]) {
    const context = await browser.newContext({ locale: 'ko-KR', viewport: { width, height: 844 }, hasTouch: width <= 390, isMobile: width <= 390 });
    t.after(() => context.close());
    const page = await context.newPage();
    await page.goto(`${base}/characters/tastes`);
    await page.getByRole('button', { name: '5 × 5' }).click();
    assert.equal(await page.locator('.taste-board-cell').count(), 25);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px layout has no horizontal overflow`);
    await page.locator('.taste-board-cell').last().click();
    const dialog = await page.locator('[role="dialog"]').boundingBox();
    assert.ok(dialog && dialog.x >= 0 && dialog.x + dialog.width <= width && dialog.y >= 0 && dialog.y + dialog.height <= 844, `${width}px character picker fits the viewport`);
    await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
    assert.equal(await page.locator('.taste-board-cell').last().getAttribute('data-empty'), 'false');
  }
});
