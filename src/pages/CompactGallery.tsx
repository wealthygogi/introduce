import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { CONCEPTS } from '../concepts/registry';
import { spriteUrl } from '../data/characters';
import '../styles/modes.css';

const copy = {
  ko: { title: '콤팩트 디자인', desc: '마음에 드는 디자인을 골라 나만의 소개장을 만들어 보세요.', switch: '와이드 디자인 보기', home: '모드 선택으로', legacy: '이전 디자인 15종 보기' },
  ja: { title: 'コンパクトデザイン', desc: 'お気に入りのデザインを選んでプロフィールを作りましょう。', switch: 'ワイドデザインを見る', home: 'モード選択へ', legacy: '以前のデザイン15種を見る' },
  en: { title: 'Compact designs', desc: 'Choose a design and make an introduction sheet of your own.', switch: 'Browse Wide designs', home: 'All modes', legacy: 'Browse 15 legacy designs' },
};

export default function CompactGallery() {
  const { lang, t } = useLang();
  const labels = copy[lang];
  return <div className="modes-page gallery-page compact-gallery">
    <header className="gallery-heading"><div><span className="modes-eyebrow">COMPACT · PORTRAIT</span><h1>{labels.title}</h1><p>{labels.desc}</p></div><nav className="gallery-nav" aria-label="Introduction sheet modes"><Link to="/wide">{labels.switch} ↗</Link><Link to="/">{labels.home}</Link></nav></header>
    <div className="grid">
      {CONCEPTS.map((c) => <Link to={`/concept/${c.id}`} key={c.id} className="concept-card"><div className="preview"><img className="px" src={spriteUrl(c.sprite)} alt=""/><span className="label">{c.tag}</span></div><div className="body"><span className="badge">CONCEPT {c.id.toUpperCase()}</span><span className="name">{c.name(t)}</span><span className="desc">{c.desc(t)}</span><span className="cta">{t.startCta} →</span></div></Link>)}
    </div>
    <p className="compact-legacy-link"><a href={`${import.meta.env.BASE_URL}v1/`}>{labels.legacy} ↗</a></p>
  </div>;
}
