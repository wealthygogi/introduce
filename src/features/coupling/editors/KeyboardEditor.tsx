import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { useCouplingDraft } from '../CouplingDraftProvider';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID } from '../data';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterPicker from '../components/CharacterPicker';
import PreferencePicker from '../components/PreferencePicker';
import { PREFERENCE_BY_ID, RELATIONS, RELATION_BY_ID, normalizeCouplingSearch } from '../relations';
import copy from '../copy';
import type { KeyboardDraft, PreferenceId, RelationId } from '../types';
import '../keyboard/keyboard.css';

const STARTER = ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko'];
const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());
type Stage = 'source' | 'relation' | 'target' | 'confirm';
const text = {
  ko: { intro: '중심 캐릭터에서 출발해 관계를 차례로 연결합니다.', focus: '현재 중심', partners: '명의 상대 · 자동 배치', total: '전체', count: '개', source: '중심 선택', relation: '관계 선택', target: '상대 선택', stepConfirm: '연결 확인', changeSource: '중심 변경', sourceHint: '선택한 캐릭터가 새 중심이 됩니다. 기존 관계는 유지됩니다.', targetHint: '선택한 캐릭터를 상대에 지정합니다. 확정 전에는 저장하지 않습니다.', pickSource: '중심으로 선택', pickTarget: '상대로 선택', relationship: '관계 종류', suggestions: '상대 선택', noResults: '검색 결과가 없습니다. 중심 자신은 제외됩니다.', center: '중심으로 이동', edit: '관계 편집', empty: '아직 연결된 상대가 없습니다. 관계와 상대를 선택해 첫 연결을 만드세요.', prev: '이전', next: '다음', fit: '맞춤', zoomIn: '확대', zoomOut: '축소', remove: '관계 삭제', clear: '전체 비우기', clearConfirm: '모든 관계를 비우시겠습니까?', confirm: '연결 확정', update: '관계 업데이트', cancel: '취소', undo: '실행 취소', searchDone: '검색 완료', search: '상대 검색', savedExists: '저장된 관계가 있습니다. 확정하면 종류를 변경합니다.', notSaved: '아직 저장되지 않았습니다. 연결 확정을 눌러 주세요.', same: '이미 같은 관계로 저장되어 있습니다. 중복 연결은 만들지 않습니다.', noUndo: '취소할 관계 편집이 없습니다.', undoDone: '마지막 관계 편집을 취소했습니다.', emptyGraph: '작은 화면에서는 위쪽 입력 영역을 사용하세요.', allLibrary: '전체 캐릭터 라이브러리', sourceMode: '중심 선택', targetMode: '상대 선택', keyboard: '단축키: / 검색 · S 중심 변경 · U 실행 취소 · 1–5 관계 · 1–9 상대 · Enter 확정', saved: '자동 저장됨', newDraft: '새 초안', saving: '저장 중…' },
  ja: { intro: '中心キャラクターから関係を順番につなぎます。', focus: '現在の中心', partners: '人の相手 · 自動配置', total: '合計', count: '件', source: '中心を選択', relation: '関係を選択', target: '相手を選択', stepConfirm: '接続を確認', changeSource: '中心を変更', sourceHint: '選んだキャラクターが新しい中心になります。既存の関係は維持されます。', targetHint: '選んだキャラクターを相手に指定します。確定するまで保存されません。', pickSource: '中心に選択', pickTarget: '相手に選択', relationship: '関係の種類', suggestions: '相手を選択', noResults: '検索結果がありません。中心自身は除外されます。', center: '中心にする', edit: '関係を編集', empty: 'まだ相手がいません。関係と相手を選んで最初の接続を作成してください。', prev: '前へ', next: '次へ', fit: '全体表示', zoomIn: '拡大', zoomOut: '縮小', remove: '関係を削除', clear: 'すべて削除', clearConfirm: 'すべての関係を削除しますか？', confirm: '接続を確定', update: '関係を更新', cancel: 'キャンセル', undo: '元に戻す', searchDone: '検索完了', search: '相手を検索', savedExists: '保存済みの関係があります。確定すると種類を変更します。', notSaved: 'まだ保存されていません。接続を確定してください。', same: '同じ関係がすでに保存されています。重複して作成しません。', noUndo: '元に戻す関係の編集がありません。', undoDone: '最後の関係編集を元に戻しました。', emptyGraph: '小さな画面では上の入力欄を使用してください。', allLibrary: 'キャラクター一覧', sourceMode: '中心を選択', targetMode: '相手を選択', keyboard: 'キー操作: / 検索 · S 中心変更 · U 元に戻す · 1–5 関係 · 1–9 相手 · Enter 確定', saved: '自動保存済み', newDraft: '新しい下書き', saving: '保存中…' },
  en: { intro: 'Build a sequence of relationships from a central character.', focus: 'Current focus', partners: ' partners · auto layout', total: 'Total', count: ' relationships', source: 'Choose center', relation: 'Choose relationship', target: 'Choose partner', stepConfirm: 'Confirm connection', changeSource: 'Change center', sourceHint: 'The selected character becomes the new center. Existing relationships are kept.', targetHint: 'Choose a partner for the current center. Nothing is saved until confirmed.', pickSource: 'Set as center', pickTarget: 'Choose as partner', relationship: 'Relationship type', suggestions: 'Choose a partner', noResults: 'No results. The current center is excluded.', center: 'Make center', edit: 'Edit relationship', empty: 'No connected partners yet. Choose a relationship and partner to make the first connection.', prev: 'Previous', next: 'Next', fit: 'Fit', zoomIn: 'Zoom in', zoomOut: 'Zoom out', remove: 'Delete relationship', clear: 'Clear all', clearConfirm: 'Clear all relationships?', confirm: 'Confirm connection', update: 'Update relationship', cancel: 'Cancel', undo: 'Undo', searchDone: 'Search complete', search: 'Search partners', savedExists: 'A relationship is already saved. Confirm to change its type.', notSaved: 'Not saved yet. Confirm the connection to save it.', same: 'This relationship is already saved. No duplicate was created.', noUndo: 'There are no relationship edits to undo.', undoDone: 'Undid the last relationship edit.', emptyGraph: 'On small screens, use the controls above.', allLibrary: 'Character library', sourceMode: 'Choose center', targetMode: 'Choose partner', keyboard: 'Keys: / search · S change center · U undo · 1–5 relationship · 1–9 partner · Enter confirm', saved: 'Saved automatically', newDraft: 'New draft', saving: 'Saving…' },
} as const;

