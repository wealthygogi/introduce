import { lazy, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ConceptPage = lazy(() => import('./ConceptPage'));
const V1_CONCEPT_ID = /^[a-o]$/;

/** Resolve legacy links before the global form provider removes the share parameter. */
export default function ConceptRoute() {
  const { id } = useParams<{ id: string }>();
  const legacy = !!id && V1_CONCEPT_ID.test(id);
  useEffect(() => {
    if (legacy) window.location.replace(`${import.meta.env.BASE_URL}v1/concept/${id}${window.location.search}${window.location.hash}`);
  }, [id, legacy]);
  return legacy ? null : <ConceptPage />;
}
