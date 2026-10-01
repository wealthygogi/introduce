import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { Lang, PlainState } from './fixtures';

/**
 * 카드 요소 스크린샷. 카드 위 레이아웃(내비 등)의 소수점 높이 때문에 카드가 서브픽셀 위치에
 * 놓이면 글자 래스터가 달라져 PNG 와 비교가 흔들린다. 카드 내용은 건드리지 않고
 * .card-scaler 를 relative 오프셋으로 정수 좌표에 맞춘 뒤 찍는다.
 */
export async function cardScreenshot(card: Locator): Promise<PNG> {
  await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const scaler = el.parentElement!;
    scaler.style.position = 'relative';
    scaler.style.left = `${(1 - (r.x % 1)) % 1}px`;
    scaler.style.top = `${(1 - (r.y % 1)) % 1}px`;
  });
  return PNG.sync.read(await card.screenshot({ animations: 'disabled' }));
}

/**
 * lang/theme/폼 상태를 localStorage 에 심고 컨셉 페이지를 연다.
 * 반환 배열에는 콘솔 error · pageerror 가 쌓인다(테스트 끝에 toEqual([])).
 */
export async function gotoConcept(
  page: Page,
  id: string,
  { lang = 'ko', theme = 'light', state }: { lang?: Lang; theme?: string; state?: PlainState } = {},
): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.addInitScript(
    ([l, t, s]) => {
      localStorage.setItem('introduce:lang', l);
      localStorage.setItem('introduce:theme', t);
      if (s) localStorage.setItem('introduce:form', s);
    },
    [lang, theme, state ? JSON.stringify(state) : null] as const,
  );
  await page.goto(`/introduce/concept/${id}`, { waitUntil: 'networkidle' });
  await waitReady(page);
  return errors;
}

/** 카드 · 웹폰트 · 이미지 로드 완료까지 대기 */
export async function waitReady(page: Page): Promise<void> {
  await page.locator('#preview-card').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      [...document.querySelectorAll<HTMLImageElement>('#preview-card img')].map((i) => {
        if (i.complete) return null;
        const { promise, resolve } = Promise.withResolvers<unknown>();
        i.onload = i.onerror = resolve;
        return promise;
      }),
    ),
  );
  // 폰트 로드 후 칩 개수 재측정(useFitCount)이 끝날 때까지 두 프레임 양보
  await page.evaluate(() => {
    const { promise, resolve } = Promise.withResolvers<void>();
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    return promise;
  });
}

export async function expectFrame(card: Locator, w = 360, h = 540): Promise<void> {
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.width - w)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box!.height - h)).toBeLessThanOrEqual(0.5);
}

/**
 * 오버플로 위반 목록이 비어 있어야 한다.
 * (1) [data-clamp] 가로 넘침 없음  (2) allowTruncate=false 면 세로 잘림 없음
 * (3) [data-clamp] 가 자기 존(.pc-z) 밖으로 잘려 나가지 않음
 * (4) data-deco(와 자손)를 뺀 모든 요소가 프레임 안(±1px)
 */
export async function expectNoOverflow(card: Locator, { allowTruncate }: { allowTruncate: boolean }): Promise<void> {
  const violations = await card.evaluate((frame, allowTruncate) => {
    const out: string[] = [];
    const tol = 1;
    const desc = (el: Element) =>
      `<${el.tagName.toLowerCase()} class="${el.getAttribute('class') ?? ''}">${(el.textContent ?? '').slice(0, 24)}`;
    const outside = (r: DOMRect, c: DOMRect) =>
      r.left < c.left - tol || r.top < c.top - tol || r.right > c.right + tol || r.bottom > c.bottom + tol;
    const fr = frame.getBoundingClientRect();

    for (const el of frame.querySelectorAll<HTMLElement>('[data-clamp]')) {
      if (el.closest('[data-deco]')) continue;
      if (el.scrollWidth > el.clientWidth + tol) out.push(`h-overflow ${el.scrollWidth}>${el.clientWidth} ${desc(el)}`);
      if (!allowTruncate && el.scrollHeight > el.clientHeight + tol)
        out.push(`truncated ${el.scrollHeight}>${el.clientHeight} ${desc(el)}`);
      const zone = el.closest('.pc-z');
      if (zone && outside(el.getBoundingClientRect(), zone.getBoundingClientRect())) out.push(`zone-clip ${desc(el)}`);
    }
    for (const el of frame.querySelectorAll<HTMLElement>('*')) {
      if (el.closest('[data-deco]')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (outside(r, fr)) out.push(`out-of-frame ${desc(el)}`);
    }
    return out;
  }, allowTruncate);
  expect(violations).toEqual([]);
}

export async function downloadPng(page: Page): Promise<{ width: number; height: number; png: PNG }> {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.download-btn')]);
  const png = PNG.sync.read(await readFile((await dl.path())!));
  return { width: png.width, height: png.height, png };
}

/** 두 PNG 의 픽셀 차이 비율(0~1). 크기가 다르면 1. outPath 가 있으면 diff 이미지를 저장한다. */
export async function diffRatio(a: PNG, b: PNG, outPath?: string): Promise<number> {
  if (a.width !== b.width || a.height !== b.height) return 1;
  const { width: w, height: h } = a;
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.3 });
  if (outPath) {
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, PNG.sync.write(diff));
  }
  return n / (w * h);
}
