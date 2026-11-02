import { useState, type ReactNode } from 'react';
import { useLang } from '../../contexts/LangContext';
import { PROFILE_CHARACTERS, PROFILE_WORKS, type ProfileCharacter } from '../../data/profileCatalog';
import TasteDialog from './TasteDialog';
import TasteCharacterList from './TasteCharacterList';
import { CHARACTER_TOPICS, CHARACTER_TOPIC_BUNDLES, EMPTY_CHARACTER_FILTER, filterGroupCharacters, type AppearanceStage, type GroupCharacterFilter, type RoleFilter } from './characterCategories';
import { MAX_CELLS_PER_GROUP, MAX_CELLS_TOTAL, MAX_GROUPS } from './tasteBoardStorage';
import type { TasteBoard, TasteCell, TasteGroup, TasteSlot } from './tasteBoardTypes';

const copy = {
  ko: { title: '그룹 추가', close: '닫기', mode: '만들기 방식', favorites: '작품별 최애', collect: '조건별 모음', empty: '자유 그룹', name: '그룹 이름', myGroup: '내 그룹', firstBossName: '1면 보스 모음', topics: '작품과 분류 선택', scope: '작품 범위', all: '전체 인물', mainline: '정규작', pc98: '구작', spinoff: '외전', books: '서적', works: '개별 작품 선택 (선택하지 않으면 범위 전체)', search: '이름 검색', role: '역할 (복수 선택 가능)', playable: '플레이어', enemy: '적', boss: '보스', midboss: '중보스', opponent: '대전 상대', support: '지원·동료', other: '기타 역할', stage: '스테이지', allStages: '모든 스테이지', final: '최종면', shortcut: '1면 보스', selectAll: '검색 결과 모두 선택', clear: '선택 해제', selected: '명 선택', note: '확인된 출연 정보를 기준으로 필터링합니다. 정보가 없는 인물은 전체 인물에서 직접 추가할 수 있습니다.', bookNote: '서적 관련 후보(언급 포함), 불완전. 최초 등장이나 서적 원작을 의미하지 않습니다.', reset: '전체 인물에서 직접 추가', settings: '그룹 설정', selection: '인물 선택', next: '인물 선택으로', back: '그룹 설정으로', create: '그룹 추가', addSelected: '선택한 인물로 그룹 추가', groupLimit: '그룹은 최대 20개까지 추가할 수 있습니다.', cellLimit: (required: number, available: number) => `필요한 칸: ${required}개 · 남은 칸: ${available}개`, requiredName: '그룹 이름을 입력해 주세요.', requiredTopics: '작품이나 분류를 선택해 주세요.', requiredCharacters: '인물을 선택해 주세요.' },
  ja: { title: 'グループを追加', close: '閉じる', mode: '作成方法', favorites: '作品別の推し', collect: '条件別の集まり', empty: '自由グループ', name: 'グループ名', myGroup: 'マイグループ', firstBossName: '1面ボス集', topics: '作品と分類を選択', scope: '作品範囲', all: '全キャラクター', mainline: '整数作品', pc98: '旧作', spinoff: '外伝', books: '書籍', works: '個別作品を選択（未選択なら範囲全体）', search: '名前を検索', role: '役割（複数選択可）', playable: 'プレイヤー', enemy: '敵', boss: 'ボス', midboss: '中ボス', opponent: '対戦相手', support: '支援・仲間', other: 'その他の役割', stage: 'ステージ', allStages: 'すべてのステージ', final: '最終面', shortcut: '1面ボス', selectAll: '検索結果をすべて選択', clear: '選択解除', selected: '人選択', note: '確認された出演情報に基づく検索です。情報がない人物も全キャラクターから直接追加できます。', bookNote: '書籍関連の候補（言及を含む）、不完全。初登場や書籍原作を意味しません。', reset: '全キャラクターから直接追加', settings: 'グループ設定', selection: 'キャラクター選択', next: 'キャラクター選択へ', back: 'グループ設定へ', create: 'グループを追加', addSelected: '選択したキャラクターで追加', groupLimit: 'グループは最大20個です。', cellLimit: (required: number, available: number) => `必要なマス: ${required} · 残り: ${available}`, requiredName: 'グループ名を入力してください。', requiredTopics: '作品か分類を選択してください。', requiredCharacters: 'キャラクターを選択してください。' },
  en: { title: 'Add group', close: 'Close', mode: 'Creation method', favorites: 'Favorites by work', collect: 'Collect by criteria', empty: 'Free group', name: 'Group name', myGroup: 'My group', firstBossName: 'Stage 1 bosses', topics: 'Choose works and categories', scope: 'Work scope', all: 'All characters', mainline: 'Mainline', pc98: 'PC-98', spinoff: 'Spin-offs', books: 'Books', works: 'Individual works (none selected means the whole scope)', search: 'Search names', role: 'Roles (multiple allowed)', playable: 'Playable', enemy: 'Enemy', boss: 'Boss', midboss: 'Midboss', opponent: 'Opponent', support: 'Support', other: 'Other role', stage: 'Stage', allStages: 'All stages', final: 'Final stage', shortcut: 'Stage 1 bosses', selectAll: 'Select all results', clear: 'Clear selection', selected: 'selected', note: 'Filters use confirmed appearances. Characters without information can still be added from all characters.', bookNote: 'Book-related candidates (including mentions), incomplete. This does not indicate a first appearance or book origin.', reset: 'Add directly from all characters', settings: 'Group settings', selection: 'Select characters', next: 'Select characters', back: 'Back to settings', create: 'Add group', addSelected: 'Add selected characters', groupLimit: 'A board can contain at most 20 groups.', cellLimit: (required: number, available: number) => `Cells needed: ${required} · Available: ${available}`, requiredName: 'Enter a group name.', requiredTopics: 'Choose a work or category.', requiredCharacters: 'Choose characters.' },
};

