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
    try {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 800)),
        ]);
      } catch {
        // ignore
      }

      const blob = await domToBlob(el, {
        scale: 2,
        type: 'image/png',
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
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
