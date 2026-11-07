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

async function createPickerPage(viewport, { mobileActivationFallback = false } = {}) {
  const context = await browser.newContext({
    acceptDownloads: true,
    locale: 'ko-KR',
    viewport,
    reducedMotion: 'reduce',
    ...(viewport.width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}),
  });
  await context.addInitScript(() => {
    const clipboard = { writeText: async value => { window.__randomClipboardText = value; } };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  });
  if (mobileActivationFallback) {
    await context.addInitScript(() => Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: { isActive: false },
    }));
  }
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto(`${base}/characters/random`);
  return { context, page };
}

async function draw(page, count = 1) {
  if (count > 1) {
    const countIndex = [1, 3, 5, 10].indexOf(count);
    assert.notEqual(countIndex, -1, `supported draw count ${count}`);
    await page.locator('.random-filter-panel fieldset.random-filter-group .random-segment button').nth(countIndex).click();
  }
  await page.locator('.random-draw-cta .random-primary-action').click();
  await page.locator('.random-result').waitFor({ state: 'visible' });
  await page.locator('#random-picker-export').waitFor({ state: 'attached' });
}

async function savePng(page, outputPath, { expectReadyState = false } = {}) {
  const button = page.locator('.random-result-actions button[data-save-state]');
  const states = [];
  const recordState = async () => states.push(await button.getAttribute('data-save-state'));
  await recordState();
  await button.evaluate(element => {
    window.__randomSaveStates = [];
    new MutationObserver(() => window.__randomSaveStates.push(element.dataset.saveState))
      .observe(element, { attributes: true, attributeFilter: ['data-save-state'] });
  });
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await button.click();
  const firstTapResult = await Promise.race([
    downloadPromise.then(value => ({ value }), error => ({ error })),
    new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 3_000)),
  ]);
  let download = firstTapResult.value;
  if (!download) {
    await page.waitForFunction(() => {
      const state = document.querySelector('.random-result-actions button[data-save-state]')?.dataset.saveState;
      return state === 'ready' || state === 'failed' || state === 'idle';
    }, null, { timeout: 120_000 });
    await recordState();
    const prepared = await button.getAttribute('data-save-state') === 'ready';
    if (expectReadyState) assert.equal(prepared, true, 'mobile capture requires a fresh tap to download');
    if (prepared) {
      const secondDownload = page.waitForEvent('download', { timeout: 120_000 });
      await button.click();
      download = await secondDownload;
    } else {
      assert.equal(await button.getAttribute('data-save-state'), 'idle', 'capture either downloads immediately or prepares the image');
      download = await downloadPromise;
    }
  }
  await recordState();
  const observedStates = await page.evaluate(() => window.__randomSaveStates);
  states.push(...observedStates);
  assert.ok(states.includes('preparing'), `save state includes preparing: ${states.join(' -> ')}`);
  assert.ok(states.includes('ready') || states.at(-1) === 'idle', `save state reaches ready or completes: ${states.join(' -> ')}`);
  await download.saveAs(outputPath);
  const bytes = await readFile(outputPath);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'download has a PNG signature');
  const png = PNG.sync.read(bytes);
  const sampledColors = new Set();
  const stride = Math.max(1, Math.floor(Math.min(png.width, png.height) / 120));
  for (let y = 0; y < png.height; y += stride) {
    for (let x = 0; x < png.width; x += stride) {
      const offset = (png.width * y + x) * 4;
      sampledColors.add(`${png.data[offset]},${png.data[offset + 1]},${png.data[offset + 2]}`);
    }
  }
  assert.ok(sampledColors.size > 80, `decoded PNG contains rendered card detail, not a blank canvas (${sampledColors.size} sampled colors)`);
  return png;
}

test('random picker exports single and multi-character cards with their required dimensions', async t => {
  const output = await mkdtemp(join(tmpdir(), 'random-picker-export-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const { context, page } = await createPickerPage({ width: 1280, height: 1000 });
  t.after(() => context.close());

  await draw(page, 1);
  const single = await savePng(page, join(output, 'single.png'));
  console.log(`random-picker single PNG: ${single.width}×${single.height}`);
  assert.ok(Math.abs(single.width - 900) <= 2, `single PNG width is ${single.width}`);
  assert.ok(Math.abs(single.height - 1200) <= 2, `single PNG height is ${single.height}`);

  await draw(page, 3);
  const multi = await savePng(page, join(output, 'multi.png'));
  console.log(`random-picker multi PNG: ${multi.width}×${multi.height}`);
  assert.ok(Math.abs(multi.width - 1200) <= 2, `multi-character PNG width is ${multi.width}`);
  assert.ok(multi.height >= 700 && multi.height <= 1200, `multi-character PNG has a useful auto-height (was ${multi.height})`);
});

test('mobile single-card export works without horizontal page overflow', async t => {
  const output = await mkdtemp(join(tmpdir(), 'random-picker-mobile-export-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const { context, page } = await createPickerPage({ width: 390, height: 844 }, { mobileActivationFallback: true });
  t.after(() => context.close());

  await draw(page, 1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `mobile page has no horizontal overflow (difference ${overflow}px)`);
  const png = await savePng(page, join(output, 'mobile-single.png'), { expectReadyState: true });
  console.log(`random-picker mobile PNG: ${png.width}×${png.height}`);
  assert.ok(Math.abs(png.width - 900) <= 2, `mobile PNG width is ${png.width}`);
  assert.ok(Math.abs(png.height - 1200) <= 2, `mobile PNG height is ${png.height}`);
});

test('copy action writes result text and exposes a localized status', async t => {
  const { context, page } = await createPickerPage({ width: 1280, height: 1000 });
  t.after(() => context.close());
  await draw(page, 1);
  await page.locator('.random-result-actions .random-secondary-action').first().click();
  await page.locator('.random-result [role="status"]').filter({ hasText: /./ }).waitFor();
  const copiedText = await page.evaluate(() => window.__randomClipboardText);
  assert.equal(typeof copiedText, 'string');
  assert.ok(copiedText.length > 0, 'clipboard receives the drawn result text');
});
