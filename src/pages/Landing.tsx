import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import '../styles/modes.css';

const copy = {
  ko: { eyebrow: 'GENSOKYO · CREATIVE STUDIO', title: '소개와 관계를 만드는 도구', desc: '나를 소개하는 한 장을 만들거나, 좋아하는 캐릭터와 관계를 정리해 보세요.', sheets: '자기소개표 만들기', sheetsDesc: '15가지 세로형 디자인과 여러 와이드 테마로 나만의 소개장을 만듭니다.', characters: '캐릭터 관련', charactersDesc: '캐릭터 취향 모음표를 만들거나 커플링과 관계를 정리합니다.', open: '둘러보기' },
  ja: { eyebrow: 'GENSOKYO · CREATIVE STUDIO', title: 'プロフィールと関係を作るツール', desc: '自分を紹介するシートを作ったり、好きなキャラクターや関係を整理したりできます。', sheets: 'プロフィールシートを作る', sheetsDesc: '縦長の15デザインとワイドテーマから、自分だけの紹介シートを作成。', characters: 'キャラクター関連', charactersDesc: 'お気に入り表を作ったり、カップリングや関係を整理したりできます。', open: '見る' },
  en: { eyebrow: 'GENSOKYO · CREATIVE STUDIO', title: 'Tools for stories and relationships', desc: 'Create a sheet about yourself or collect favorite characters and their relationships.', sheets: 'Make an introduction sheet', sheetsDesc: 'Build a personal sheet with 15 portrait designs and several wide themes.', characters: 'Characters', charactersDesc: 'Make a character taste board or organize couplings and relationships.', open: 'Explore' },
};

export default function Landing() {
  const { lang } = useLang();
  const t = copy[lang];
  return <div className="modes-page landing-modes">
    <section className="modes-hero"><span className="modes-eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.desc}</p><span className="hero-rule"/></section>
    <section className="mode-options landing-entry-options" aria-label={t.eyebrow}>
      <Link to="/sheets" className="mode-card compact-mode">
        <div className="mode-art"><div className="landing-sheet-art" aria-hidden="true"><span/><i/><i/><i/><b/><b/><b/><b/></div><span className="mode-index">01 / PROFILE</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">GENSOKYO · PROFILE</span><h2>{t.sheets}</h2><p>{t.sheetsDesc}</p><span className="mode-link">{t.open} <b>↗</b></span></div>
      </Link>
      <Link to="/characters" className="mode-card wide-mode">
        <div className="mode-art"><div className="landing-coupling-art" aria-hidden="true"><svg viewBox="0 0 240 150"><path d="M48 44 118 30 185 56 165 112 90 124 48 44M48 44 90 124M118 30 90 124M118 30 165 112"/></svg><i/><i/><i/><i/><i/></div><span className="mode-index">02 / COUPLING</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">GENSOKYO · CHARACTERS</span><h2>{t.characters}</h2><p>{t.charactersDesc}</p><span className="mode-link">{t.open} <b>↗</b></span></div>
      </Link>
    </section>
    <footer className="modes-note">東方Project fan-made creative tools <span>✳</span></footer>
  </div>;
}
