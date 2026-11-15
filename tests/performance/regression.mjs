import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { gzipSync } from 'node:zlib';

let outDir, server, browser, base, manifest;
before(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'introduce-perf-'));
  await build({ logLevel: 'error', build: { outDir, emptyOutDir: true, manifest: true } });
  manifest = JSON.parse(await readFile(join(outDir, '.vite/manifest.json'), 'utf8'));
  server = await preview({ build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } });
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  if (outDir) await rm(outDir, { recursive: true, force: true });
});
async function pageFor(t, path = '/') {
  const context = await browser.newContext({ locale: 'ko-KR' });
  t.after(() => context.close());
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await context.addInitScript(() => {
    window.storageWrites = [];
    window.storageReads = [];
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { window.storageReads.push(key); return get.call(this, key); };
    Storage.prototype.setItem = function(key, value) { window.storageWrites.push({ key, value }); return set.call(this, key, value); };
  });
  const page = await context.newPage();
  await page.goto(`${base}${path}`);
  return page;
}

test('home avoids editor, export and full calendar chunks; concept loads only its implementation', async t => {
  const page = await pageFor(t);
  await page.locator('.calendar-home-event').first().waitFor();
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  const forbidden = Object.entries(manifest).filter(([key]) => /src\/(concepts\/Concept[A-Z]\.tsx|pages\/(ConceptPage|WidePage)\.tsx|features\/coupling\/|data\/characterDays\.ts|lib\/captureCard\.ts)/.test(key));
  const files = [...new Set(resources.filter(url => /\.(js|css)$/.test(url) && url.startsWith(base)).map(url => url.slice(base.length + 1)))];
  const sizes = { js: { bytes: 0, gzip: 0 }, css: { bytes: 0, gzip: 0 } };
  for (const file of files) {
    const bytes = await readFile(join(outDir, file));
    const kind = file.endsWith('.js') ? 'js' : 'css';
    sizes[kind].bytes += bytes.length;
    sizes[kind].gzip += gzipSync(bytes).length;
  }
  t.diagnostic(`Home resources including teaser: ${JSON.stringify(sizes)}; ${files.join(', ')}`);
  assert.ok(!resources.some(url => /\/(captureCard|CouplingDraftProvider)-/.test(url)), 'home must avoid export and coupling runtime');
  for (const [key, entry] of forbidden) assert.ok(!resources.some(url => url.endsWith(entry.file)), `home loaded ${key}`);
  // A statically bundled implementation would otherwise be absent from the manifest.
  for (const name of ['ConceptP', 'ConceptQ']) assert.ok(manifest[`src/concepts/${name}.tsx`]?.isDynamicEntry, `${name} must be a dynamic entry`);
  await page.goto(`${base}/concept/p`);
  await page.locator('#card-export').waitFor();
  const conceptResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  assert.ok(conceptResources.some(url => url.endsWith(manifest['src/concepts/ConceptP.tsx'].file)));
  assert.ok(!conceptResources.some(url => url.endsWith(manifest['src/concepts/ConceptQ.tsx'].file)));
});

test('non-coupling routes do not read coupling drafts', async t => {
  const page = await pageFor(t);
  await page.locator('h1').waitFor();
  const reads = await page.evaluate(() => window.storageReads);
  assert.deepEqual(reads.filter(key => key.startsWith('introduce:coupling:')), []);
});

test('photo draft edits debounce writes and flush once on visibility/pagehide', async t => {
  const page = await pageFor(t, '/concept/p');
  await page.locator('#inp-nickname').waitFor();
  await page.locator('input[type=file]').setInputFiles({ name: 'photo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>') });
  await page.locator('.photo-thumb img').waitFor();
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.storageWrites = []; });
  await page.locator('#inp-nickname').pressSequentially('debounced', { delay: 10 });
  assert.equal(await page.evaluate(() => window.storageWrites.filter(x => x.key === 'introduce:form:v2').length), 0);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.storageWrites.filter(x => x.key === 'introduce:form:v2').length), 1);
  await page.locator('#inp-nickname').fill('hidden');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  const writes = await page.evaluate(() => window.storageWrites.filter(x => x.key === 'introduce:form:v2'));
  assert.equal(writes.length, 2);
  const draft = JSON.parse(writes.at(-1).value);
  assert.equal(draft.nickname, 'hidden');
  assert.ok(draft.profileImage.startsWith('data:image/'));
  await page.reload();
  assert.equal(await page.locator('#inp-nickname').inputValue(), 'hidden');
  await page.locator('#inp-nickname').fill('reloaded');
  await page.reload();
  assert.equal(await page.locator('#inp-nickname').inputValue(), 'reloaded');
});


test('coupling edits survive immediate exit, reentry and reload', async t => {
  const page = await pageFor(t, '/coupling/matrix');
  const cell = page.locator('.coupling-matrix-cell[data-from="reimu"][data-to="marisa"]');
  await cell.click();
  await page.locator('header a.brand').click();
  await page.locator('.landing-modes').waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1')));
  assert.ok(saved.data.directed.some(edge => edge.from === 'reimu' && edge.to === 'marisa'));
  await page.locator('header a[href="/introduce/characters"]').first().click();
  await page.locator('main a[href="/introduce/coupling"]').first().click();
  await page.locator('.coupling-hub-card a[href="/introduce/coupling/matrix"]').click();
  await cell.waitFor();
  await page.reload();
  await cell.waitFor();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1')));
  assert.deepEqual(restored.data.directed, saved.data.directed);
});

test('download target is unavailable while the selected concept is still loading', async t => {
  const page = await pageFor(t);
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  let intercepted;
  const requested = new Promise(resolve => { intercepted = resolve; });
  const file = manifest['src/concepts/ConceptP.tsx'].file;
  await page.route(`**/${file}`, async route => {
    intercepted();
    await ready;
    await route.continue();
  });
  const navigation = page.goto(`${base}/concept/p`);
  try {
    await requested;
    await page.getByRole('status').waitFor();
    // Keep the chunk blocked long enough for the page's own fallback to commit.
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#card-export').count(), 0);
  } finally { release(); await navigation; }
  await page.locator('#card-export').waitFor();
});

for (const event of ['navigation', 'pagehide']) {
  test(`pending whiteboard viewport survives immediate ${event}`, async t => {
    const page = await pageFor(t, '/coupling/whiteboard');
    await page.locator('.coupling-board-world').waitFor();
    // Let first-use fit settle, then wheel and leave in the same browser task.
    await page.waitForTimeout(400);
    const view = await page.evaluate(event => {
      const viewport = document.querySelector('.coupling-board-viewport');
      viewport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 150, clientX: 400, clientY: 400 }));
      const matrix = new DOMMatrixReadOnly(document.querySelector('.coupling-board-world').style.transform);
      if (event === 'navigation') document.querySelector('header a.brand').click();
      else window.dispatchEvent(new Event('pagehide'));
      return { x: matrix.e, y: matrix.f, zoom: matrix.a };
    }, event);
    if (event === 'navigation') await page.locator('.landing-modes').waitFor();
    const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:coupling:whiteboard:v1')));
    assert.ok(draft, 'viewport draft must be saved on exit');
    // CSS serializes transform values at lower precision than persisted numbers.
    for (const key of ['x', 'y', 'zoom']) assert.ok(Math.abs(draft.data.view[key] - view[key]) < 0.001, key);
  });
}
