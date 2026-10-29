import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';

let server;
let browser;
let base;
let output;

before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
  output = await mkdtemp(join(tmpdir(), 'coupling-export-'));
});

after(async () => {
  await browser?.close();
  await server?.close();
  if (output) await rm(output, { recursive: true, force: true });
});

const drafts = {
  'introduce:coupling:whiteboard:v1': { nodes: [{ id: 'reimu', x: 0, y: 0 }, { id: 'marisa', x: 220, y: 120 }], edges: [{ id: 'edge-1', from: 'reimu', to: 'marisa', type: 'love', preference: null, direction: 'forward' }], view: { x: 0, y: 0, zoom: 1 } },
  'introduce:coupling:keyboard:v1': { sourceId: 'reimu', edges: ['marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko', 'reisen', 'alice', 'aya', 'patchouli'].map(id => ({ a: 'reimu', b: id, relation: 'love', preference: null })) },
  'introduce:coupling:pairs:v1': { pairs: [{ id: 'pair-1', a: 'reimu', b: 'marisa', relation: 'love', preference: null, direction: 'forward', memo: 'export memo' }], draft: { a: null, b: null, relation: 'love', preference: null, direction: 'forward', memo: '' }, activeSlot: 'a', editingId: null },
  'introduce:coupling:matrix:v1': { roster: ['reimu', 'marisa'], mode: 'directed', directed: [{ from: 'reimu', to: 'marisa', relation: 'love', preference: null }], unordered: [] },
};

const editors = [
  { path: '/coupling/whiteboard', id: 'coupling-export-whiteboard', expected: /하쿠레이 레이무[\s\S]*키리사메 마리사/ },
  { path: '/coupling/keyboard', id: 'coupling-export-keyboard', expected: /하쿠레이 레이무[\s\S]*키리사메 마리사[\s\S]*파츄리/ },
  { path: '/coupling/pairs', id: 'coupling-export-pairs', expected: /export memo/ },
  { path: '/coupling/matrix', id: 'coupling-export-matrix', expected: /하쿠레이 레이무[\s\S]*키리사메 마리사/ },
];

for (const editor of editors) {
  test(`${editor.path} exports its complete relationship content`, async t => {
    const context = await browser.newContext({ acceptDownloads: true, locale: 'ko-KR', viewport: { width: 1280, height: 900 } });
    t.after(() => context.close());
    await context.addInitScript(data => { for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify({ version: 1, data: value })); }, drafts);
    const page = await context.newPage();
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    await page.goto(`${base}${editor.path}`);
    await page.locator(`#${editor.id}`).waitFor({ state: 'attached' });
    assert.match(await page.locator(`#${editor.id}`).innerText(), editor.expected);
    assert.equal(await page.getByRole('button', { name: '이미지로 저장' }).count(), 1);
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.getByRole('button', { name: '이미지로 저장' }).click()]);
    const path = join(output, `${editor.id}.png`);
    await download.saveAs(path);
    const data = await readFile(path);
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const png = PNG.sync.read(data);
    assert.equal(png.width, 1400);
    assert.ok(png.height > 200);

    await page.setViewportSize({ width: 390, height: 844 });
    const [mobileDownload] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.getByRole('button', { name: '이미지로 저장' }).click()]);
    const mobilePath = join(output, `${editor.id}-mobile.png`);
    await mobileDownload.saveAs(mobilePath);
    const mobilePng = PNG.sync.read(await readFile(mobilePath));
    assert.deepEqual([mobilePng.width, mobilePng.height], [png.width, png.height], 'editor exports retain identical geometry on mobile');
  });
}