const layoutCopy = {
  ko: { size: '격자 크기', custom: '직접 선택', rows: '행 수', columns: '열 수', note: '확인된 게임 기록을 기준으로 찾습니다. 빠진 인물은 전체 인물에서 직접 추가할 수 있습니다.', stageHint: '면을 선택하려면 보스, 중보스 또는 적을 선택하세요.', intro: '원하는 방식으로 새 그룹을 구성해 모음표에 추가합니다.', modeHint: { favorites: '작품마다 최애를 하나씩 담아요.', collect: '작품·역할·면 조건으로 모아요.', empty: '크기를 정하고 직접 채워요.' } },
  ja: { size: 'グリッドのサイズ', custom: 'サイズを指定', rows: '行数', columns: '列数', note: '確認されたゲームの記録から探します。含まれない人物も全キャラクターから直接追加できます。', stageHint: 'ステージを選ぶにはボス、中ボス、敵を選択してください。', intro: 'レイアウトを選び、ボードに追加します。', modeHint: { favorites: '作品ごとにお気に入りを配置します。', collect: '作品・役割・ステージで集めます。', empty: 'サイズを選び、自分で埋めます。' } },
  en: { size: 'Grid size', custom: 'Custom size', rows: 'Rows', columns: 'Columns', note: 'Search uses confirmed game records. Missing characters can be added directly from all characters.', stageHint: 'Select boss, midboss, or enemy to choose a stage.', intro: 'Choose a layout, then add it to your board.', modeHint: { favorites: 'A favorite slot for each work.', collect: 'Build a set from works, roles, and stages.', empty: 'Choose a grid and fill it yourself.' } },
} as const;
const gridPresets = [[1, 3], [3, 3], [4, 4], [5, 5]] as const;
const gridSizes = Array.from({ length: 10 }, (_, index) => index + 1);
const stageRoles: RoleFilter[] = ['boss', 'midboss', 'enemy'];

