import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import PageLoading from './components/PageLoading';
import ConceptRoute from './pages/ConceptRoute';
const IntroductionGallery = lazy(() => import('./pages/IntroductionGallery'));
const CompactGallery = lazy(() => import('./pages/CompactGallery'));
const CharacterRelated = lazy(() => import('./pages/CharacterRelated'));
const WideGallery = lazy(() => import('./pages/WideGallery'));
const WidePage = lazy(() => import('./pages/WidePage'));
const CouplingLayout = lazy(() => import('./features/coupling/CouplingLayout'));
const CouplingHub = lazy(() => import('./features/coupling/CouplingHub'));

const WhiteboardEditor = lazy(() => import('./features/coupling/editors/WhiteboardEditor'));
const KeyboardEditor = lazy(() => import('./features/coupling/editors/KeyboardEditor'));
const PairsEditor = lazy(() => import('./features/coupling/editors/PairsEditor'));
const MatrixEditor = lazy(() => import('./features/coupling/editors/MatrixEditor'));
const TasteBoardEditor = lazy(() => import('./features/characters/TasteBoardEditor'));
const RandomPickerPage = lazy(() => import('./features/characters/random/RandomPickerPage'));
const RandomEffectsPrototype = lazy(() => import('./features/characters/random/RandomEffectsPrototype'));
const CharacterCalendar = lazy(() => import('./pages/CharacterCalendar'));
export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sheets" element={<IntroductionGallery />} />
          <Route path="/compact" element={<CompactGallery />} />
          <Route path="/wide" element={<WideGallery />} />
          <Route path="/wide/:theme" element={<WidePage />} />
          <Route path="/characters" element={<CharacterRelated />} />
          <Route path="/calendar" element={<Suspense fallback={<PageLoading />}><CharacterCalendar /></Suspense>} />
          <Route path="/characters/tastes" element={<Suspense fallback={<PageLoading />}><TasteBoardEditor /></Suspense>} />
          <Route path="/characters/random" element={<Suspense fallback={<PageLoading />}><RandomPickerPage /></Suspense>} />
          {import.meta.env.DEV && <Route path="/characters/random/prototype" element={<Suspense fallback={<PageLoading />}><RandomEffectsPrototype /></Suspense>} />}
          <Route path="/concept/:id" element={<ConceptRoute />} />
          <Route path="/coupling" element={<CouplingLayout />}>
            <Route index element={<CouplingHub />} />
            <Route path="whiteboard" element={<Suspense fallback={<PageLoading />}><WhiteboardEditor /></Suspense>} />
            <Route path="keyboard" element={<Suspense fallback={<PageLoading />}><KeyboardEditor /></Suspense>} />
            <Route path="pairs" element={<Suspense fallback={<PageLoading />}><PairsEditor /></Suspense>} />
            <Route path="matrix" element={<Suspense fallback={<PageLoading />}><MatrixEditor /></Suspense>} />
            <Route path="*" element={<Navigate to="/coupling" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
