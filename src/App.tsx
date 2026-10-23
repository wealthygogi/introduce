import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ConceptPage from './pages/ConceptPage';
import CompactGallery from './pages/CompactGallery';
import WideGallery from './pages/WideGallery';
import WidePage from './pages/WidePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/compact" element={<CompactGallery />} />
        <Route path="/wide" element={<WideGallery />} />
        <Route path="/wide/:theme" element={<WidePage />} />
        <Route path="/concept/:id" element={<ConceptPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
