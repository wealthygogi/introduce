import { lazy } from 'react';

export const CONCEPT_COMPONENTS = {
  p: lazy(() => import('./ConceptP')),
  q: lazy(() => import('./ConceptQ')),
  r: lazy(() => import('./ConceptR')),
  s: lazy(() => import('./ConceptS')),
  t: lazy(() => import('./ConceptT')),
  u: lazy(() => import('./ConceptU')),
  v: lazy(() => import('./ConceptV')),
  w: lazy(() => import('./ConceptW')),
  x: lazy(() => import('./ConceptX')),
  y: lazy(() => import('./ConceptY')),
};
