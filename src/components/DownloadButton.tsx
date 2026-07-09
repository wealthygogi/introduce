import { useEffect, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { useLang } from '../contexts/LangContext';

interface Props {
  targetId: string;
  filename: string;
}

// ── 다운로드 캡처용 웹폰트 임베드 ───────────────────────────────
// 캡처는 DOM 을 SVG <foreignObject> 로 직렬화한 뒤 <img> 로 로드해 canvas 에
// 그린다. 이 img 는 격리 컨텍스트라 페이지에 로드된 웹폰트에 접근하지 못하고,
// 폰트는 반드시 @font-face 로 이미지 안에 임베드돼야 한다.
//
// 그런데 폰트는 크로스오리진 <link>(fonts.googleapis.com)로 들어오고, 크로스오리진
// 스타일시트는 cssRules 접근이 막혀 modern-screenshot 기본 임베드가 @font-face 를
// 읽지 못한다 → 픽셀/세리프 폰트가 fallback 으로 치환되고 글리프 폭이 달라져
// 텍스트가 줄바꿈·겹침(예: 스펠카드 제목의 닫는 괄호 소실)된다.
//
// 그래서 Google Fonts CSS 를 직접 fetch 하고, 그 안의 woff2 URL 을 base64 data URL
// 로 치환해 자족적(self-contained) @font-face CSS 를 만들어 font.cssText 로 넘긴다.
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
  // index.html 의 Google Fonts <link> 를 그대로 재사용 → 폰트 목록이 자동 동기화된다.
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

function getFontEmbedCss(): Promise<string> {
  if (!fontCssCache) fontCssCache = buildFontEmbedCss().catch(() => '');
  return fontCssCache;
}

export default function DownloadButton({ targetId, filename }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  // 사용자가 폼을 채우는 동안 폰트 임베드 CSS 를 미리 구워둬서(pre-warm) 첫 다운로드
  // 클릭이 수십 개 woff2 서브셋 fetch 비용을 물지 않게 한다.
  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (ric) ric(() => void getFontEmbedCss());
    else setTimeout(() => void getFontEmbedCss(), 1500);
  }, []);

  const run = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    setBusy(true);
    let wrap: HTMLDivElement | null = null;
    try {
      const [, fontCssText] = await Promise.all([
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).catch(() => undefined),
        getFontEmbedCss(),
      ]);

      const bg = getComputedStyle(document.body).backgroundColor || '#ffffff';
      // 카드를 여백 있는 래퍼로 감싸 캡처 → 트위터 업로드 시 카드가 가장자리에
      // 붙지 않고 여백을 두고 예쁘게 보이도록. 원본은 건드리지 않게 clone 을
      // 화면 밖에서 캡처한다.
      wrap = document.createElement('div');
      wrap.style.cssText =
        `position:fixed;left:-99999px;top:0;padding:48px;background:${bg};` +
        `display:inline-block;box-sizing:border-box;`;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.margin = '0';
      // 카드는 항상 640 폭(.card-frame). offsetWidth 는 레이아웃 폭(640, transform 무관)이라
      // 화면 밖 wrap 에서도 레이아웃이 정확히 계산된다. getBoundingClientRect().width 는
      // 모바일 useCardScale 의 transform:scale 이나 브라우저 zoom 이 반영된 축소 폭이어서
      // clone 이 좁아지고 다운로드가 짤렸다 — 그래서 offsetWidth 로 고정한다.
      clone.style.width = `${el.offsetWidth}px`;
      clone.style.maxWidth = 'none';
      // 진입 애니메이션(opacity:0→1, delay 최대 ~380ms)은 clone 을 새로 DOM 에
      // 부착하는 순간 처음부터 재생된다. 캡처는 그 직후 일어나므로 fill-mode both +
      // delay 요소들이 opacity:0 상태로 찍혀 카드/본문이 통째로 사라진다.
      // 캡처용 clone 에서는 모든 애니메이션·트랜지션을 꺼서 최종 상태로 렌더한다.
      clone.style.animation = 'none';
      clone.querySelectorAll<HTMLElement>('*').forEach((n) => {
        n.style.animation = 'none';
        n.style.transition = 'none';
      });
      wrap.appendChild(clone);
      document.body.appendChild(wrap);

      const blob = await domToBlob(wrap, {
        scale: 2,
        type: 'image/png',
        backgroundColor: bg,
        // 자족적 @font-face CSS 를 넘겨 픽셀/세리프 폰트를 이미지에 임베드한다.
        // 비어 있으면(fetch 실패) 옵션을 생략해 기본 동작으로 폴백.
        ...(fontCssText ? { font: { cssText: fontCssText } } : {}),
      });
      if (!blob) throw new Error('blob is null');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Save failed', e);
      alert(t.saveFailed);
    } finally {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      setBusy(false);
    }
  };

  return (
    <button type="button" className="download-btn" onClick={run} disabled={busy}>
      <span aria-hidden>📸</span>
      <span>{busy ? t.saving : t.download}</span>
    </button>
  );
}
