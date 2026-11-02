import { type ReactNode } from 'react';
import { useLang } from '../../contexts/LangContext';
import { type ProfileCharacter } from '../../data/profileCatalog';
import { filterCharacters, type CharacterFilter } from './characterCategories';

const copy = {
  ko: { empty: '검색 결과가 없습니다.' },
  ja: { empty: '検索結果がありません。' },
  en: { empty: 'No characters found.' },
};

type Props = {
  query: string;
  filter: CharacterFilter;
  selectedIds: ReadonlySet<string>;
  disabledIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  renderAvatar: (character: ProfileCharacter, size: number) => ReactNode;
};

export default function TasteCharacterList({ query, filter, selectedIds, disabledIds, onSelect, renderAvatar }: Props) {
  const { lang } = useLang();
  const t = copy[lang];
  const characters = filterCharacters(query, filter);

  return <div className="taste-character-list">
    {characters.length === 0 && <p className="taste-picker-empty" role="status">{t.empty}</p>}
    {characters.map(character => <button key={character.id} className="taste-character-select" type="button" aria-label={character[lang]} aria-pressed={selectedIds.has(character.id)} disabled={disabledIds.has(character.id)} onClick={() => onSelect(character.id)}>
      {renderAvatar(character, 72)}
      <span className="taste-character-name">{character[lang]}</span>
    </button>)}
  </div>;
}
