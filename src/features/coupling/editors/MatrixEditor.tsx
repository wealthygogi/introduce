import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../../contexts/LangContext';
import CharacterPicker from '../components/CharacterPicker';
import CharacterAvatar from '../components/CharacterAvatar';
import { PROFILE_CHARACTER_BY_ID } from '../data';
import { RELATIONS } from '../relations';
import { useCouplingDraft } from '../CouplingDraftProvider';
import type { MatrixDraft, RelationId } from '../types';
import copy from '../copy';
import '../matrix/matrix.css';

const MAX_ROSTER = 16;
type Pair = { from: string; to: string };
type Snapshot = MatrixDraft;
const copyPair = (pair: Pair) => JSON.stringify([pair.from, pair.to]);
const unpack = (key: string): Pair => { const [from, to] = JSON.parse(key) as [string, string]; return { from, to }; };
const names: Record<string, Record<string, string>> = {
  ko: { title: '관계 매트릭스', intro: '행에서 열로 읽어 관계를 빠르게 기록하세요.', roster: '비교 명단', count: '명', density: '칸 크기', remove: '제거', confirmTitle: '캐릭터 제거 확인', confirmText: '두 모드의 관련 관계도 함께 삭제됩니다. 실행 취소로 모두 복구할 수 있습니다.', confirmRemove: '캐릭터와 관계 제거', cancel: '취소', emptyRoster: '캐릭터를 추가해 관계표를 시작하세요.', emptyRelations: '아직 관계가 없습니다. 관계 종류를 선택한 뒤 칸을 누르세요.', self: '자기 관계 사용 불가', noRelation: '관계 없음', added: '추가했습니다.', max: '최대 16명까지 비교할 수 있습니다. 먼저 캐릭터를 제거하세요.', select: '관계 종류', matrixDesc: '행은 출발, 열은 도착입니다.', symmetric: '대칭 칸은 같은 관계 한 건입니다.', independent: '반대 방향 관계는 각각 저장됩니다.', details: '선택한 모드의 관계', noUndo: '되돌릴 편집이 없습니다.', undoDone: '마지막 편집을 되돌렸습니다.', directed: '방향 있음', unordered: '방향 없음', records: '건', row: '출발', col: '도착', statusSaved: '자동 저장됨', statusSaving: '저장 중…', statusMemory: '현재 탭에서만 유지' },
  ja: { title: '関係マトリクス', intro: '行から列へ読み、関係をすばやく記録します。', roster: '比較するキャラクター', count: '人', density: 'セルサイズ', remove: '削除', confirmTitle: 'キャラクターの削除確認', confirmText: '両モードの関連関係も削除されます。元に戻すとすべて復元できます。', confirmRemove: 'キャラクターと関係を削除', cancel: 'キャンセル', emptyRoster: 'キャラクターを追加して関係表を始めましょう。', emptyRelations: '関係はまだありません。種類を選び、セルを押してください。', self: '自分との関係は使用できません', noRelation: '関係なし', added: '追加しました。', max: '比較できるのは最大16人です。先にキャラクターを削除してください。', select: '関係の種類', matrixDesc: '行は出発、列は到着です。', symmetric: '対称セルは同じ1件の関係です。', independent: '逆方向の関係は別々に保存されます。', details: '選択モードの関係', noUndo: '元に戻す編集はありません。', undoDone: '最後の編集を元に戻しました。', directed: '方向あり', unordered: '方向なし', records: '件', row: '出発', col: '到着', statusSaved: '自動保存済み', statusSaving: '保存中…', statusMemory: 'このタブのみ' },
  en: { title: 'Relationship matrix', intro: 'Read from row to column to record relationships quickly.', roster: 'Roster', count: 'characters', density: 'Cell size', remove: 'Remove', confirmTitle: 'Confirm character removal', confirmText: 'Related relationships in both modes will also be deleted. Undo restores everything.', confirmRemove: 'Remove character and relationships', cancel: 'Cancel', emptyRoster: 'Add characters to start the matrix.', emptyRelations: 'No relationships yet. Choose a type, then select a cell.', self: 'Self-relationships are unavailable', noRelation: 'No relationship', added: ' added.', max: 'Compare up to 16 characters. Remove one before adding another.', select: 'Relationship type', matrixDesc: 'Rows are sources and columns are targets.', symmetric: 'Symmetric cells represent one shared relationship.', independent: 'Opposite directions are stored independently.', details: 'Relationships in this mode', noUndo: 'There is nothing to undo.', undoDone: 'Last edit undone.', directed: 'Directed', unordered: 'Undirected', records: 'records', row: 'From', col: 'To', statusSaved: 'Saved automatically', statusSaving: 'Saving…', statusMemory: 'Kept in this tab only' },
};

