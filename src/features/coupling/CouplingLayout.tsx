import { NavLink, Outlet } from 'react-router-dom';
import { useLang } from '../../contexts/LangContext';
import copy from './copy';
import './coupling.css';

const editors = [
  { id: 'whiteboard', path: 'whiteboard' },
  { id: 'keyboard', path: 'keyboard' },
  { id: 'pairs', path: 'pairs' },
  { id: 'matrix', path: 'matrix' },
] as const;

export default function CouplingLayout() {
  const { lang } = useLang();
  const t = copy[lang];
  return <div className="coupling-root"><div className="coupling-layout">
    <nav className="coupling-tabs" aria-label={t.coupling}>
      <NavLink end to="/coupling">{t.coupling}</NavLink>
      {editors.map(editor => <NavLink key={editor.id} to={`/coupling/${editor.path}`}>{t[editor.id]}</NavLink>)}
    </nav>
    <Outlet />
  </div></div>;
}
