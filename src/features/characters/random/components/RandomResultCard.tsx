import { useLang } from '../../../../contexts/LangContext';
import type { ProfileCharacter } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import RandomPortrait from './RandomPortrait';

type Props = {
  characters: ProfileCharacter[];
  copy: RandomCopy;
  onCopy: () => void;
  onSave: () => void;
  onOpenPair?: () => void;
  copyState: 'idle' | 'copied' | 'failed';
  saveState: 'idle' | 'preparing' | 'ready' | 'failed';
};

export default function RandomResultCard({ characters, copy, onCopy, onSave, onOpenPair, copyState, saveState }: Props) {
  const { lang } = useLang();
  return <section className={`random-result random-result--${characters.length}`} aria-label={copy.result}>
    <header className="random-result-header">
      <div>
        <span className="random-eyebrow">{copy.result}</span>
        <h2>{copy.resultCount(characters.length)}</h2>
      </div>
      <span className="random-result-stamp" aria-hidden="true">GENSOKYO</span>
    </header>

    <ul className="random-result-grid">
      {characters.map(character => <li key={character.id} className="random-result-card">
        <RandomPortrait character={character} className="random-result-portrait" loading="eager" />
        <strong className="random-result-name">{character[lang]}</strong>
        <span className="random-result-group">{character.group[lang]}</span>
      </li>)}
    </ul>

    <div className="random-result-actions">
      <button type="button" className="random-primary-action" onClick={onSave} disabled={saveState === 'preparing'} aria-live="polite">
        <span aria-hidden="true">↓</span> {saveState === 'preparing' ? copy.saving : saveState === 'ready' ? copy.saveReady : copy.save}
      </button>
      <button type="button" className="random-secondary-action" onClick={onCopy}>{copyTextFor(copy, copyState)}</button>
      {onOpenPair && <button type="button" className="random-secondary-action" onClick={onOpenPair}>{copy.pairAction}</button>}
    </div>
    {saveState === 'failed' && <p className="random-warning" role="status">{copy.saveFailed}</p>}
    {copyState === 'copied' && <p className="random-hint" role="status">{copy.copied}</p>}
    {copyState === 'failed' && <p className="random-warning" role="status">{copy.copyFailed}</p>}
    {onOpenPair && <p className="random-hint">{copy.pairHint}</p>}
  </section>;
}

function copyTextFor(copy: RandomCopy, state: 'idle' | 'copied' | 'failed'): string {
  if (state === 'copied') return copy.copied;
  if (state === 'failed') return copy.copyFailed;
  return copy.copyText;
}
