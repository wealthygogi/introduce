import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { PROFILE_CHARACTER_BY_ID, type ProfileCharacter } from '../data';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterPicker from '../components/CharacterPicker';
import { PREFERENCE_BY_ID, RELATIONS } from '../relations';
import PreferencePicker from '../components/PreferencePicker';
import { useCouplingDraft } from '../CouplingDraftProvider';
import CouplingSnackbar from '../components/CouplingSnackbar';
import copy from '../copy';
import type { PairCard, PairFields, PairsDraft, RelationId } from '../types';
import '../coupling.css';
import '../pairs/pairs.css';

type Snapshot = { pairs: PairCard[]; draft: PairFields; activeSlot: 'a' | 'b'; editingId: string | null; action: string };
const blankFields = (): PairFields => ({ a: null, b: null, relation: 'love', preference: null, direction: 'forward', memo: '' });
const strings = {
  ko: { title: '커플 카드 스튜디오', subtitle: 'A와 B를 고르고 관계와 메모를 카드로 모으세요.', new: '새 카드', slot: '슬롯', empty: '캐릭터 선택', clearA: 'A 비우기', clearB: 'B 비우기', swap: 'A와 B 맞바꾸기', relation: '관계 종류', direction: '관계 방향', forward: 'A → B · A에서 B로', mutual: 'A ↔ B · 양방향', reverse: 'B → A · B에서 A로', memo: '메모 · 선택 사항', memoPlaceholder: '두 사람의 관계, 좋아하는 장면…\n여러 줄로 자유롭게 적어 보세요.', save: '카드 저장', editSave: '카드 수정 저장', search: '캐릭터 검색', undo: '실행 취소', collection: '내 커플 카드', emptyCards: '아직 짝지은 카드가 없어요.', first: '앞으로 이동', last: '뒤로 이동', edit: '편집', remove: '삭제', noMemo: '메모 없음', saveHint: '개인 해석용 · 이 브라우저에 자동 저장됩니다.', active: '지금 라이브러리에서 고르면 {slot} 자리에 들어갑니다.', aRequired: 'A와 B에 각각 캐릭터를 선택해 주세요.', self: '서로 다른 두 캐릭터를 골라 주세요.', duplicate: '같은 인물과 방향의 카드가 이미 있습니다. 기존 카드를 편집하거나 방향을 바꿔 주세요.', saved: '새 커플 카드를 컬렉션에 저장했습니다.', updated: '기존 카드를 수정했습니다. 복사본은 만들지 않았습니다.', selected: '슬롯을 선택했습니다. 라이브러리에서 캐릭터를 고르세요.', selectDone: '선택 완료.', emptyUndo: '되돌릴 변경이 없습니다.', undoDone: '작업을 되돌렸습니다.', searchLabel: '선택할 자리', workSentence: '카드의 앞·뒤 이동 버튼으로 순서를 정하세요.' },
  ja: { title: 'カップリングカード', subtitle: 'AとBを選び、関係とメモをカードにまとめます。', new: '新しいカード', slot: 'スロット', empty: 'キャラクターを選択', clearA: 'Aをクリア', clearB: 'Bをクリア', swap: 'AとBを入れ替え', relation: '関係の種類', direction: '関係の向き', forward: 'A → B · AからBへ', mutual: 'A ↔ B · 双方向', reverse: 'B → A · BからAへ', memo: 'メモ · 任意', memoPlaceholder: '二人の関係、好きな場面…\n複数行で自由に書けます。', save: 'カードを保存', editSave: '変更を保存', search: 'キャラクター検索', undo: '元に戻す', collection: 'カップリングカード', emptyCards: 'カードはまだありません。', first: '前へ', last: '後へ', edit: '編集', remove: '削除', noMemo: 'メモなし', saveHint: '個人の解釈用 · このブラウザーに自動保存します。', active: 'ライブラリーで選ぶと{slot}に入ります。', aRequired: 'AとBのキャラクターを選んでください。', self: '異なる二人を選んでください。', duplicate: '同じ人物と方向のカードがあります。既存カードを編集するか方向を変更してください。', saved: 'カードをコレクションに保存しました。', updated: '既存カードを更新しました。複製は作成していません。', selected: 'スロットを選択しました。キャラクターを選んでください。', selectDone: '選択しました。', emptyUndo: '元に戻す変更はありません。', undoDone: '操作を元に戻しました。', searchLabel: '選択するスロット', workSentence: '前後ボタンでカードの順序を変更できます。' },
  en: { title: 'Pair card studio', subtitle: 'Choose A and B, then collect their relationships and notes as cards.', new: 'New card', slot: 'slot', empty: 'Choose a character', clearA: 'Clear A', clearB: 'Clear B', swap: 'Swap A and B', relation: 'Relationship', direction: 'Direction', forward: 'A → B · A to B', mutual: 'A ↔ B · Mutual', reverse: 'B → A · B to A', memo: 'Memo · optional', memoPlaceholder: 'Their relationship, a favorite scene…\nWrite freely across multiple lines.', save: 'Save card', editSave: 'Save changes', search: 'Search characters', undo: 'Undo', collection: 'Pair cards', emptyCards: 'No pair cards yet.', first: 'Move earlier', last: 'Move later', edit: 'Edit', remove: 'Delete', noMemo: 'No memo', saveHint: 'For personal interpretation · saved automatically in this browser.', active: 'Choosing from the library will fill slot {slot}.', aRequired: 'Choose a character for both A and B.', self: 'Choose two different characters.', duplicate: 'A card with the same people and direction already exists. Edit it or change the direction.', saved: 'Saved a new card to your collection.', updated: 'Updated the existing card without making a copy.', selected: 'Slot selected. Choose a character from the library.', selectDone: 'Selected.', emptyUndo: 'There is nothing to undo.', undoDone: 'Undid the action.', searchLabel: 'Choose slot', workSentence: 'Use the move buttons to arrange card order.' },
} as const;
const collectionWords = {
  ko: { filter: '관계 필터', allRelations: '모든 관계', sort: '정렬', orderCreated: '추가한 순서', sortAZ: '캐릭터 이름 A–Z', sortZA: '캐릭터 이름 Z–A', noMatches: '조건에 맞는 카드가 없어요.', moreActions: '카드 작업' },
  ja: { filter: '関係で絞り込み', allRelations: 'すべての関係', sort: '並び替え', orderCreated: '追加順', sortAZ: 'キャラクター名 A–Z', sortZA: 'キャラクター名 Z–A', noMatches: '一致するカードはありません。', moreActions: 'カード操作' },
  en: { filter: 'Filter by relationship', allRelations: 'All relationships', sort: 'Sort', orderCreated: 'Date added', sortAZ: 'Character names A–Z', sortZA: 'Character names Z–A', noMatches: 'No cards match these filters.', moreActions: 'Card actions' },
} as const;
function pairKey(pair: Pick<PairFields, 'a' | 'b' | 'direction'>) {
  if (!pair.a || !pair.b) return '';
  return pair.direction === 'mutual' ? JSON.stringify(['mutual', ...[pair.a, pair.b].sort()]) : JSON.stringify(['directed', ...(pair.direction === 'reverse' ? [pair.b, pair.a] : [pair.a, pair.b])]);
}
function directionSymbol(direction: PairFields['direction']) { return direction === 'mutual' ? '↔' : direction === 'reverse' ? '←' : '→'; }

