import { useEffect, useState } from 'react';
import { useLang } from '../contexts/LangContext';
import { captureCardBlob, saveBlob } from '../lib/captureCard';

interface Props {
  targetId: string;
  filename: string;
}

/**
 * 트윗하기: 클릭하면 자동 다운로드하지 않고 안내 모달을 띄운다.
 * 트위터 웹 인텐트는 이미지 자동 첨부가 불가하므로, 모달에서 (1) 이미지 저장,
 * (2) 트윗 작성창 열기를 사용자가 직접 하도록 안내한다. 트친소 카드에는 링크를
 * 넣지 않고, 태그는 언어별 유행 태그를 text 에 직접 담는다.
 */
export default function TweetButton({ targetId, filename }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openModal = () => {
    setSaved(false);
    setOpen(true);
  };

  const saveImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureCardBlob(targetId);
      saveBlob(blob, filename);
      setSaved(true);
    } catch (e) {
      console.error('Tweet image capture failed', e);
      alert(t.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const openComposer = () => {
    const text = `${t.tweetText}\n\n${t.tweetTags}`;
    // 클릭 제스처 내 동기 호출 → 팝업 차단 회피
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn" onClick={openModal}>
        <span aria-hidden>🐦</span> {t.tweet}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label={t.cancel}>
              ✕
            </button>
            <p className="modal-msg">{t.tweetNoImage}</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={saveImage} disabled={busy}>
                <span aria-hidden>📸</span> {busy ? t.saving : saved ? t.tweetSaved : t.download}
              </button>
              <button type="button" className="btn primary" onClick={openComposer}>
                <span aria-hidden>🐦</span> {t.tweetOpen}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
