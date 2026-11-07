import { useEffect } from 'react';
import type { ProfileCharacter } from '../../../../data/profileCatalog';
import { useLang } from '../../../../contexts/LangContext';
import type { RandomCopy } from '../copy';
import type { RandomRevealPlan } from '../revealEffects';
import RandomPortrait from './RandomPortrait';

type Props = {
  characters: ProfileCharacter[];
  plan: RandomRevealPlan;
  copy: RandomCopy;
  onComplete: () => void;
  onSkip: () => void;
};

export default function RandomReveal({ characters, plan, copy, onComplete, onSkip }: Props) {
  const { lang } = useLang();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, 1400 + (characters.length - 1) * 105);
    return () => window.clearTimeout(timer);
  }, [characters.length, onComplete]);

  return <section
    className="random-reveal"
    data-series={plan.series.id}
    data-motif={plan.series.motif}
    data-opening={plan.opening}
    data-motion={plan.motion}
    data-finish={plan.finish}
    aria-label={copy.revealSeries(plan.series.title[lang])}
  >
    <div className="random-reveal-scene" aria-hidden="true">
      <div className="random-reveal-halo" />
      <ul className={`random-reveal-grid random-reveal-grid--${characters.length}`}>
        {characters.map((character, index) => <li className="random-reveal-card" style={{ '--reveal-index': index } as React.CSSProperties} key={character.id}>
          <div className="random-reveal-card-inner">
            <span className="random-reveal-card-back"><span>東</span></span>
            <span className="random-reveal-card-face">
              <RandomPortrait character={character} className="random-reveal-portrait" loading="eager" decorative />
              <strong>{character[lang]}</strong>
            </span>
          </div>
        </li>)}
      </ul>
      <div className="random-reveal-particles">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
    </div>
    <div className="random-reveal-footer">
      <p>{copy.revealSeries(plan.series.title[lang])}</p>
      <button type="button" className="random-secondary-action" onClick={onSkip}>{copy.skipReveal}</button>
    </div>
  </section>;
}
