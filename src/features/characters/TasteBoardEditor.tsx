import { useEffect, useMemo, useState } from 'react';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID } from '../../data/profileCatalog';
import { getCouplingPortrait } from '../coupling/data';
import { useLang } from '../../contexts/LangContext';
import DownloadButton from '../../components/DownloadButton';
import { createDefaultTasteBoard, MAX_GROUPS, parseTasteBoard, readTasteBoard, TASTE_BOARD_STORAGE_KEY, writeTasteBoard } from './tasteBoardStorage';
import type { TasteBoard, TasteCell, TasteGroup, TasteTheme } from './tasteBoardTypes';
import './taste-board.css';

const copy = {
  ko: { heading: '캐릭터 취향 모음표', hint: '격자와 그룹을 정하고 좋아하는 캐릭터를 원하는 칸에 담아 보세요.', title: '모음표 제목', group: '그룹 이름', addGroup: '그룹 추가', presets: '격자 구성', oneRow: '한 줄 · 3칸', three: '3 × 3', four: '4 × 4', five: '5 × 5', themes: '테마', minimal: '미니멀 테마', album: '앨범 테마', night: '나이트 테마', showNames: '이름 표시', choose: '캐릭터 선택', change: '캐릭터 바꾸기', addSecond: '한 명 더 담기', close: '완료', clear: '비우기', empty: '캐릭터를 담아 보세요', search: '캐릭터 검색', undo: '실행 취소', saved: '자동 저장됨', storageWarning: '저장할 수 없어 이 탭에서만 유지됩니다.', invalid: '저장된 모음표를 읽지 못해 새 표를 시작합니다.', remove: '그룹 삭제', up: '위로', down: '아래로' },
  ja: { heading: 'キャラクターのお気に入り表', hint: 'グリッドとグループを決めて、好きなキャラクターを配置しましょう。', title: '表のタイトル', group: 'グループ名', addGroup: 'グループを追加', presets: 'グリッド', oneRow: '横一列・3マス', three: '3 × 3', four: '4 × 4', five: '5 × 5', themes: 'テーマ', minimal: 'ミニマル', album: 'アルバム', night: 'ナイト', showNames: '名前を表示', choose: 'キャラクターを選択', change: 'キャラクターを変更', addSecond: 'もう一人追加', close: '完了', clear: '空にする', empty: 'キャラクターを配置', search: 'キャラクターを検索', undo: '元に戻す', saved: '自動保存しました', storageWarning: '保存できないため、このタブでのみ保持されます。', invalid: '保存データを読み込めないため、新しい表を開始します。', remove: 'グループを削除', up: '上へ', down: '下へ' },
  en: { heading: 'Character taste board', hint: 'Choose grids and groups, then place your favorite characters in the spots you want.', title: 'Board title', group: 'Group name', addGroup: 'Add group', presets: 'Grid layout', oneRow: 'Single row · 3 cells', three: '3 × 3', four: '4 × 4', five: '5 × 5', themes: 'Theme', minimal: 'Minimal theme', album: 'Album theme', night: 'Night theme', showNames: 'Show names', choose: 'Choose character', change: 'Change character', addSecond: 'Add a second character', close: 'Done', clear: 'Clear cell', empty: 'Add a character', search: 'Search characters', undo: 'Undo', saved: 'Saved automatically', storageWarning: 'Storage is unavailable; changes stay in this tab.', invalid: 'Saved board could not be read. A new board was started.', remove: 'Remove group', up: 'Move up', down: 'Move down' },
} as const;

const characterIds = new Set(PROFILE_CHARACTERS.map(character => character.id));
const themes: TasteTheme[] = ['minimal', 'album', 'night'];

function loadInitialBoard(): TasteBoard {
  try {
    const result = readTasteBoard(window.localStorage, characterIds);
    return result.kind === 'valid' ? result.data : createDefaultTasteBoard();
  } catch {
    return createDefaultTasteBoard();
  }
}