type Mode = 'favorites' | 'collect' | 'empty';
type Scope = GroupCharacterFilter['scope'];
const favoriteTopics = [...CHARACTER_TOPICS, ...CHARACTER_TOPIC_BUNDLES.filter(topic => topic.id !== 'mainline')];
const defaultTopics = new Set([...Array.from({ length: 15 }, (_, index) => `th${index + 6}`), 'pc98', 'spinoff']);
const roles: RoleFilter[] = ['playable', 'enemy', 'boss', 'midboss', 'opponent', 'support', 'other'];
const scopes: Scope[] = ['all', 'mainline', 'pc98', 'spinoff', 'books'];
const mainIds = new Set(Array.from({ length: 20 }, (_, index) => `th${index + 1}`));
const pc98Ids = new Set(['th1', 'th2', 'th3', 'th4', 'th5']);
const emptyFilter = (): GroupCharacterFilter => ({ scope: 'all', workIds: [], roles: [], stage: null });

function findTasteGrid(count: number, availableCells: number): { rows: number; columns: number } | null {
  return Array.from({ length: 10 }, (_, index) => index + 1)
    .flatMap(rows => Array.from({ length: 10 }, (_, index) => ({ rows, columns: index + 1 })))
    .filter(grid => grid.rows * grid.columns >= count && grid.rows * grid.columns <= Math.min(availableCells, MAX_CELLS_PER_GROUP))
    .sort((a, b) => a.rows * a.columns - b.rows * b.columns || Math.abs(a.rows - a.columns) - Math.abs(b.rows - b.columns))[0] ?? null;
}

