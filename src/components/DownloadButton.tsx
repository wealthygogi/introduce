import { useState } from 'react';
import { useLang } from '../contexts/LangContext';
import { captureCardBlob, saveBlob } from '../lib/captureCard';

interface Props {
  targetId: string;
  filename: string;
  captureOptions?: { scale?: number; padding?: number; resetPosition?: boolean; maxPixelArea?: number };
}

export default function DownloadButton({ targetId, filename, captureOptions }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureCardBlob(targetId, captureOptions);
      saveBlob(blob, filename);
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
