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
      data: { title: 'PNG 검증 모음표', theme: 'album', showNames: true, groups: [{ id: 'g', title: '마지막 그룹', rows: 3, columns: 3, cells: [{ characters: ['reimu', 'marisa'], label: '사용자 사진', imageId: 'export-image' }, null, null, null, null, null, null, null, { characters: ['reimu', 'marisa'], label: '마지막 칸' }] }] },
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
    let download;
    [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.locator('.download-btn').click()]);
    const path = join(output, `${viewport.width}.png`);
    await download.saveAs(path);
    const data = await readFile(path);
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'download is a PNG file');
    const png = PNG.sync.read(data);
    assert.equal(png.width, 1200, 'export width is independent of the viewport');
    assert.ok(png.height > 0);
    assert.ok(png.data.some((channel, index) => index % 4 !== 3 && channel !== 255), 'PNG contains rendered non-white board content');
    assert.ok(png.data.some((_, index) => index % 4 === 0 && png.data[index] < 80 && png.data[index + 1] > 200 && png.data[index + 2] < 80), 'PNG includes the custom green image pixels');
    dimensions.push([png.width, png.height]);
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
  await page.getByRole('button', { name: '하쿠레이 레이무' }).click();
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
