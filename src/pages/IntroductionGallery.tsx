import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { WIDE_THEMES } from '../data/wideThemes';
import '../styles/modes.css';

const copy = {
  ko: { eyebrow: 'GENSOKYO · INTRODUCTION SHEETS', title: '나를 소개하는, 나만의 한 장', desc: '좋아하는 것과 나의 이야기를 담아 소개장을 만들어 보세요.', compact: '컴팩트 자기소개표', compactDesc: '세로로 길고 알찬 15가지 디자인. 간편하게 채우고 공유해요.', wide: '와이드', wideDesc: '가로형 2×2 또는 4열 레이아웃. 취향에 맞는 테마를 골라요.', choose: '디자인 둘러보기', vertical: '세로형 · 15가지 디자인', horizontal: `가로형 · ${WIDE_THEMES.length}가지 테마` },
  ja: { eyebrow: 'GENSOKYO · INTRODUCTION SHEETS', title: 'あなたらしさを、一枚のシートに', desc: '好きなものや自分のことを詰め込んだプロフィールを作りましょう。', compact: 'コンパクト', compactDesc: '縦長で情報たっぷりの15デザイン。気軽に作ってシェア。', wide: 'ワイド', wideDesc: '横長の2×2または4列レイアウト。テーマを選んで作成。', choose: 'デザインを見る', vertical: '縦長 · 15デザイン', horizontal: `横長 · ${WIDE_THEMES.length}テーマ` },
  en: { eyebrow: 'GENSOKYO · INTRODUCTION SHEETS', title: 'Your story, on one little sheet', desc: 'Make an introduction sheet filled with the things you love.', compact: 'Compact', compactDesc: '15 detailed portrait designs. Fill one in and share it with ease.', wide: 'Wide', wideDesc: 'Landscape 2×2 or four-column layouts. Pick a theme to begin.', choose: 'Explore designs', vertical: 'PORTRAIT · 15 DESIGNS', horizontal: `LANDSCAPE · ${WIDE_THEMES.length} THEMES` },
};

function Miniature({ wide }: { wide: boolean }) {
  return <div className={`mode-miniature ${wide ? 'is-wide' : 'is-compact'}`} aria-hidden="true"><div className="mini-top"><i /><i /><i /></div><div className="mini-content"><div className="mini-avatar"/><div className="mini-lines"><i/><i/><i/></div><div className="mini-block"/><div className="mini-block short"/><div className="mini-block"/><div className="mini-block short"/></div></div>;
}

export default function IntroductionGallery() {
  const { lang } = useLang();
  const t = copy[lang];
  return <div className="modes-page landing-modes gallery-page">
    <section className="modes-hero"><span className="modes-eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.desc}</p><span className="hero-rule"/></section>
    <section className="mode-options" aria-label={t.choose}>
      <Link to="/compact" className="mode-card compact-mode"><div className="mode-art"><Miniature wide={false}/><span className="mode-index">01 / PORTRAIT</span></div><div className="mode-card-copy"><span className="mode-kicker">{t.vertical}</span><h2>{t.compact}</h2><p>{t.compactDesc}</p><span className="mode-link">{t.choose} <b>↗</b></span></div></Link>
      <Link to="/wide" className="mode-card wide-mode"><div className="mode-art"><Miniature wide/><span className="mode-index">02 / LANDSCAPE</span></div><div className="mode-card-copy"><span className="mode-kicker">{t.horizontal}</span><h2>{t.wide}</h2><p>{t.wideDesc}</p><span className="mode-link">{t.choose} <b>↗</b></span></div></Link>
    </section>
    <footer className="modes-note">東方Project fan-made introduction sheets <span>✳</span></footer>
  </div>;
}
