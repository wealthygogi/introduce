import { useEffect, useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { findConcept } from '../concepts/registry';
import { useLang } from '../contexts/LangContext';
import { useFormState } from '../contexts/FormStateContext';
import FormPanel from '../components/FormPanel';
import DownloadButton from '../components/DownloadButton';
import ShareButton from '../components/ShareButton';
import TweetButton from '../components/TweetButton';
import { useCardScale } from '../hooks/useCardScale';

/** v1(가로형 컨셉 A~O)은 git 태그 v1-final 을 빌드한 정적 사본이 /introduce/v1/ 에 있다. */
const V1_CONCEPT_ID = /^[a-o]$/;

function V1Redirect({ id }: { id: string }) {
  useEffect(() => {
    // 예전 공유 링크(?c=)를 그대로 v1 사본으로 넘긴다.
    window.location.replace(`${import.meta.env.BASE_URL}v1/concept/${id}${window.location.search}${window.location.hash}`);
  }, [id]);
  return null;
}

type Mode = 'edit' | 'preview';

export default function ConceptPage() {
  const { id } = useParams<{ id: string }>();
  const concept = id ? findConcept(id) : undefined;
  const { t } = useLang();
  const { doReroll } = useFormState();
  const shellRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  // 모바일(≤880px) 전용: 입력/미리보기 중 하나만 보인다. 데스크톱은 CSS 가 둘 다 보여준다.
  const [mode, setMode] = useState<Mode>('edit');
  useCardScale(wrapRef, scalerRef);

  if (id && V1_CONCEPT_ID.test(id)) return <V1Redirect id={id} />;
  if (!concept) return <Navigate to="/" replace />;

  const ConceptComponent = concept.Component;
  const switchTo = (next: Mode) => {
    setMode(next);
    // 탭 바가 화면 맨 위에 오게 → 미리보기 탭에서는 도구 + 카드 전체가 한 화면에 들어온다
    window.scrollTo(0, shellRef.current?.offsetTop ?? 0);
  };

  return (
    <div className="page-shell" data-mode={mode} ref={shellRef}>
      <div className="mobile-tabs" role="tablist" aria-label={t.intro}>
        <button type="button" role="tab" aria-selected={mode === 'edit'} onClick={() => switchTo('edit')}>
          ✏️ {t.tabEdit}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'preview'} onClick={() => switchTo('preview')}>
          🖼️ {t.tabPreview}
        </button>
      </div>
      <div className="edit-panel">
        <FormPanel />
        <button type="button" className="btn primary to-preview" onClick={() => switchTo('preview')}>
          🖼️ {t.tabPreview} →
        </button>
      </div>
      <div className="preview-panel">
        <div className="preview-tools">
          <DownloadButton targetId="preview-card" filename={`trchinso-${concept.slug}.png`} />
          <TweetButton targetId="preview-card" filename={`trchinso-${concept.slug}.png`} />
          <ShareButton />
          {concept.hasRandomStats && (
            <button type="button" className="btn" onClick={doReroll}>
              🎲 {t.reroll}
            </button>
          )}
        </div>
        <div className="preview-wrap" ref={wrapRef}>
          <div className="card-scaler" ref={scalerRef}>
            <ConceptComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
