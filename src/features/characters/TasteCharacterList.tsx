import { useId, useRef, useState, type ReactNode } from 'react';
import { useLang } from '../../contexts/LangContext';
import { PROFILE_WORK_BY_ID, type ProfileCharacter } from '../../data/profileCatalog';
import { allAppearances, APPEARANCE_SOURCES, appearanceSummary, filterCharacters, formatAppearance, type CharacterFilter } from './characterCategories';

const copy = {
  ko: { empty: '검색 결과가 없습니다.', info: '출연 정보', close: '닫기', conditional: '일부 경로', unknown: '출연 정보 미확인', source: '출처', revision: '판' },
  ja: { empty: '検索結果がありません。', info: '出演情報', close: '閉じる', conditional: '一部ルート', unknown: '出演情報未確認', source: '出典', revision: '版' },
  en: { empty: 'No characters found.', info: 'Appearance information', close: 'Close', conditional: 'Some routes', unknown: 'Appearance information unconfirmed', source: 'Source', revision: 'Revision' },
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
  const listId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const infoButtons = useRef(new Map<string, HTMLButtonElement>());
  const characters = filterCharacters(query, filter);

  return <div className="taste-character-list">
    {characters.length === 0 && <p className="taste-picker-empty" role="status">{t.empty}</p>}
    {characters.map(character => {
      const summary = appearanceSummary(character.id, filter, lang);
      const expanded = openId === character.id;
      const regionId = `${listId}-${character.id}`;
      const facts = expanded ? allAppearances(character.id) : [];
      return <div className="taste-character-card" key={character.id}>
        <button className="taste-character-select" type="button" aria-label={character[lang]} aria-pressed={selectedIds.has(character.id)} disabled={disabledIds.has(character.id)} onClick={() => onSelect(character.id)}>
          {renderAvatar(character, 72)}
          <span className="taste-character-name">{character[lang]}</span>
          <span className="taste-character-summary">{summary.slice(0, 2).map((item, index) => <span key={index}>{item}</span>)}{summary.length > 2 && <span>+{summary.length - 2}</span>}</span>
        </button>
        <button className="taste-character-info" type="button" aria-label={`${character[lang]} ${t.info}`} aria-expanded={expanded} aria-controls={regionId} ref={element => { if (element) infoButtons.current.set(character.id, element); else infoButtons.current.delete(character.id); }} onClick={() => setOpenId(expanded ? null : character.id)}>{t.info}</button>
        {expanded && <div className="taste-character-details" id={regionId} role="region" aria-label={`${character[lang]} ${t.info}`}>
          {facts.length === 0 ? <p>{t.unknown}</p> : <ul>{facts.map((fact, index) => <li key={index}>
            <strong>{PROFILE_WORK_BY_ID.get(fact.workId)?.[lang] ?? fact.workId}</strong>{' · '}{formatAppearance(fact, lang)}{fact.conditional && ` · ${t.conditional}`}
            <ul>{fact.sources.map(sourceIndex => { const source = APPEARANCE_SOURCES[sourceIndex]; return source && <li key={sourceIndex}><a href={source.url} target="_blank" rel="noreferrer">{t.source}: {source.locator}</a> (<a href={`${source.url}${source.url.includes('?') ? '&' : '?'}oldid=${encodeURIComponent(source.revisionId)}`} target="_blank" rel="noreferrer">{t.revision} {source.revisionId}</a>)</li>; })}</ul>
          </li>)}</ul>}
          <button type="button" onClick={() => { setOpenId(null); infoButtons.current.get(character.id)?.focus(); }}>{t.close}</button>
        </div>}
      </div>;
    })}
  </div>;
}
