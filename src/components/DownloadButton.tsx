import { useState } from 'react';
import { useLang } from '../contexts/LangContext';
import { captureCardBlob, saveBlob } from '../lib/captureCard';

interface Props {
  targetId: string;
  filename: string;
  captureOptions?: { scale?: number; padding?: number; resetPosition?: boolean; maxPixelArea?: number };
  onStatusChange?: (status: 'preparing' | 'ready' | 'started' | 'failed') => void;
}

export default function DownloadButton({ targetId, filename, captureOptions, onStatusChange }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const run = async () => {
    if (busy) return;
    if (pendingBlob) {
      try {
        saveBlob(pendingBlob, filename);
        setPendingBlob(null);
        onStatusChange?.('started');
      } catch (e) {
        console.error('Save failed', e);
        onStatusChange?.('failed');
        alert(t.saveFailed);
      }
      return;
    }
    setBusy(true);
    onStatusChange?.('preparing');
    try {
      const blob = await captureCardBlob(targetId, captureOptions);
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        setPendingBlob(blob);
        onStatusChange?.('ready');
      } else {
        saveBlob(blob, filename);
        onStatusChange?.('started');
      }
    } catch (e) {
      console.error('Save failed', e);
      onStatusChange?.('failed');
      alert(t.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="download-btn" data-download-ready={pendingBlob !== null} onClick={run} disabled={busy}>
      <span aria-hidden>📸</span>
      <span>{busy ? t.saving : pendingBlob ? t.downloadReady : t.download}</span>
    </button>
  );
}
