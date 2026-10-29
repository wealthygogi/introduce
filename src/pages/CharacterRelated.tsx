import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import '../styles/modes.css';

const copy = {
  ko: {
    title: '캐릭터 취향과 관계를 한 장에',
    intro: '좋아하는 캐릭터를 모으거나 캐릭터 사이의 관계를 정리해 보세요.',
    tastes: '캐릭터 취향 모음표', tastesDesc: '격자와 그룹을 정하고 좋아하는 캐릭터를 배치해 이미지로 저장합니다.',
    relationships: '커플링·관계', relationshipsDesc: '자유 캔버스, 릴레이, 커플 카드, 관계 매트릭스로 관계를 기록합니다.',
    start: '만들기', explore: '둘러보기',
  },
  ja: {
    title: '好きなキャラクターと関係を一枚に',
    intro: '好きなキャラクターを集めたり、キャラクター同士の関係を整理したりできます。',
    tastes: 'キャラクターのお気に入り表', tastesDesc: 'グリッドとグループを決めて好きなキャラクターを配置し、画像で保存します。',
    relationships: 'カップリング・関係', relationshipsDesc: 'フリーボード、リレー、カード、関係マトリクスで関係を記録します。',
    start: '作成する', explore: '見る',
  },
  en: {
    title: 'Collect favorite characters and map relationships',
    intro: 'Make a board of characters you like or organize how characters relate.',
    tastes: 'Character taste board', tastesDesc: 'Choose grids and groups, place favorite characters, and save an image.',
    relationships: 'Couplings & relationships', relationshipsDesc: 'Record connections with a free canvas, relay, pair cards, or matrix.',
    start: 'Create', explore: 'Explore',
  },
} as const;

export default function CharacterRelated() {
  const { lang } = useLang();
  const t = copy[lang];
  return <div className="modes-page character-related-page">
    <section className="modes-hero"><span className="modes-eyebrow">GENSOKYO · CHARACTERS</span><h1>{t.title}</h1><p>{t.intro}</p><span className="hero-rule" /></section>
    <section className="mode-options" aria-label={t.title}>
      <Link to="/characters/tastes" className="mode-card compact-mode character-related-card">
        <div className="mode-art"><div className="landing-sheet-art" aria-hidden="true"><span /><i /><i /><i /><b /><b /><b /><b /></div><span className="mode-index">01 / TASTE BOARD</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">GENSOKYO · FAVORITES</span><h2>{t.tastes}</h2><p>{t.tastesDesc}</p><span className="mode-link">{t.start} <b>↗</b></span></div>
      </Link>
      <Link to="/coupling" className="mode-card wide-mode character-related-card">
        <div className="mode-art"><div className="landing-coupling-art" aria-hidden="true"><svg viewBox="0 0 240 150"><path d="M48 44 118 30 185 56 165 112 90 124 48 44M48 44 90 124M118 30 90 124M118 30 165 112" /></svg><i /><i /><i /><i /><i /></div><span className="mode-index">02 / RELATIONSHIPS</span></div>
        <div className="mode-card-copy"><span className="mode-kicker">GENSOKYO · COUPLINGS</span><h2>{t.relationships}</h2><p>{t.relationshipsDesc}</p><span className="mode-link">{t.explore} <b>↗</b></span></div>
      </Link>
    </section>
  </div>;
}
