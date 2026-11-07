import { useEffect, useMemo, useState } from 'react';
import { PROFILE_CHARACTERS } from '../../../data/profileCatalog';
import { getCharacterPortrait } from '../../../data/characterPortraits';
import { useLang } from '../../../contexts/LangContext';
import RandomPortrait from './components/RandomPortrait';
import './random-effects-prototype.css';

const EFFECTS = ['barrier', 'sakura', 'moon', 'danmaku', 'cards'] as const;
type Effect = typeof EFFECTS[number];
type Slot = 'prep' | 'reveal' | 'finish';

const effectCopy = {
  ko: {
    title: '환상향 럭키 드로우 연출 프로토타입', intro: '작품별 애니메이션의 소재만 참고해, 카드 중심의 연출로 새로 구성한 비교 화면입니다.',
    back: '환상향 럭키 드로우로 돌아가기', cast: '연출 조합', prep: '준비 효과', reveal: '공개 동작', finish: '마무리 효과', replay: '다시 재생',
    count: '공개 장수', one: '1장', three: '3장', five: '5장', ten: '10장', skip: '모두 공개', waiting: '결계에 빛이 모입니다', names: '환상향의 인연',
    namesOf: ['결계 소환', '벚꽃 개화', '월광 경계', '성광 탄막', '카드 캐스케이드'],
  },
  ja: {
    title: '幻想郷ラッキードロー エフェクト試作', intro: 'シリーズ別アニメーションのモチーフを参考に、カードを主役にして再構成した比較画面です。',
    back: '幻想郷ラッキードローに戻る', cast: 'エフェクトの組み合わせ', prep: '準備', reveal: '公開動作', finish: '仕上げ', replay: 'もう一度再生',
    count: '公開枚数', one: '1枚', three: '3枚', five: '5枚', ten: '10枚', skip: 'すべて公開', waiting: '結界に光が集まります', names: '幻想郷の縁',
    namesOf: ['結界召喚', '桜の開花', '月光の境界', '星光弾幕', 'カードカスケード'],
  },
  en: {
    title: 'Gensokyo Lucky Draw effects prototype', intro: 'A card-focused exploration inspired by the motifs in the series animations.',
    back: 'Back to Gensokyo Lucky Draw', cast: 'Mix the effects', prep: 'Opening', reveal: 'Reveal motion', finish: 'Final flourish', replay: 'Replay',
    count: 'Cards to reveal', one: '1 card', three: '3 cards', five: '5 cards', ten: '10 cards', skip: 'Reveal all', waiting: 'Light gathers around the seal', names: 'A meeting in Gensokyo',
    namesOf: ['Barrier summon', 'Sakura bloom', 'Moonlit boundary', 'Starlight danmaku', 'Card cascade'],
  },
} as const;

const SLOT_OPTIONS: Record<Slot, readonly Effect[]> = {
  prep: ['barrier', 'sakura', 'moon', 'danmaku', 'cards'],
  reveal: ['barrier', 'sakura', 'moon', 'danmaku', 'cards'],
  finish: ['barrier', 'sakura', 'moon', 'danmaku', 'cards'],
};
const PRESETS: ReadonlyArray<{ prep: Effect; reveal: Effect; finish: Effect }> = [
  { prep: 'barrier', reveal: 'barrier', finish: 'danmaku' },
  { prep: 'sakura', reveal: 'sakura', finish: 'sakura' },
  { prep: 'moon', reveal: 'moon', finish: 'barrier' },
  { prep: 'danmaku', reveal: 'danmaku', finish: 'danmaku' },
  { prep: 'cards', reveal: 'cards', finish: 'sakura' },
];

