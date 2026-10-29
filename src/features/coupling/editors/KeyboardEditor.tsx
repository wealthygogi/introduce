import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { useCouplingDraft } from '../CouplingDraftProvider';
import { PROFILE_CHARACTER_BY_ID } from '../data';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterPicker from '../components/CharacterPicker';
import RelationLegend from '../components/RelationLegend';
import CouplingImageExport from '../components/CouplingImageExport';
import PreferencePicker from '../components/PreferencePicker';
import { PREFERENCE_BY_ID, RELATIONS, RELATION_BY_ID } from '../relations';
import copy from '../copy';
import type { KeyboardDraft, PreferenceId, RelationId } from '../types';
import '../keyboard/keyboard.css';

const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());
const EMPTY_CHARACTER_IDS: readonly string[] = [];
type Stage = 'source' | 'relation' | 'target' | 'confirm';
const text = {
  ko: { intro: '중심 캐릭터에서 출발해 관계를 차례로 연결합니다.', focus: '현재 중심', partners: '명의 상대 · 자동 배치', total: '전체', count: '개', source: '중심 선택', relation: '관계 선택', target: '상대 선택', stepConfirm: '연결 확인', changeSource: '중심 변경', sourceHint: '먼저 중심 캐릭터를 선택하세요.', targetHint: '중심과 관계 설정은 유지됩니다. 연결할 상대를 선택하세요.', pickSource: '중심으로 선택', pickTarget: '상대로 선택', relationship: '관계 종류', suggestions: '상대 선택', noResults: '검색 결과가 없습니다. 중심 자신은 제외됩니다.', center: '중심으로 이동', edit: '관계 편집', empty: '아직 연결된 상대가 없습니다. 관계와 상대를 선택해 첫 연결을 만드세요.', prev: '이전', next: '다음', fit: '맞춤', zoomIn: '확대', zoomOut: '축소', remove: '관계 삭제', clear: '전체 비우기', clearConfirm: '모든 관계를 비우시겠습니까?', confirm: '연결하기', update: '관계 업데이트', cancel: '취소', undo: '실행 취소', searchDone: '검색 완료', search: '상대 검색', savedExists: '저장된 관계가 있습니다. 확정하면 종류를 변경합니다.', notSaved: '아직 저장되지 않았습니다. 연결 확정을 눌러 주세요.', same: '이미 같은 관계로 저장되어 있습니다. 중복 연결은 만들지 않습니다.', noUndo: '취소할 관계 편집이 없습니다.', undoDone: '마지막 관계 편집을 취소했습니다.', emptyGraph: '작은 화면에서는 위쪽 입력 영역을 사용하세요.', allLibrary: '전체 캐릭터 라이브러리', sourceMode: '중심 선택', targetMode: '상대 선택', keyboard: '단축키: / 검색 · S 중심 변경 · U 실행 취소 · 1–5 관계 · 1–9 상대 · Enter 확정', saved: '자동 저장됨', newDraft: '새 초안', saving: '저장 중…' },
  ja: { intro: '中心キャラクターから関係を順番につなぎます。', focus: '現在の中心', partners: '人の相手 · 自動配置', total: '合計', count: '件', source: '中心を選択', relation: '関係を選択', target: '相手を選択', stepConfirm: '接続を確認', changeSource: '中心を変更', sourceHint: 'まず中心キャラクターを選択してください。', targetHint: '中心と関係の設定は維持されます。相手を選択してください。', pickSource: '中心に選択', pickTarget: '相手に選択', relationship: '関係の種類', suggestions: '相手を選択', noResults: '検索結果がありません。中心自身は除外されます。', center: '中心にする', edit: '関係を編集', empty: 'まだ相手がいません。関係と相手を選んで最初の接続を作成してください。', prev: '前へ', next: '次へ', fit: '全体表示', zoomIn: '拡大', zoomOut: '縮小', remove: '関係を削除', clear: 'すべて削除', clearConfirm: 'すべての関係を削除しますか？', confirm: '接続する', update: '関係を更新', cancel: 'キャンセル', undo: '元に戻す', searchDone: '検索完了', search: '相手を検索', savedExists: '保存済みの関係があります。確定すると種類を変更します。', notSaved: 'まだ保存されていません。接続を確定してください。', same: '同じ関係がすでに保存されています。重複して作成しません。', noUndo: '元に戻す関係の編集がありません。', undoDone: '最後の関係編集を元に戻しました。', emptyGraph: '小さな画面では上の入力欄を使用してください。', allLibrary: 'キャラクター一覧', sourceMode: '中心を選択', targetMode: '相手を選択', keyboard: 'キー操作: / 検索 · S 中心変更 · U 元に戻す · 1–5 関係 · 1–9 相手 · Enter 確定', saved: '自動保存済み', newDraft: '新しい下書き', saving: '保存中…' },
  en: { intro: 'Build a sequence of relationships from a central character.', focus: 'Current focus', partners: ' partners · auto layout', total: 'Total', count: ' relationships', source: 'Choose center', relation: 'Choose relationship', target: 'Choose partner', stepConfirm: 'Confirm connection', changeSource: 'Change center', sourceHint: 'Choose a center character to begin.', targetHint: 'Your center and relationship settings are kept. Choose a partner.', pickSource: 'Set as center', pickTarget: 'Choose as partner', relationship: 'Relationship type', suggestions: 'Choose a partner', noResults: 'No results. The current center is excluded.', center: 'Make center', edit: 'Edit relationship', empty: 'No connected partners yet. Choose a relationship and partner to make the first connection.', prev: 'Previous', next: 'Next', fit: 'Fit', zoomIn: 'Zoom in', zoomOut: 'Zoom out', remove: 'Delete relationship', clear: 'Clear all', clearConfirm: 'Clear all relationships?', confirm: 'Connect', update: 'Update relationship', cancel: 'Cancel', undo: 'Undo', searchDone: 'Search complete', search: 'Search partners', savedExists: 'A relationship is already saved. Confirm to change its type.', notSaved: 'Not saved yet. Confirm the connection to save it.', same: 'This relationship is already saved. No duplicate was created.', noUndo: 'There are no relationship edits to undo.', undoDone: 'Undid the last relationship edit.', emptyGraph: 'On small screens, use the controls above.', allLibrary: 'Character library', sourceMode: 'Choose center', targetMode: 'Choose partner', keyboard: 'Keys: / search · S change center · U undo · 1–5 relationship · 1–9 partner · Enter confirm', saved: 'Saved automatically', newDraft: 'New draft', saving: 'Saving…' },
} as const;