export default function PairsEditor() {
  const { lang } = useLang();
  const t = { ...copy[lang], ...strings[lang], ...collectionWords[lang] };
  const { draft, setDraft, resetDraft, hasDraft, saveStatus, warning } = useCouplingDraft('pairs');
  const rootRef = useRef<HTMLElement>(null);
  const pickerDialogRef = useRef<HTMLDialogElement>(null);
  const pickerOpenerRef = useRef<HTMLElement | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collectionRelation, setCollectionRelation] = useState<RelationId | 'all'>('all');
  const [collectionSort, setCollectionSort] = useState<'created' | 'az' | 'za'>('created');
  const [snackbar, setSnackbar] = useState<{ message: string; onAction: () => void } | null>(null);
  const historyRef = useRef(history);
  historyRef.current = history;
  useEffect(() => {
    const dialog = pickerDialogRef.current;
    if (!dialog) return;
    if (pickerOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    } else if (!pickerOpen && dialog.open) dialog.close();
  }, [pickerOpen]);
  const pairIndex = useMemo(() => new Map(PROFILE_CHARACTER_BY_ID), []);
  const text = (id: string | null) => id ? pairIndex.get(id)?.[lang] ?? id : '';
  const character = (id: string | null): ProfileCharacter | undefined => id ? pairIndex.get(id) : undefined;
  const announce = (message: string, isError = false) => { setFeedback(message); setError(isError); };
  const remember = (action: string) => setHistory(items => [...items.slice(-99), { pairs: draft.pairs.map(pair => ({ ...pair })), draft: { ...draft.draft }, activeSlot: draft.activeSlot, editingId: draft.editingId, action }]);
  const update = (change: Partial<PairsDraft>) => setDraft(current => ({ ...current, ...change }));
  const patchForm = (change: Partial<PairFields>) => update({ draft: { ...draft.draft, ...change } });
  const openPicker = (slot: 'a' | 'b', opener: HTMLElement) => {
    pickerOpenerRef.current = opener;
    selectSlot(slot);
    setPickerOpen(true);
  };
  const closePicker = () => {
    setPickerOpen(false);
    requestAnimationFrame(() => pickerOpenerRef.current?.focus());
  };
  const selectSlot = (slot: 'a' | 'b') => { update({ activeSlot: slot }); announce(`${slot.toUpperCase()} ${t.selected}`); };
  const pickCharacter = (picked: ProfileCharacter) => {
    const other = draft.activeSlot === 'a' ? 'b' : 'a';
    if (draft.draft[other] === picked.id) { announce(t.self, true); return; }
    const slot = draft.activeSlot;
    const next = { ...draft.draft, [slot]: picked.id };
    update({ draft: next, activeSlot: slot === 'a' && !next.b ? 'b' : draft.activeSlot });
    announce(`${picked[lang]} ${t.selectDone}`);
    if (next.a && next.b) closePicker();
  };
  const resetEditor = () => update({ draft: blankFields(), activeSlot: 'a', editingId: null });
  const resetAll = () => {
    if (!window.confirm(copy[lang].resetConfirm)) return;
    resetDraft(); setHistory([]); setPickerOpen(false); setError(false); announce(copy[lang].resetDone);
  };
  const undo = () => {
    const previous = historyRef.current[historyRef.current.length - 1];
    if (!previous) { announce(t.emptyUndo); return; }
    setHistory(items => items.slice(0, -1));
    setDraft({ pairs: previous.pairs, draft: previous.draft, activeSlot: previous.activeSlot, editingId: previous.editingId });
    announce(`${previous.action}: ${t.undoDone}`);
  };
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (pickerDialogRef.current?.open || event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing || event.keyCode === 229) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'b') { event.preventDefault(); selectSlot(key); }
      else if (key === '/') { event.preventDefault(); root.querySelector<HTMLInputElement>('input[type="search"]')?.focus(); }
      else if (key === 'z') { event.preventDefault(); undo(); }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  });
  const save = (event: FormEvent) => {
    event.preventDefault();
    const fields = draft.draft;
    if (!fields.a || !fields.b) { announce(t.aRequired, true); return; }
    if (fields.a === fields.b) { announce(t.self, true); return; }
    if (draft.pairs.some(pair => pair.id !== draft.editingId && pairKey(pair) === pairKey(fields))) { announce(t.duplicate, true); return; }
    const editing = draft.editingId;
    remember(editing ? 'edit' : 'save');
    const next: PairCard[] = editing
      ? draft.pairs.map(pair => pair.id === editing ? { ...fields, a: fields.a!, b: fields.b!, id: editing } : pair)
      : [...draft.pairs, { ...fields, a: fields.a, b: fields.b, id: `pair-${Math.max(0, ...draft.pairs.map(pair => Number(pair.id.match(/^pair-(\d+)$/)?.[1] ?? 0))) + 1}` }];
    setDraft({ pairs: next, draft: blankFields(), activeSlot: 'a', editingId: null });
    announce(editing ? t.updated : t.saved);
  };
  const directionSentence = (pair: PairFields) => pair.direction === 'mutual' ? `${text(pair.a)} ↔ ${text(pair.b)}` : pair.direction === 'reverse' ? `${text(pair.b)} → ${text(pair.a)}` : `${text(pair.a)} → ${text(pair.b)}`;
  const editCard = (pair: PairCard) => { const { id, ...fields } = pair; update({ draft: { ...fields }, activeSlot: 'a', editingId: id }); announce(`${text(pair.a)} / ${text(pair.b)} · ${t.edit}`); };
  const removeCard = (id: string) => { const index = draft.pairs.findIndex(pair => pair.id === id); if (index < 0) return; remember('delete'); const pairs = draft.pairs.filter(pair => pair.id !== id); setDraft({ pairs, draft: draft.editingId === id ? blankFields() : draft.draft, activeSlot: draft.editingId === id ? 'a' : draft.activeSlot, editingId: draft.editingId === id ? null : draft.editingId }); announce(t.remove); setSnackbar({ message: t.remove, onAction: undo }); };
  const visiblePairs = useMemo(() => {
    const pairs = draft.pairs.filter(pair => collectionRelation === 'all' || pair.relation === collectionRelation);
    if (collectionSort === 'created') return pairs;
    return pairs.sort((left, right) => {
      const leftNames = `${text(left.a)} ${text(left.b)}`;
      const rightNames = `${text(right.a)} ${text(right.b)}`;
      const order = leftNames.localeCompare(rightNames, lang);
      return collectionSort === 'az' ? order : -order;
    });
  }, [collectionRelation, collectionSort, draft.pairs, lang]);
  const moveCard = (id: string, offset: number) => { const index = draft.pairs.findIndex(pair => pair.id === id); const target = index + offset; if (target < 0 || target >= draft.pairs.length) return; remember('reorder'); const pairs = [...draft.pairs]; [pairs[index], pairs[target]] = [pairs[target], pairs[index]]; update({ pairs }); };
  const saveLabel = !hasDraft ? t.draftNew : saveStatus === 'saving' ? (lang === 'ko' ? '저장 중…' : lang === 'ja' ? '保存中…' : 'Saving…') : saveStatus === 'memory-only' ? t.memoryOnly : t.saved;

  return <section className="coupling-pairs" ref={rootRef} aria-label={t.pairs}>
    <div className="coupling-pairs-grid">
      <section className="coupling-panel coupling-pairs-editor" aria-labelledby="pairs-editor-title">
        <header className="coupling-pairs-heading"><div><p className="coupling-pairs-eyebrow">PAIR STUDIO</p><h1 id="pairs-editor-title">{draft.editingId ? t.edit : t.title}</h1><p>{t.subtitle}</p></div><div className="coupling-pairs-heading-actions"><span className="coupling-pairs-save-state" role="status">{saveLabel}</span><button className="coupling-btn" type="button" onClick={resetAll}>{copy[lang].reset}</button><button className="coupling-btn" type="button" onClick={resetEditor}>{t.new}</button></div></header>
        <div className="coupling-pairs-stage">
          {(['a', 'b'] as const).map(slot => {
            const person = character(draft.draft[slot]);
            return <div className="coupling-pairs-slot-wrap" key={slot}>
                <button type="button" className="coupling-pairs-slot" aria-pressed={draft.activeSlot === slot} aria-label={`${slot.toUpperCase()} ${t.slot}: ${person?.[lang] ?? t.empty}`} onClick={event => openPicker(slot, event.currentTarget)}>
                <span className="coupling-pairs-slot-label">{slot.toUpperCase()} · {draft.activeSlot === slot ? (lang === 'ko' ? '선택 중' : lang === 'ja' ? '選択中' : 'active') : t.slot}</span>
                {person ? <><CharacterAvatar character={person} size={88} /><strong>{person[lang]}</strong><small>{person.group[lang]}</small></> : <><span className="coupling-pairs-empty-avatar" aria-hidden="true">+</span><strong>{t.empty}</strong><small>{copy[lang].pickerTitle}</small></>}
              </button>
              <button type="button" className="coupling-btn coupling-pairs-clear" disabled={!person} onClick={() => { patchForm({ [slot]: null }); update({ activeSlot: slot }); }}>{slot === 'a' ? t.clearA : t.clearB}</button>
            </div>;
          })}
          <div className="coupling-pairs-stage-center"><span aria-hidden="true" className="coupling-pairs-arrow">{directionSymbol(draft.draft.direction)}</span><span className="coupling-pairs-relation-preview" style={{ '--coupling-pair-color': RELATIONS.find(item => item.id === draft.draft.relation)?.color } as CSSProperties}>{RELATIONS.find(item => item.id === draft.draft.relation)?.symbol} {RELATIONS.find(item => item.id === draft.draft.relation)?.label[lang]}{draft.draft.preference && <span className="coupling-preference-label"> · {PREFERENCE_BY_ID.get(draft.draft.preference)?.symbol} {PREFERENCE_BY_ID.get(draft.draft.preference)?.label[lang]}</span>}</span><small className="coupling-pairs-direction-preview">{draft.draft.a && draft.draft.b ? directionSentence(draft.draft) : t[draft.draft.direction]}</small><button type="button" className="coupling-btn coupling-pairs-swap" aria-label={t.swap} title={t.swap} disabled={!draft.draft.a && !draft.draft.b} onClick={() => patchForm({ a: draft.draft.b, b: draft.draft.a })}>⇄</button></div>
        </div>
        <p className="coupling-pairs-instruction">{t.active.replace('{slot}', draft.activeSlot.toUpperCase())}</p>
        <form className="coupling-pairs-fields" onSubmit={save}>
          <div className="coupling-pairs-controls">
          <fieldset className="coupling-pairs-control-group">
            <legend>{t.relation}</legend>
            <div className="coupling-pairs-choice-grid">{RELATIONS.map(relation => <label key={relation.id} style={{ '--coupling-pair-color': relation.color } as CSSProperties}><input type="radio" name="pairRelation" value={relation.id} checked={draft.draft.relation === relation.id} onChange={() => patchForm({ relation: relation.id })}/><span aria-hidden="true">{relation.symbol}</span><strong>{relation.label[lang]}</strong></label>)}</div>
          </fieldset>
          <fieldset className="coupling-pairs-control-group coupling-pairs-preference-group">
            <legend>{t.personalPreference}</legend>
            <PreferencePicker value={draft.draft.preference} onChange={preference => patchForm({ preference })} label={t.personalPreference} />
          </fieldset>
          <fieldset className="coupling-pairs-control-group coupling-pairs-direction-group">
            <legend>{t.direction}</legend>
            <div className="coupling-pairs-choice-grid">{(['forward', 'mutual', 'reverse'] as const).map(direction => <label key={direction}><input type="radio" name="pairDirection" value={direction} checked={draft.draft.direction === direction} onChange={() => patchForm({ direction })}/><span aria-hidden="true">{directionSymbol(direction)}</span><strong>{t[direction]}</strong></label>)}</div>
          </fieldset>
          </div>
          <label className="coupling-field">{t.memo}<textarea rows={4} value={draft.draft.memo} placeholder={t.memoPlaceholder} onChange={event => patchForm({ memo: event.target.value })} /></label>
          <div className="coupling-actions"><button type="submit" className="coupling-btn coupling-btn-primary">{draft.editingId ? t.editSave : t.save}</button><button type="button" className="coupling-btn" onClick={event => openPicker(draft.activeSlot, event.currentTarget)}>{t.search}</button></div>
        </form>
        <p className="coupling-pairs-key-help"><kbd>A</kbd> / <kbd>B</kbd> {t.searchLabel}　<kbd>/</kbd> {t.search}　<kbd>Z</kbd> {t.undo}</p>
        <div className="coupling-pairs-feedback" role="status" aria-live="polite" data-tone={error ? 'error' : 'normal'}>{feedback || t.saveHint}{warning && <span className="coupling-save-warning">{warning}</span>}</div>
      </section>
      <dialog ref={pickerDialogRef} className="coupling-pairs-picker-dialog" aria-labelledby="pairs-picker-title" onCancel={event => { event.preventDefault(); closePicker(); }} onClose={closePicker}>
        <div className="coupling-pairs-picker-shell">
          <header><div><h2 id="pairs-picker-title">{t.search}</h2><p>{t.active.replace('{slot}', draft.activeSlot.toUpperCase())}</p></div><button type="button" className="coupling-btn" aria-label={t.close} onClick={closePicker}>{t.close}</button></header>
          <div className="coupling-pairs-picker-slots" role="group" aria-label={t.chooseCharacter}>{(['a', 'b'] as const).map(slot => <button type="button" className="coupling-btn" key={slot} aria-pressed={draft.activeSlot === slot} aria-label={`${slot.toUpperCase()} ${t.slot}: ${text(draft.draft[slot]) || t.empty}`} onClick={() => selectSlot(slot)}><strong>{slot.toUpperCase()}</strong><span>{text(draft.draft[slot]) || t.empty}</span></button>)}</div>
          <CharacterPicker onSelect={pickCharacter} selectedIds={[draft.draft.a, draft.draft.b].filter((id): id is string => Boolean(id))} autoFocus={pickerOpen} />
          <footer><p aria-live="polite"><strong>A</strong> {text(draft.draft.a) || t.empty} <span aria-hidden="true">→</span> <strong>B</strong> {text(draft.draft.b) || t.empty}</p><button type="button" className="coupling-btn coupling-btn-primary" onClick={closePicker}>{t.close}</button></footer>
        </div>
      </dialog>
      <section className="coupling-panel coupling-pairs-collection" aria-labelledby="pairs-collection-title">
        <header className="coupling-pairs-collection-heading"><div><h2 id="pairs-collection-title">{t.collection} <span className="coupling-pairs-count">{visiblePairs.length} / {draft.pairs.length}</span></h2><p>{t.workSentence}</p></div><button type="button" className="coupling-btn" disabled={!history.length} onClick={undo}>{t.undo}</button></header>
        <div className="coupling-pairs-collection-controls"><label className="coupling-field">{t.filter}<select className="coupling-pairs-filter" value={collectionRelation} onChange={event => setCollectionRelation(event.target.value as RelationId | 'all')}><option value="all">{t.allRelations}</option>{RELATIONS.map(relation => <option key={relation.id} value={relation.id}>{relation.label[lang]}</option>)}</select></label><label className="coupling-field">{t.sort}<select className="coupling-pairs-sort" value={collectionSort} onChange={event => setCollectionSort(event.target.value as 'created' | 'az' | 'za')}><option value="created">{t.orderCreated}</option><option value="az">{t.sortAZ}</option><option value="za">{t.sortZA}</option></select></label></div>
        {draft.pairs.length === 0 ? <div className="coupling-pairs-empty"><strong>{t.emptyCards}</strong>{t.subtitle}</div> : visiblePairs.length === 0 ? <div className="coupling-pairs-empty">{t.noMatches}</div> : <ol className="coupling-pairs-list" aria-label={t.collection}>{visiblePairs.map((pair, index) => {
          const a = character(pair.a); const b = character(pair.b); const relation = RELATIONS.find(item => item.id === pair.relation)!;
          if (!a || !b) return null;
          return <li className="coupling-pair-card" data-editing={pair.id === draft.editingId} key={pair.id} style={{ '--coupling-pair-color': relation.color } as CSSProperties}>
            <div className="coupling-pair-card-top"><span>PAIR {String(index + 1).padStart(2, '0')}</span><span>{relation.symbol} {relation.label[lang]}{pair.preference && <span className="coupling-preference-label"> · {PREFERENCE_BY_ID.get(pair.preference)?.symbol} {PREFERENCE_BY_ID.get(pair.preference)?.label[lang]}</span>}</span></div>
            <div className="coupling-pair-couple"><div><CharacterAvatar character={a} size={60} /><strong>{a[lang]}</strong></div><span aria-hidden="true">{directionSymbol(pair.direction)}</span><div><CharacterAvatar character={b} size={60} /><strong>{b[lang]}</strong></div></div>
            <p className="coupling-pair-caption">{directionSentence(pair)}</p><p className={`coupling-pair-memo${pair.memo ? '' : ' coupling-pair-no-memo'}`}>{pair.memo || t.noMemo}</p>
             <div className="coupling-pair-card-actions"><button type="button" className="coupling-btn" onClick={() => editCard(pair)}>{t.edit}</button><details className="coupling-pair-secondary-actions"><summary>{t.moreActions}</summary><div><button type="button" className="coupling-btn" disabled={collectionSort !== 'created' || collectionRelation !== 'all' || index === 0} aria-label={t.first} onClick={() => moveCard(pair.id, -1)}>↑ {t.first}</button><button type="button" className="coupling-btn" disabled={collectionSort !== 'created' || collectionRelation !== 'all' || index === visiblePairs.length - 1} aria-label={t.last} onClick={() => moveCard(pair.id, 1)}>↓ {t.last}</button><button type="button" className="coupling-btn coupling-pair-delete" onClick={() => removeCard(pair.id)}>{t.remove}</button></div></details></div>
          </li>;
        })}</ol>}
      </section>
    </div>
    {snackbar&&<CouplingSnackbar message={snackbar.message} actionLabel={t.undo} dismissLabel={copy[lang].close} onAction={snackbar.onAction} onDismiss={()=>setSnackbar(null)}/>}
  </section>;
}
