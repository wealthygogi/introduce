import { useEffect, useRef, useState } from 'react';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { buildShareUrl } from '../lib/formStateCodec';

/** 현재 폼 상태를 담은 공유 링크를 클립보드로 복사한다(업로드 사진 제외). */
export default function ShareButton() {
  const { state } = useFormState();
  const { t } = useLang();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (s: 'copied' | 'failed') => {
    setStatus(s);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 1600);
  };

  const run = async () => {
    const url = buildShareUrl(state);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // 구형/비보안 컨텍스트 폴백
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand copy failed');
      }
      flash('copied');
    } catch {
      flash('failed');
    }
  };

  const label = status === 'copied' ? t.linkCopied : status === 'failed' ? t.linkCopyFailed : t.shareLink;

  return (
    <button type="button" className="btn" onClick={run} aria-live="polite">
      <span aria-hidden>{status === 'copied' ? '✅' : '🔗'}</span> {label}
    </button>
  );
}
