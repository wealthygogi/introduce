// @ts-check
/**
 * 비주얼 QA 하네스 — 각 컨셉을 실제 브라우저에서 렌더한 뒤,
 * (1) 화면 미리보기(#preview-card) 스크린샷과
 * (2) 다운로드 버튼이 실제로 뽑아내는 PNG(modern-screenshot 결과)
 * 를 나란히 tests/visual/output/ 에 저장한다.
 *
 * 목적: "화면에 보이는 것"과 "다운로드된 PNG"가 다른 결함(글씨 누락, 크롭,
 * 리사이징, blend/blur 손실 등)을 사람이 눈으로 대조·검증할 소재를 만든다.
 *
 * 사용법:
 *   node tests/visual/capture.mjs                 # 전체(a~o), ko, light
 *   node tests/visual/capture.mjs f g             # 특정 컨셉만
 *   node tests/visual/capture.mjs f --lang=ja --theme=dark
 *   node tests/visual/capture.mjs --scenario=empty  # 폼 비운 기본값 렌더
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const PORT = 5199;
const BASE = `http://localhost:${PORT}/introduce`;

const ALL_CONCEPTS = 'abcdefghijklmno'.split('');

// 텍스트가 가장 많은 "full" 케이스 — 텍스트 누락/오버플로 결함이 잘 드러남.
// (nickname 최대 10자, dislike/pairing 100자, freeText 300자 제한)
const SCENARIOS = {
  full: {
    nickname: '샤메이마루',
    dislike: '지각',
    pairing: '다 좋아요',
    freeText: '비계/부계 @sanaisanae\n환상향에서 뉴스를 씁니다',
  },
  empty: null, // 폼을 채우지 않고 기본값(fallback)으로 렌더
};

// ── CLI 파싱 ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const only = argv.filter((a) => /^[a-o]$/.test(a));
const getOpt = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const lang = getOpt('lang', 'ko');
const theme = getOpt('theme', 'light');
const scenarioName = getOpt('scenario', 'full');
const scenario = SCENARIOS[scenarioName];
const conceptList = only.length ? only : ALL_CONCEPTS;

const suffix = `${lang}-${theme}-${scenarioName}`;

// ── 유틸 ───────────────────────────────────────────────────
async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server not ready at ${url} within ${timeoutMs}ms`);
}

// ── 메인 ───────────────────────────────────────────────────
console.log(`[harness] concepts=${conceptList.join(',')} lang=${lang} theme=${theme} scenario=${scenarioName}`);

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const viteBin = join(REPO_ROOT, 'node_modules', '.bin', 'vite');
const server = spawn(viteBin, ['--port', String(PORT), '--strictPort'], {
  cwd: REPO_ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

/** @type {import('playwright').Browser | null} */
let browser = null;
const results = [];
try {
  console.log('[harness] starting dev server…');
  await waitForServer(`${BASE}/`);
  console.log('[harness] dev server up');

  browser = await chromium.launch();
  const context = await browser.newContext({
    acceptDownloads: true,
    deviceScaleFactor: 2,
    viewport: { width: 1400, height: 1000 },
  });
  await context.addInitScript(
    ([l, t]) => {
      localStorage.setItem('introduce:lang', l);
      localStorage.setItem('introduce:theme', t);
    },
    [lang, theme],
  );

  for (const id of conceptList) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    // 다운로드 실패 시 뜨는 alert 이 하네스를 멈추지 않도록 자동 수락
    page.on('dialog', (d) => {
      errors.push(`dialog: ${d.message()}`);
      d.accept().catch(() => {});
    });

    try {
      await page.goto(`${BASE}/concept/${id}`, { waitUntil: 'networkidle' });

      if (scenario) {
        await page.fill('#inp-nickname', scenario.nickname);
        await page.fill('#inp-dislike', scenario.dislike);
        await page.fill('#inp-pairing', scenario.pairing);
        await page.fill('#inp-free', scenario.freeText);
      }

      // 웹폰트 로딩 완료까지 대기 (DownloadButton 과 동일 조건 + 여유)
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      const card = page.locator('#preview-card');
      await card.screenshot({ path: join(OUTPUT_DIR, `${id}-${suffix}-preview.png`) });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 20_000 }),
        page.click('.download-btn'),
      ]);
      await download.saveAs(join(OUTPUT_DIR, `${id}-${suffix}-download.png`));

      const ok = errors.length === 0;
      results.push({ id, ok, errors });
      console.log(`[harness] ${id}: ${ok ? 'OK' : 'ISSUES → ' + errors.join(' | ')}`);
    } catch (e) {
      results.push({ id, ok: false, errors: [String(e)] });
      console.log(`[harness] ${id}: FAILED → ${e}`);
    } finally {
      await page.close();
    }
  }
} catch (e) {
  console.error('[harness] fatal:', e);
  console.error('[harness] --- dev server log ---\n' + serverLog.slice(-2000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}

// ── 요약 ───────────────────────────────────────────────────
const bad = results.filter((r) => !r.ok);
console.log(`\n[harness] done. ${results.length} concepts, ${bad.length} with runtime issues.`);
console.log(`[harness] output → ${OUTPUT_DIR}`);
if (bad.length) console.log('[harness] runtime issues in: ' + bad.map((r) => r.id).join(', '));
