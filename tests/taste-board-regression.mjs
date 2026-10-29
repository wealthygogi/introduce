import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
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
  await page.locator('.taste-custom-grid summary').click();
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
  await page.getByRole('button', { name: '나이트' }).click();
  assert.equal(await page.locator('.taste-board').getAttribute('data-theme'), 'night');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false);
});

test('custom grid controls expand above the board instead of covering cells on mobile', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  await page.locator('.taste-custom-grid summary').click();
  const lastControl = await page.locator('.taste-custom-grid-fields > label').last().boundingBox();
  const grid = await page.locator('.taste-board-grid').first().boundingBox();
  assert.ok(lastControl && grid && lastControl.y + lastControl.height <= grid.y, 'custom controls must take space before the character grid');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'custom controls must not cause horizontal page overflow');
});

test('clearing characters requires confirmation, preserves board settings and can be undone', async t => {
  const page = await pageFor(t);
  await page.getByLabel('모음표 제목').fill('내 모음표');
  await page.getByRole('button', { name: '나이트' }).click();
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  await page.getByRole('button', { name: '그룹 추가' }).click();
  await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '키리사메 마리사' }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 2);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 0);
  assert.equal(await page.getByLabel('모음표 제목').inputValue(), '내 모음표');
  assert.equal(await page.locator('.taste-board').getAttribute('data-theme'), 'night');
  assert.equal(await page.locator('.taste-board-group').count(), 2);
  await page.reload();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 0);
});

test('clearing characters is undoable', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 1);
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

test('a cell image is stored separately and restored after reload', async t => {
  const page = await pageFor(t);
  const image = new PNG({ width: 1, height: 1 });
  image.data = Buffer.from([120, 80, 200, 255]);
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '사진 업로드' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'custom.png',
    mimeType: 'image/png',
    buffer: PNG.sync.write(image),
  });
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.reload();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  const imageId = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    return saved.data.groups[0].cells[0].imageId;
  });
  assert.ok(imageId);
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '사진 제거' }).click();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
});

test('work group creation adds multiple selected characters together', async t => {
  const page = await pageFor(t);
  await page.getByRole('button', { name: '작품 그룹 만들기' }).click();
  await page.getByLabel('작품명 / 그룹 이름').fill('홍마향');
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
  await page.getByRole('button', { name: '키리사메 마리사' }).click();
  await page.getByRole('button', { name: '선택한 캐릭터 담기' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 2);
  assert.equal(await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell[data-empty="false"]').count(), 2);
  assert.equal(await page.locator('.taste-group-heading input').nth(1).inputValue(), '홍마향');
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
