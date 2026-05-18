import { useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { findConcept } from '../concepts/registry';
import { useLang } from '../contexts/LangContext';
import FormPanel from '../components/FormPanel';
import DownloadButton from '../components/DownloadButton';
import { useCardScale } from '../hooks/useCardScale';

export default function ConceptPage() {
  const { id } = useParams<{ id: string }>();
  const concept = id ? findConcept(id) : undefined;
  const { t } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useCardScale(wrapRef, scalerRef);

  if (!concept) {
    return <Navigate to="/" replace />;
  }

  const ConceptComponent = concept.Component;

  return (
    <div className="page-shell">
      <FormPanel />
      <div className={`preview-panel${collapsed ? ' is-collapsed' : ''}`}>
        <div className="preview-tools">
          <DownloadButton targetId="preview-card" filename={`trchinso-${concept.slug}.png`} />
          <button
            type="button"
            className="preview-toggle"
            aria-expanded={!collapsed}
            aria-controls="preview-card-wrap"
            onClick={() => setCollapsed((c) => !c)}
          >
            <span aria-hidden>{collapsed ? '▾' : '▴'}</span>
            <span>{collapsed ? t.previewShow : t.previewHide}</span>
          </button>
        </div>
        <div id="preview-card-wrap" className="preview-wrap" ref={wrapRef} aria-hidden={collapsed}>
          <div className="card-scaler" ref={scalerRef}>
            <ConceptComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
