import { useState, type ReactNode } from 'react';
import { useLang } from '../../contexts/LangContext';
import { PROFILE_CHARACTERS, type ProfileCharacter } from '../../data/profileCatalog';
import TasteDialog from './TasteDialog';
import TasteCharacterList from './TasteCharacterList';
import { CHARACTER_TOPICS, CHARACTER_TOPIC_BUNDLES, EMPTY_CHARACTER_FILTER, filterCharacters, type AppearanceStage, type CharacterFilter, type RoleFilter } from './characterCategories';
import { MAX_CELLS_PER_GROUP, MAX_CELLS_TOTAL, MAX_GROUPS } from './tasteBoardStorage';
import type { TasteBoard, TasteCell, TasteGroup, TasteSlot } from './tasteBoardTypes';

const copy = {
  ko: { title: '그룹 추가', close: '닫기', mode: '추가 방식', favorites: '작품별 최애', collect: '인물 모으기', empty: '빈 그룹', name: '그룹 이름', myGroup: '내 그룹', firstBossName: '1면 보스 모음', topics: '작품과 분류 선택', bundles: '묶음', works: '작품과 분류', all: '전체 인물', search: '이름 검색', role: '역할', allRoles: '모든 역할', playable: '플레이어', enemy: '적', boss: '보스', midboss: '중보스', opponent: '대전 상대', support: '지원·동료', other: '기타 역할', details: '상세 조건', stage: '스테이지', allStages: '모든 스테이지', final: '최종면', shortcut: '1면 보스', selectAll: '검색 결과 모두 선택', clear: '선택 해제', selected: '명 선택', noResults: '검색 결과가 없습니다.', note: '역할과 스테이지 조건으로 검색할 수 있습니다.', create: '그룹 추가', addSelected: '선택한 인물로 그룹 추가', groupLimit: '그룹은 최대 20개까지 추가할 수 있습니다.', cellLimit: (required: number, available: number) => `필요한 칸: ${required}개 · 남은 칸: ${available}개`, requiredName: '그룹 이름을 입력하세요.', requiredTopics: '주제를 하나 이상 선택하세요.', requiredCharacters: '인물을 한 명 이상 선택하세요.' },
  ja: { title: 'グループを追加', close: '閉じる', mode: '追加方法', favorites: '作品別の推し', collect: 'キャラクターを集める', empty: '空のグループ', name: 'グループ名', myGroup: 'マイグループ', firstBossName: '1面ボス集', topics: '作品と分類を選択', bundles: 'まとめ', works: '作品と分類', all: 'すべてのキャラクター', search: '名前を検索', role: '役割', allRoles: 'すべての役割', playable: 'プレイヤー', enemy: '敵', boss: 'ボス', midboss: '中ボス', opponent: '対戦相手', support: '支援・仲間', other: 'その他の役割', details: '詳細条件', stage: 'ステージ', allStages: 'すべてのステージ', final: '最終面', shortcut: '1面ボス', selectAll: '検索結果をすべて選択', clear: '選択解除', selected: '人選択', noResults: '検索結果がありません。', note: '役割やステージの条件で検索できます。', create: 'グループを追加', addSelected: '選択したキャラクターでグループを追加', groupLimit: 'グループは最大20個です。', cellLimit: (required: number, available: number) => `必要なマス: ${required} · 残り: ${available}`, requiredName: 'グループ名を入力してください。', requiredTopics: '主題を1つ以上選んでください。', requiredCharacters: 'キャラクターを1人以上選んでください。' },
  en: { title: 'Add group', close: 'Close', mode: 'Group type', favorites: 'Favorites by work', collect: 'Collect characters', empty: 'Empty group', name: 'Group name', myGroup: 'My group', firstBossName: 'Stage 1 bosses', topics: 'Choose works and categories', bundles: 'Bundles', works: 'Works and categories', all: 'All characters', search: 'Search names', role: 'Role', allRoles: 'All roles', playable: 'Playable', enemy: 'Enemy', boss: 'Boss', midboss: 'Midboss', opponent: 'Opponent', support: 'Support', other: 'Other role', details: 'Advanced filters', stage: 'Stage', allStages: 'All stages', final: 'Final stage', shortcut: 'Stage 1 bosses', selectAll: 'Select all results', clear: 'Clear selection', selected: 'selected', noResults: 'No results found.', note: 'Search by role and stage conditions.', create: 'Add group', addSelected: 'Add group with selected characters', groupLimit: 'A board can have at most 20 groups.', cellLimit: (required: number, available: number) => `Cells needed: ${required} · Available: ${available}`, requiredName: 'Enter a group name.', requiredTopics: 'Select at least one topic.', requiredCharacters: 'Select at least one character.' },
};

