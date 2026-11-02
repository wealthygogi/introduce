import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';

let server;
let browser;
let webkitBrowser;
let base;

before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
  try { webkitBrowser = await webkit.launch(); }
  catch { webkitBrowser = null; }
});

after(async () => {
  await browser?.close();
  await webkitBrowser?.close();
  await server?.close();
});
async function downloadPng(page, path) {
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.locator('.download-btn').click()]);
  await download.saveAs(path);
  const data = await readFile(path);
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'download is a PNG file');
  return PNG.sync.read(data);
}

async function exportRect(locator) {
  return locator.evaluate(element => {
    const root = document.querySelector('#taste-board-export').getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return { x: rect.x - root.x, y: rect.y - root.y, width: rect.width, height: rect.height };
  });
}

function assertRenderedPixels(actual, hidden, rect, description) {
  assert.equal(actual.width, hidden.width);
  assert.equal(actual.height, hidden.height);
  let different = 0;
  for (let y = Math.max(0, Math.floor(rect.y)); y < Math.min(actual.height, Math.ceil(rect.y + rect.height)); y++) {
    for (let x = Math.max(0, Math.floor(rect.x)); x < Math.min(actual.width, Math.ceil(rect.x + rect.width)); x++) {
      const offset = (y * actual.width + x) * 4;
      if (actual.data[offset] !== hidden.data[offset] || actual.data[offset + 1] !== hidden.data[offset + 1] || actual.data[offset + 2] !== hidden.data[offset + 2]) different++;
    }
  }
  assert.ok(different > 5, `${description} changes downloaded PNG pixels (found ${different})`);
}


