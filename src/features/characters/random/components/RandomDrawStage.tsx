import type { ProfileCharacter } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import RandomPortrait from './RandomPortrait';
import type { RefObject } from 'react';

type Props = {
  phase: 'idle' | 'drawing' | 'revealing';
  result: ProfileCharacter[] | null;
  copy: RandomCopy;
  poolEmpty: boolean;
  onDraw: () => void;
  drawButtonRef: RefObject<HTMLButtonElement>;
};

/** Card-back draw stage and the primary draw action. */
export default function RandomDrawStage({ phase, result, copy, poolEmpty, onDraw, drawButtonRef }: Props) {
  const busy = phase !== 'idle';
  const label = phase === 'drawing' ? copy.drawing : phase === 'revealing' ? copy.revealing : result ? copy.drawAgain : copy.draw;
  return <section className="random-draw-stage" aria-busy={busy}>
    <div className="random-stage-art" aria-hidden="true">
      <span className="random-stage-ring" />
        <span className={`random-card-back${busy ? ' is-drawing' : ''}`}>
        <span className="random-card-back-mark">東</span>
        <span className="random-card-back-line" />
      </span>
      <span className="random-stage-shadow" />
      {phase === 'idle' && result?.length ? <span className="random-stage-peek"><RandomPortrait character={result[0]} size={76} decorative /></span> : null}
    </div>
    <div className="random-stage-copy">
      <h2>{result?.length ? copy.result : copy.idleTitle}</h2>
      <p>{phase === 'drawing' ? copy.drawing : phase === 'revealing' ? copy.revealing : result?.length ? copy.resultCount(result.length) : copy.idleHint}</p>
    </div>
    <div className="random-draw-cta">
      <button ref={drawButtonRef} type="button" className="random-primary-action" onClick={onDraw} aria-disabled={busy}>
        <span aria-hidden="true">✦</span> {label}
      </button>
      {poolEmpty && <p className="random-hint" role="status">{copy.emptyBody}</p>}
    </div>
  </section>;
}
