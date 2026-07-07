import { useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { useLang } from '../contexts/LangContext';

interface Props {
  targetId: string;
  filename: string;
}

export default function DownloadButton({ targetId, filename }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    setBusy(true);
    let wrap: HTMLDivElement | null = null;
    try {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 800)),
        ]);
      } catch {
        // ignore
      }

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
      wrap.appendChild(clone);
      document.body.appendChild(wrap);

      const blob = await domToBlob(wrap, {
        scale: 2,
        type: 'image/png',
        backgroundColor: bg,
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
