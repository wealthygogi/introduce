import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID } from '../../data/profileCatalog';
import { getCouplingPortrait } from '../coupling/data';
import { useLang } from '../../contexts/LangContext';
import DownloadButton from '../../components/DownloadButton';
import { createDefaultTasteBoard, MAX_CELLS_PER_GROUP, MAX_CELLS_TOTAL, MAX_GROUPS, parseTasteBoard, readTasteBoard, TASTE_BOARD_STORAGE_KEY, writeTasteBoard } from './tasteBoardStorage';
import { collectTasteBoardImageIds, createTasteBoardImageStorage } from './tasteBoardImageStorage';
import type { TasteBoard, TasteCell, TasteGroup, TasteTheme } from './tasteBoardTypes';
import TasteDialog from './TasteDialog';
import TasteGroupDialog from './TasteGroupDialog';
import TasteCharacterList from './TasteCharacterList';
import { CHARACTER_TOPICS, CHARACTER_TOPIC_BUNDLES, CHARACTER_TOPIC_BY_ID, EMPTY_CHARACTER_FILTER, appearanceSummary, type AppearanceStage, type RoleFilter } from './characterCategories';
import './taste-board.css';

const copy = {
  ko: { heading: '캐릭터 취향 모음표', hint: '그룹별 레이아웃을 고르고 좋아하는 캐릭터를 담아 보세요.', title: '모음표 제목', group: '그룹 이름', addGroup: '그룹 추가', workGroup: '작품 그룹 만들기', presets: '격자 구성', oneRow: '한 줄 · 3칸', three: '3 × 3', four: '4 × 4', five: '5 × 5', custom: '직접 설정', rows: '행', columns: '열', themes: '테마', minimal: '미니멀', paper: '페이퍼', album: '앨범', terminal: '터미널', night: '나이트', showNames: '이름 표시', choose: '캐릭터 선택', change: '캐릭터 바꾸기', addSecond: '한 명 더 담기', close: '완료', clear: '비우기', empty: '캐릭터를 담아 보세요', search: '캐릭터 검색', undo: '실행 취소', saved: '자동 저장됨', storageWarning: '저장할 수 없어 이 탭에서만 유지됩니다.', invalid: '저장된 모음표를 읽지 못해 새 표를 시작합니다.', remove: '그룹 삭제', up: '위로', down: '아래로', upload: '사진 업로드', replaceImage: '사진 변경', removeImage: '사진 제거', imageError: '이미지를 저장하지 못했습니다. 다른 이미지를 선택해 주세요.', invalidImage: 'PNG, JPEG, WebP 이미지(최대 5MB)를 선택해 주세요.', workTitle: '작품명 / 그룹 이름', addSelected: '선택한 캐릭터 담기', selected: '명 선택', rosterNote: '표시된 분류는 캐릭터의 대표 분류이며 작품 전체 출연 목록이 아닙니다.', workLimit: '모음표 저장 한도를 넘습니다. 캐릭터 수를 줄이거나 그룹을 비워 주세요.', gridLimit: '전체 격자 한도(300칸)를 초과해 크기를 바꾸지 못했습니다.' },
  ja: { heading: 'キャラクターのお気に入り表', hint: 'グループごとにレイアウトを選び、好きなキャラクターを配置しましょう。', title: '表のタイトル', group: 'グループ名', addGroup: 'グループを追加', workGroup: '作品グループを作成', presets: 'グリッド', oneRow: '横一列・3マス', three: '3 × 3', four: '4 × 4', five: '5 × 5', custom: 'カスタム', rows: '行', columns: '列', themes: 'テーマ', minimal: 'ミニマル', paper: 'ペーパー', album: 'アルバム', terminal: 'ターミナル', night: 'ナイト', showNames: '名前を表示', choose: 'キャラクターを選択', change: 'キャラクターを変更', addSecond: 'もう一人追加', close: '完了', clear: '空にする', empty: 'キャラクターを配置', search: 'キャラクターを検索', undo: '元に戻す', saved: '自動保存しました', storageWarning: '保存できないため、このタブでのみ保持されます。', invalid: '保存データを読み込めないため、新しい表を開始します。', remove: 'グループを削除', up: '上へ', down: '下へ', upload: '写真をアップロード', replaceImage: '写真を変更', removeImage: '写真を削除', imageError: '画像を保存できませんでした。別の画像を選択してください。', invalidImage: 'PNG、JPEG、WebP画像（最大5MB）を選択してください。', workTitle: '作品名 / グループ名', addSelected: '選択したキャラクターを追加', selected: '人選択', rosterNote: '表示される分類は代表分類であり、作品の全出演者一覧ではありません。', workLimit: '保存上限を超えます。キャラクター数を減らしてください。', gridLimit: 'グリッド上限（300マス）を超えるため変更できません。' },
  en: { heading: 'Character taste board', hint: 'Choose a layout for each group and add your favorite characters.', title: 'Board title', group: 'Group name', addGroup: 'Add group', workGroup: 'Create a work group', presets: 'Grid layout', oneRow: 'Single row · 3 cells', three: '3 × 3', four: '4 × 4', five: '5 × 5', custom: 'Custom size', rows: 'Rows', columns: 'Columns', themes: 'Theme', minimal: 'Minimal', paper: 'Paper', album: 'Album', terminal: 'Terminal', night: 'Night', showNames: 'Show names', choose: 'Choose character', change: 'Change character', addSecond: 'Add a second character', close: 'Done', clear: 'Clear cell', empty: 'Add a character', search: 'Search characters', undo: 'Undo', saved: 'Saved automatically', storageWarning: 'Storage is unavailable; changes stay in this tab.', invalid: 'Saved board could not be read. A new board was started.', remove: 'Remove group', up: 'Move up', down: 'Move down', upload: 'Upload image', replaceImage: 'Change image', removeImage: 'Remove image', imageError: 'Could not save the image. Please choose another image.', invalidImage: 'Choose a PNG, JPEG, or WebP image (up to 5 MB).', workTitle: 'Work / group name', addSelected: 'Add selected characters', selected: 'selected', rosterNote: 'The listed category is a representative category, not a complete appearance list.', workLimit: 'This exceeds the board size limit. Select fewer characters.', gridLimit: 'The board limit is 300 cells. Reduce other groups before resizing.' },
} as const;