export default function TasteBoardEditor() {
  const { lang } = useLang();
  const t = copy[lang];
  const [board, setBoard] = useState<TasteBoard>(loadInitialBoard);
  const [undoStack, setUndoStack] = useState<TasteBoard[]>([]);
  const [activeCell, setActiveCell] = useState<{ groupId: string; index: number; adding: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [restoreWarning, setRestoreWarning] = useState(false);

  useEffect(() => {
    try { setRestoreWarning(window.localStorage.getItem(TASTE_BOARD_STORAGE_KEY) !== null && readTasteBoard(window.localStorage, characterIds).kind === 'invalid'); }
    catch { setStorageAvailable(false); }
  }, []);
  useEffect(() => { setStorageAvailable(writeTasteBoard(window.localStorage, board)); }, [board]);

  const visibleCharacters = useMemo(() => PROFILE_CHARACTERS.filter(character => `${character[lang]} ${character.ko} ${character.ja} ${character.en}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [lang, query]);
  const renderAvatar = (character: (typeof PROFILE_CHARACTERS)[number], size: number) => {
    const portrait = getCouplingPortrait(character);
    return <span className="taste-character-avatar" style={{ '--taste-avatar-size': `${size}px` } as React.CSSProperties} aria-hidden="true">{portrait.src ? <img src={portrait.src} alt="" loading="lazy" /> : character[lang].slice(0, 1)}</span>;
  };
  const update = (change: (current: TasteBoard) => TasteBoard) => {
    setUndoStack(stack => [...stack.slice(-19), board]);
    setBoard(change(board));
  };
  const applyPreset = (group: TasteGroup, rows: number, columns: number) => {
    const cells = Array<TasteCell | null>(rows * columns).fill(null);
    group.cells.slice(0, cells.length).forEach((cell, index) => { cells[index] = cell; });
    if (group.cells.slice(cells.length).some(Boolean) && !window.confirm('격자를 줄이면 일부 캐릭터가 제거됩니다. 계속할까요?')) return;
    update(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, rows, columns, cells } : item) }));
  };
  const setCell = (groupId: string, index: number, cell: TasteCell | null) => update(current => ({
    ...current, groups: current.groups.map(group => group.id === groupId ? { ...group, cells: group.cells.map((value, cellIndex) => cellIndex === index ? cell : value) } : group),
  }));
  const addGroup = () => update(current => ({ ...current, groups: [...current.groups, { id: `group-${Date.now()}`, title: `Group ${current.groups.length + 1}`, rows: 3, columns: 3, cells: Array(9).fill(null) }] }));
  const chooseCharacter = (id: string) => {
    if (!activeCell) return;
    const group = board.groups.find(item => item.id === activeCell.groupId);
    const current = group?.cells[activeCell.index] ?? null;
    const characters = activeCell.adding && current ? [...current.characters, id].slice(0, 2) : [id];
    setCell(activeCell.groupId, activeCell.index, { characters, label: current?.label ?? '' });
    setActiveCell(null);
    setQuery('');
  };

  return <main className="taste-board-page">
    <header className="taste-board-header"><span className="taste-eyebrow">GENSOKYO · FAVORITES</span><h1>{t.heading}</h1><p>{t.hint}</p></header>
    <div className="taste-board-workspace">
      <aside className="taste-controls" aria-label={t.heading}>
        <label className="taste-field">{t.title}<input value={board.title} maxLength={120} onChange={event => update(current => ({ ...current, title: event.target.value }))} /></label>
        <div className="taste-control-block"><strong>{t.presets}</strong>{([['oneRow', 1, 3], ['three', 3, 3], ['four', 4, 4], ['five', 5, 5]] as const).map(([key, rows, columns]) => <button type="button" key={key} onClick={() => applyPreset(board.groups[0], rows, columns)}>{t[key]}</button>)}</div>
        <div className="taste-control-block"><strong>{t.themes}</strong>{themes.map(theme => <button key={theme} type="button" aria-pressed={board.theme === theme} onClick={() => update(current => ({ ...current, theme }))}>{t[theme]}</button>)}</div>
        <label className="taste-toggle"><input type="checkbox" checked={board.showNames} onChange={event => update(current => ({ ...current, showNames: event.target.checked }))} />{t.showNames}</label>
        <button type="button" className="taste-secondary-action" disabled={!undoStack.length} onClick={() => { setBoard(undoStack[undoStack.length - 1]); setUndoStack(stack => stack.slice(0, -1)); }}>{t.undo}</button>
        <DownloadButton targetId="taste-board-export" filename="character-taste-board.png" captureOptions={{ scale: 1, resetPosition: true, maxPixelArea: 16_000_000 }} />
        <p className="taste-save-status" role="status">{storageAvailable ? t.saved : t.storageWarning}</p>
        {restoreWarning && <p role="alert">{t.invalid}</p>}
      </aside>
      <section className={`taste-board theme-${board.theme}`} data-testid="taste-board" data-theme={board.theme}>
        <h2>{board.title || t.heading}</h2>
        {board.groups.map((group, groupIndex) => <section className="taste-board-group" key={group.id}>
          <div className="taste-group-heading"><input aria-label={t.group} value={group.title} maxLength={100} onChange={event => update(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, title: event.target.value } : item) }))} /><label>{lang === 'ko' ? '행' : lang === 'ja' ? '行' : 'Rows'}<select aria-label={lang === 'ko' ? '행 수' : lang === 'ja' ? '行数' : 'Rows'} value={group.rows} onChange={event => applyPreset(group, Number(event.target.value), group.columns)}>{Array.from({ length: 10 }, (_, i) => i + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>{lang === 'ko' ? '열' : lang === 'ja' ? '列' : 'Columns'}<select aria-label={lang === 'ko' ? '열 수' : lang === 'ja' ? '列数' : 'Columns'} value={group.columns} onChange={event => applyPreset(group, group.rows, Number(event.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" onClick={() => update(current => ({ ...current, groups: current.groups.filter(item => item.id !== group.id) }))} disabled={board.groups.length === 1} aria-label={t.remove}>×</button><button type="button" aria-label={t.up} disabled={groupIndex === 0} onClick={() => update(current => ({ ...current, groups: [current.groups[groupIndex - 1], current.groups[groupIndex], ...current.groups.filter((_, i) => i !== groupIndex && i !== groupIndex - 1)] }))}>↑</button><button type="button" aria-label={t.down} disabled={groupIndex === board.groups.length - 1} onClick={() => update(current => ({ ...current, groups: [current.groups[groupIndex], current.groups[groupIndex + 1], ...current.groups.filter((_, i) => i !== groupIndex && i !== groupIndex + 1)] }))}>↓</button></div>
          <div className="taste-board-grid" style={{ '--taste-columns': group.columns } as React.CSSProperties}>
            {group.cells.map((cell, index) => <button key={index} type="button" className="taste-board-cell" data-empty={!cell} aria-label={`${group.title} ${index + 1}: ${cell ? cell.characters.map(id => PROFILE_CHARACTER_BY_ID.get(id)?.[lang]).join(' + ') : t.empty}`} onClick={() => setActiveCell({ groupId: group.id, index, adding: false })}>
              {cell ? <><span className="taste-cell-characters">{cell.characters.map(id => { const character = PROFILE_CHARACTER_BY_ID.get(id)!; return <span className="taste-character" key={id}>{renderAvatar(character, 52)}{board.showNames && <span>{character[lang]}</span>}</span>; })}</span><span className="taste-cell-edit">{t.change}</span></> : <span className="taste-cell-empty"><b>＋</b>{t.empty}</span>}
            </button>)}
          </div>
        </section>)}
      <button type="button" className="taste-add-group" disabled={board.groups.length >= MAX_GROUPS} onClick={addGroup}>{t.addGroup}</button>
      </section>
    </div>
    <section id="taste-board-export" className={`taste-export theme-${board.theme}`} aria-hidden="true">
      <h1>{board.title || t.heading}</h1>
      {board.groups.map(group => <section className="taste-export-group" key={group.id}>
        <h2>{group.title}</h2>
        <div className="taste-export-grid" style={{ '--taste-columns': group.columns } as React.CSSProperties}>{group.cells.map((cell, index) => <div className="taste-export-cell" key={index}>
          {cell?.characters.map(id => <div className="taste-export-character" key={id}>{renderAvatar(PROFILE_CHARACTER_BY_ID.get(id)!, 72)}{board.showNames && <span>{PROFILE_CHARACTER_BY_ID.get(id)![lang]}</span>}</div>)}
          {cell?.label && <small>{cell.label}</small>}
        </div>)}</div>
      </section>)}
    </section>
    {activeCell && <div className="taste-dialog-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveCell(null); }}><section className="taste-character-dialog" role="dialog" aria-modal="true" aria-label={t.choose}>
      <header><h2>{t.choose}</h2><button type="button" aria-label={t.close} onClick={() => setActiveCell(null)}>×</button></header>
      <label className="taste-field">{t.search}<input autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="taste-character-list">{visibleCharacters.map(character => { const activeGroup = activeCell && board.groups.find(group => group.id === activeCell.groupId); const currentIds = activeGroup?.cells[activeCell?.index ?? -1]?.characters ?? []; return <button key={character.id} type="button" disabled={activeCell.adding && currentIds.includes(character.id)} onClick={() => chooseCharacter(character.id)}>{renderAvatar(character, 36)}<span>{character[lang]}</span><small>{character.group[lang]}</small></button>; })}</div>
      <footer>{activeCell && board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index] && <><button type="button" onClick={() => { setCell(activeCell.groupId, activeCell.index, null); setActiveCell(null); }}>{t.clear}</button><button type="button" disabled={(board.groups.find(item => item.id === activeCell.groupId)?.cells[activeCell.index]?.characters.length ?? 0) >= 2} onClick={() => setActiveCell({ ...activeCell, adding: true })}>{t.addSecond}</button></>}<button type="button" onClick={() => setActiveCell(null)}>{t.close}</button></footer>
    </section></div>}
  </main>;
}