export default function KeyboardEditor() {
  const { lang } = useLang();
  const t = copy[lang];
  const words = text[lang];
  const { draft, setDraft, resetDraft, hasDraft, saveStatus, warning } = useCouplingDraft('keyboard');
  const [centerChosen, setCenterChosen] = useState(hasDraft);
  const source = PROFILE_CHARACTER_BY_ID.get(draft.sourceId) ?? PROFILE_CHARACTER_BY_ID.get('reimu')!;
  const byId = PROFILE_CHARACTER_BY_ID;
  const [stage, setStage] = useState<Stage>('source');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [relation, setRelation] = useState<RelationId>('love');
  const [preference, setPreference] = useState<PreferenceId>(null);
  const [graphPage, setGraphPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<KeyboardDraft['edges'][]>([]);
  const [targetResultIds, setTargetResultIds] = useState<string[]>([]);
  const [viewportWidth, setViewportWidth] = useState(900);
  const searchRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const sourceButtonRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const shortcutRootRef = useRef<HTMLElement>(null);
  const targetDisabledIds = useMemo(() => [source.id], [source.id]);
  const visibleSuggestionIds = targetResultIds.slice(0, 9);
  const connected = draft.edges.filter(edge => edge.a === source.id || edge.b === source.id);
  const graphPages = Math.max(1, Math.ceil(connected.length / 8));
  const visibleEdges = connected.slice(Math.min(graphPage, graphPages - 1) * 8, (Math.min(graphPage, graphPages - 1) + 1) * 8);
  const target = targetId ? byId.get(targetId) ?? null : null;
  const existing = target ? draft.edges.find(edge => pairKey(edge.a, edge.b) === pairKey(source.id, target.id)) ?? null : null;
  const zoomFactor = viewportWidth <= 600 ? Math.min(1, viewportWidth / 900) : Math.min(1, (viewportWidth - 24) / 900);
  const actualZoom = Math.max(.25, Math.min(1.75, zoom * zoomFactor));

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(entries => setViewportWidth(entries[0]?.contentRect.width ?? viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setGraphPage(page => Math.min(page, graphPages - 1)); }, [graphPages]);
  useEffect(() => {
    if (stage === 'confirm' && target) confirmRef.current?.focus();
  }, [stage, target]);


  const chooseSource = useCallback((id: string) => {
    if (!byId.has(id)) return;
    setCenterChosen(true);
    setDraft(current => current.sourceId === id ? current : { ...current, sourceId: id });
    setTargetId(null); setGraphPage(0); setStage('relation');
    setFeedback(`${byId.get(id)![lang]} — ${centerChosen ? words.changeSource : words.pickSource}`);
    sourceButtonRef.current?.focus();
  }, [byId, centerChosen, lang, setDraft, words.changeSource, words.pickSource]);
  const chooseTarget = useCallback((id: string) => {
    if (id === source.id) { setFeedback(words.noResults); return; }
    const character = byId.get(id);
    if (!character) return;
    setTargetId(id);
    const prior = draft.edges.find(edge => pairKey(edge.a, edge.b) === pairKey(source.id, id));
    setStage('confirm');
    setFeedback(`${character[lang]}${prior ? ` — ${words.update}` : ''}`);
  }, [byId, draft.edges, lang, source.id, words.noResults, words.update]);
  const chooseRelation = useCallback((id: RelationId) => {
    setRelation(id);
  }, []);
  const onTargetResultsChange = useCallback((ids: readonly string[]) => setTargetResultIds([...ids]), []);
  const cancel = useCallback(() => {
    if (stage === 'confirm') { setTargetId(null); setStage('target'); }
    else if (stage === 'target') setStage('relation');
    setFeedback(words.cancel);
  }, [stage, words.cancel]);
  const next = useCallback(() => {
    if (!centerChosen || stage !== 'relation') return;
    setTargetId(null); setStage('target');
  }, [centerChosen, stage]);
  const previous = useCallback(() => {
    if (stage === 'target') setStage('relation');
    else if (stage === 'confirm') setStage('target');
    else if (stage === 'relation') setStage('source');
  }, [stage]);
  const confirm = useCallback(() => {
    if (stage !== 'confirm' || !target || target.id === source.id) return;
    const key = pairKey(source.id, target.id);
    const prior = draft.edges.find(edge => pairKey(edge.a, edge.b) === key);
    if (prior?.relation === relation && prior.preference === preference) { setFeedback(words.same); return; }
    setHistory(stack => [...stack.slice(-99), draft.edges.map(edge => ({ ...edge }))]);
    const nextEdge = { a: source.id, b: target.id, relation, preference };
    const edges = prior ? draft.edges.map(edge => pairKey(edge.a, edge.b) === key ? nextEdge : edge) : [...draft.edges, nextEdge];
    setDraft(current => ({ ...current, edges }));
    const index = edges.filter(edge => edge.a === source.id || edge.b === source.id).findIndex(edge => pairKey(edge.a, edge.b) === key);
    setGraphPage(Math.floor(index / 8)); setTargetId(null); setStage('target'); setFeedback(words.confirm);
  }, [draft.edges, preference, relation, setDraft, source.id, stage, target, words.confirm, words.same]);
  const remove = useCallback(() => {
    if (!target || !existing) return;
    setHistory(stack => [...stack.slice(-99), draft.edges.map(edge => ({ ...edge }))]);
    setDraft(current => ({ ...current, edges: current.edges.filter(edge => pairKey(edge.a, edge.b) !== pairKey(source.id, target.id)) }));
    setFeedback(words.remove); setStage('confirm');
  }, [draft.edges, existing, setDraft, source.id, target, words.remove]);
  const undo = useCallback(() => {
    if (!history.length) { setFeedback(words.noUndo); return; }
    const prior = history[history.length - 1];
    setDraft(current => ({ ...current, edges: prior.map(edge => ({ ...edge })) }));
    setHistory(stack => stack.slice(0, -1)); setFeedback(words.undoDone);
  }, [history, setDraft, words.noUndo, words.undoDone]);
  const clear = () => {
    if (!draft.edges.length) return;
    setHistory(stack => [...stack.slice(-99), draft.edges.map(edge => ({ ...edge }))]);
    setDraft(current => ({ ...current, edges: [] })); setFeedback(words.clear);
  };
  const resetEditor = () => {
    if (!window.confirm(t.resetConfirm)) return;
    resetDraft(); setCenterChosen(false); setHistory([]); setStage('source'); setTargetId(null); setRelation('love'); setPreference(null);
     setGraphPage(0); setZoom(1);
    setFeedback(t.resetDone);
  };
  const searchTarget = useCallback(() => {
    if (stage === 'source') { searchRef.current?.focus(); return; }
    if (stage === 'relation') { next(); return; }
    setTargetId(null); setStage('target');
  }, [next, stage]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.keyCode === 229) return;
      const el = event.target as HTMLElement | null;
      if (el?.matches('input, textarea, select, [contenteditable="true"]') || el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Enter' && el?.closest('button,a,summary')) return;
      const key = event.key.toLowerCase(); let handled = true;
      if (key === '/') searchTarget();
      else if (key === 's') setStage('source');
      else if (key === 'u') undo();
      else if (key === 'escape') cancel();
      else if (key === 'enter' && stage === 'confirm') confirm();
      else if (key === 'enter' && (stage === 'relation' || stage === 'target')) searchTarget();
        else if (/^[1-9]$/.test(key) && stage === 'target') { const choice = visibleSuggestionIds[Number(key) - 1]; if (choice) chooseTarget(choice); else setFeedback(words.noResults); }
      else if (/^[1-5]$/.test(key) && (stage === 'relation' || stage === 'confirm')) chooseRelation(RELATIONS[Number(key) - 1].id);
      else handled = false;
      if (handled) event.preventDefault();
    };
    const root = shortcutRootRef.current;
    root?.addEventListener('keydown', handler);
    return () => root?.removeEventListener('keydown', handler);
    }, [cancel, chooseRelation, chooseTarget, confirm, searchTarget, stage, undo, visibleSuggestionIds, words.noResults]);

  const relationFor = (id: RelationId) => RELATION_BY_ID.get(id)!;
  return <section ref={shortcutRootRef} tabIndex={-1} className="coupling-root coupling-keyboard" data-stage={stage}>
    <header className="coupling-keyboard-intro"><p>{words.intro}</p><span>{words.keyboard}</span></header>
    <div className="coupling-keyboard-layout">
       <section className="coupling-keyboard-graph-panel" aria-label={centerChosen ? words.focus : words.sourceHint}>
         <div className="coupling-keyboard-toolbar"><strong>{centerChosen ? `${words.focus}: ${source[lang]}` : lang === 'ko' ? '현재 중심을 선택하세요' : lang === 'ja' ? '中心キャラクターを選択してください' : 'Choose a center character'}</strong><span>{words.total} {draft.edges.length}{words.count}</span><div className="coupling-keyboard-zoom"><button type="button" onClick={() => setZoom(value => Math.max(.25, value - .1))} aria-label={words.zoomOut}>−</button><span>{Math.round(actualZoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(1.75, value + .1))} aria-label={words.zoomIn}>+</button><button type="button" onClick={() => setZoom(1)}>{words.fit}</button></div></div>
         <div className="coupling-keyboard-legend"><RelationLegend /></div>
         <div className="coupling-keyboard-graph-viewport" ref={viewportRef}>
          <div className="coupling-keyboard-graph-stage" style={{ width: viewportWidth * actualZoom, minHeight: 560 * actualZoom }}>
            <div className={`coupling-keyboard-graph-scene${viewportWidth <= 600 ? ' is-mobile' : ''}`} ref={sceneRef} style={{ width: viewportWidth <= 600 ? viewportWidth : 900, transform: `scale(${actualZoom})`, transformOrigin: 'top left', minHeight: viewportWidth <= 600 ? undefined : 560 }}>
              <svg className="coupling-keyboard-lines" aria-hidden="true" viewBox="0 0 900 560" preserveAspectRatio="none">{visibleEdges.map((edge, index) => <line key={pairKey(edge.a, edge.b)} x1={viewportWidth <= 600 ? 0 : 450} y1={viewportWidth <= 600 ? 0 : 280} x2={viewportWidth <= 600 ? 0 : (index % 2 === 0 ? 145 : 755)} y2={viewportWidth <= 600 ? 0 : 70 + Math.floor(index / 2) * 140} stroke={relationFor(edge.relation).color} strokeDasharray={edge.preference === 'avoid' ? '5 4' : undefined} />)}</svg>
              {centerChosen && <article className="coupling-keyboard-node is-center"><div className="coupling-keyboard-caption">{words.focus}</div><div className="coupling-keyboard-identity"><CharacterAvatar character={source} size={70} /><div><strong>{source[lang]}</strong><small>{source.group[lang]}</small></div></div><p>{connected.length}{words.partners}</p></article>}
               {visibleEdges.map((edge, index) => { const character = byId.get(edge.a === source.id ? edge.b : edge.a); if (!character) return null; const rel = relationFor(edge.relation), pref = edge.preference ? PREFERENCE_BY_ID.get(edge.preference) : null; return <article className="coupling-keyboard-node is-partner" key={pairKey(edge.a, edge.b)} style={{ gridColumn: index % 2 === 0 ? 1 : 3, gridRow: Math.floor(index / 2) + 1, '--coupling-rel': rel.color } as React.CSSProperties}><div className="coupling-keyboard-identity"><CharacterAvatar character={character} size={40} /><div><strong>{character[lang]}</strong><small>{character.group[lang]}</small></div></div><p className="coupling-keyboard-relation">{rel.symbol} {rel.label[lang]}{pref && <span className="coupling-preference-label"> · {pref.symbol} {pref.label[lang]}</span>}</p><div className="coupling-keyboard-node-actions"><button type="button" onClick={() => { setRelation(edge.relation); setPreference(edge.preference); chooseTarget(character.id); }}>{words.edit}</button></div></article>; })}
               {visibleEdges.length === 0 && <p className="coupling-keyboard-empty">{centerChosen ? <>{words.empty}<br />{words.emptyGraph}</> : words.sourceHint}</p>}
            </div>
          </div>
        </div>
         <div className="coupling-keyboard-graph-footer"><span>{centerChosen ? `${source[lang]} · ${connected.length} / ${visibleEdges.length}` : words.sourceHint}</span><div><button type="button" disabled={graphPage === 0} onClick={() => setGraphPage(page => Math.max(0, page - 1))}>{words.prev}</button><span>{Math.min(graphPage + 1, graphPages)} / {graphPages}</span><button type="button" disabled={graphPage >= graphPages - 1} onClick={() => setGraphPage(page => page + 1)}>{words.next}</button></div></div>
      </section>
      <aside className="coupling-keyboard-command">
        <section className="coupling-keyboard-rail"><h2>{({ source: words.source, relation: words.relation, target: words.target, confirm: words.stepConfirm })[stage]}</h2><p className="coupling-keyboard-stage-help">{stage === 'source' ? words.sourceHint : stage === 'relation' ? words.relationship : stage === 'target' ? words.targetHint : words.stepConfirm}</p><ol className="coupling-keyboard-steps">{(['source', 'relation', 'target', 'confirm'] as Stage[]).map(item => <li key={item} aria-current={stage === item ? 'step' : undefined} data-complete={['source', 'relation', 'target', 'confirm'].indexOf(item) < ['source', 'relation', 'target', 'confirm'].indexOf(stage) || undefined}>{({ source: words.source, relation: words.relation, target: words.target, confirm: words.stepConfirm })[item]}</li>)}</ol>
          {centerChosen && <div className="coupling-keyboard-source-slot"><small>{words.focus}</small><div><CharacterAvatar character={source} size={36} /><strong>{source[lang]}</strong></div><button ref={sourceButtonRef} type="button" onClick={() => setStage('source')}>{words.changeSource}</button></div>}
          <div className="coupling-keyboard-step">
              {(stage === 'source' || stage === 'target') && <div className="coupling-keyboard-step-picker"><CharacterPicker label={stage === 'source' ? words.source : words.target} initialGroup="" autoFocus searchRef={searchRef} onResultsChange={onTargetResultsChange} onSelect={character => stage === 'source' ? chooseSource(character.id) : chooseTarget(character.id)} disabledIds={stage === 'target' ? targetDisabledIds : EMPTY_CHARACTER_IDS} /></div>}
            {stage === 'relation' && <><div className="coupling-keyboard-relations" role="group" aria-label={words.relationship}><h3>{words.relationship}</h3>{RELATIONS.map((item, index) => <button type="button" key={item.id} aria-pressed={relation === item.id} style={{ '--coupling-rel': item.color } as React.CSSProperties} onClick={() => chooseRelation(item.id)}><span>{item.symbol}</span> {item.label[lang]}<kbd>{index + 1}</kbd></button>)}</div><div className="coupling-keyboard-preference-setting"><strong>{t.personalPreference}</strong><PreferencePicker value={preference} onChange={setPreference} label={t.personalPreference} /></div></>}
             {stage === 'confirm' && target && <><div className="coupling-keyboard-pending"><strong>{source[lang]} → {target[lang]}</strong><span style={{ color: relationFor(relation).color }}>{relationFor(relation).symbol} {relationFor(relation).label[lang]}{preference && <span className="coupling-preference-label"> · {PREFERENCE_BY_ID.get(preference)?.symbol} {PREFERENCE_BY_ID.get(preference)?.label[lang]}</span>}</span><small>{existing ? words.savedExists : words.notSaved}</small></div><div className="coupling-keyboard-confirm-settings"><div className="coupling-keyboard-relations coupling-keyboard-confirm-relations" role="group" aria-label={words.relationship}><h3>{words.relationship}</h3>{RELATIONS.map((item, index) => <button type="button" key={item.id} aria-pressed={relation === item.id} style={{ '--coupling-rel': item.color } as React.CSSProperties} onClick={() => chooseRelation(item.id)}><span>{item.symbol}</span> {item.label[lang]}<kbd>{index + 1}</kbd></button>)}</div><div className="coupling-keyboard-preference-setting coupling-keyboard-confirm-preference"><strong>{t.personalPreference}</strong><PreferencePicker value={preference} onChange={setPreference} label={t.personalPreference} /></div></div></>}
          </div>
          <div className="coupling-keyboard-actions">{stage === 'relation' && <><button className="coupling-btn" type="button" onClick={previous}>{words.prev}</button><button className="coupling-btn coupling-btn-primary" type="button" onClick={next}>{words.next}</button></>}{stage === 'target' && <><button className="coupling-btn" type="button" onClick={previous}>{words.prev}</button><button className="coupling-btn" type="button" onClick={cancel}>{words.cancel}</button></>}{stage === 'confirm' && <><button className="coupling-btn" type="button" onClick={previous}>{words.prev}</button><button ref={confirmRef} className="coupling-btn coupling-btn-primary" type="button" disabled={!target} onClick={confirm}>{existing ? words.update : words.confirm}</button><button className="coupling-btn" type="button" onClick={cancel}>{words.cancel}</button></>}{stage === 'confirm' && existing && <button className="coupling-btn" type="button" onClick={remove}>{words.remove}</button>}<details className="coupling-keyboard-management"><summary>{lang === 'ko' ? '관리' : lang === 'ja' ? '管理' : 'Manage'}</summary><div>{history.length > 0 && <button className="coupling-btn" type="button" onClick={undo}>{t.undo}</button>}{draft.edges.length > 0 && <button className="coupling-btn" type="button" onClick={clear}>{words.clear}</button>}<button className="coupling-btn" type="button" onClick={resetEditor}>{t.reset}</button></div></details></div>
        </section>
      </aside>
    </div>
    <CouplingImageExport id="coupling-export-keyboard" filename="coupling-keyboard.png" title={words.focus} scope={`${source[lang]} · ${connected.length}`}>
      <div className="coupling-export-relations">{connected.map(edge => { const character = byId.get(edge.a === source.id ? edge.b : edge.a); if (!character) return null; const relation = relationFor(edge.relation), preferenceData = edge.preference ? PREFERENCE_BY_ID.get(edge.preference) : null; return <div className="coupling-export-relation" key={pairKey(edge.a, edge.b)} style={{ '--export-relation': relation.color } as React.CSSProperties}><strong>{source[lang]} → {character[lang]}</strong><span>{relation.symbol} {relation.label[lang]}{preferenceData ? ` · ${preferenceData.symbol} ${preferenceData.label[lang]}` : ''}</span></div>; })}</div>
    </CouplingImageExport>
    <div className="coupling-keyboard-session"><p role="status" aria-live="polite">{warning ?? feedback ?? (hasDraft ? words.saved : words.newDraft)}</p><span>{saveStatus === 'saving' ? words.saving : saveStatus === 'memory-only' ? t.memoryOnly : hasDraft ? words.saved : words.newDraft}</span></div>
  </section>;
}