const characterIds = new Set(PROFILE_CHARACTERS.map(character => character.id));
const pickerCopy = {
  ko: { group: '작품 분류', all: '모든 작품', empty: '검색 결과가 없습니다.' },
  ja: { group: '作品分類', all: 'すべての作品', empty: '検索結果がありません。' },
  en: { group: 'Work category', all: 'All works', empty: 'No characters found.' },
} as const;

const appearanceCopy = {
  ko: { show: '출연 정보 표시', role: '역할', allRoles: '모든 역할', playable: '플레이어', enemy: '적', boss: '보스', midboss: '중보스', opponent: '대전 상대', support: '지원·동료', other: '기타 출연', details: '상세 조건', stage: '스테이지', allStages: '모든 스테이지', final: '최종면', note: '확인된 출연 정보를 기준으로 필터링합니다.', unknown: '출연 정보 미확인' },
  ja: { show: '出演情報を表示', role: '役割', allRoles: 'すべての役割', playable: 'プレイヤー', enemy: '敵', boss: 'ボス', midboss: '中ボス', opponent: '対戦相手', support: '支援・仲間', other: 'その他の出演', details: '詳細条件', stage: 'ステージ', allStages: 'すべてのステージ', final: '最終面', note: '確認された出演情報に基づいて絞り込みます。', unknown: '出演情報未確認' },
  en: { show: 'Show appearances', role: 'Role', allRoles: 'All roles', playable: 'Playable', enemy: 'Enemy', boss: 'Boss', midboss: 'Midboss', opponent: 'Opponent', support: 'Support', other: 'Other appearance', details: 'Advanced filters', stage: 'Stage', allStages: 'All stages', final: 'Final stage', note: 'Filtering is based on confirmed appearance information.', unknown: 'Appearance information unconfirmed' },
} as const;
const roles: RoleFilter[] = ['playable', 'enemy', 'boss', 'midboss', 'opponent', 'support', 'other'];

