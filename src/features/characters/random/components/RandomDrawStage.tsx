import type { ProfileCharacter } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import RandomPortrait from './RandomPortrait';

type Props = {
  phase: 'idle' | 'drawing';
  result: ProfileCharacter[] | null;
  copy: RandomCopy;
  poolEmpty: boolean;
  onDraw: () => void;
};

/** Card-back draw stage and the primary draw action. */
export default function RandomDrawStage({ phase, result, copy, poolEmpty, onDraw }: Props) {
  const drawing = phase === 'drawing';
  const label = drawing ? copy.drawing : result ? copy.drawAgain : copy.draw;
  return <section className="random-draw-stage" aria-busy={drawing}>
    <div className="random-stage-art" aria-hidden="true">
      <span className="random-stage-ring" />
      <span className={`random-card-back${drawing ? ' is-drawing' : ''}`}>
        <span className="random-card-back-mark">東</span>
        <span className="random-card-back-line" />
      </span>
      <span className="random-stage-shadow" />
      {result?.length === 1 && <span className="random-stage-peek"><RandomPortrait character={result[0]} size={96} decorative /></span>}
    </div>
    <div className="random-stage-copy">
      <h2>{result?.length ? copy.result : copy.idleTitle}</h2>
      <p>{drawing ? copy.drawing : result?.length ? copy.resultCount(result.length) : copy.idleHint}</p>
    </div>
    <div className="random-draw-cta">
      <button type="button" className="random-primary-action" onClick={onDraw} disabled={drawing} aria-disabled={drawing}>
        <span aria-hidden="true">✦</span> {label}
      </button>
      {poolEmpty && <p className="random-hint" role="status">{copy.emptyBody}</p>}
    </div>
  </section>;
}
