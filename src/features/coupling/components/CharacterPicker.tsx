import { useMemo, useState, type RefObject } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { PROFILE_CHARACTERS, type ProfileCharacter } from '../data';
import { normalizeCouplingSearch } from '../relations';
import copy from '../copy';
import CharacterAvatar from './CharacterAvatar';

type Props = {
  onSelect: (character: ProfileCharacter) => void;
  selectedIds?: readonly string[];
  disabledIds?: readonly string[];
  initialGroup?: string;
  autoFocus?: boolean;
  label?: string;
  searchRef?: RefObject<HTMLInputElement>;
};
export default function CharacterPicker({ onSelect, selectedIds = [], disabledIds = [], initialGroup = '', autoFocus = false, label, searchRef }: Props) {
  const { lang } = useLang();
  const t = copy[lang];
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(initialGroup);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const disabled = useMemo(() => new Set(disabledIds), [disabledIds]);
  const works = useMemo(() => [...new Map(PROFILE_CHARACTERS.map(character => [character.group[lang], character.group[lang]])).values()], [lang]);
  const normalizedQuery = normalizeCouplingSearch(query);
  const results = PROFILE_CHARACTERS.filter(character =>
    (!group || character.group[lang] === group) && (!normalizedQuery || normalizeCouplingSearch(
      `${character.ko}${character.ja}${character.en}${character.group.ko}${character.group.ja}${character.group.en}`,
    ).includes(normalizedQuery)),
  );
  return <section className="coupling-picker" aria-label={label ?? t.pickerTitle}>
    <div className="coupling-picker-top">
      <h2>{t.pickerTitle} <small>{PROFILE_CHARACTERS.length}</small></h2>
      <label className="coupling-field">{t.search}<input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder} autoFocus={autoFocus} /></label>
      <label className="coupling-field">{t.work}<select value={group} onChange={event => setGroup(event.target.value)}><option value="">{t.allWorks}</option>{works.map(work => <option key={work} value={work}>{work}</option>)}</select></label>
      <p className="coupling-picker-count" aria-live="polite">{results.length} / {PROFILE_CHARACTERS.length}</p>
    </div>
    <div className="coupling-picker-results" role="list" aria-label={t.pickerTitle}>
      {results.map(character => {
        const isSelected = selected.has(character.id);
        const isDisabled = isSelected || disabled.has(character.id);
        return <button key={character.id} className="coupling-character-choice" type="button" role="listitem" disabled={isDisabled} aria-pressed={isSelected} data-character={character.id} onClick={() => onSelect(character)}>
          <CharacterAvatar character={character} size={36} decorative />
          <span><strong>{character[lang]}</strong><small>{character.group[lang]}</small></span>
          <span className="coupling-choice-mark" aria-hidden="true">{isSelected ? '✓' : '+'}</span>
        </button>;
      })}
      {results.length === 0 && <p className="coupling-empty-note">{t.noResults}</p>}
    </div>
  </section>;
}