const themes: TasteTheme[] = ['paper', 'album', 'terminal', 'night'];
const resetCopy = {
  ko: { action: '캐릭터 초기화', confirm: '모든 그룹의 캐릭터와 사진을 비울까요? 제목, 테마와 그룹 구성은 유지됩니다.', actions: '작업' },
  ja: { action: 'キャラクターをリセット', confirm: 'すべてのグループのキャラクターと写真を消去しますか？タイトル、テーマ、グループ構成は保持されます。', actions: '操作' },
  en: { action: 'Clear characters', confirm: 'Clear characters and photos from all groups? The title, theme, and group layouts will be kept.', actions: 'Actions' },
} as const;
const downloadCopy = {
  ko: { preparing: '이미지를 준비하고 있습니다…', started: '다운로드를 시작했습니다. 브라우저의 다운로드 목록을 확인해 주세요.', failed: '다운로드를 시작하지 못했습니다. 다시 시도해 주세요.' },
  ja: { preparing: '画像を準備しています…', started: 'ダウンロードを開始しました。ブラウザーのダウンロード一覧をご確認ください。', failed: 'ダウンロードを開始できませんでした。もう一度お試しください。' },
  en: { preparing: 'Preparing your image…', started: 'Download started. Check your browser’s downloads.', failed: 'Could not start the download. Please try again.' },
} as const;

