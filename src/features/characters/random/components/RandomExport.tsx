import { useLang } from '../../../../contexts/LangContext';
import type { ProfileCharacter } from '../../../../data/profileCatalog';
import type { RandomCopy } from '../copy';
import RandomPortrait from './RandomPortrait';
import '../random-result.css';

export const RANDOM_EXPORT_ID = 'random-picker-export';

type Props = {
  characters: ProfileCharacter[];
  copy: RandomCopy;
};

function columnsFor(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 5;
}

/**
 * Off-screen, fixed-width capture target. It is deliberately simple so the PNG
 * reads as a share card rather than a screenshot of the tool.
 */
export default function RandomExport({ characters, copy }: Props) {
  const { lang } = useLang();
  const single = characters.length === 1;
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date());
  return <section
    id={RANDOM_EXPORT_ID}
    className={`random-export${single ? ' random-export--single' : ''}`}
    style={{ '--random-export-columns': columnsFor(characters.length) } as React.CSSProperties}
    aria-hidden="true"
  >
    <header className="random-export-header">
      <span className="random-export-eyebrow">{copy.eyebrow}</span>
      <h1>{copy.exportTitle}</h1>
      <p>{copy.exportDate(date)}</p>
    </header>
    <ul className="random-export-grid">
      {characters.map(character => <li key={character.id} className="random-export-character">
        <RandomPortrait character={character} className="random-export-portrait" loading="eager" decorative />
        <strong>{character[lang]}</strong>
        <span>{character.group[lang]}</span>
      </li>)}
    </ul>
    <footer className="random-export-footer">
      <span>{copy.exportFooter}</span>
      <span>{copy.resultCount(characters.length)}</span>
    </footer>
  </section>;
}
