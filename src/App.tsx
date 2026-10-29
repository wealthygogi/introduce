import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLang } from './contexts/LangContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import IntroductionGallery from './pages/IntroductionGallery';
import ConceptPage from './pages/ConceptPage';
import CompactGallery from './pages/CompactGallery';
import CharacterRelated from './pages/CharacterRelated';
import WideGallery from './pages/WideGallery';
import WidePage from './pages/WidePage';
import { CouplingDraftProvider } from './features/coupling/CouplingDraftProvider';
import CouplingLayout from './features/coupling/CouplingLayout';
import CouplingHub from './features/coupling/CouplingHub';
import copy from './features/coupling/copy';

const WhiteboardEditor = lazy(() => import('./features/coupling/editors/WhiteboardEditor'));
const KeyboardEditor = lazy(() => import('./features/coupling/editors/KeyboardEditor'));
const PairsEditor = lazy(() => import('./features/coupling/editors/PairsEditor'));
const MatrixEditor = lazy(() => import('./features/coupling/editors/MatrixEditor'));
function CouplingLoading() {
  const { lang } = useLang();
  return <p role="status">{copy[lang].loading}</p>;
}

export default function App() {
  return (
    <Layout>
      <CouplingDraftProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sheets" element={<IntroductionGallery />} />
          <Route path="/compact" element={<CompactGallery />} />
          <Route path="/wide" element={<WideGallery />} />
          <Route path="/wide/:theme" element={<WidePage />} />
          <Route path="/characters" element={<CharacterRelated />} />
          <Route path="/concept/:id" element={<ConceptPage />} />
          <Route path="/coupling" element={<CouplingLayout />}>
            <Route index element={<CouplingHub />} />
            <Route path="whiteboard" element={<Suspense fallback={<CouplingLoading />}><WhiteboardEditor /></Suspense>} />
            <Route path="keyboard" element={<Suspense fallback={<CouplingLoading />}><KeyboardEditor /></Suspense>} />
            <Route path="pairs" element={<Suspense fallback={<CouplingLoading />}><PairsEditor /></Suspense>} />
            <Route path="matrix" element={<Suspense fallback={<CouplingLoading />}><MatrixEditor /></Suspense>} />
            <Route path="*" element={<Navigate to="/coupling" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CouplingDraftProvider>
    </Layout>
  );
}
