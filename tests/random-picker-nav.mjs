import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

let server;
let browser;
let base;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { host: '127.0.0.1', port: 0, open: false },
    logLevel: 'error',
  });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(dimensions.document <= dimensions.viewport + 1, `${label} overflows horizontally: ${JSON.stringify(dimensions)}`);
}

test('random draw navigation, reveal flow, persistence, and mobile layout', async t => {
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 } });
  t.after(() => context.close());
  const page = await context.newPage();

  await page.goto(`${base}/characters`);
  const randomHubCard = page.locator('.random-teaser-card');
  await randomHubCard.waitFor();
  assert.ok((await randomHubCard.getAttribute('href')).endsWith('/characters/random'));
  await assertNoHorizontalOverflow(page, 'characters hub');
  const cardBounds = await randomHubCard.boundingBox();
  assert.ok(cardBounds && cardBounds.x >= 0 && cardBounds.x + cardBounds.width <= 391, 'random hub card fits the 390px viewport');

  await page.goto(`${base}/characters/random`);
  await page.locator('.random-page h1').waitFor();
  assert.ok((await page.locator('.random-page h1').innerText()).trim().length > 0, 'random page heading is rendered');
  assert.equal(await page.locator('.section-subnav a[href$="/characters/random"][aria-current="page"]').count(), 1, 'random link is current in the character subnav');
  assert.equal(await page.locator('a[aria-label][href$="/characters"]').count(), 1, 'random page has a back link to the character hub');
  await assertNoHorizontalOverflow(page, 'random page');

  // The app's explicit dark theme, not just the OS preference, must theme the picker.
  await page.locator('.theme-switcher button').nth(1).click();
  const themedColors = await page.locator('.random-page').evaluate(element => ({
    surface: getComputedStyle(element).getPropertyValue('--random-surface').trim(),
    ink: getComputedStyle(element).getPropertyValue('--random-ink').trim(),
    buttonText: getComputedStyle(element.querySelector('.random-primary-action')).color,
  }));
  assert.equal(themedColors.surface, '#16151f');
  assert.equal(themedColors.ink, '#ecebf5');
  assert.equal(themedColors.buttonText, 'rgb(26, 21, 48)');
  await page.locator('.theme-switcher button').first().click();

  // Undoing a history clear after a new draw must retain both the old and new draws.
  await page.locator('.random-draw-cta .random-primary-action').click();
  await page.waitForFunction(() => document.querySelectorAll('.random-history-item').length === 1);
  await page.locator('.random-history-header .random-text-button').click();
  await page.locator('.random-draw-cta .random-primary-action').click();
  await page.waitForFunction(() => document.querySelectorAll('.random-history-item').length === 1);
  await page.locator('.random-history-undo .random-text-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.random-history-item').length === 2);

  await page.locator('.random-settings-trigger').click();
  const filterSheet = page.locator('.random-filter-sheet');
  const counts = filterSheet.locator('.random-filter-group').first().getByRole('button');
  assert.equal(await counts.count(), 4, 'only 1, 3, 5, and 10 draw-count options are available');
  const tripleCount = counts.nth(1);
  await tripleCount.click();
  assert.equal(await tripleCount.getAttribute('aria-pressed'), 'true', 'three-card draw count is selected');
  await filterSheet.locator('.random-filter-sheet-header button').click();
  await page.locator('.random-draw-cta .random-primary-action').click();
  await page.locator('.random-reveal').waitFor();
  await page.locator('.random-reveal .random-secondary-action').click();
  const result = page.locator('.random-result');
  await result.waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.random-result-name').length === 3);
  const names = await result.locator('.random-result-name').allTextContents();
  assert.equal(names.length, 3);
  assert.ok(names.every(name => name.trim().length > 0), 'three character names are shown');
  assert.equal(await result.getByRole('button', { name: /커플 카드|pair card|カップルカード/ }).count(), 0, 'random result no longer offers a pairing shortcut');
  await page.waitForFunction(() => {
    const data = JSON.parse(localStorage.getItem('introduce:characters:random-picker:v1') ?? '{}');
    return data.data?.history?.some(record => record.count === 3);
  });
  await page.reload();
  await page.locator('.random-history-item').first().waitFor();
  const restoredHistory = await page.locator('.random-history-item').allTextContents();
  assert.ok(restoredHistory.some(text => names.some(name => text.includes(name))), 'history keeps the three revealed characters after reload');
});