async function resizeImageFile(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Unsupported image');
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed')), 'image/webp', 0.9));
}

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
  const resetText = resetCopy[lang];
  const [board, setBoard] = useState<TasteBoard>(loadInitialBoard);
  const [undoStack, setUndoStack] = useState<TasteBoard[]>([]);
  const [activeCell, setActiveCell] = useState<{ groupId: string; index: number; adding: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [pickerGroup, setPickerGroup] = useState('');
  const [pickerRole, setPickerRole] = useState<RoleFilter | null>(null);
  const [pickerStage, setPickerStage] = useState<AppearanceStage | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [restoreWarning, setRestoreWarning] = useState(false);
  const [boardLimitError, setBoardLimitError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'preparing' | 'started' | 'failed' | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const imageStorage = useMemo(() => createTasteBoardImageStorage(), []);

  useEffect(() => {
    try { setRestoreWarning(window.localStorage.getItem(TASTE_BOARD_STORAGE_KEY) !== null && readTasteBoard(window.localStorage, characterIds).kind === 'invalid'); }
    catch { setStorageAvailable(false); }
  }, []);
  useEffect(() => { setStorageAvailable(writeTasteBoard(window.localStorage, board)); }, [board]);
  useEffect(() => {
    let cancelled = false;
    const urls: Record<string, string> = {};
    const ids = collectTasteBoardImageIds(board, undoStack);
    void (async () => {
      const entries = await Promise.all([...ids].map(async id => [id, await imageStorage.get(id)] as const));
      if (cancelled) return;
      if (entries.some(([, blob]) => !blob)) setImageError(true);
      for (const [id, blob] of entries) if (blob) urls[id] = URL.createObjectURL(blob);
      setImageUrls(urls);
      await imageStorage.prune(ids);
      ids.forEach(imageStorage.unprotect);
    })().catch(() => { if (!cancelled && ids.size > 0) setImageError(true); });
    return () => {
      cancelled = true;
      Object.values(urls).forEach(URL.revokeObjectURL);
    };
  }, [board, undoStack, imageStorage]);

  const pickerFilter = { topicId: CHARACTER_TOPIC_BY_ID.has(pickerGroup) ? pickerGroup : null, role: pickerRole, stage: pickerStage };
  const currentIds = activeCell ? board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index]?.characters ?? [] : [];
  const appearanceText = appearanceCopy[lang];
  const renderAvatar = (character: (typeof PROFILE_CHARACTERS)[number], size: number, imageId?: string, loading: 'lazy' | 'eager' = 'lazy') => {
    const portrait = getCouplingPortrait(character);
    const src = imageId ? imageUrls[imageId] : undefined;
    return <span className="taste-character-avatar" style={{ '--taste-avatar-size': `${size}px` } as React.CSSProperties} aria-hidden="true">{src || portrait.src ? <img src={src ?? portrait.src ?? undefined} alt="" loading={loading} /> : character[lang].slice(0, 1)}</span>;
  };
  const update = (change: (current: TasteBoard) => TasteBoard) => {
    setUndoStack(stack => [...stack.slice(-19), board]);
    setBoard(change(board));
  };
  const applyPreset = (group: TasteGroup, rows: number, columns: number) => {
    const totalCells = board.groups.reduce((total, item) => total + item.cells.length, 0) - group.cells.length + rows * columns;
    if (rows * columns > MAX_CELLS_PER_GROUP || totalCells > MAX_CELLS_TOTAL) {
      setBoardLimitError(true);
      return;
    }
    const cells = Array<TasteCell | null>(rows * columns).fill(null);
    group.cells.slice(0, cells.length).forEach((cell, index) => { cells[index] = cell; });
    const slots = group.slots && Array.from({ length: cells.length }, (_, index) => group.slots?.[index] ?? null);
    if ((group.cells.slice(cells.length).some(Boolean) || group.slots?.slice(cells.length).some(Boolean)) && !window.confirm('격자를 줄이면 일부 캐릭터 또는 칸 라벨이 제거됩니다. 계속할까요?')) return;
    update(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, rows, columns, cells, ...(slots ? { slots } : {}) } : item) }));
    setBoardLimitError(false);
  };
  const setCell = (groupId: string, index: number, cell: TasteCell | null) => update(current => ({
    ...current, groups: current.groups.map(group => group.id === groupId ? { ...group, cells: group.cells.map((value, cellIndex) => cellIndex === index ? cell : value) } : group),
  }));
  const uploadCellImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeCell) return;
    const cell = board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index];
    if (!cell) return;
    let pendingImageId: string | null = null;
    try {
      const blob = await resizeImageFile(file);
      const imageId = crypto.randomUUID();
      pendingImageId = imageId;
      imageStorage.protect(imageId);
      await imageStorage.put(imageId, blob);
      setCell(activeCell.groupId, activeCell.index, { ...cell, imageId });
      pendingImageId = null;
      setImageError(false);
    } catch {
      if (pendingImageId) imageStorage.unprotect(pendingImageId);
      setImageError(true);
    }
  };
  const removeCellImage = () => {
    if (!activeCell) return;
    const cell = board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index];
    if (cell) {
      const { imageId: _imageId, ...withoutImage } = cell;
      setCell(activeCell.groupId, activeCell.index, withoutImage);
    }
  };
  const chooseCharacter = (id: string) => {
    if (!activeCell) return;
    const group = board.groups.find(item => item.id === activeCell.groupId);
    const current = group?.cells[activeCell.index] ?? null;
    const characters = activeCell.adding && current ? [...current.characters, id].slice(0, 2) : [id];
    setCell(activeCell.groupId, activeCell.index, { ...current, characters, label: current?.label ?? '' });
    setActiveCell(null);
    setQuery('');
  };

  return <main className="taste-board-page">
    <header className="taste-board-header"><span className="taste-eyebrow">GENSOKYO · FAVORITES</span><h1>{t.heading}</h1><p>{t.hint}</p></header>
    <div className="taste-board-workspace">
      <aside className="taste-controls" aria-label={t.heading}>
        <label className="taste-field">{t.title}<input value={board.title} maxLength={120} onChange={event => update(current => ({ ...current, title: event.target.value }))} /></label>
        <div className="taste-control-block taste-theme-options"><strong>{t.themes}</strong>{themes.map(theme => <button key={theme} type="button" className={`taste-theme-option theme-${theme}`} aria-pressed={board.theme === theme} onClick={() => update(current => ({ ...current, theme }))}><span className="taste-theme-swatch" aria-hidden="true"><i /><i /><i /><i /></span><span>{t[theme]}</span></button>)}</div>
        <label className="taste-toggle"><input type="checkbox" checked={board.showNames} onChange={event => update(current => ({ ...current, showNames: event.target.checked }))} />{t.showNames}</label>
        <button type="button" className="taste-secondary-action taste-create-action" disabled={board.groups.length >= MAX_GROUPS} onClick={event => { dialogOpener.current = event.currentTarget; setGroupDialogOpen(true); }}>{t.workGroup}</button>
        <div className="taste-action-group" aria-label={resetText.actions}>
          <strong>{resetText.actions}</strong>
          <DownloadButton targetId="taste-board-export" filename="character-taste-board.png" captureOptions={{ scale: 1, resetPosition: true, maxPixelArea: 16_000_000 }} onStatusChange={setDownloadStatus} />
          <p className="taste-download-status" role="status" aria-live="polite">{downloadStatus ? downloadCopy[lang][downloadStatus] : ''}</p>
          <button type="button" className="taste-secondary-action" disabled={!undoStack.length} onClick={() => { setBoard(undoStack[undoStack.length - 1]); setUndoStack(stack => stack.slice(0, -1)); }}>{t.undo}</button>
          <button type="button" className="taste-secondary-action taste-reset-action" disabled={!board.groups.some(group => group.cells.some(Boolean))} onClick={() => { if (window.confirm(resetText.confirm)) update(current => ({ ...current, groups: current.groups.map(group => ({ ...group, cells: group.cells.map(() => null) })) })); }}>{resetText.action}</button>
        </div>
        <p className="taste-save-status" role="status">{storageAvailable ? t.saved : t.storageWarning}</p>
        {restoreWarning && <p role="alert">{t.invalid}</p>}
        {boardLimitError && <p role="alert">{t.gridLimit}</p>}
        {imageError && <p role="alert">{t.imageError}</p>}
      </aside>
      <section className={`taste-board theme-${board.theme}`} data-testid="taste-board" data-theme={board.theme}>
        <h2>{board.title || t.heading}</h2>
        {board.groups.map((group, groupIndex) => <section className="taste-board-group" key={group.id}>
          <div className="taste-group-heading">
            <input aria-label={t.group} value={group.title} maxLength={100} onChange={event => update(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, title: event.target.value } : item) }))} />
            <div className="taste-layout-tools" aria-label={t.presets}>
              {([['oneRow', 1, 3], ['three', 3, 3], ['four', 4, 4], ['five', 5, 5]] as const).map(([key, rows, columns]) => <button type="button" key={key} aria-pressed={group.rows === rows && group.columns === columns} onClick={() => applyPreset(group, rows, columns)}>{t[key]}</button>)}
            </div>
            <details className="taste-custom-grid"><summary>{t.custom}</summary><div className="taste-custom-grid-fields"><label>{t.rows}<select aria-label={lang === 'ko' ? '행 수' : lang === 'ja' ? '行数' : 'Rows'} value={group.rows} onChange={event => applyPreset(group, Number(event.target.value), group.columns)}>{Array.from({ length: 10 }, (_, i) => i + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>{t.columns}<select aria-label={lang === 'ko' ? '열 수' : lang === 'ja' ? '列数' : 'Columns'} value={group.columns} onChange={event => applyPreset(group, group.rows, Number(event.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label></div></details>
            <label className="taste-toggle"><input type="checkbox" checked={group.showAppearances ?? false} onChange={event => { const checked = event.target.checked; update(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, showAppearances: checked } : item) })); }} />{appearanceText.show}</label>
            <div className="taste-group-actions"><button type="button" onClick={() => update(current => ({ ...current, groups: current.groups.filter(item => item.id !== group.id) }))} disabled={board.groups.length === 1} aria-label={t.remove}>×</button><button type="button" aria-label={t.up} disabled={groupIndex === 0} onClick={() => update(current => ({ ...current, groups: [current.groups[groupIndex - 1], current.groups[groupIndex], ...current.groups.filter((_, i) => i !== groupIndex && i !== groupIndex - 1)] }))}>↑</button><button type="button" aria-label={t.down} disabled={groupIndex === board.groups.length - 1} onClick={() => update(current => ({ ...current, groups: [current.groups[groupIndex], current.groups[groupIndex + 1], ...current.groups.filter((_, i) => i !== groupIndex && i !== groupIndex + 1)] }))}>↓</button></div>
          </div>
          <div className="taste-board-grid" style={{ '--taste-columns': group.columns } as React.CSSProperties}>
            {group.cells.map((cell, index) => <button key={index} type="button" className={`taste-board-cell${group.slots?.[index] || (group.showAppearances && cell) ? ' taste-board-cell--expanded' : ''}`} data-empty={!cell} aria-label={`${group.title} ${index + 1} ${group.slots?.[index]?.label ?? ''}: ${cell ? cell.characters.map(id => PROFILE_CHARACTER_BY_ID.get(id)?.[lang]).join(' + ') : t.empty}`} onClick={event => { dialogOpener.current = event.currentTarget; setQuery(''); setPickerGroup(group.slots?.[index]?.topicId ?? ''); setPickerRole(null); setPickerStage(null); setActiveCell({ groupId: group.id, index, adding: false }); }}>
              {group.slots?.[index] && <span className="taste-slot-label">{group.slots[index]?.label}</span>}
              {cell ? <><span className="taste-cell-characters">{cell.characters.map((id, characterIndex) => { const character = PROFILE_CHARACTER_BY_ID.get(id)!; const topicId = group.slots?.[index]?.topicId; const context = topicId ? { ...EMPTY_CHARACTER_FILTER, topicId } : group.appearanceContext ?? EMPTY_CHARACTER_FILTER; const summary = group.showAppearances ? (context.topicId && !CHARACTER_TOPIC_BY_ID.has(context.topicId) ? [appearanceText.unknown] : appearanceSummary(id, context, lang)) : []; return <span className="taste-character" key={id}>{renderAvatar(character, 72, characterIndex === 0 ? cell.imageId : undefined)}{board.showNames && <span>{character[lang]}</span>}{group.showAppearances && <span className="taste-appearance-summary">{summary.slice(0, 2).map((label, i) => <small key={i}>{label}</small>)}{summary.length > 2 && <small>+{summary.length - 2}</small>}</span>}</span>; })}</span><span className="taste-cell-edit">{t.change}</span></> : <span className="taste-cell-empty"><b>＋</b>{t.empty}</span>}
            </button>)}
          </div>
        </section>)}
      <button type="button" className="taste-add-group" disabled={board.groups.length >= MAX_GROUPS} onClick={event => { dialogOpener.current = event.currentTarget; setGroupDialogOpen(true); }}>{t.addGroup}</button>
      </section>
    </div>
    <section id="taste-board-export" className={`taste-export theme-${board.theme}`} aria-hidden="true">
      <h1>{board.title || t.heading}</h1>
      {board.groups.map(group => <section className="taste-export-group" key={group.id}>
        <h2>{group.title}</h2>
        <div className="taste-export-grid" style={{ '--taste-columns': group.columns } as React.CSSProperties}>{group.cells.map((cell, index) => <div className="taste-export-cell" key={index}>
          {group.slots?.[index] && <span className="taste-export-slot-label">{group.slots[index]?.label}</span>}
          {cell?.characters.map((id, characterIndex) => {
            const character = PROFILE_CHARACTER_BY_ID.get(id)!;
            const topicId = group.slots?.[index]?.topicId;
            const context = topicId ? { ...EMPTY_CHARACTER_FILTER, topicId } : group.appearanceContext ?? EMPTY_CHARACTER_FILTER;
            const summary = group.showAppearances ? (context.topicId && !CHARACTER_TOPIC_BY_ID.has(context.topicId) ? [appearanceText.unknown] : appearanceSummary(id, context, lang)) : [];
            return <div className="taste-export-character" key={id}>
              {renderAvatar(character, 96, characterIndex === 0 ? cell.imageId : undefined, 'eager')}
              {board.showNames && <span>{character[lang]}</span>}
              {group.showAppearances && <span className="taste-export-summary">{summary.slice(0, 2).map((label, i) => <small key={i}>{label}</small>)}{summary.length > 2 && <small>+{summary.length - 2}</small>}</span>}
            </div>;
          })}
          {cell?.label && <small>{cell.label}</small>}
        </div>)}</div>
      </section>)}
    </section>
    {activeCell && <TasteDialog label={t.choose} opener={dialogOpener.current} onClose={() => setActiveCell(null)}>
      <header><h2>{t.choose}</h2><button type="button" aria-label={t.close} onClick={() => setActiveCell(null)}>×</button></header>
      {board.groups.find(group => group.id === activeCell.groupId)?.slots?.[activeCell.index] && <label className="taste-field">{lang === 'ko' ? '칸 이름' : lang === 'ja' ? 'マスの名前' : 'Cell name'}<input maxLength={80} value={board.groups.find(group => group.id === activeCell.groupId)?.slots?.[activeCell.index]?.label ?? ''} onChange={event => { const label = event.target.value; update(current => ({ ...current, groups: current.groups.map(group => group.id === activeCell.groupId ? { ...group, slots: group.slots?.map((slot, index) => index === activeCell.index && slot ? { ...slot, label } : slot) } : group) })); }} /></label>}
      <label className="taste-field">{t.search}<input autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="taste-field">{pickerCopy[lang].group}<select value={CHARACTER_TOPIC_BY_ID.has(pickerGroup) ? pickerGroup : ''} onChange={event => setPickerGroup(event.target.value)}><option value="">{lang === 'ko' ? '전체 인물에서 선택' : lang === 'ja' ? 'すべてのキャラクターから選択' : 'Choose from all characters'}</option>{[...CHARACTER_TOPIC_BUNDLES, ...CHARACTER_TOPICS].map(topic => <option key={topic.id} value={topic.id}>{topic.label[lang]}</option>)}</select></label>
      {pickerGroup && !CHARACTER_TOPIC_BY_ID.has(pickerGroup) && <p role="status">{lang === 'ko' ? '현재 사용할 수 없는 분류입니다.' : lang === 'ja' ? '現在利用できない分類です。' : 'This category is no longer available.'}</p>}
      <label className="taste-field">{appearanceText.role}<select value={pickerRole ?? ''} onChange={event => setPickerRole((event.target.value || null) as RoleFilter | null)}><option value="">{appearanceText.allRoles}</option>{roles.map(role => <option key={role} value={role}>{appearanceText[role]}</option>)}</select></label>
      <details><summary>{appearanceText.details}</summary><label className="taste-field">{appearanceText.stage}<select value={pickerStage ?? ''} onChange={event => { const value = event.target.value; setPickerStage(value ? (/^[1-6]$/.test(value) ? Number(value) : value as AppearanceStage) : null); }}><option value="">{appearanceText.allStages}</option>{Array.from({ length: 6 }, (_, index) => <option key={index + 1} value={index + 1}>{lang === 'en' ? `Stage ${index + 1}` : `${index + 1}面`}</option>)}<option value="final">{appearanceText.final}</option><option value="extra">Extra</option><option value="phantasm">Phantasm</option></select></label></details>
      {(pickerRole || pickerStage !== null) && <p>{appearanceText.note}</p>}
      <TasteCharacterList query={query} filter={pickerFilter} selectedIds={new Set(currentIds)} disabledIds={new Set(activeCell.adding ? currentIds : [])} onSelect={chooseCharacter} renderAvatar={renderAvatar} />
      <footer>{activeCell && board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index] && <><button type="button" onClick={() => { setCell(activeCell.groupId, activeCell.index, null); setActiveCell(null); }}>{t.clear}</button><button type="button" disabled={(board.groups.find(item => item.id === activeCell.groupId)?.cells[activeCell.index]?.characters.length ?? 0) >= 2} onClick={() => setActiveCell({ ...activeCell, adding: true })}>{t.addSecond}</button><button type="button" onClick={() => imageInputRef.current?.click()}>{board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index]?.imageId ? t.replaceImage : t.upload}</button>{board.groups.find(group => group.id === activeCell.groupId)?.cells[activeCell.index]?.imageId && <button type="button" onClick={removeCellImage}>{t.removeImage}</button>}</>}<button type="button" onClick={() => setActiveCell(null)}>{t.close}</button><input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadCellImage} hidden aria-label={t.upload} />{imageError && <span role="alert">{t.invalidImage}</span>}</footer>
    </TasteDialog>}
    {groupDialogOpen && <TasteGroupDialog board={board} opener={dialogOpener.current} onClose={() => setGroupDialogOpen(false)} onCreate={group => { update(current => ({ ...current, groups: [...current.groups, group] })); setGroupDialogOpen(false); }} renderAvatar={renderAvatar} />}
  </main>;
}
