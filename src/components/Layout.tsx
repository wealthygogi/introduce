import { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import ThemeSwitcher from './ThemeSwitcher';
import LangSwitcher from './LangSwitcher';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang } = useLang();
  const loc = useLocation();
  const onLanding = loc.pathname === '/' || loc.pathname === '';
  const onSheets = loc.pathname === '/sheets' || loc.pathname === '/compact' || loc.pathname.startsWith('/wide') || loc.pathname.startsWith('/concept/');
  const onCoupling = loc.pathname === '/coupling' || loc.pathname.startsWith('/coupling/');
  const sectionNames = { ko: { sheets: '자기소개표', coupling: '캐릭터 커플링' }, ja: { sheets: 'プロフィールシート', coupling: 'キャラクターカップリング' }, en: { sheets: 'Profile sheets', coupling: 'Character couplings' } }[lang];
  return (
    <div className="shell">
      <header className="top-nav">
        <Link to="/" className="brand" aria-label={t.brand}>
          <span className="brand-mark">東</span>
          <span>{t.brand}</span>
        </Link>
        <nav className="mode-nav primary-mode-nav" aria-label={lang === 'ko' ? '주요 메뉴' : lang === 'ja' ? 'メインメニュー' : 'Main menu'}>
          <NavLink to="/sheets" className={`btn ghost${onSheets ? ' active' : ''}`}>{sectionNames.sheets}</NavLink>
          <NavLink to="/coupling" className={`btn ghost${onCoupling ? ' active' : ''}`}>{sectionNames.coupling}</NavLink>
        </nav>
        {onSheets && <nav className="mode-nav sheet-subnav" aria-label={lang === 'ko' ? '자기소개표 방식' : lang === 'ja' ? 'プロフィール形式' : 'Profile sheet editors'}>
          <NavLink to="/compact" className={({ isActive }) => `btn ghost${isActive || loc.pathname.startsWith('/concept/') ? ' active' : ''}`}>Compact</NavLink>
          <NavLink to="/wide" className={({ isActive }) => `btn ghost${isActive ? ' active' : ''}`}>Wide</NavLink>
        </nav>}
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