type Mode = 'favorites' | 'collect' | 'empty';
const favoriteTopics = [...CHARACTER_TOPICS, ...CHARACTER_TOPIC_BUNDLES.filter(topic => topic.id !== 'mainline')];
const defaultTopics = new Set([...Array.from({ length: 15 }, (_, index) => `th${index + 6}`), 'pc98', 'spinoff']);
const roles: RoleFilter[] = ['playable', 'enemy', 'boss', 'midboss', 'opponent', 'support', 'other'];

function findTasteGrid(count: number, availableCells: number): { rows: number; columns: number } | null {
  return Array.from({ length: 10 }, (_, index) => index + 1)
    .flatMap(rows => Array.from({ length: 10 }, (_, index) => ({ rows, columns: index + 1 })))
    .filter(grid => grid.rows * grid.columns >= count && grid.rows * grid.columns <= Math.min(availableCells, MAX_CELLS_PER_GROUP))
    .sort((a, b) => a.rows * a.columns - b.rows * b.columns || Math.abs(a.rows - a.columns) - Math.abs(b.rows - b.columns))[0] ?? null;
}

export default function TasteGroupDialog({ board, opener, onClose, onCreate, renderAvatar }: { board: TasteBoard; opener: HTMLElement | null; onClose: () => void; onCreate: (group: TasteGroup) => void; renderAvatar: (character: ProfileCharacter, size: number) => ReactNode }) {
  const { lang } = useLang();
  const t = copy[lang];
  const [mode, setMode] = useState<Mode>('favorites');
  const [titles, setTitles] = useState<Record<Mode, string>>(() => ({ favorites: t.favorites, collect: t.myGroup, empty: `Group ${board.groups.length + 1}` }));
  const [collectTitleEdited, setCollectTitleEdited] = useState(false);
  const [topicIds, setTopicIds] = useState<Set<string>>(() => new Set(defaultTopics));
  const [selected, setSelected] = useState<Map<string, string | null>>(() => new Map());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CharacterFilter>({ ...EMPTY_CHARACTER_FILTER });
  const available = Math.max(0, MAX_CELLS_TOTAL - board.groups.reduce((sum, group) => sum + group.cells.length, 0));
  const chosenTopics = favoriteTopics.filter(topic => topicIds.has(topic.id));
  const chosenCharacters = PROFILE_CHARACTERS.filter(character => selected.has(character.id));
  const results = filterCharacters(query, filter);
  const selectedIds = new Set(selected.keys());
  const selectedWorkId = CHARACTER_TOPICS.find(topic => topic.id === filter.topicId && topic.workIds.length === 1 && topic.workIds[0] === topic.id)?.id ?? null;
  const columns = chosenTopics.length ? Math.min(10, Math.max(Math.min(4, chosenTopics.length), Math.ceil(chosenTopics.length / 10))) : 0;
  const rows = columns ? Math.ceil(chosenTopics.length / columns) : 0;
  const favoriteCells = rows * columns;
  const grid = chosenCharacters.length ? findTasteGrid(chosenCharacters.length, available) : null;
  const minimumGrid = chosenCharacters.length ? findTasteGrid(chosenCharacters.length, MAX_CELLS_PER_GROUP) : null;
  const required = mode === 'favorites' ? favoriteCells : mode === 'empty' ? 9 : minimumGrid ? minimumGrid.rows * minimumGrid.columns : chosenCharacters.length;
  const fits = mode === 'collect' ? !!grid : required <= Math.min(available, MAX_CELLS_PER_GROUP);
  const hasSelection = mode === 'favorites' ? chosenTopics.length > 0 : mode === 'collect' ? chosenCharacters.length > 0 : true;
  const canCreate = !!titles[mode].trim() && hasSelection && fits && board.groups.length < MAX_GROUPS;

  const create = () => {
    if (!canCreate) return;
    const base = { id: crypto.randomUUID(), title: titles[mode].trim() };
    if (mode === 'favorites') {
      const slots: Array<TasteSlot | null> = chosenTopics.map(topic => ({ label: topic.label[lang], topicId: topic.id }));
      while (slots.length < favoriteCells) slots.push(null);
      onCreate({ ...base, rows, columns, cells: Array(favoriteCells).fill(null), slots });
    } else if (mode === 'collect' && grid) {
      const cells: Array<TasteCell | null> = Array(grid.rows * grid.columns).fill(null);
      chosenCharacters.forEach((character, index) => {
        const workId = selected.get(character.id);
        cells[index] = { characters: [character.id], label: '', ...(workId ? { versionWorkIds: { [character.id]: workId } } : {}) };
      });
      onCreate({ ...base, ...grid, cells });
    } else if (mode === 'empty') {
      onCreate({ ...base, rows: 3, columns: 3, cells: Array(9).fill(null) });
    }
  };

  return <TasteDialog label={t.title} className="taste-group-dialog" opener={opener} onClose={onClose}>
    <header><h2>{t.title}</h2><button type="button" aria-label={t.close} onClick={onClose}>×</button></header>
    <div className="taste-group-dialog-body">
      <div className="taste-group-dialog-controls">
        <label className="taste-field">{t.mode}<select value={mode} onChange={event => setMode(event.target.value as Mode)}><option value="favorites">{t.favorites}</option><option value="collect">{t.collect}</option><option value="empty">{t.empty}</option></select></label>
        <label className="taste-field">{t.name}<input autoFocus maxLength={100} value={titles[mode]} onChange={event => { setTitles(current => ({ ...current, [mode]: event.target.value })); if (mode === 'collect') setCollectTitleEdited(true); }} /></label>
        {mode === 'collect' && <>
          <label className="taste-field">{t.search}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label className="taste-field">{t.works}<select value={filter.topicId ?? ''} onChange={event => setFilter(current => ({ ...current, topicId: event.target.value || null }))}><option value="">{t.all}</option><optgroup label={t.bundles}>{CHARACTER_TOPIC_BUNDLES.map(topic => <option key={topic.id} value={topic.id}>{topic.label[lang]}</option>)}</optgroup><optgroup label={t.works}>{CHARACTER_TOPICS.map(topic => <option key={topic.id} value={topic.id}>{topic.label[lang]}</option>)}</optgroup></select></label>
          <label className="taste-field">{t.role}<select value={filter.role ?? ''} onChange={event => setFilter(current => ({ ...current, role: (event.target.value || null) as RoleFilter | null }))}><option value="">{t.allRoles}</option>{roles.map(role => <option key={role} value={role}>{t[role]}</option>)}</select></label>
          <details><summary>{t.details}</summary><label className="taste-field">{t.stage}<select value={filter.stage ?? ''} onChange={event => { const value = event.target.value; setFilter(current => ({ ...current, stage: value ? (/^[1-6]$/.test(value) ? Number(value) : value as AppearanceStage) : null })); }}><option value="">{t.allStages}</option>{Array.from({ length: 6 }, (_, index) => <option key={index + 1} value={index + 1}>{lang === 'en' ? `Stage ${index + 1}` : `${index + 1}面`}</option>)}<option value="final">{t.final}</option><option value="extra">Extra</option><option value="phantasm">Phantasm</option></select></label></details>
          <button type="button" onClick={() => { setFilter({ topicId: 'mainline', role: 'boss', stage: 1 }); if (!collectTitleEdited) setTitles(current => ({ ...current, collect: t.firstBossName })); }}>{t.shortcut}</button>
          <p>{t.note}</p>
        </>}
      </div>
      {mode === 'favorites' && <fieldset className="taste-group-topics"><legend>{t.topics}</legend>{favoriteTopics.map(topic => <label key={topic.id}><input type="checkbox" checked={topicIds.has(topic.id)} onChange={() => setTopicIds(current => { const next = new Set(current); if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id); return next; })} /> {topic.label[lang]}</label>)}</fieldset>}
      {mode === 'collect' && <div className="taste-group-results"><div className="taste-group-selection-actions"><button type="button" onClick={() => setSelected(current => { const next = new Map(current); results.forEach(character => { if (!next.has(character.id)) next.set(character.id, selectedWorkId); }); return next; })}>{t.selectAll}</button><button type="button" onClick={() => setSelected(new Map())}>{t.clear}</button><span>{selected.size} {t.selected}</span></div><TasteCharacterList query={query} filter={filter} selectedIds={selectedIds} disabledIds={new Set()} onSelect={id => setSelected(current => { const next = new Map(current); if (next.has(id)) next.delete(id); else next.set(id, selectedWorkId); return next; })} renderAvatar={renderAvatar} /></div>}
    </div>
    <footer><div aria-live="polite">{!titles[mode].trim() && <p>{t.requiredName}</p>}{!hasSelection && <p>{mode === 'favorites' ? t.requiredTopics : t.requiredCharacters}</p>}{board.groups.length >= MAX_GROUPS && <p>{t.groupLimit}</p>}{hasSelection && !fits && <p>{t.cellLimit(required, Math.min(available, MAX_CELLS_PER_GROUP))}</p>}</div><button type="button" onClick={onClose}>{t.close}</button><button type="button" disabled={!canCreate} onClick={create}>{mode === 'collect' ? t.addSelected : t.create}</button></footer>
  </TasteDialog>;
}
