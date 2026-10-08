import { domToBlob } from 'modern-screenshot';

// ── 다운로드 캡처용 웹폰트 임베드 ───────────────────────────────
// 캡처는 DOM 을 SVG <foreignObject> 로 직렬화한 뒤 <img> 로 로드해 canvas 에 그린다.
// 이 img 는 격리 컨텍스트라 페이지 웹폰트에 접근하지 못하고, 폰트는 @font-face 로
// 이미지 안에 임베드돼야 한다(크로스오리진 <link> 라 라이브러리 기본 임베드는 실패한다).
// Google Fonts CSS 는 6개 패밀리 × unicode-range 서브셋 = woff2 624개(약 24MB)라 전부 넣으면
// SVG 가 30MB 를 넘고, Safari 는 디코드가 끝나기 전에 그려 빈 이미지나 fallback 폰트가 나온다
// (fallback 은 글리프 폭이 달라 칩이 '#…' 으로 잘린다). 그래서 카드가 실제로 쓰는
// 패밀리 · 글자에 걸리는 서브셋만 골라 base64 로 넣는다.

interface EmbedFace {
  css: string;
  family: string;
  url: string;
  /** [from, to] 코드포인트 구간. 비어 있으면 모든 글자 */
  ranges: [number, number][];
}

let facesCache: Promise<EmbedFace[]> | null = null;
/** woff2 URL → data URL. 실패는 캐시하지 않는다(다음 다운로드에서 다시 받는다). */
const fontDataCache = new Map<string, Promise<string>>();

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function parseRanges(value: string | undefined): [number, number][] {
  if (!value) return [];
  return value.split(',').map((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-');
    if (a.includes('?')) return [parseInt(a.replace(/\?/g, '0'), 16), parseInt(a.replace(/\?/g, 'F'), 16)];
    const from = parseInt(a, 16);
    return [from, b ? parseInt(b, 16) : from];
  });
}

async function loadFaces(): Promise<EmbedFace[]> {
  const link = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
  if (!link) return [];
  const res = await fetch(link.href);
  if (!res.ok) throw new Error(`font css ${res.status}`);
  const css = await res.text();
  return Array.from(css.matchAll(/@font-face\s*{[^}]*}/g), ([block]) => ({
    css: block,
    family: /font-family:\s*['"]?([^'";]+)/.exec(block)?.[1].trim() ?? '',
    url: /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(block)?.[1] ?? '',
    ranges: parseRanges(/unicode-range:\s*([^;]+)/.exec(block)?.[1]),
  })).filter((f) => f.family && f.url);
}

function fontData(url: string): Promise<string> {
  let p = fontDataCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`font ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => `data:font/woff2;base64,${bufToBase64(buf)}`);
    p.catch(() => fontDataCache.delete(url));
    fontDataCache.set(url, p);
  }
  return p;
}

/** 카드가 쓰는 font-family 이름들과 글자(코드포인트) — 의사 요소 content 포함 */
function collectUsage(root: HTMLElement): { families: Set<string>; codepoints: Set<number> } {
  const families = new Set<string>();
  const codepoints = new Set<number>();
  const addText = (s: string) => {
    for (const ch of s) codepoints.add(ch.codePointAt(0)!);
  };
  addText(root.textContent ?? '');
  for (const el of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
    for (const pseudo of [null, '::before', '::after'] as const) {
      const cs = getComputedStyle(el, pseudo);
      if (pseudo) {
        const content = cs.content;
        if (!content || content === 'none' || content === 'normal') continue;
        addText(content);
      }
      for (const name of cs.fontFamily.split(',')) families.add(name.trim().replace(/^['"]|['"]$/g, ''));
    }
  }
  return { families, codepoints };
}

/** root 가 실제로 쓰는 서브셋만 담은 자족적 @font-face CSS */
async function buildFontEmbedCss(root: HTMLElement): Promise<string> {
  if (!facesCache) {
    facesCache = loadFaces();
    facesCache.catch(() => (facesCache = null));
  }
  const faces = await facesCache;
  const { families, codepoints } = collectUsage(root);
  const cps = [...codepoints];
  const needed = faces.filter(
    (f) => families.has(f.family) && (f.ranges.length === 0 || cps.some((c) => f.ranges.some(([a, b]) => c >= a && c <= b))),
  );
  const blocks = await Promise.all(
    needed.map(async (f) => {
      // 한 번 실패하면 한 번 더 받는다. 그래도 실패한 서브셋만 빼고 진행(그 글자는 fallback).
      const data = await fontData(f.url).catch(() => fontData(f.url)).catch(() => '');
      return data ? f.css.split(f.url).join(data) : '';
    }),
  );
  return blocks.join('\n');
}

/** 포토카드 360×540 CSS px → PNG 1080×1620 */
const CAPTURE_SCALE = 3;

/**
 * 화면에 보이는 카드(targetId)를 PNG blob 으로 캡처한다(여백 없음 → PNG 가 카드와 정확히 일치).
 * 원본은 건드리지 않게 화면 밖에서 clone 을 찍는다. 모바일 transform:scale 의 영향을 받지
 * 않도록 clone 폭을 레이아웃 폭(offsetWidth)으로 고정하고 애니메이션을 끈다.
 */
export async function captureCardBlob(targetId: string): Promise<Blob> {
  const el = document.getElementById(targetId);
  if (!el) throw new Error(`captureCardBlob: #${targetId} not found`);

  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).catch(() => undefined);
  const fontCssText = await buildFontEmbedCss(el).catch(() => '');

  const bg = getComputedStyle(document.body).backgroundColor || '#ffffff';
  const wrap = document.createElement('div');
  wrap.style.cssText =
    `position:fixed;left:-99999px;top:0;background:${bg};` +
    `display:inline-block;box-sizing:border-box;`;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.width = `${el.offsetWidth}px`;
  clone.style.maxWidth = 'none';
  clone.style.animation = 'none';
  clone.querySelectorAll<HTMLElement>('*').forEach((n) => {
    n.style.animation = 'none';
    n.style.transition = 'none';
  });
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    const blob = await domToBlob(wrap, {
      scale: CAPTURE_SCALE,
      type: 'image/png',
      backgroundColor: bg,
      ...(fontCssText ? { font: { cssText: fontCssText } } : {}),
    });
    if (!blob) throw new Error('domToBlob returned null');
    return blob;
  } finally {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }
}

/** blob 을 파일로 저장(다운로드 트리거). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
