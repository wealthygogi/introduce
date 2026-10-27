import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LangContext';
import { useCouplingDraft } from './CouplingDraftProvider';
import copy from './copy';

type Editor = 'whiteboard' | 'keyboard' | 'pairs' | 'matrix';
export default function CouplingHub() {
  const { lang } = useLang();
  const t = copy[lang];
  const whiteboard = useCouplingDraft('whiteboard');
  const keyboard = useCouplingDraft('keyboard');
  const pairs = useCouplingDraft('pairs');
  const matrix = useCouplingDraft('matrix');
  const drafts = { whiteboard, keyboard, pairs, matrix };
  const editors: Editor[] = ['whiteboard', 'keyboard', 'pairs', 'matrix'];
  const saving = { ko: '저장 중…', ja: '保存中…', en: 'Saving…' }[lang];
  const descriptions: Record<Editor, string> = { whiteboard: t.whiteboardDesc, keyboard: t.keyboardDesc, pairs: t.pairsDesc, matrix: t.matrixDesc };
  return <section className="coupling-hub" aria-labelledby="coupling-hub-title">
    <header className="coupling-hub-heading"><p className="coupling-hub-eyebrow">GENSOKYO · COUPLING STUDIO</p><h1 id="coupling-hub-title">{t.coupling}</h1><p>{({ ko: '방식별 별도 초안 · 이 브라우저에 자동 저장', ja: '方式ごとに独立した下書き · このブラウザーに自動保存', en: 'Separate drafts for each editor · saved automatically in this browser' })[lang]}</p></header>
    <div className="coupling-hub-grid">{editors.map(id => {
      const state = drafts[id];
      const status = !state.hasDraft ? t.draftNew : state.saveStatus === 'saving' ? saving : state.saveStatus === 'memory-only' ? t.memoryOnly : t.saved;
      return <article key={id} className="coupling-hub-card">
        <p className="coupling-hub-index">{String(editors.indexOf(id) + 1).padStart(2, '0')} / {id.toUpperCase()}</p>
        <h2>{t[id]}</h2><p className="coupling-hub-description">{descriptions[id]}</p>
        <div className="coupling-hub-status" role="status">{status}{state.warning && <small className="coupling-save-warning">{state.warning}</small>}</div>
        <Link className="coupling-btn coupling-btn-primary" to={`/coupling/${id}`}>{state.hasDraft ? t.continue : t.start} <span aria-hidden="true">↗</span></Link>
      </article>;
    })}</div>
  </section>;
}
