import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import ThemeSwitcher from './ThemeSwitcher';
import LangSwitcher from './LangSwitcher';
import Footer from './Footer';

const copy = {
  ko: {
    sheets: '자기소개표', characters: '캐릭터 관련', tastes: '캐릭터 취향표', random: '랜덤 뽑기', coupling: '커플링·관계',
    primary: '주요 메뉴', sheetNav: '자기소개표 방식', characterNav: '캐릭터 도구',
    home: '홈으로', sheetsBack: '자기소개표 목록', compactBack: 'Compact 갤러리',
    wideBack: 'Wide 갤러리', charactersBack: '캐릭터 도구 목록', couplingBack: '관계 도구 목록',
  },
  ja: {
    sheets: 'プロフィールシート', characters: 'キャラクター関連', tastes: 'キャラクターのお気に入り表', random: 'ランダム抽選', coupling: 'カップリング・関係',
    primary: 'メインメニュー', sheetNav: 'プロフィール形式', characterNav: 'キャラクターツール',
    home: 'ホームへ', sheetsBack: 'プロフィール形式一覧', compactBack: 'Compact ギャラリー',
    wideBack: 'Wide ギャラリー', charactersBack: 'キャラクターツール一覧', couplingBack: '関係ツール一覧',
  },
  en: {
    sheets: 'Profile sheets', characters: 'Characters', tastes: 'Character taste board', random: 'Random draw', coupling: 'Couplings & relationships',
    primary: 'Main menu', sheetNav: 'Profile sheet editors', characterNav: 'Character tools',
    home: 'Home', sheetsBack: 'Profile sheet modes', compactBack: 'Compact gallery',
    wideBack: 'Wide gallery', charactersBack: 'Character tools', couplingBack: 'Relationship tools',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang } = useLang();
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  const onLanding = path === '/';
  const onSheets = path === '/sheets' || path === '/compact' || path.startsWith('/concept/') || path === '/wide' || path.startsWith('/wide/');
  const onCharacters = path === '/characters' || path.startsWith('/characters/') || path === '/coupling' || path.startsWith('/coupling/');
  const c = copy[lang];
  const parent = onLanding ? null : path === '/sheets' || path === '/characters'
    ? { to: '/', label: c.home }
    : path === '/compact' || path.startsWith('/concept/')
      ? path === '/compact' ? { to: '/sheets', label: c.sheetsBack } : { to: '/compact', label: c.compactBack }
      : path === '/wide' ? { to: '/sheets', label: c.sheetsBack }
        : path.startsWith('/wide/') ? { to: '/wide', label: c.wideBack }
          : path === '/characters/tastes' || path === '/characters/random' ? { to: '/characters', label: c.charactersBack }
            : path === '/coupling' ? { to: '/characters', label: c.charactersBack }
              : path.startsWith('/coupling/') ? { to: '/coupling', label: c.couplingBack } : { to: '/', label: c.home };
  const current = (target: string, descendants = false) => path === target ? 'page' : descendants && path.startsWith(`${target}/`) ? 'location' : undefined;
  const linkClass = (state?: string) => `btn ghost${state ? ' active' : ''}`;
  return (
    <div className="shell">
      <header className="top-nav">
        <Link to="/" className="brand" aria-label={t.brand}>
          <span className="brand-mark">東</span>
          <span>{t.brand}</span>
        </Link>
        <nav className="mode-nav primary-mode-nav" aria-label={c.primary}>
          <Link to="/sheets" className={linkClass(path === '/sheets' ? 'page' : onSheets ? 'location' : undefined)} aria-current={path === '/sheets' ? 'page' : onSheets ? 'location' : undefined}>{c.sheets}</Link>
          <Link to="/characters" className={linkClass(path === '/characters' ? 'page' : onCharacters ? 'location' : undefined)} aria-current={path === '/characters' ? 'page' : onCharacters ? 'location' : path === '/coupling' || path.startsWith('/coupling/') ? 'location' : undefined}>{c.characters}</Link>
        </nav>
        <div className="nav-row">
          {parent && <Link to={parent.to} className="btn ghost" aria-label={parent.label}><span aria-hidden="true">← </span>{parent.label}</Link>}
          <ThemeSwitcher />
          <LangSwitcher />
        </div>
        {onSheets && <nav className="mode-nav section-subnav" aria-label={c.sheetNav}>
          <Link to="/compact" className={linkClass(path === '/compact' ? 'page' : path.startsWith('/concept/') ? 'location' : undefined)} aria-current={path === '/compact' ? 'page' : path.startsWith('/concept/') ? 'location' : undefined}>Compact</Link>
          <Link to="/wide" className={linkClass(current('/wide', true))} aria-current={current('/wide', true)}>Wide</Link>
        </nav>}
        {onCharacters && <nav className="mode-nav section-subnav" aria-label={c.characterNav}>
          <Link to="/characters/tastes" className={linkClass(current('/characters/tastes'))} aria-current={current('/characters/tastes', true)}>{c.tastes}</Link>
          <Link to="/characters/random" className={linkClass(current('/characters/random'))} aria-current={current('/characters/random')}>{c.random}</Link>
          <Link to="/coupling" className={linkClass(current('/coupling', true))} aria-current={current('/coupling', true)}>{c.coupling}</Link>
        </nav>}
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