export default function RandomEffectsPrototype() {
  const { lang } = useLang();
  const t = effectCopy[lang];
  const [combo, setCombo] = useState(PRESETS[0]);
  const [count, setCount] = useState(1);
  const [run, setRun] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const character = useMemo(() => PROFILE_CHARACTERS.find(item => getCharacterPortrait(item).src) ?? PROFILE_CHARACTERS[0], []);
  const labels = useMemo(() => Object.fromEntries(EFFECTS.map((effect, index) => [effect, t.namesOf[index]])) as Record<Effect, string>, [t]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }
    const timer = window.setTimeout(() => setRevealed(true), 1900 + count * 120);
    return () => window.clearTimeout(timer);
  }, [run, count]);

  const replay = () => {
    setRevealed(false);
    setSkipAnimation(false);
    setRun(value => value + 1);
  };
  const choosePreset = (index: number) => {
    setCombo(PRESETS[index]);
    setRevealed(false);
    setSkipAnimation(false);
    setRun(value => value + 1);
  };
  const updateSlot = (slot: Slot, effect: Effect) => {
    setCombo(current => ({ ...current, [slot]: effect }));
    setRevealed(false);
    setSkipAnimation(false);
    setRun(value => value + 1);
  };

  return <div className="random-fx-prototype">
    <header className="random-fx-heading">
      <a href="/introduce/characters/random">← {t.back}</a>
      <p className="random-fx-kicker">GENSOKYO · MOTION STUDY</p>
      <h1>{t.title}</h1>
      <p>{t.intro}</p>
    </header>

    <section className="random-fx-workbench" aria-label={t.cast}>
      <div className={`random-fx-stage random-fx-stage--${count}`} key={run}>
        <div className={`random-fx-backdrop fx-prep--${combo.prep}`} />
        <div className={`random-fx-flourish fx-finish--${combo.finish}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="random-fx-cards" data-reveal={revealed} data-skip={skipAnimation}>
          {Array.from({ length: count }, (_, index) => <article
            className={`random-fx-card fx-reveal--${combo.reveal}`}
            style={{ '--card-index': index } as React.CSSProperties}
            key={index}
          >
            <div className="random-fx-card-front"><span className="random-fx-seal">東</span></div>
            <div className="random-fx-card-face">
              <RandomPortrait character={character} className="random-fx-portrait" loading="eager" />
              <strong>{character[lang]}</strong>
              {count > 1 && <small>{t.names}</small>}
            </div>
          </article>)}
        </div>
        {!revealed && <p className="random-fx-caption">{t.waiting}</p>}
        <button className="random-fx-skip" type="button" onClick={() => { setSkipAnimation(true); setRevealed(true); }}>{t.skip}</button>
      </div>

      <div className="random-fx-controls">
        <h2>{t.cast}</h2>
        <div className="random-fx-count" aria-label={t.count}>
          {[1, 3, 5, 10].map(value => <button type="button" key={value} aria-pressed={count === value} onClick={() => { setCount(value); replay(); }}>{value === 1 ? t.one : value === 3 ? t.three : value === 5 ? t.five : t.ten}</button>)}
        </div>
        <div className="random-fx-slots">
          {(['prep', 'reveal', 'finish'] as const).map(slot => <label key={slot}>
            <span>{t[slot]}</span>
            <select value={combo[slot]} onChange={event => updateSlot(slot, event.target.value as Effect)}>
              {SLOT_OPTIONS[slot].map(effect => <option value={effect} key={effect}>{labels[effect]}</option>)}
            </select>
          </label>)}
        </div>
        <button type="button" className="random-fx-replay" onClick={replay}>✦ {t.replay}</button>
      </div>
    </section>

    <section className="random-fx-presets">
      <h2>{t.title}</h2>
      <div className="random-fx-preset-grid">
        {PRESETS.map((preset, index) => <button type="button" key={preset.prep} onClick={() => choosePreset(index)} aria-pressed={EFFECTS.indexOf(combo.prep) === index && combo.reveal === preset.reveal && combo.finish === preset.finish}>
          <span className={`random-fx-swatch fx-prep--${preset.prep}`} aria-hidden="true"><i /></span>
          <strong>{t.namesOf[index]}</strong>
          <small>{labels[preset.prep]} → {labels[preset.reveal]} → {labels[preset.finish]}</small>
        </button>)}
      </div>
    </section>
  </div>;
}
