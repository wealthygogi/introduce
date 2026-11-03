import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PROFILE_CHARACTER_BY_ID, PROFILE_WORKS, PROFILE_WORK_BY_ID, type ProfileCharacter } from '../../data/profileCatalog';
import { useLang } from '../../contexts/LangContext';
import TasteCharacterList from './TasteCharacterList';
import TasteDialog from './TasteDialog';
import { CHARACTER_TOPICS, CHARACTER_TOPIC_BUNDLES, CHARACTER_TOPIC_BY_ID } from './characterCategories';
import { formatTasteVersion, resolveTasteSlotLabel } from './tasteBoardLabels';
import type { TasteCell, TasteGroup, TasteSlot } from './tasteBoardTypes';

const text = {
  ko: { edit: '칸 편집', choose: '캐릭터 선택', change: '캐릭터 바꾸기', add: '한 명 더 담기', back: '칸 편집으로', close: '닫기', done: '완료', clear: '비우기', nameDetails: '칸 이름 설정', name: '칸 이름', search: '캐릭터 검색', filter: '작품 / 분류', all: '전체 인물에서 선택', noTopic: '현재 사용할 수 없는 분류입니다.', nameHint: '직접 쓴 이름은 언어를 바꿔도 유지됩니다.', automatic: '자동 이름', custom: '직접 입력', useWork: '작품 이름 사용', version: '좋아하는 버전', none: '지정하지 않음', clearVersion: '버전 해제', note: '필터는 검색 결과만 바꾸며, 지정한 버전은 바꾸지 않습니다.', assign: '이 칸에 새로 담는 캐릭터는 {work} 버전으로 지정됩니다. 나중에 변경하거나 해제할 수 있습니다.', save: '자동 저장됨', storage: '저장할 수 없어 이 탭에서만 유지됩니다.', upload: '사진 업로드', replaceImage: '사진 변경', removeImage: '사진 제거', secondFull: '한 칸에는 최대 두 명까지 담을 수 있습니다.' },
  ja: { edit: 'マスを編集', choose: 'キャラクターを選択', change: 'キャラクターを変更', add: 'もう一人追加', back: 'マスの編集に戻る', close: '閉じる', done: '完了', clear: '空にする', nameDetails: 'マス名の設定', name: 'マスの名前', search: 'キャラクターを検索', filter: '作品 / 分類', all: 'すべてのキャラクターから選択', noTopic: '現在利用できない分類です。', nameHint: '入力した名前は言語を切り替えても保持されます。', automatic: '自動の名前', custom: 'カスタム名', useWork: '作品名を使う', version: '好きなバージョン', none: '指定しない', clearVersion: 'バージョンを解除', note: '絞り込みは検索結果だけを変え、設定済みのバージョンは変更しません。', assign: 'このマスに新しく追加するキャラクターには、{work}のバージョンを設定します。後から変更・解除できます。', save: '自動保存しました', storage: '保存できないため、このタブでのみ保持されます。', upload: '写真をアップロード', replaceImage: '写真を変更', removeImage: '写真を削除', secondFull: '1マスに配置できるキャラクターは最大2人です。' },
  en: { edit: 'Edit cell', choose: 'Choose character', change: 'Change character', add: 'Add a second character', back: 'Back to cell', close: 'Close', done: 'Done', clear: 'Clear cell', nameDetails: 'Cell name settings', name: 'Cell name', search: 'Search characters', filter: 'Work / category', all: 'Choose from all characters', noTopic: 'This category is no longer available.', nameHint: 'Names you enter stay unchanged when you switch languages.', automatic: 'Automatic name', custom: 'Custom name', useWork: 'Use work name', version: 'Favorite version', none: 'Not specified', clearVersion: 'Clear version', note: 'Filters change the search results, not saved versions.', assign: 'New characters in this cell use the {work} version. You can change or clear it later.', save: 'Saved automatically', storage: 'Storage is unavailable; changes stay in this tab.', upload: 'Upload image', replaceImage: 'Change image', removeImage: 'Remove image', secondFull: 'A cell can hold at most two characters.' },
} as const;

