import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../../contexts/LangContext';
import copy from './copy';
import './coupling.css';

const editors = [
  { id: 'whiteboard', path: 'whiteboard' },
  { id: 'keyboard', path: 'keyboard' },
  { id: 'pairs', path: 'pairs' },
  { id: 'matrix', path: 'matrix' },
] as const;

const navCopy = {
  ko: { hub: '도구 목록', editors: '관계 편집 방식' },
  ja: { hub: 'ツール一覧', editors: '関係の編集方式' },
  en: { hub: 'All relationship tools', editors: 'Relationship editors' },
};

export default function CouplingLayout() {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  const t = copy[lang];
  const labels = navCopy[lang];
  return <div className="coupling-root"><div className="coupling-layout">
    <nav className="coupling-tabs" aria-label={labels.editors}>
      <Link to="/coupling" aria-current={path === '/coupling' ? 'page' : undefined}>{labels.hub}</Link>
      {editors.map(editor => <Link key={editor.id} to={`/coupling/${editor.path}`} aria-current={path === `/coupling/${editor.path}` ? 'page' : undefined}>{t[editor.id]}</Link>)}
    </nav>
    <Outlet />
  </div></div>;
}