export default function TasteGroupDialog({ board, opener, onClose, onCreate, renderAvatar }: { board: TasteBoard; opener: HTMLElement | null; onClose: () => void; onCreate: (group: TasteGroup) => void; renderAvatar: (character: ProfileCharacter, size: number) => ReactNode }) {
  const { lang } = useLang();
  const t = copy[lang];
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<'settings' | 'selection'>('settings');
  const [titles, setTitles] = useState<Record<Mode, string>>(() => ({ favorites: t.favorites, collect: t.myGroup, empty: `${t.myGroup} ${board.groups.length + 1}` }));
  const [freeRows, setFreeRows] = useState(3);
  const [freeColumns, setFreeColumns] = useState(3);
  const [topicIds, setTopicIds] = useState<Set<string>>(() => new Set(defaultTopics));
  const [selected, setSelected] = useState<Map<string, string | null>>(() => new Map());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<GroupCharacterFilter>(emptyFilter);
  const available = Math.max(0, MAX_CELLS_TOTAL - board.groups.reduce((sum, group) => sum + group.cells.length, 0));
  const chosenTopics = favoriteTopics.filter(topic => topicIds.has(topic.id));
  const chosenCharacters = PROFILE_CHARACTERS.filter(character => selected.has(character.id));
  const results = filterGroupCharacters(query, filter);
  const selectedIds = new Set(selected.keys());
  const selectedWorkId = filter.scope !== 'books' && filter.workIds.length === 1 && PROFILE_WORKS.some(work => work.id === filter.workIds[0] && work.category === 'game') ? filter.workIds[0] : null;
  const workOptions = PROFILE_WORKS.filter(work => filter.scope === 'books' ? work.category === 'book' : work.category === 'game' && (filter.scope === 'all' || (filter.scope === 'mainline' ? mainIds.has(work.id) : filter.scope === 'pc98' ? pc98Ids.has(work.id) : !mainIds.has(work.id))));
  const stageDisabled = filter.scope === 'books' || !filter.roles.some(role => stageRoles.includes(role));
  const columns = chosenTopics.length ? Math.min(10, Math.max(Math.min(4, chosenTopics.length), Math.ceil(chosenTopics.length / 10))) : 0;
  const rows = columns ? Math.ceil(chosenTopics.length / columns) : 0;
  const favoriteCells = rows * columns;
  const grid = chosenCharacters.length ? findTasteGrid(chosenCharacters.length, available) : null;
  const minimumGrid = chosenCharacters.length ? findTasteGrid(chosenCharacters.length, MAX_CELLS_PER_GROUP) : null;
  const required = mode === 'favorites' ? favoriteCells : mode === 'empty' ? freeRows * freeColumns : minimumGrid ? minimumGrid.rows * minimumGrid.columns : chosenCharacters.length;
  const fits = mode === 'collect' ? !!grid : required <= Math.min(available, MAX_CELLS_PER_GROUP);
  const hasSelection = mode === 'favorites' ? chosenTopics.length > 0 : mode === 'collect' ? chosenCharacters.length > 0 : true;
  const canCreate = !!mode && !!titles[mode].trim() && hasSelection && fits && board.groups.length < MAX_GROUPS;

  const create = () => {
    if (!mode || !canCreate) return;
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
      onCreate({ ...base, rows: freeRows, columns: freeColumns, cells: Array(freeRows * freeColumns).fill(null) });
    }
  };

  return <TasteDialog label={t.title} className={`taste-group-dialog${mode ? ' taste-group-dialog--configured' : ''}`} opener={opener} onClose={onClose}>
    <header className="taste-group-header"><div><span className="taste-dialog-eyebrow">GENSOKYO · FAVORITES</span><h2>{t.title}</h2><p>{layoutCopy[lang].intro}</p></div><button type="button" aria-label={t.close} onClick={onClose}>×</button></header>
    <div className="taste-group-dialog-body">
      {step === 'settings' ? <>
        <div className="taste-group-dialog-controls">
          <fieldset className="taste-group-modes"><legend>{t.mode}</legend>{(['favorites', 'collect', 'empty'] as Mode[]).map((value, index) => <button key={value} type="button" aria-label={t[value]} aria-describedby={`taste-group-mode-${value}-description`} aria-pressed={mode === value} onClick={() => setMode(value)}><span className="taste-group-mode-number" aria-hidden="true">0{index + 1}</span><strong>{t[value]}</strong><small id={`taste-group-mode-${value}-description`}>{layoutCopy[lang].modeHint[value]}</small></button>)}</fieldset>
          {mode && <label className="taste-field">{t.name}<input maxLength={100} value={titles[mode]} onChange={event => setTitles(current => ({ ...current, [mode]: event.target.value }))} /></label>}
          {mode === 'empty' && <div className="taste-control-block" role="group" aria-label={layoutCopy[lang].size}>
            {gridPresets.map(([presetRows, presetColumns]) => <button key={`${presetRows}-${presetColumns}`} type="button" aria-pressed={freeRows === presetRows && freeColumns === presetColumns} onClick={() => { setFreeRows(presetRows); setFreeColumns(presetColumns); }}>{presetRows} × {presetColumns}</button>)}
            <details className="taste-group-custom-size"><summary>{layoutCopy[lang].custom}</summary><div>
              <label className="taste-field">{layoutCopy[lang].rows}<select value={freeRows} onChange={event => setFreeRows(Number(event.target.value))}>{gridSizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
              <label className="taste-field">{layoutCopy[lang].columns}<select value={freeColumns} onChange={event => setFreeColumns(Number(event.target.value))}>{gridSizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
            </div></details>
          </div>}
          {mode === 'collect' && <>
            <label className="taste-field">{t.scope}<select value={filter.scope} onChange={event => { const scope = event.target.value as Scope; setFilter(current => ({ ...current, scope, workIds: [], ...(scope === 'books' ? { roles: [], stage: null } : {}) })); }}>{scopes.map(scope => <option key={scope} value={scope}>{t[scope]}</option>)}</select></label>
            <fieldset className="taste-group-topics taste-group-roles" disabled={filter.scope === 'books'}><legend>{t.role}</legend>{roles.map(role => <label key={role}><input type="checkbox" checked={filter.roles.includes(role)} onChange={() => setFilter(current => { const next = current.roles.includes(role) ? current.roles.filter(item => item !== role) : [...current.roles, role]; return { ...current, roles: next, stage: next.some(item => stageRoles.includes(item)) ? current.stage : null }; })} />{t[role]}</label>)}</fieldset>
            <label className="taste-field">{t.stage}<select disabled={stageDisabled} value={filter.stage ?? ''} onChange={event => { const value = event.target.value; setFilter(current => ({ ...current, stage: value ? (/^\d+$/.test(value) ? Number(value) : value as AppearanceStage) : null })); }}><option value="">{t.allStages}</option>{Array.from({ length: 20 }, (_, index) => <option key={index + 1} value={index + 1}>{lang === 'en' ? `Stage ${index + 1}` : lang === 'ko' ? `${index + 1}면` : `${index + 1}面`}</option>)}<option value="final">{t.final}</option><option value="extra">Extra</option><option value="phantasm">Phantasm</option></select></label>
            {stageDisabled && filter.scope !== 'books' && <p>{layoutCopy[lang].stageHint}</p>}
            <fieldset className="taste-group-topics taste-group-work-options"><legend>{t.works}</legend>{workOptions.map(work => <label key={work.id}><input type="checkbox" checked={filter.workIds.includes(work.id)} onChange={() => setFilter(current => ({ ...current, workIds: current.workIds.includes(work.id) ? current.workIds.filter(id => id !== work.id) : [...current.workIds, work.id] }))} />{work[lang]}</label>)}</fieldset>
            <p>{filter.scope === 'books' ? t.bookNote : layoutCopy[lang].note}</p>
          </>}
        </div>
        {mode === 'favorites' && <fieldset className="taste-group-topics"><legend>{t.topics}</legend>{favoriteTopics.map(topic => <label key={topic.id}><input type="checkbox" checked={topicIds.has(topic.id)} onChange={() => setTopicIds(current => { const next = new Set(current); if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id); return next; })} /> {topic.label[lang]}</label>)}</fieldset>}
      </> : <div className="taste-group-results">
        <h3>{t.selection}</h3><label className="taste-field">{t.search}<input autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <p>{filter.scope === 'books' ? t.bookNote : layoutCopy[lang].note}</p>
        <div className="taste-group-selection-actions"><button type="button" onClick={() => { setFilter(emptyFilter()); setQuery(''); }}>{t.reset}</button><button type="button" onClick={() => setSelected(current => { const next = new Map(current); results.forEach(character => { if (!next.has(character.id)) next.set(character.id, selectedWorkId); }); return next; })}>{t.selectAll}</button><button type="button" onClick={() => setSelected(new Map())}>{t.clear}</button><span>{selected.size} {t.selected}</span></div>
        <TasteCharacterList query={query} filter={EMPTY_CHARACTER_FILTER} characters={results} selectedIds={selectedIds} disabledIds={new Set()} onSelect={id => setSelected(current => { const next = new Map(current); if (next.has(id)) next.delete(id); else next.set(id, selectedWorkId); return next; })} renderAvatar={renderAvatar} />
      </div>}
    </div>
    <footer><div aria-live="polite">{mode && !titles[mode].trim() && <p>{t.requiredName}</p>}{mode && (mode !== 'collect' || step === 'selection') && !hasSelection && <p>{mode === 'favorites' ? t.requiredTopics : t.requiredCharacters}</p>}{board.groups.length >= MAX_GROUPS && <p>{t.groupLimit}</p>}{mode && hasSelection && !fits && <p>{t.cellLimit(required, Math.min(available, MAX_CELLS_PER_GROUP))}</p>}</div><button type="button" onClick={step === 'selection' ? () => setStep('settings') : onClose}>{step === 'selection' ? t.back : t.close}</button>{mode === 'collect' && step === 'settings' ? <button type="button" disabled={!titles.collect.trim() || board.groups.length >= MAX_GROUPS} onClick={() => setStep('selection')}>{t.next}</button> : <button type="button" disabled={!canCreate} onClick={create}>{mode === 'collect' ? t.addSelected : t.create}</button>}</footer>
  </TasteDialog>;
}