export type TasteCellDialogProps = {
  group: TasteGroup;
  index: number;
  opener: HTMLElement | null;
  storageAvailable: boolean;
  imageError: boolean;
  onClose: () => void;
  onChangeCell: (cell: TasteCell | null) => void;
  onChangeSlot: (slot: TasteSlot) => void;
  onUploadImage: (file: File) => Promise<void>;
  onRemoveImage: () => void;
  renderAvatar: (character: ProfileCharacter, size: number, imageId?: string, loading?: 'lazy' | 'eager') => ReactNode;
};

type Mode = 'edit' | 'replace' | 'add';
const games = PROFILE_WORKS.filter(work => work.category === 'game');

export default function TasteCellDialog({ group, index, opener, storageAvailable, imageError, onClose, onChangeCell, onChangeSlot, onUploadImage, onRemoveImage, renderAvatar }: TasteCellDialogProps) {
  const { lang } = useLang();
  const t = text[lang];
  const cell = group.cells[index] ?? null;
  const slot = group.slots?.[index] ?? null;
  const [mode, setMode] = useState<Mode>(() => cell ? 'edit' : 'replace');
  const [query, setQuery] = useState('');
  const [topicId, setTopicId] = useState(slot?.topicId ?? '');
  const searchRef = useRef<HTMLInputElement>(null);
  const versionRefs = useRef(new Map<string, HTMLSelectElement>());
  const imageInputRef = useRef<HTMLInputElement>(null);
  const filter = useMemo(() => ({ topicId: CHARACTER_TOPIC_BY_ID.has(topicId) ? topicId : null, role: null, stage: null }), [topicId]);
  const topic = slot?.topicId ? CHARACTER_TOPIC_BY_ID.get(slot.topicId) : undefined;
  const slotLabel = slot ? resolveTasteSlotLabel(slot, lang) : null;
  const initialWork = topic && games.some(work => work.id === topic.id) ? PROFILE_WORK_BY_ID.get(topic.id) : undefined;
  const currentIds = cell?.characters ?? [];
  const occupied = !!cell;
  const title = mode === 'edit' ? t.edit : mode === 'add' ? t.add : occupied ? t.change : t.choose;

  useEffect(() => {
    if (mode === 'edit') {
      const id = cell?.characters[0];
      if (id) versionRefs.current.get(id)?.focus();
    } else searchRef.current?.focus();
  }, [mode, cell?.characters.join('|')]);

  const chooseCharacter = (id: string) => {
    if (!cell || mode === 'replace') {
      const previous = cell;
      const versions: Record<string, string> = {};
      for (const characterId of [id]) {
        if (previous?.characters.includes(characterId)) {
          const saved = previous.versionWorkIds?.[characterId];
          if (saved) versions[characterId] = saved;
        } else if (initialWork) versions[characterId] = initialWork.id;
      }
      const next: TasteCell = { ...(previous ?? {}), characters: [id], label: previous?.label ?? '', versionWorkIds: versions };
      const unchanged = previous?.characters.length === 1 && previous.characters[0] === id && JSON.stringify(previous.versionWorkIds ?? {}) === JSON.stringify(versions);
      if (!unchanged) onChangeCell(next);
    } else if (mode === 'add' && cell.characters.length < 2 && !cell.characters.includes(id)) {
      const versions = { ...cell.versionWorkIds };
      if (initialWork) versions[id] = initialWork.id;
      onChangeCell({ ...cell, characters: [...cell.characters, id], versionWorkIds: versions });
    }
    onClose();
  };

  const changeVersion = (id: string, workId: string) => {
    if (!cell) return;
    const versions = { ...cell.versionWorkIds };
    if (workId) versions[id] = workId;
    else delete versions[id];
    onChangeCell({ ...cell, versionWorkIds: versions });
  };
  const clearVersion = (id: string) => {
    changeVersion(id, '');
    requestAnimationFrame(() => versionRefs.current.get(id)?.focus());
  };
  const changeSlotLabel = (label: string) => { if (slot) onChangeSlot({ ...slot, label, labelSource: 'custom' }); };

  return <TasteDialog label={title} className="taste-cell-dialog" opener={opener} onClose={onClose}>
    <header><h2>{title}</h2><button type="button" aria-label={t.close} onClick={onClose}>×</button></header>
    <div className="taste-cell-dialog-body">
      {slot && <details className="taste-cell-name-details"><summary>{t.nameDetails}</summary><label className="taste-field">{t.name}<input maxLength={80} value={slotLabel?.automatic ? slotLabel.text : slot.label} onChange={event => changeSlotLabel(event.target.value)} /></label><p>{t.nameHint}</p><span>{slotLabel?.automatic ? t.automatic : t.custom}</span>{slotLabel?.canReset && <button type="button" onClick={() => { if (topic) onChangeSlot({ ...slot, label: topic.label[lang], labelSource: 'topic' }); }}>{t.useWork}</button>}</details>}
      {mode === 'edit' && cell && <div className="taste-cell-version-list">{cell.characters.map(id => {
        const character = PROFILE_CHARACTER_BY_ID.get(id)!;
        const selected = cell.versionWorkIds?.[id] ?? '';
        return <div className="taste-cell-version-row" key={id}>{renderAvatar(character, 48, cell.characters[0] === id ? cell.imageId : undefined)}<strong>{character[lang]}</strong><label className="taste-field">{t.version}<select ref={element => { if (element) versionRefs.current.set(id, element); else versionRefs.current.delete(id); }} aria-label={`${character[lang]} ${t.version}`} value={selected} onChange={event => changeVersion(id, event.target.value)}><option value="">{t.none}</option>{selected && !games.some(work => work.id === selected) && <option value={selected}>{formatTasteVersion(selected, lang)}</option>}{games.map(work => <option key={work.id} value={work.id}>{formatTasteVersion(work.id, lang)}</option>)}</select></label>{selected && <button type="button" aria-label={`${character[lang]} ${t.clearVersion}`} onClick={() => clearVersion(id)}>{t.clearVersion}</button>}</div>;
      })}</div>}
      {mode !== 'edit' && <>
        <label className="taste-field">{t.search}<input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label className="taste-field">{t.filter}<select value={CHARACTER_TOPIC_BY_ID.has(topicId) ? topicId : ''} onChange={event => setTopicId(event.target.value)}><option value="">{t.all}</option>{[...CHARACTER_TOPIC_BUNDLES, ...CHARACTER_TOPICS].map(item => <option key={item.id} value={item.id}>{item.label[lang]}</option>)}</select></label>
        {topicId && !CHARACTER_TOPIC_BY_ID.has(topicId) && <p role="status">{t.noTopic}</p>}
        {initialWork && <p role="status">{t.assign.replace('{work}', initialWork[lang])}</p>}
        <p>{t.note}</p>
        <TasteCharacterList query={query} filter={filter} selectedIds={new Set(currentIds)} disabledIds={new Set(mode === 'add' ? currentIds : [])} onSelect={chooseCharacter} renderAvatar={renderAvatar} />
      </>}
      {mode === 'edit' && cell && <div className="taste-cell-edit-actions"><button type="button" onClick={() => setMode('replace')}>{t.change}</button>{cell.characters.length < 2 && <button type="button" onClick={() => setMode('add')}>{t.add}</button>}</div>}
    </div>
    <footer>
      <div role="status">{storageAvailable ? t.save : t.storage}{imageError && <p role="alert">{lang === 'ko' ? '이미지를 저장하지 못했습니다. 다른 이미지를 선택해 주세요.' : lang === 'ja' ? '画像を保存できませんでした。別の画像を選択してください。' : 'Could not save the image. Please choose another image.'}</p>}</div>
      {mode === 'edit' && cell && <><button type="button" onClick={() => { onChangeCell(null); onClose(); }}>{t.clear}</button><button type="button" onClick={() => imageInputRef.current?.click()}>{cell.imageId ? t.replaceImage : t.upload}</button>{cell.imageId && <button type="button" onClick={onRemoveImage}>{t.removeImage}</button>}<input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void onUploadImage(file); }} /></>}
      {mode !== 'edit' && occupied && <button type="button" onClick={() => setMode('edit')}>{t.back}</button>}
      <button type="button" onClick={onClose}>{t.done}</button>
    </footer>
  </TasteDialog>;
}
