import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { CONCEPTS } from '../concepts/registry';
import { WIDE_THEMES } from '../data/wideThemes';
import '../styles/modes.css';

const copy = {
  ko: {
    compactTitle: '컴팩트 자기소개표',
    compactDescription: '세로형 카드 디자인을 골라 나만의 동방 소개장을 만들어 보세요.',
    wideTitle: '와이드 자기소개표',
    wideDescription: '가로형 자기소개표를 취향에 맞게 구성해 보세요.',
    count: (count: number) => `${count}가지 디자인`,
    cta: '디자인 보기',
  },
  ja: {
    compactTitle: 'コンパクトプロフィール',
    compactDescription: '縦型カードを選んで、自分だけの東方プロフィールを作りましょう。',
    wideTitle: 'ワイドプロフィール',
    wideDescription: '横型プロフィールを自分好みにカスタマイズしましょう。',
    count: (count: number) => `${count}種類のデザイン`,
    cta: 'デザインを見る',
  },
  en: {
    compactTitle: 'Compact profiles',
    compactDescription: 'Choose a portrait card design and make your own Touhou introduction.',
    wideTitle: 'Wide profiles',
    wideDescription: 'Customize a landscape introduction sheet to match your style.',
    count: (count: number) => `${count} designs`,
    cta: 'Browse designs',
  },
};

export default function Landing() {
  const { t, lang } = useLang();
  const labels = copy[lang];
  return <div className="modes-page">
    <section className="modes-hero">
      <span className="modes-eyebrow">{t.brand}</span>
      <h1>{t.heroTitle}</h1>
      <p>{t.heroDesc}</p>
      <span className="hero-rule" />
    </section>
    <div className="mode-options">
      <Link to="/compact" className="mode-card">
        <div className="mode-art"><div className="mode-miniature"><div className="mini-top"><i/><i/><i/></div><div className="mini-content"><span className="mini-avatar"/><div className="mini-lines"><i/><i/><i/></div><span className="mini-block"/><span className="mini-block short"/></div></div><span className="mode-index">01</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">COMPACT · PORTRAIT</span><h2>{labels.compactTitle}</h2><p>{labels.compactDescription}</p><span className="mode-link"><span>{labels.count(CONCEPTS.length)}</span><b>{labels.cta} →</b></span></div>
      </Link>
      <Link to="/wide" className="mode-card">
        <div className="mode-art"><div className="mode-miniature is-wide"><div className="mini-top"><i/><i/><i/></div><div className="mini-content"><span className="mini-avatar"/><div className="mini-lines"><i/><i/><i/></div><span className="mini-block"/><span className="mini-block short"/></div></div><span className="mode-index">02</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">WIDE · LANDSCAPE</span><h2>{labels.wideTitle}</h2><p>{labels.wideDescription}</p><span className="mode-link"><span>{labels.count(WIDE_THEMES.length)}</span><b>{labels.cta} →</b></span></div>
      </Link>
    </div>
  </div>;
}
