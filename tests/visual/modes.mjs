// Browser smoke harness: real main → mode → theme → edit → downloaded PNG.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = new URL('./output/modes/', import.meta.url);
const base = 'http://127.0.0.1:5201/introduce';
const server = spawn(new URL('../../node_modules/.bin/vite', import.meta.url).pathname,
  ['--host', '127.0.0.1', '--port', '5201', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', d => { serverLog += d; });
server.stderr.on('data', d => { serverLog += d; });
let browser;
const report = [];
const errors = [];
const themes = ['paper', 'album', 'terminal', 'hifuu'];
const scenarios = ['sparse', 'single', 'full', 'long'];

async function ready() {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try { if ((await fetch(`${base}/`)).ok) return; } catch { /* Wait for startup. */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Vite startup failed: ${serverLog}`);
}
async function fit(page) {
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
}
async function png(page, target, name, wide = true) {
  const natural = await page.locator(target).evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }));
  console.log(`[modes] capturing ${name}…`);
  let download;
  try {
    [download] = await Promise.all([page.waitForEvent('download', { timeout: 120_000 }), page.locator('.download-btn').click()]);
  } catch (error) {
    const state = await page.evaluate(() => ({ url: location.href, button: document.querySelector('.download-btn')?.textContent, busy: document.querySelector('.download-btn')?.disabled, detachedCaptures: document.querySelectorAll('body > div[style*="-99999px"]').length }));
    await writeFile(new URL(`${name}-failure.json`, out), JSON.stringify({ state, runtimeErrors: errors }, null, 2));
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-failure.png`, out)) });
    throw error;
  }
  assert.match(download.suggestedFilename(), /\.png$/i);
  const path = fileURLToPath(new URL(`${name}.png`, out));
  await download.saveAs(path);
  const data = await readFile(path);
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (wide) {
    assert.equal(width, (natural.width + 96) * 2, `${name}: Wide width formula`);
    assert.ok(Math.abs(height - (natural.height + 96) * 2) <= 4, `${name}: full Wide height`);
  } else {
    assert.equal(width, natural.width * 3, `${name}: Compact width formula`);
    assert.equal(height, natural.height * 3, `${name}: Compact height formula`);
  }
  const [, scenario, theme, layout] = name.match(/^wide-(sparse|single|full|long)-(paper|album|terminal|hifuu)-(grid|row)$/) ?? [];
  report.push({ name, scenario: scenario ?? null, theme: theme ?? null, layout: layout ?? null, screenshot: `${name}-preview.png`, filename: download.suggestedFilename(), width, height, bytes: data.length });
}

try {
  await mkdir(out, { recursive: true });
  await ready();
  browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1512, height: 1100 } });
  await context.addInitScript(() => { localStorage.setItem('introduce:lang', 'ko'); localStorage.setItem('introduce:theme', 'light'); });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => { errors.push(d.message()); void d.dismiss(); });
  await page.goto(`${base}/`);
  await page.screenshot({ path: fileURLToPath(new URL('main-desktop.png', out)) });
  await page.locator('main a[href$="/compact"]').first().click();
  await page.waitForURL('**/compact');
  assert.equal(await page.locator('main a[href*="/concept/"]').count(), 10);
  assert.equal(await page.locator('main a[href$="/v1/"]').isVisible(), true);
  await page.locator('main a[href*="/concept/"]').first().click();
  await page.locator('#card-export').waitFor();
  await png(page, '#card-export', 'compact-current-p', false);
  await page.locator('header a.brand').click();
  await page.locator('main a[href$="/wide"]').first().click();
  await page.waitForURL('**/wide');
  for (const theme of themes) {
    for (const layout of ['grid', 'row']) {
      for (const scenario of scenarios) {
        const characters = scenario === 'sparse' ? [] : scenario === 'single' ? ['reimu'] : ['reimu','marisa','sanae','aya','reisen','youmu','sakuya'];
        const works = scenario === 'sparse' ? [] : scenario === 'single' ? ['music-11cd7e63b384'] : ['th10','th12','book-b036981ba92d','music-352e4ada578a','music-11cd7e63b384'];
        const repeated = scenario === 'long' ? '長文 English 日本語 🙂 '.repeat(20) : '';
        await page.evaluate(({ characters, works, scenario, repeated }) => {
          const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
          draft.nickname = 'Wide PNG';
          draft.rankedCharacters = characters;
          draft.favoriteWorks = works;
          draft.selectedAcct = [];
          draft.custom = { ...draft.custom, 'wide:handle': '', 'wide:intro': '', 'wide:keywords': '', 'wide:callname': '', 'wide:age': '', 'wide:workNote': scenario === 'single' ? '대표곡·입덕 계기·좋아하는 부분' : repeated, 'wide:characterNote': '', 'wide:pairing': '', 'wide:dislike': '', 'wide:freeText': '', 'wide:activities': '', 'wide:otherGenre': '', 'wide:interaction': '', 'wide:boundaryMethod': '', 'wide:closing': '' };
          if (scenario === 'full' || scenario === 'long') { draft.custom['wide:pairing'] = repeated || '쇼 × 나즈린'; draft.custom['wide:freeText'] = repeated || '마지막 한마디'; }
          localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
        }, { characters, works, scenario, repeated });
        await page.goto(`${base}/wide/${theme}?layout=${layout}`);
        await page.locator('#wide-export').waitFor();
        const name = `wide-${scenario}-${theme}-${layout}`;
        const panelCount = await page.locator('#wide-export [data-wide-panel]').count();
        assert.equal(panelCount, scenario === 'sparse' ? 1 : scenario === 'single' ? 3 : 4, `${name}: empty panels must be omitted`);
        if (scenario === 'sparse') {
          assert.equal(await page.locator('#wide-export .wide-checklist').count(), 0);
          assert.equal(await page.locator('#wide-export .wide-account-strip').count(), 1);
        }
        await page.locator(`[data-wide-layout="${layout}"]`).click();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: fileURLToPath(new URL(`${name}-preview.png`, out)), fullPage: true });
        await png(page, '#wide-export', name);
      }
    }
  }
  assert.equal(report.filter(item => item.name.startsWith('wide-')).length, 32);
  await page.setViewportSize({ width: 390, height: 844 });
  await fit(page);
  assert.deepEqual(errors, []);
  await writeFile(new URL('report.json', out), JSON.stringify({ downloads: report, runtimeErrors: errors }, null, 2));
  console.log(`[modes] PASS: ${report.length} real PNG downloads; 32 Wide states and current Compact export verified.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
