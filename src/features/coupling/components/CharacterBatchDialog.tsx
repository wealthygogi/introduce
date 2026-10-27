import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { COUPLING_WORKS, PROFILE_CHARACTERS } from '../data';
import { normalizeCouplingSearch } from '../relations';
import copy from '../copy';
import CharacterAvatar from './CharacterAvatar';

type Props = { open: boolean; placedIds: readonly string[]; initialWork?: string; globalSearch?: boolean; onCancel: () => void; onConfirm: (ids: string[]) => void };
export default function CharacterBatchDialog({ open, placedIds, initialWork = '공통', globalSearch = false, onCancel, onConfirm }: Props) {
  const { lang } = useLang(); const t = copy[lang];
  const dialog = useRef<HTMLDialogElement>(null); const search = useRef<HTMLInputElement>(null);
  const rememberedWork = useRef(initialWork);
  const [work, setWork] = useState(initialWork); const [query, setQuery] = useState(''); const [pending, setPending] = useState<string[]>([]);
  const placed = useMemo(() => new Set(placedIds), [placedIds]);
  const works = COUPLING_WORKS;
  useEffect(() => {
    const el = dialog.current; if (!el) return;
    if (open && !el.open) {
      setPending([]); setQuery('');
      const nextWork = globalSearch ? '' : rememberedWork.current;
      setWork(nextWork); el.showModal();
      (globalSearch ? search.current : el.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])'))?.focus();
    } else if (!open && el.open) el.close();
  }, [open, globalSearch]);
  const term = normalizeCouplingSearch(query);
  const matches = PROFILE_CHARACTERS.filter(c => (!work || c.group.ko === work) && (!term || normalizeCouplingSearch(`${c.ko}${c.ja}${c.en}${c.group.ko}${c.group.ja}${c.group.en}`).includes(term)));
  const toggle = (id: string) => setPending(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const confirm = () => { if (pending.length) onConfirm(PROFILE_CHARACTERS.filter(c => pending.includes(c.id)).map(c => c.id)); };
  return <dialog ref={dialog} className="coupling-batch-dialog" aria-label={t.addCharacter} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); return; }
    if (event.key !== 'Tab') return;
    const element = dialog.current;
    if (!element) return;
    const focusable = Array.from(element.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')).filter(item => item.getClientRects().length > 0);
    if (!focusable.length) { event.preventDefault(); element.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }} onCancel={event => { event.preventDefault(); onCancel(); }} onClose={() => { if (open) onCancel(); }}>
    <div className="coupling-batch-shell"><header><h2>{t.addCharacter}</h2><button className="coupling-btn" type="button" onClick={onCancel}>{t.close}</button></header>
      <div className="coupling-batch-controls"><label className="coupling-field">{t.work}<select value={work} onChange={e => { setWork(e.target.value); if (e.target.value) rememberedWork.current = e.target.value; }}><option value="">{t.allWorks}</option>{works.map(value => <option key={value} value={value}>{PROFILE_CHARACTERS.find(c => c.group.ko === value)?.group[lang] ?? value}</option>)}</select></label><label className="coupling-field">{t.search}<input ref={search} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}/></label>
      <div className="coupling-batch-actions"><button type="button" className="coupling-btn" onClick={() => setPending(ids => [...new Set([...ids, ...PROFILE_CHARACTERS.filter(c => (!work || c.group.ko === work) && !placed.has(c.id)).map(c => c.id)])])}>{work ? `${PROFILE_CHARACTERS.find(c => c.group.ko === work)?.group[lang] ?? work} ${t.selectAll}` : t.selectAllCharacters}</button><button type="button" className="coupling-btn" onClick={() => setPending([])}>{t.clearSelection}</button></div></div>
      <div className="coupling-batch-grid">{matches.map(c => { const checked = pending.includes(c.id); const unavailable = placed.has(c.id); return <label key={c.id} className={`coupling-batch-choice${unavailable ? ' is-placed' : ''}`}><input type="checkbox" checked={checked} disabled={unavailable} onChange={() => toggle(c.id)}/><CharacterAvatar character={c} size={38} decorative/><span><strong>{c[lang]}</strong><small>{unavailable ? t.placed : c.group[lang]}</small></span></label>; })}{!matches.length && <p className="coupling-empty-note">{t.noResults}</p>}</div>
      <footer><div className="coupling-batch-pending" aria-live="polite">{pending.map(id => { const c = PROFILE_CHARACTERS.find(item => item.id === id)!; return <button type="button" key={id} onClick={() => toggle(id)}>{c[lang]} ×</button>; })}</div><button className="coupling-btn" type="button" onClick={onCancel}>{t.cancel}</button><button className="coupling-btn coupling-btn-primary" type="button" disabled={!pending.length} onClick={confirm}>{t.addSelected.replace('{count}', String(pending.length))}</button></footer>
    </div>
  </dialog>;
}
