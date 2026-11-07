import { useLang } from '../../../../contexts/LangContext';
import { PROFILE_CHARACTER_BY_ID } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import type { RandomDrawRecord } from '../types';
import RandomPortrait from './RandomPortrait';

type Props = {
  records: RandomDrawRecord[];
  copy: RandomCopy;
  activeId: string | null;
  onOpen: (record: RandomDrawRecord) => void;
  onClear: () => void;
  canUndo: boolean;
  onUndo: () => void;
};

export default function RandomHistory({ records, copy, activeId, onOpen, onClear, canUndo, onUndo }: Props) {
  const { lang } = useLang();
  const formatter = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const newestFirst = [...records].sort((a, b) => b.at - a.at);
  return <section className="random-history" aria-label={copy.history}>
    <header className="random-history-header">
      <h2>{copy.history}</h2>
      {records.length > 0 && <button type="button" className="random-text-button" onClick={onClear}>{copy.historyClear}</button>}
    </header>
    {newestFirst.length === 0
      ? <p className="random-hint" role="status">{copy.historyEmpty}</p>
      : <ul className="random-history-list">
        {newestFirst.map(record => {
          const characters = record.characterIds
            .map(id => PROFILE_CHARACTER_BY_ID.get(id))
            .filter((character): character is NonNullable<typeof character> => Boolean(character));
          const names = characters.map(character => character[lang]).join(', ');
          return <li key={record.id}>
            <button
              type="button"
              className="random-history-item"
              aria-pressed={record.id === activeId}
              onClick={() => onOpen(record)}
            >
              <span className="random-history-thumbs" aria-hidden="true">
                {characters.slice(0, 3).map(character => <RandomPortrait key={character.id} character={character} size={34} decorative />)}
              </span>
              <span className="random-history-copy">
                <strong>{copy.resultCount(characters.length)}</strong>
                <span>{names}</span>
                <time dateTime={new Date(record.at).toISOString()}>{formatter.format(record.at)}</time>
              </span>
            </button>
          </li>;
        })}
      </ul>}
    {canUndo && <div className="random-history-undo" role="status">
      <span>{copy.historyCleared}</span>
      <button type="button" className="random-text-button" onClick={onUndo}>{copy.undo}</button>
    </div>}
  </section>;
}
