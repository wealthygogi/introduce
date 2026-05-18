import { useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { findConcept } from '../concepts/registry';
import FormPanel from '../components/FormPanel';
import DownloadButton from '../components/DownloadButton';
import { useCardScale } from '../hooks/useCardScale';

export default function ConceptPage() {
  const { id } = useParams<{ id: string }>();
  const concept = id ? findConcept(id) : undefined;
  const wrapRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  useCardScale(wrapRef, scalerRef);

  if (!concept) {
    return <Navigate to="/" replace />;
  }

  const ConceptComponent = concept.Component;

  return (
    <div className="page-shell">
      <FormPanel />
      <div className="preview-panel">
        <div className="preview-tools">
          <DownloadButton targetId="preview-card" filename={`trchinso-${concept.slug}.png`} />
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
