import { useLang } from '../../../../contexts/LangContext';
import type { ProfileCharacter } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import RandomPortrait from './RandomPortrait';

type Props = {
  characters: ProfileCharacter[];
  copy: RandomCopy;
  onCopy: () => void;
  onSave: () => void;
  copyState: 'idle' | 'copied' | 'failed';
  saveState: 'idle' | 'preparing' | 'ready' | 'failed';
};

export default function RandomResultCard({ characters, copy, onCopy, onSave, copyState, saveState }: Props) {
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
      <button type="button" className="random-primary-action" onClick={onSave} disabled={saveState === 'preparing'} data-save-state={saveState}>
        <span aria-hidden="true">↓</span> {saveState === 'preparing' ? copy.saving : saveState === 'ready' ? copy.saveReady : saveState === 'failed' ? copy.saveFailed : copy.save}
      </button>
      <button type="button" className="random-secondary-action" onClick={onCopy}>{copy.copyText}</button>
    </div>
    {saveState === 'failed' && <p className="random-warning" role="status">{copy.saveFailed}</p>}
    {copyState !== 'idle' && <p className={copyState === 'failed' ? 'random-warning' : 'random-hint'} role="status">{copyState === 'copied' ? copy.copied : copy.copyFailed}</p>}
  </section>;
}
