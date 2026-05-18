import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import ThemeSwitcher from './ThemeSwitcher';
import LangSwitcher from './LangSwitcher';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const loc = useLocation();
  const onLanding = loc.pathname === '/' || loc.pathname === '';

  return (
    <div className="shell">
      <header className="top-nav">
        <Link to="/" className="brand" aria-label={t.brand}>
          <span className="brand-mark">東</span>
          <span>{t.brand}</span>
        </Link>
        <div className="nav-row">
          {!onLanding && (
            <Link to="/" className="btn ghost" aria-label={t.back}>
              ← {t.back}
            </Link>
          )}
          <ThemeSwitcher />
          <LangSwitcher />
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
