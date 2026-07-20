import { domToBlob } from 'modern-screenshot';

// ── 다운로드 캡처용 웹폰트 임베드 ───────────────────────────────
// 캡처는 DOM 을 SVG <foreignObject> 로 직렬화한 뒤 <img> 로 로드해 canvas 에 그린다.
// 이 img 는 격리 컨텍스트라 페이지 웹폰트에 접근하지 못하고, 폰트는 @font-face 로
// 이미지 안에 임베드돼야 한다. 그런데 폰트는 크로스오리진 <link> 로 들어와 cssRules
// 접근이 막혀 기본 임베드가 실패 → 픽셀/세리프 폰트가 fallback 으로 치환되고 글리프
// 폭이 달라져 텍스트가 줄바꿈·겹침된다. 그래서 Google Fonts CSS 를 직접 fetch 하고
// woff2 URL 을 base64 data URL 로 치환해 자족적 @font-face CSS 를 만들어 넘긴다.
let fontCssCache: Promise<string> | null = null;

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function buildFontEmbedCss(): Promise<string> {
  const link = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
  if (!link) return '';
  const cssRes = await fetch(link.href);
  if (!cssRes.ok) return '';
  let css = await cssRes.text();

  const urls = Array.from(
    new Set(Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g), (m) => m[1])),
  );
  const pairs = await Promise.all(
    urls.map(async (u) => {
      try {
        const r = await fetch(u);
        if (!r.ok) return [u, ''] as const;
        return [u, `data:font/woff2;base64,${bufToBase64(await r.arrayBuffer())}`] as const;
      } catch {
        return [u, ''] as const;
      }
    }),
  );
  for (const [u, data] of pairs) {
    if (data) css = css.split(u).join(data);
  }
  return css;
}

/**
 * 자족적 @font-face CSS 를 만들어 반환(첫 호출에만 fetch, 이후 메모이즈).
 * 첫 다운로드 클릭 시점에 lazy 로 만든다 — 마운트 시 pre-warm 하면 대부분의 방문자가
 * 쓰지도 않는 ~60개 woff2 fetch 로 첫 진입이 ~1s 멈춰 보였다.
 */
function getFontEmbedCss(): Promise<string> {
  if (!fontCssCache) fontCssCache = buildFontEmbedCss().catch(() => '');
  return fontCssCache;
}

/**
 * 화면에 보이는 카드(targetId)를 여백 있는 래퍼로 감싸 PNG blob 으로 캡처한다.
 * 원본은 건드리지 않게 화면 밖에서 clone 을 찍는다. transform:scale·진입 애니메이션의
 * 영향을 받지 않도록 clone 폭을 offsetWidth 로 고정하고 애니메이션을 끈다.
 */
export async function captureCardBlob(targetId: string): Promise<Blob> {
  const el = document.getElementById(targetId);
  if (!el) throw new Error(`captureCardBlob: #${targetId} not found`);

  const [, fontCssText] = await Promise.all([
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).catch(() => undefined),
    getFontEmbedCss(),
  ]);

  const bg = getComputedStyle(document.body).backgroundColor || '#ffffff';
  const wrap = document.createElement('div');
  wrap.style.cssText =
    `position:fixed;left:-99999px;top:0;padding:48px;background:${bg};` +
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
      scale: 2,
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