export default function MatrixEditor() {
  const { lang } = useLang();
  const t: Record<string, string> = { ...copy[lang], ...names[lang] };
  const { draft, setDraft, saveStatus, warning } = useCouplingDraft('matrix');
  const [selectedRelation, setSelectedRelation] = useState<RelationId>('love');
  const [density, setDensity] = useState(76);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [history, setHistory] = useState<Snapshot[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<Pair>({ from: draft.roster[0] ?? '', to: draft.roster[1] ?? '' });
  const roster = draft.roster;
  const store = draft[draft.mode];
  const modeLabel = draft.mode === 'directed' ? t.directed : t.unordered;
  const arrow = draft.mode === 'directed' ? '→' : '↔';
  const relationMap = useMemo(() => new Map(RELATIONS.map(relation => [relation.id, relation])), []);
  const recordKey = (from: string, to: string) => JSON.stringify(draft.mode === 'unordered' && from > to ? [to, from] : [from, to]);
  const commit = (next: MatrixDraft, previous = draft) => { setHistory(items => [...items.slice(-99), structuredClone(previous)]); setDraft(next); };
  const cellValue = (from: string, to: string) => store.find(item => item.from === (draft.mode === 'unordered' && from > to ? to : from) && item.to === (draft.mode === 'unordered' && from > to ? from : to))?.relation;

  const addCharacter = (character: { id: string; ko: string }) => {
    if (roster.includes(character.id)) return;
    if (roster.length >= MAX_ROSTER) { setAnnouncement(t.max); return; }
    commit({ ...draft, roster: [...roster, character.id] });
    setAnnouncement(`${character.ko}${t.added}`);
  };
  const changeRelation = (from: string, to: string, toggle = false) => {
    if (from === to || !roster.includes(from) || !roster.includes(to)) return;
    const key = recordKey(from, to), old = cellValue(from, to);
    const nextValue = toggle && old === selectedRelation ? undefined : selectedRelation;
    if (old === nextValue) return;
    const records = store.filter(item => JSON.stringify([item.from, item.to]) !== key);
    if (nextValue) records.push(draft.mode === 'directed' ? { from, to, relation: nextValue } : { ...unpack(key), relation: nextValue });
    commit({ ...draft, [draft.mode]: records } as MatrixDraft);
    const relation = relationMap.get(nextValue ?? selectedRelation)?.label[lang];
    setAnnouncement(`${PROFILE_CHARACTER_BY_ID.get(from)?.[lang]} ${arrow} ${PROFILE_CHARACTER_BY_ID.get(to)?.[lang]}: ${relation ?? t.noRelation}${draft.mode === 'unordered' ? ` · ${t.symmetric}` : ''}`);
  };
  const deleteRelation = (from: string, to: string) => {
    const key = recordKey(from, to);
    if (!store.some(item => JSON.stringify([item.from, item.to]) === key)) return;
    commit({ ...draft, [draft.mode]: store.filter(item => JSON.stringify([item.from, item.to]) !== key) });
  };
  const affectedCount = (id: string) => [...draft.directed, ...draft.unordered].filter(item => item.from === id || item.to === id).length;
  const confirmRemove = () => {
    if (!pendingRemoval) return;
    const id = pendingRemoval;
    commit({ ...draft, roster: roster.filter(item => item !== id), directed: draft.directed.filter(item => item.from !== id && item.to !== id), unordered: draft.unordered.filter(item => item.from !== id && item.to !== id) });
    setPendingRemoval(null); setAnnouncement(`${PROFILE_CHARACTER_BY_ID.get(id)?.[lang]} · ${t.remove}`);
  };
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(items => items.slice(0, -1)); setDraft(previous); setPendingRemoval(null); setAnnouncement(t.undoDone);
  };
  const focusCell = (from: string, to: string) => {
    focusRef.current = { from, to };
    const root = scrollRef.current;
    if (!root) return;
    const button = root.querySelector<HTMLButtonElement>(`button[data-from="${CSS.escape(from)}"][data-to="${CSS.escape(to)}"]`);
    button?.focus();
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onFocus = (event: FocusEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-from][data-to]:not(:disabled)');
      if (button) focusRef.current = { from: button.dataset.from ?? '', to: button.dataset.to ?? '' };
    };
    root.addEventListener('focusin', onFocus);
    return () => root.removeEventListener('focusin', onFocus);
  }, []);
  const handleGridKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.matches('input,textarea,select,[contenteditable="true"]') || event.nativeEvent.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const button = target.closest<HTMLButtonElement>('[data-from][data-to]:not(:disabled)');
    if (!button) return;
    const from = button.dataset.from!, to = button.dataset.to!;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const rowStep = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      const colStep = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      let row = roster.indexOf(from), col = roster.indexOf(to);
      do { row += rowStep; col += colStep; } while (row >= 0 && col >= 0 && row < roster.length && col < roster.length && row === col);
      if (row >= 0 && col >= 0 && row < roster.length && col < roster.length) focusCell(roster[row], roster[col]);
    } else if (/^[1-5]$/.test(event.key)) {
      event.preventDefault(); setSelectedRelation(RELATIONS[Number(event.key) - 1].id);
      setAnnouncement(`${t.select}: ${RELATIONS[Number(event.key) - 1].label[lang]}`);
    } else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteRelation(from, to); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!event.repeat) changeRelation(from, to, event.key === ' '); }
  };
  return <section className="coupling-matrix-editor">
    <header className="coupling-panel coupling-matrix-heading"><div><h1>{t.title}</h1><p>{t.intro}</p></div><div className="coupling-matrix-save" aria-live="polite">{warning ? <span className="coupling-save-warning">{warning}</span> : saveStatus === 'saving' ? t.statusSaving : saveStatus === 'memory-only' ? t.statusMemory : t.statusSaved}</div></header>
    <section className="coupling-panel coupling-matrix-controls" aria-label={t.select}>
      <div className="coupling-toolbar"><button className="coupling-btn" type="button" onClick={undo} disabled={!history.length}>{t.undo}</button><span className="coupling-status">{roster.length} × {roster.length} · {store.length} {t.records}</span>
        <div className="coupling-matrix-mode" role="group" aria-label={t.matrixDesc}>{(['directed', 'unordered'] as const).map(mode => <button className="coupling-btn" type="button" key={mode} aria-pressed={draft.mode === mode} onClick={() => { if (draft.mode !== mode) { setDraft({ ...draft, mode }); setPendingRemoval(null); } }}>{mode === 'directed' ? t.directed : t.unordered} ({draft[mode].length})</button>)}</div>
      </div>
      <div className="coupling-toolbar coupling-matrix-palette" aria-label={t.select}>{RELATIONS.map((relation, index) => <button className="coupling-btn coupling-relation-button" style={{ '--relation-color': relation.color } as React.CSSProperties} type="button" key={relation.id} aria-pressed={selectedRelation === relation.id} onClick={() => setSelectedRelation(relation.id)}><span>{relation.symbol}</span>{relation.label[lang]} <kbd>{index + 1}</kbd></button>)}</div>
      <div className="coupling-toolbar coupling-matrix-density"><label className="coupling-field">{t.density}<select value={density} onChange={event => setDensity(Number(event.target.value))}><option value={56}>{copy[lang].densityCompact}</option><option value={76}>{copy[lang].densityStandard}</option><option value={104}>{copy[lang].densityWide}</option></select></label><span>{t.matrixDesc} {draft.mode === 'unordered' ? t.symmetric : t.independent}</span></div>
    </section>
    <div className="coupling-matrix-layout">
      <section className="coupling-panel coupling-matrix-workspace"><h2>{t.title} <small>{modeLabel} · {store.length} {t.records}</small></h2>
        <div ref={scrollRef} className="coupling-matrix-scroll" onKeyDown={handleGridKey} tabIndex={-1}>
          {roster.length === 0 ? <p className="coupling-empty-note">{t.emptyRoster}</p> : <table className="coupling-relationship-matrix" style={{ width: 180 + roster.length * density }} aria-describedby="coupling-matrix-help"><caption className="coupling-matrix-sr">{modeLabel}. {t.matrixDesc} {draft.mode === 'unordered' ? t.symmetric : t.independent}</caption><colgroup><col style={{ width: 180 }} />{roster.map(id => <col key={id} style={{ width: density }} />)}</colgroup><thead><tr><th className="coupling-matrix-corner" scope="col">{t.row} ↓ / {t.col} →</th>{roster.map(id => { const c = PROFILE_CHARACTER_BY_ID.get(id)!; return <th scope="col" key={id}><div className="coupling-matrix-column"><CharacterAvatar character={c} size={36} decorative /><strong>{c[lang]}</strong></div></th>})}</tr></thead><tbody>{roster.map(from => { const c = PROFILE_CHARACTER_BY_ID.get(from)!; return <tr key={from}><th scope="row"><div className="coupling-matrix-row"><CharacterAvatar character={c} size={32} decorative /><strong>{c[lang]}</strong></div></th>{roster.map(to => { const self = from === to, value = self ? undefined : cellValue(from, to), relation = value ? relationMap.get(value) : undefined, target = PROFILE_CHARACTER_BY_ID.get(to)!; return <td key={to} className={self ? 'coupling-matrix-self' : undefined}><button type="button" className={`coupling-matrix-cell${relation ? ' has-relation' : ''}`} data-from={from} data-to={to} disabled={self} tabIndex={!self && focusRef.current.from === from && focusRef.current.to === to ? 0 : -1} aria-label={`${c[lang]} ${arrow} ${target[lang]}: ${self ? t.self : relation?.label[lang] ?? t.noRelation}`} aria-pressed={Boolean(relation)} style={relation ? { '--relation-color': relation.color, '--relation-background': `${relation.color}13` } as React.CSSProperties : undefined} onClick={() => { focusRef.current = { from, to }; changeRelation(from, to, true); }}><span aria-hidden="true">{self ? '—' : relation?.symbol ?? '·'}</span>{relation && <small>{relation.label[lang]}</small>}</button></td>})}</tr>})}</tbody></table>}
        </div><div id="coupling-matrix-help" className="coupling-matrix-help"><p>{t.matrixDesc} {draft.mode === 'unordered' ? t.symmetric : t.independent} {copy[lang].matrixShortcuts.replace('{select}',t.select)}</p><p className="coupling-status" aria-live="polite">{announcement}</p></div>
      </section>
      <aside className="coupling-matrix-sidebar">
        <section className="coupling-panel coupling-matrix-roster"><h2>{t.roster} <small>{roster.length} / {MAX_ROSTER} {t.count}</small></h2><div className="coupling-matrix-chips">{roster.length ? roster.map(id => { const c = PROFILE_CHARACTER_BY_ID.get(id)!; return <div className="coupling-matrix-chip" key={id}><CharacterAvatar character={c} size={28} decorative /><span>{c[lang]}</span><button type="button" className="coupling-btn" aria-label={`${c[lang]} ${t.remove}`} onClick={() => { setPendingRemoval(id); }}>{t.remove}</button></div>}) : <p className="coupling-empty-note">{t.emptyRoster}</p>}</div>{pendingRemoval && <div className="coupling-matrix-confirm" role="group" aria-label={t.confirmTitle}><p><strong>{PROFILE_CHARACTER_BY_ID.get(pendingRemoval)?.[lang]}</strong>: {t.confirmText} ({affectedCount(pendingRemoval)} {t.records})</p><div className="coupling-toolbar"><button className="coupling-btn coupling-btn-primary" type="button" onClick={confirmRemove}>{t.confirmRemove}</button><button className="coupling-btn" type="button" onClick={() => setPendingRemoval(null)}>{t.cancel}</button></div></div>}<p className="coupling-status">{roster.length} / {MAX_ROSTER}</p></section>
        <details className="coupling-panel coupling-matrix-library"><summary>{t.addCharacter}</summary>{roster.length >= MAX_ROSTER && <p className="coupling-matrix-note">{t.max}</p>}<CharacterPicker onSelect={addCharacter} disabledIds={roster} label={t.pickerTitle} /></details>
        <section className="coupling-panel coupling-matrix-summary"><h2>{t.details} <small>{modeLabel} · {store.length} {t.records}</small></h2>{store.length ? <ul>{store.map(item => { const from = PROFILE_CHARACTER_BY_ID.get(item.from)!, to = PROFILE_CHARACTER_BY_ID.get(item.to)!, relation = relationMap.get(item.relation)!; return <li key={JSON.stringify([item.from, item.to])}><div className="coupling-matrix-pair"><span><CharacterAvatar character={from} size={26} decorative /><strong>{from[lang]}</strong></span><span>{arrow}</span><span><CharacterAvatar character={to} size={26} decorative /><strong>{to[lang]}</strong></span><small style={{ '--relation-color': relation.color } as React.CSSProperties}>{relation.symbol} {relation.label[lang]}</small></div><button className="coupling-btn" type="button" aria-label={`${from[lang]} ${arrow} ${to[lang]} ${t.remove}`} onClick={() => deleteRelation(item.from, item.to)}>{t.remove}</button></li>})}</ul> : <p className="coupling-empty-note">{t.emptyRelations}</p>}</section>
      </aside>
    </div>
  </section>;
}