export default function KeyboardEditor() {
  const { lang } = useLang();
  const t = copy[lang];
  const words = text[lang];
  const { draft, setDraft, resetDraft, hasDraft, saveStatus, warning } = useCouplingDraft('keyboard');
  const source = PROFILE_CHARACTER_BY_ID.get(draft.sourceId) ?? PROFILE_CHARACTER_BY_ID.get('reimu')!;
  const byId = PROFILE_CHARACTER_BY_ID;
  const [stage, setStage] = useState<Stage>('relation');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [relation, setRelation] = useState<RelationId>('love');
  const [preference, setPreference] = useState<PreferenceId>(null);
  const [libraryMode, setLibraryMode] = useState<'source' | 'target'>('source');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [targetPage, setTargetPage] = useState(0);
  const [graphPage, setGraphPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<KeyboardDraft['edges'][]>([]);
  const [viewportWidth, setViewportWidth] = useState(900);
  const searchRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const sourceButtonRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const shortcutRootRef = useRef<HTMLElement>(null);
  const suggestions = useMemo(() => {
    const q = normalizeCouplingSearch(query);
    return PROFILE_CHARACTERS.filter(character => character.id !== source.id && (!q || normalizeCouplingSearch(`${character.ko}${character.ja}${character.en}${character.group.ko}${character.group.ja}${character.group.en}`).includes(q)));
  }, [query, source.id]);
  const pages = Math.max(1, Math.ceil(suggestions.length / 9));
  const visibleSuggestions = suggestions.slice(Math.min(targetPage, pages - 1) * 9, (Math.min(targetPage, pages - 1) + 1) * 9);
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
  useEffect(() => { setTargetPage(page => Math.min(page, pages - 1)); }, [pages]);
  useEffect(() => { setGraphPage(page => Math.min(page, graphPages - 1)); }, [graphPages]);
  useEffect(() => {
    if (stage === 'confirm' && target) confirmRef.current?.focus();
  }, [stage, target]);


  const chooseSource = useCallback((id: string) => {
    if (!byId.has(id)) return;
    setDraft(current => current.sourceId === id ? current : { ...current, sourceId: id });
    setTargetId(null); setGraphPage(0); setTargetPage(0); setQuery(''); setLibraryOpen(false); setStage('relation');
    setFeedback(`${byId.get(id)![lang]} — ${words.changeSource}`);
    sourceButtonRef.current?.focus();
  }, [byId, lang, setDraft, words.changeSource]);
  const chooseTarget = useCallback((id: string) => {
    if (id === source.id) { setFeedback(words.noResults); return; }
    const character = byId.get(id);
    if (!character) return;
    setTargetId(id);
    const prior = draft.edges.find(edge => pairKey(edge.a, edge.b) === pairKey(source.id, id));
    if (prior) { setRelation(prior.relation); setPreference(prior.preference); }
    setStage('confirm'); setLibraryOpen(false);
    setFeedback(`${character[lang]}${prior ? ` — ${words.update}` : ''}`);
  }, [byId, draft.edges, lang, source.id, words.noResults, words.update]);
  const openLibrary = useCallback((mode: 'source' | 'target') => {
    setLibraryMode(mode); setLibraryOpen(true); setStage(mode); setFeedback(mode === 'source' ? words.sourceHint : words.targetHint);
  }, [words.sourceHint, words.targetHint]);
  const chooseRelation = useCallback((id: RelationId) => {
    setRelation(id); setLibraryOpen(false);
    if (stage !== 'confirm') { setTargetId(null); setStage('target'); destinationRef.current?.focus(); }
    else setStage('confirm');
  }, [stage]);
  const cancel = useCallback(() => {
    setTargetId(null); setLibraryOpen(false); setStage('relation'); setFeedback(words.cancel);
    sourceButtonRef.current?.focus();
  }, [words.cancel]);
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
    destinationRef.current?.focus();
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
    resetDraft(); setHistory([]); setStage('relation'); setTargetId(null); setRelation('love'); setPreference(null);
    setLibraryMode('source'); setLibraryOpen(false); setQuery(''); setTargetPage(0); setGraphPage(0); setZoom(1);
    setFeedback(t.resetDone); sourceButtonRef.current?.focus();
  };
  const searchTarget = useCallback(() => {
    if (stage === 'source') { setLibraryOpen(true); return; }
    setLibraryOpen(false); setTargetId(null); setStage('target');
    searchRef.current?.focus();
  }, [stage]);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault(); setTargetId(null); setStage('target');
    destinationRef.current?.focus();
    setFeedback(words.searchDone);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.keyCode === 229) return;
      const el = event.target as HTMLElement | null;
      if (el?.matches('input, textarea, select, [contenteditable="true"]') || el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Enter' && el?.closest('button,a,summary')) return;
      const key = event.key.toLowerCase(); let handled = true;
      if (key === '/') searchTarget();
      else if (key === 's') openLibrary('source');
      else if (key === 'u') undo();
      else if (key === 'escape') cancel();
      else if (key === 'enter' && stage === 'confirm') confirm();
      else if (key === 'enter' && (stage === 'relation' || stage === 'target')) searchTarget();
      else if (/^[1-9]$/.test(key) && stage === 'target') { const choice = visibleSuggestions[Number(key) - 1]; if (choice) chooseTarget(choice.id); else setFeedback(words.noResults); }
      else if (/^[1-5]$/.test(key) && (stage === 'relation' || stage === 'confirm')) chooseRelation(RELATIONS[Number(key) - 1].id);
      else handled = false;
      if (handled) event.preventDefault();
    };
    const root = shortcutRootRef.current;
    root?.addEventListener('keydown', handler);
    return () => root?.removeEventListener('keydown', handler);
  }, [cancel, chooseRelation, chooseTarget, confirm, openLibrary, searchTarget, stage, undo, visibleSuggestions, words.noResults]);

  const relationFor = (id: RelationId) => RELATION_BY_ID.get(id)!;
  return <section ref={shortcutRootRef} tabIndex={-1} className="coupling-root coupling-keyboard" data-stage={stage}>
    <header className="coupling-keyboard-intro"><p>{words.intro}</p><span>{words.keyboard}</span></header>
    <div className="coupling-keyboard-layout">
      <section className="coupling-keyboard-graph-panel" aria-label={words.focus}>
        <div className="coupling-keyboard-toolbar"><strong>{words.focus}: {source[lang]}</strong><span>{words.total} {draft.edges.length}{words.count}</span><div className="coupling-keyboard-zoom"><button type="button" onClick={() => setZoom(value => Math.max(.25, value - .1))} aria-label={words.zoomOut}>−</button><span>{Math.round(actualZoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(1.75, value + .1))} aria-label={words.zoomIn}>+</button><button type="button" onClick={() => setZoom(1)}>{words.fit}</button></div></div>
        <div className="coupling-keyboard-graph-viewport" ref={viewportRef}>
          <div className="coupling-keyboard-graph-stage" style={{ width: viewportWidth * actualZoom, minHeight: 560 * actualZoom }}>
            <div className={`coupling-keyboard-graph-scene${viewportWidth <= 600 ? ' is-mobile' : ''}`} ref={sceneRef} style={{ width: viewportWidth <= 600 ? viewportWidth : 900, transform: `scale(${actualZoom})`, transformOrigin: 'top left', minHeight: viewportWidth <= 600 ? undefined : 560 }}>
              <svg className="coupling-keyboard-lines" aria-hidden="true" viewBox="0 0 900 560" preserveAspectRatio="none">{visibleEdges.map((edge, index) => <line key={pairKey(edge.a, edge.b)} x1={viewportWidth <= 600 ? 0 : 450} y1={viewportWidth <= 600 ? 0 : 280} x2={viewportWidth <= 600 ? 0 : (index % 2 === 0 ? 145 : 755)} y2={viewportWidth <= 600 ? 0 : 70 + Math.floor(index / 2) * 140} stroke={relationFor(edge.relation).color} strokeDasharray={edge.preference === 'avoid' ? '5 4' : undefined} />)}</svg>
              <article className="coupling-keyboard-node is-center"><div className="coupling-keyboard-caption">{words.focus}</div><div className="coupling-keyboard-identity"><CharacterAvatar character={source} size={70} /><div><strong>{source[lang]}</strong><small>{source.group[lang]}</small></div></div><p>{connected.length}{words.partners}</p></article>
              {visibleEdges.map((edge, index) => { const character = byId.get(edge.a === source.id ? edge.b : edge.a); if (!character) return null; const rel = relationFor(edge.relation), pref = edge.preference ? PREFERENCE_BY_ID.get(edge.preference) : null; return <article className="coupling-keyboard-node is-partner" key={pairKey(edge.a, edge.b)} style={{ gridColumn: index % 2 === 0 ? 1 : 3, gridRow: Math.floor(index / 2) + 1, '--coupling-rel': rel.color } as React.CSSProperties}><div className="coupling-keyboard-identity"><CharacterAvatar character={character} size={40} /><div><strong>{character[lang]}</strong><small>{character.group[lang]}</small></div></div><p className="coupling-keyboard-relation">{rel.symbol} {rel.label[lang]}{pref && <span className="coupling-preference-label"> · {pref.symbol} {pref.label[lang]}</span>}</p><div className="coupling-keyboard-node-actions"><button type="button" onClick={() => chooseSource(character.id)}>{words.center}</button><button type="button" onClick={() => chooseTarget(character.id)}>{words.edit}</button></div></article>; })}
              {visibleEdges.length === 0 && <p className="coupling-keyboard-empty">{words.empty}<br />{words.emptyGraph}</p>}
            </div>
          </div>
        </div>
        <div className="coupling-keyboard-graph-footer"><span>{source[lang]} · {connected.length} / {visibleEdges.length}</span><div><button type="button" disabled={graphPage === 0} onClick={() => setGraphPage(page => Math.max(0, page - 1))}>{words.prev}</button><span>{Math.min(graphPage + 1, graphPages)} / {graphPages}</span><button type="button" disabled={graphPage >= graphPages - 1} onClick={() => setGraphPage(page => page + 1)}>{words.next}</button></div></div>
        <div className="coupling-keyboard-roster"><h2>{words.source} <small>{t.start}</small></h2>{STARTER.map(id => { const character = byId.get(id)!; return <button type="button" key={id} aria-pressed={id === source.id} onClick={() => chooseSource(id)}><CharacterAvatar character={character} size={26} decorative /><span>{character[lang]}</span></button>; })}</div>
      </section>
      <aside className="coupling-keyboard-command">
        <section className="coupling-keyboard-rail"><h2>{t.keyboard}</h2><p className="coupling-keyboard-stage-help">{stage === 'source' ? words.sourceHint : stage === 'relation' ? words.relation : stage === 'target' ? words.target : words.stepConfirm}</p><ol className="coupling-keyboard-steps">{(['source', 'relation', 'target', 'confirm'] as Stage[]).map(item => <li key={item} aria-current={stage === item ? 'step' : undefined} data-complete={['source', 'relation', 'target', 'confirm'].indexOf(item) < ['source', 'relation', 'target', 'confirm'].indexOf(stage) || undefined}>{({ source: words.source, relation: words.relation, target: words.target, confirm: words.stepConfirm })[item]}</li>)}</ol>
          <div className="coupling-keyboard-source-slot"><small>{words.focus}</small><div><CharacterAvatar character={source} size={36} /><strong>{source[lang]}</strong></div><button ref={sourceButtonRef} type="button" onClick={() => openLibrary('source')}>{words.changeSource}</button></div>
          {(stage === 'relation' || stage === 'confirm') && <><div className="coupling-keyboard-relations" role="group" aria-label={words.relationship}><h3>{words.relationship}</h3>{RELATIONS.map((item, index) => <button type="button" key={item.id} aria-pressed={relation === item.id} style={{ '--coupling-rel': item.color } as React.CSSProperties} onClick={() => chooseRelation(item.id)}><span>{item.symbol}</span> {item.label[lang]}<kbd>{index + 1}</kbd></button>)}</div><div className="coupling-keyboard-preference-setting"><strong>{t.personalPreference}</strong><PreferencePicker value={preference} onChange={setPreference} label={t.personalPreference} /></div></>}
          {stage === 'target' && <><form className="coupling-keyboard-search" onSubmit={submitSearch}><label>{words.search}<input ref={searchRef} type="search" value={query} onFocus={() => { if (stage !== 'target') { setTargetId(null); setStage('target'); } }} onChange={event => { setQuery(event.target.value); setTargetPage(0); }} placeholder={t.searchPlaceholder} /></label><button type="submit">{words.searchDone}</button></form>
          <section className="coupling-keyboard-suggestions" ref={destinationRef} tabIndex={-1} aria-label={words.suggestions}><div className="coupling-keyboard-suggestion-heading"><h3>{words.suggestions}</h3><span>{suggestions.length} / {PROFILE_CHARACTERS.length}</span></div><div className="coupling-keyboard-destinations">{visibleSuggestions.map((character, index) => <button type="button" key={character.id} aria-pressed={targetId === character.id} onClick={() => chooseTarget(character.id)}><kbd>{index + 1}</kbd><CharacterAvatar character={character} size={28} decorative /><span><strong>{character[lang]}</strong><small>{character.group[lang]}</small></span></button>)}{suggestions.length === 0 && <p>{words.noResults}</p>}</div><div className="coupling-keyboard-pagination"><button type="button" disabled={targetPage === 0} onClick={() => setTargetPage(page => Math.max(0, page - 1))}>{words.prev}</button><span>{Math.min(targetPage + 1, pages)} / {pages}</span><button type="button" disabled={targetPage >= pages - 1} onClick={() => setTargetPage(page => page + 1)}>{words.next}</button></div></section></>}
          {stage === 'confirm' && target && <div className="coupling-keyboard-pending"><strong>{source[lang]} → {target[lang]}</strong><span style={{ color: relationFor(relation).color }}>{relationFor(relation).symbol} {relationFor(relation).label[lang]}{preference && <span className="coupling-preference-label"> · {PREFERENCE_BY_ID.get(preference)?.symbol} {PREFERENCE_BY_ID.get(preference)?.label[lang]}</span>}</span><small>{existing ? words.savedExists : words.notSaved}</small><button type="button" className="coupling-btn" onClick={() => { setTargetId(null); setStage('target'); setFeedback(words.targetHint); requestAnimationFrame(() => searchRef.current?.focus()); }}>{words.target}</button></div>}
          <div className="coupling-keyboard-actions">{stage === 'confirm' && <button ref={confirmRef} className="coupling-btn coupling-btn-primary" type="button" disabled={!target} onClick={confirm}>{existing ? words.update : words.confirm}</button>}{stage !== 'relation' && <button className="coupling-btn" type="button" onClick={cancel}>{words.cancel}</button>}{stage === 'confirm' && existing && <button className="coupling-btn" type="button" onClick={remove}>{words.remove}</button>}{history.length > 0 && <button className="coupling-btn" type="button" onClick={undo}>{t.undo}</button>}{draft.edges.length > 0 && <button className="coupling-btn" type="button" onClick={clear}>{words.clear}</button>}<button className="coupling-btn" type="button" onClick={resetEditor}>{t.reset}</button></div>
        </section>
        <details className="coupling-keyboard-library" open={libraryOpen} onToggle={event => setLibraryOpen(event.currentTarget.open)}><summary>{words.allLibrary}</summary><div className="coupling-keyboard-library-mode"><button type="button" aria-pressed={libraryMode === 'source'} onClick={() => { setLibraryMode('source'); setStage('source'); }}>{words.sourceMode}</button><button type="button" aria-pressed={libraryMode === 'target'} onClick={() => { setLibraryMode('target'); setStage('target'); }}>{words.targetMode}</button></div><p>{libraryMode === 'source' ? words.sourceHint : words.targetHint}</p><CharacterPicker label={words.allLibrary} initialGroup="" autoFocus={libraryOpen} onSelect={character => libraryMode === 'source' ? chooseSource(character.id) : chooseTarget(character.id)} /></details>
      </aside>
    </div>
    <div className="coupling-keyboard-session"><p role="status" aria-live="polite">{warning ?? feedback ?? (hasDraft ? words.saved : words.newDraft)}</p><span>{saveStatus === 'saving' ? words.saving : saveStatus === 'memory-only' ? t.memoryOnly : hasDraft ? words.saved : words.newDraft}</span></div>
  </section>;
}
