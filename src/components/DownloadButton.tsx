import { useEffect, useState } from 'react';
import { toPng, getFontEmbedCSS } from 'html-to-image';
import { useLang } from '../contexts/LangContext';

interface Props {
  targetId: string;
  filename: string;
}

let fontEmbedCache: Promise<string> | null = null;
function getCachedFontEmbedCSS(el: HTMLElement) {
  if (!fontEmbedCache) {
    fontEmbedCache = getFontEmbedCSS(el).catch(() => '');
  }
  return fontEmbedCache;
}

function whenIdle(cb: () => void) {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 300);
  }
}

export default function DownloadButton({ targetId, filename }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  // Pre-warm the font embed CSS while the user is filling out the form,
  // so the first download click doesn't pay the 2-3s @font-face fetch cost.
  useEffect(() => {
    whenIdle(() => {
      const el = document.getElementById(targetId);
      if (el) void getCachedFontEmbedCSS(el);
    });
  }, [targetId]);

  const run = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    setBusy(true);
    try {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 1000)),
        ]);
      } catch {
        // ignore
      }

      const fontEmbedCSS = await getCachedFontEmbedCSS(el);

      const dataUrl = await toPng(el, {
        pixelRatio: 1.5,
        cacheBust: false,
        skipFonts: false,
        fontEmbedCSS,
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
      });

      const a = document.createElement('a');
      a.download = filename;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error('Save failed', e);
      alert(t.saveFailed);
    } finally {
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
