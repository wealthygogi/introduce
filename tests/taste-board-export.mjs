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
async function downloadPng(page, path, expectSecondTap = false) {
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  const button = page.locator('.download-btn');
  await button.click();
  await page.waitForFunction(() => {
    const button = document.querySelector('.download-btn');
    const status = document.querySelector('.taste-download-status')?.textContent ?? '';
    return button?.dataset.downloadReady === 'true' || ['다운로드를 시작했습니다.', 'ダウンロードを開始しました。', 'Download started.'].some(message => status.includes(message));
  }, null, { timeout: 120_000 });
  const ready = await button.getAttribute('data-download-ready') === 'true';
  if (expectSecondTap) assert.equal(ready, true, 'mobile fallback asks for a fresh user tap after image capture');
  if (ready) {
    assert.match(await page.locator('.taste-download-status').innerText(), /준비됐습니다|準備できました|Image ready/);
    await Promise.all([downloadPromise, button.click()]);
  }
  const download = await downloadPromise;
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
    const context = await browser.newContext({
      acceptDownloads: true,
      locale: 'ko-KR',
      viewport,
      ...(viewport.width === 390 ? {
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      } : {}),
    });
    t.after(() => context.close());
    if (viewport.width === 390) {
      await context.addInitScript(() => Object.defineProperty(navigator, 'userActivation', {
        configurable: true,
        value: { isActive: false },
      }));
    }
    await context.addInitScript(() => localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({
      version: 1,
      data: { title: 'PNG 검증 모음표', theme: 'album', showNames: true, groups: [
        { id: 'first', title: '첫 그룹', rows: 1, columns: 1, cells: [null] },
        { id: 'g', title: '마지막 그룹', rows: 3, columns: 3,
          cells: [{ characters: ['sakuya', 'marisa'], label: '사용자 사진', imageId: 'export-image', versionWorkIds: { sakuya: 'th18' } }, null, null, null, null, null, null, null, { characters: ['reimu', 'marisa'], label: '마지막 칸' }],
          slots: [{ label: '홍마향', topicId: 'th6' }, { label: '빈 작품 칸', topicId: 'th7' }, null, null, null, null, null, null, null],
          appearanceContext: { topicId: 'th7', role: null, stage: null }, showAppearances: true },
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
    const version = group.locator('.taste-export-cell').first().locator('.taste-export-version');
    assert.equal(await version.innerText(), '동방홍룡동 버전');
    const targets = [group.locator('h2'), filledLabel, emptyLabel, portrait, version];
    const descriptions = ['last group heading', 'filled slot label', 'empty slot label', 'last group character portrait', 'selected work version'];
    const rects = await Promise.all(targets.map(exportRect));
    const png = await downloadPng(page, join(output, `${viewport.width}.png`), viewport.width === 390);
    await page.getByText('다운로드를 시작했습니다. 브라우저의 다운로드 목록을 확인해 주세요.').waitFor({ timeout: 5000 });
    assert.equal(png.width, 1200, 'export width is independent of the viewport');
    assert.ok(png.height > 0);
    assert.ok(png.data.some((channel, index) => index % 4 !== 3 && channel !== 255), 'PNG contains rendered non-white board content');
    assert.ok(png.data.some((_, index) => index % 4 === 0 && png.data[index] < 80 && png.data[index + 1] > 200 && png.data[index + 2] < 80), 'PNG includes the custom green image pixels');
    assert.doesNotMatch(await group.innerText(), /5면 보스|중보스|출연 정보/);
    for (const locator of targets) await locator.evaluate(element => { element.style.visibility = 'hidden'; });
    const hidden = await downloadPng(page, join(output, `${viewport.width}-hidden.png`), viewport.width === 390);
    for (const locator of targets) await locator.evaluate(element => { element.style.visibility = ''; });
    targets.forEach((_, index) => assertRenderedPixels(png, hidden, rects[index], descriptions[index]));
    dimensions.push([png.width, png.height]);
  }
  assert.deepEqual(dimensions[0], dimensions[1]);
});

test('Japanese names and work versions stay separated in the downloaded board', async t => {
  const output = await mkdtemp(join(tmpdir(), 'taste-board-japanese-export-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const context = await browser.newContext({ acceptDownloads: true, locale: 'ja-JP', viewport: { width: 1280, height: 900 } });
  t.after(() => context.close());
  await context.addInitScript(() => localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({
    version: 1,
    data: {
      title: '내 캐릭터 취향',
      theme: 'album',
      showNames: true,
      groups: [{
        id: 'japanese-versions',
        title: '내 그룹 2',
        rows: 1,
        columns: 3,
        cells: ['sanae', 'hina', 'tenshi'].map(id => ({ characters: [id], label: '', versionWorkIds: { [id]: 'th10' } })),
      }],
    },
  })));
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/characters/tastes?lang=ja`);
  const cells = page.locator('#taste-board-export .taste-export-cell');
  await cells.first().waitFor();
  const layout = await cells.evaluateAll(elements => elements.map(cell => {
    const nameElement = cell.querySelector('.taste-export-character-name');
    const name = nameElement.getBoundingClientRect();
    const version = cell.querySelector('.taste-export-version').getBoundingClientRect();
    const bounds = cell.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(nameElement).lineHeight);
    return { nameLines: Math.round(name.height / lineHeight), gap: version.top - name.bottom, versionBottom: version.bottom, cellBottom: bounds.bottom, name: nameElement.textContent };
  }));
  assert.equal(layout.length, 3);
  for (const item of layout) assert.equal(item.nameLines, 1, `${item.name} stays on one line`);
  for (const item of layout) {
    assert.ok(item.gap >= 4, `${item.name} and its version label do not overlap`);
    assert.ok(item.versionBottom <= item.cellBottom - 8, `${item.name} version label stays inside its card`);
  }
  assert.equal(await cells.first().locator('.taste-export-version').innerText(), '東方風神録 バージョン');
  const png = await downloadPng(page, join(output, 'japanese-versions.png'));
  assert.equal(png.width, 1200);
  assert.ok(png.height > 0);
});

test('Korean work labels stay above portraits in a dense four-column PNG', async t => {
  const output = await mkdtemp(join(tmpdir(), 'taste-board-korean-labels-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const context = await browser.newContext({ acceptDownloads: true, locale: 'ko-KR', viewport: { width: 1280, height: 900 } });
  t.after(() => context.close());
  await context.addInitScript(() => {
    const labels = [
      '동방홍마향', '동방요요몽', '동방영야초', '동방화영총',
      '동방풍신록', '동방지령전', '동방성련선', '동방신령묘',
      '동방휘침성', '동방감주전', '동방천공장', '동방귀형수',
      '동방홍룡동', '동방수왕원', '동방비상천', '동방비상천칙',
      '동방문화첩', '동방구문사기', '구작', '서적 원작',
    ];
    const ids = ['reisen', 'hina', 'tenshi', 'doremy'];
    const cells = labels.map((_, index) => {
      const id = ids[index % ids.length];
      return { characters: [id], label: '', versionWorkIds: { [id]: 'th18' } };
    });
    localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({
      version: 1,
      data: {
        title: '내 캐릭터 취향',
        theme: 'album',
        showNames: true,
        groups: [{
          id: 'dense-korean-labels',
          title: '작품별 최애',
          rows: 5,
          columns: 4,
          cells,
          slots: labels.map(label => ({ label, topicId: 'th6' })),
        }],
      },
    }));
  });
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/characters/tastes?lang=ko`);
  const cells = page.locator('#taste-board-export .taste-export-cell');
  await cells.first().waitFor();
  await page.locator('#taste-board-export img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  const layout = await cells.evaluateAll(elements => elements.map(cell => {
    const slot = cell.querySelector('.taste-export-slot-label');
    const characterName = cell.querySelector('.taste-export-character-name');
    const version = cell.querySelector('.taste-export-version');
    const avatar = cell.querySelector('.taste-character-avatar');
    const slotRange = document.createRange();
    slotRange.selectNodeContents(slot);
    const slotText = slotRange.getBoundingClientRect();
    const slotBounds = slot.getBoundingClientRect();
    const avatarBounds = avatar.getBoundingClientRect();
    const nameBounds = characterName.getBoundingClientRect();
    const versionBounds = version.getBoundingClientRect();
    const cellBounds = cell.getBoundingClientRect();
    return {
      label: slot.textContent,
      labelLines: new Set(Array.from(slotRange.getClientRects(), rect => Math.round(rect.top))).size,
      labelTextBottom: slotText.bottom,
      labelBottom: slotBounds.bottom,
      avatarTop: avatarBounds.top,
      nameBottom: nameBounds.bottom,
      versionTop: versionBounds.top,
      versionBottom: versionBounds.bottom,
      cellBottom: cellBounds.bottom,
    };
  }));
  assert.equal(layout.length, 20);
  for (const item of layout) {
    assert.equal(item.labelLines, 1, `${item.label} fits on one line`);
    assert.ok(item.labelTextBottom <= item.labelBottom + 1, `${item.label} text stays inside its label box`);
    assert.ok(item.labelBottom + 6 <= item.avatarTop, `${item.label} does not collide with its portrait`);
    assert.ok(item.nameBottom + 4 <= item.versionTop, `${item.label} name and version remain separate`);
    assert.ok(item.versionBottom <= item.cellBottom - 8, `${item.label} version remains inside its card`);
  }
  const png = await downloadPng(page, join(output, 'dense-korean-labels.png'));
  assert.equal(png.width, 1200);
  assert.ok(png.height > 0);
});


test('WebKit mobile export produces a decodable fixed-width PNG', async t => {
  if (!webkitBrowser) { t.skip('Playwright WebKit browser binary is not installed in this environment'); return; }
  const context = await webkitBrowser.newContext({ acceptDownloads: true, locale: 'ko-KR', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/characters/tastes`);
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.getByRole('button', { name: '자유 그룹' }).click();
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: '캐릭터 취향 모음표' }).waitFor();
  await page.getByRole('button', { name: '5 × 5' }).click();
  await page.locator('.taste-board-cell').last().click();
  await page.locator('.taste-character-select').getByText('하쿠레이 레이무', { exact: true }).click();
  const path = join(tmpdir(), `taste-board-webkit-${process.pid}.png`);
  try {
    const png = await downloadPng(page, path);
    assert.equal(png.width, 1200);
    assert.ok(png.height > 900, 'the full fixed 5 by 5 export is represented');
  } finally {
    await rm(path, { force: true });
  }
});
