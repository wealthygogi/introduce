import { useParams, Navigate } from 'react-router-dom';
import { findConcept } from '../concepts/registry';
import FormPanel from '../components/FormPanel';
import DownloadButton from '../components/DownloadButton';

export default function ConceptPage() {
  const { id } = useParams<{ id: string }>();
  const concept = id ? findConcept(id) : undefined;

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
        <ConceptComponent />
      </div>
    </div>
  );
}
