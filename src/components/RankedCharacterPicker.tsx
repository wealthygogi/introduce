import { useMemo, useState } from 'react';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { PROFILE_CHARACTERS, MAX_RANKED_CHARACTERS } from '../data/profileCatalog';

const copy = { ko: { title: '최애 캐릭터 순위', search: '캐릭터 검색', group: '그룹 필터', count: '선택', add: '추가', remove: '삭제', up: '위로', down: '아래로', full: '최대 순위에 도달했습니다' }, ja: { title: '好きなキャラクター順位', search: 'キャラクター検索', group: 'グループで絞り込む', count: '選択', add: '追加', remove: '削除', up: '上へ', down: '下へ', full: '上限に達しました' }, en: { title: 'Ranked characters', search: 'Search characters', group: 'Filter by group', count: 'selected', add: 'Add', remove: 'Remove', up: 'Move up', down: 'Move down', full: 'Maximum ranks reached' } };
export default function RankedCharacterPicker() {
  const { state, set } = useFormState(); const { lang } = useLang(); const [query, setQuery] = useState(''); const [group, setGroup] = useState(''); const t = copy[lang];
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROFILE_CHARACTERS.filter(c => (!group || c.group.ko === group) && (!q || [c.ko, c.ja, c.en].some(n => n.toLowerCase().includes(q))));
  }, [group, query]);
  const groups = [...new Map(PROFILE_CHARACTERS.map(c => [c.group.ko, c.group])).values()];
  const update = (ids: string[]) => set('rankedCharacters', ids);
  return <section className="wide-picker" aria-label={t.title}><h3>{t.title} <small>{state.rankedCharacters.length}/{MAX_RANKED_CHARACTERS}</small></h3>
    <label className="wide-picker-label" htmlFor="wide-character-search">{t.search}</label><input id="wide-character-search" type="search" value={query} onChange={e => setQuery(e.target.value)} />
    <label className="wide-picker-label" htmlFor="wide-character-group">{t.group}</label><select id="wide-character-group" value={group} onChange={e => setGroup(e.target.value)}><option value="">{lang === 'ko' ? '전체' : lang === 'ja' ? 'すべて' : 'All'}</option>{groups.map(g => <option key={g.ko} value={g.ko}>{g[lang]}</option>)}</select>
    <ol className="wide-ranked-list">{state.rankedCharacters.map((id, i) => { const c = PROFILE_CHARACTERS.find(x => x.id === id)!; return <li key={id} data-character-selected={id}><span>{i + 1}. {c[lang]}</span><div><button type="button" data-rank-up={id} aria-label={`${t.up}: ${c[lang]}`} disabled={!i} onClick={() => { const a = [...state.rankedCharacters]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; update(a); }}>{t.up}</button><button type="button" data-rank-down={id} aria-label={`${t.down}: ${c[lang]}`} disabled={i === state.rankedCharacters.length - 1} onClick={() => { const a = [...state.rankedCharacters]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; update(a); }}>{t.down}</button><button type="button" data-rank-remove={id} aria-label={`${t.remove}: ${c[lang]}`} onClick={() => update(state.rankedCharacters.filter(x => x !== id))}>{t.remove}</button></div></li>; })}</ol>
    {state.rankedCharacters.length === MAX_RANKED_CHARACTERS && <p>{t.full}</p>}<div className="wide-picker-results" role="group" aria-label={t.search}>{results.map(c => <button type="button" key={c.id} data-character-choice={c.id} disabled={state.rankedCharacters.includes(c.id) || state.rankedCharacters.length >= MAX_RANKED_CHARACTERS} onClick={() => update([...state.rankedCharacters, c.id])}>{c[lang]}{state.rankedCharacters.includes(c.id) ? ` · ${t.count}` : ` · ${t.add}`}</button>)}</div>
  </section>;
}