test('taste-board PNG downloads decode at fixed dimensions on desktop and mobile', async t => {
  const output = await mkdtemp(join(tmpdir(), 'taste-board-export-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const dimensions = [];
  const customImage = new PNG({ width: 8, height: 8 });
  for (let index = 0; index < customImage.data.length; index += 4) customImage.data.set([0, 255, 0, 255], index);
  const customImageBase64 = PNG.sync.write(customImage).toString('base64');
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ acceptDownloads: true, locale: 'ko-KR', viewport });
    t.after(() => context.close());
    await context.addInitScript(() => localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({
      version: 1,
      data: { title: 'PNG 검증 모음표', theme: 'album', showNames: true, groups: [
        { id: 'first', title: '첫 그룹', rows: 1, columns: 1, cells: [null] },
        { id: 'g', title: '마지막 그룹', rows: 3, columns: 3,
          cells: [{ characters: ['sakuya', 'marisa'], label: '사용자 사진', imageId: 'export-image' }, null, null, null, null, null, null, null, { characters: ['reimu', 'marisa'], label: '마지막 칸' }],
          slots: [{ label: '홍마향', topicId: 'th6' }, { label: '빈 작품 칸', topicId: 'th7' }, null, null, null, null, null, null, null],
          appearanceContext: { topicId: 'th7', role: null, stage: null }, showAppearances: false },
      ] },
    })));
    const page = await context.newPage();
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    await page.goto(`${base}/characters/tastes`);
    await page.evaluate(async imageBase64 => {
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('introduce-taste-board-images', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('images');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const bytes = Uint8Array.from(atob(imageBase64), char => char.charCodeAt(0));
      await new Promise((resolve, reject) => {
        const transaction = database.transaction('images', 'readwrite');
        transaction.objectStore('images').put(new Blob([bytes], { type: 'image/png' }), 'export-image');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    }, customImageBase64);
    await page.reload();
    await page.locator('#taste-board-export').waitFor({ state: 'attached' });
    await page.locator('#taste-board-export img[src^="blob:"]').first().waitFor();
    assert.match(await page.locator('#taste-board-export').innerText(), /마지막 그룹[\s\S]*마지막 칸/);
    if (viewport.width > 1000) {
      await page.locator('#taste-board-export').evaluate(element => { element.style.height = '20000px'; });
      const dialogPromise = page.waitForEvent('dialog');
      const clickPromise = page.locator('.download-btn').click();
      const dialog = await dialogPromise;
      assert.match(dialog.message(), /저장|실패/);
      await dialog.accept();
      await clickPromise;
      await page.locator('#taste-board-export').evaluate(element => { element.style.height = ''; });
    }
    const group = page.locator('#taste-board-export .taste-export-group').last();
    const emptyLabel = group.locator('.taste-export-cell').nth(1).locator('.taste-export-slot-label');
    const filledLabel = group.locator('.taste-export-cell').first().locator('.taste-export-slot-label');
    const portrait = group.locator('.taste-export-cell').last().locator('img').first();
    await portrait.evaluate(image => image.decode());
    assert.equal(await portrait.getAttribute('loading'), 'eager');
    const targets = [group.locator('h2'), filledLabel, emptyLabel, portrait];
    const descriptions = ['last group heading', 'filled slot label', 'empty slot label', 'last group character portrait'];
    const variantDimensions = [];
    for (const show of [false, true]) {
      if (show) await page.locator('.taste-board-group').last().getByLabel('출연 정보 표시').check();
      const summaries = group.locator('.taste-export-cell').first().locator('.taste-export-character').first().locator('.taste-export-summary');
      assert.equal(await summaries.count(), show ? 1 : 0, 'roles are only included when enabled');
      if (show) {
        assert.match(await summaries.innerText(), /5면 보스/);
        assert.match(await summaries.innerText(), /중보스/);
        assert.doesNotMatch(await summaries.innerText(), /플레이어/, 'slot topic overrides the group context');
      }
      const measured = show ? [...targets, summaries] : targets;
      const rects = await Promise.all(measured.map(exportRect));
      const png = await downloadPng(page, join(output, `${viewport.width}-${show}.png`));
      await page.getByText('다운로드를 시작했습니다. 브라우저의 다운로드 목록을 확인해 주세요.').waitFor({ timeout: 5000 });
      assert.equal(png.width, 1200, 'export width is independent of the viewport');
      assert.ok(png.height > 0);
      assert.ok(png.data.some((channel, index) => index % 4 !== 3 && channel !== 255), 'PNG contains rendered non-white board content');
      assert.ok(png.data.some((_, index) => index % 4 === 0 && png.data[index] < 80 && png.data[index + 1] > 200 && png.data[index + 2] < 80), 'PNG includes the custom green image pixels');
      variantDimensions.push([png.width, png.height]);

      // A second real download with only the measured elements hidden preserves layout.
      // Pixel differences in each element's rectangle prove the downloaded image contains it.
      for (const locator of measured) await locator.evaluate(element => { element.style.visibility = 'hidden'; });
      const hidden = await downloadPng(page, join(output, `${viewport.width}-${show}-hidden.png`));
      for (const locator of measured) await locator.evaluate(element => { element.style.visibility = ''; });
      measured.forEach((_, index) => assertRenderedPixels(png, hidden, rects[index], descriptions[index] ?? 'contextual role summary'));
    }
    dimensions.push(variantDimensions);
  }
  assert.deepEqual(dimensions[0], dimensions[1]);
});

test('WebKit mobile export produces a decodable fixed-width PNG', async t => {
  if (!webkitBrowser) { t.skip('Playwright WebKit browser binary is not installed in this environment'); return; }
  const context = await webkitBrowser.newContext({ acceptDownloads: true, locale: 'ko-KR', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/characters/tastes`);
  await page.getByRole('heading', { level: 1, name: '캐릭터 취향 모음표' }).waitFor();
  await page.getByRole('button', { name: '5 × 5' }).click();
  await page.locator('.taste-board-cell').last().click();
  await page.locator('.taste-character-select').getByText('하쿠레이 레이무', { exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.locator('.download-btn').click()]);
  const path = join(tmpdir(), `taste-board-webkit-${process.pid}.png`);
  try {
    await download.saveAs(path);
    const png = PNG.sync.read(await readFile(path));
    assert.equal(png.width, 1200);
    assert.ok(png.height > 900, 'the full fixed 5 by 5 export is represented');
  } finally {
    await rm(path, { force: true });
  }
});
