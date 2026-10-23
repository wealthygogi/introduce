import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { WIDE_THEMES } from '../data/wideThemes';
import '../styles/modes.css';

const copy = {
  ko: { title: '와이드 테마', desc: '한 장에 담을 나의 취향, 어울리는 분위기를 골라보세요.', switch: '콤팩트 디자인 보기', home: '모드 선택으로', cta: '이 테마로 시작', label: 'WIDE THEME' },
  ja: { title: 'ワイドテーマ', desc: '一枚にまとめるあなたの好みに合うスタイルを選びましょう。', switch: 'コンパクトデザインを見る', home: 'モード選択へ', cta: 'このテーマで作る', label: 'WIDE THEME' },
  en: { title: 'Wide themes', desc: 'Choose a style for a single sheet filled with your favorites.', switch: 'Browse Compact designs', home: 'All modes', cta: 'Start with this theme', label: 'WIDE THEME' },
};

export default function WideGallery() {
  const { lang } = useLang();
  const labels = copy[lang];
  return <div className="modes-page gallery-page wide-gallery">
    <header className="gallery-heading"><div><span className="modes-eyebrow">WIDE · LANDSCAPE</span><h1>{labels.title}</h1><p>{labels.desc}</p></div><nav className="gallery-nav" aria-label="Introduction sheet modes"><Link to="/compact">{labels.switch} ↗</Link><Link to="/">{labels.home}</Link></nav></header>
    <div className="wide-theme-grid">{WIDE_THEMES.map((theme, index) => <Link className={`wide-theme-card theme-${theme.id}`} to={`/wide/${theme.id}`} key={theme.id}><div className="wide-theme-art" aria-hidden="true"><div className="theme-sheet"><span className="sheet-mark">{theme.id === 'hifuu' ? '☾' : theme.id === 'paper' ? '✳' : theme.id === 'album' ? '✦' : '▰'}</span><span className="sheet-line"/><span className="sheet-line short"/><div className="sheet-panels"><i/><i/><i/><i/></div><span className="sheet-foot"/></div><span className="theme-number">0{index + 1}</span></div><div className="wide-theme-copy"><span className="mode-kicker">{labels.label} · {theme.id.toUpperCase()}</span><h2>{theme.name[lang]}</h2><p>{theme.description[lang]}</p><span className="mode-link">{labels.cta} <b>↗</b></span></div></Link>)}</div>
  </div>;
}
