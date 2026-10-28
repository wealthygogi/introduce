import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { COUPLING_FACE_CHARACTERS, COUPLING_WORKS } from '../data';
import { normalizeCouplingSearch } from '../relations';
import copy from '../copy';
import CharacterAvatar from './CharacterAvatar';

type Props = { open: boolean; placedIds: readonly string[]; initialWork?: string; globalSearch?: boolean; onCancel: () => void; onConfirm: (ids: string[]) => void };
type WorkOption = { value: string; name: string; search: string };

export default function CharacterBatchDialog({ open, placedIds, initialWork = '공통', globalSearch = false, onCancel, onConfirm }: Props) {
  const { lang } = useLang(); const t = copy[lang];
  const dialog = useRef<HTMLDialogElement>(null); const search = useRef<HTMLInputElement>(null); const workSearch = useRef<HTMLInputElement>(null); const workButton = useRef<HTMLButtonElement>(null);
  const rememberedWork = useRef(initialWork);
  const [work, setWork] = useState(initialWork); const [query, setQuery] = useState(''); const [workQuery, setWorkQuery] = useState(''); const [workPickerOpen, setWorkPickerOpen] = useState(false); const [pending, setPending] = useState<string[]>([]);
  const placed = useMemo(() => new Set(placedIds), [placedIds]);
  const workOptions = useMemo<WorkOption[]>(() => [
    { value: '', name: t.allWorks, search: `${copy.ko.allWorks} ${copy.ja.allWorks} ${copy.en.allWorks}` },
    ...COUPLING_WORKS.map(value => {
      const group = COUPLING_FACE_CHARACTERS.find(character => character.group.ko === value)!.group;
      return { value, name: group[lang], search: `${group.ko} ${group.ja} ${group.en}` };
    }),
  ], [lang, t.allWorks]);
  const availableCounts = useMemo(() => new Map<string, number>(workOptions.map(option => [option.value, COUPLING_FACE_CHARACTERS.reduce((count, character) => count + (!placed.has(character.id) && (!option.value || character.group.ko === option.value) ? 1 : 0), 0)] as const)), [placed, workOptions]);
  const selectedWorkName = workOptions.find(option => option.value === work)?.name ?? t.allWorks;
  const term = normalizeCouplingSearch(query);
  const workTerm = normalizeCouplingSearch(workQuery);
  const matches = useMemo(() => COUPLING_FACE_CHARACTERS.filter(character => (!work || character.group.ko === work) && (!term || normalizeCouplingSearch(`${character.ko}${character.ja}${character.en}${character.group.ko}${character.group.ja}${character.group.en}`).includes(term))), [term, work]);
  const matchingWorks = useMemo(() => workOptions.filter(option => !workTerm || normalizeCouplingSearch(option.search).includes(workTerm)), [workOptions, workTerm]);
  useLayoutEffect(() => {
    const el = dialog.current; if (!el) return;
    if (open && !el.open) {
      setPending([]); setQuery(''); setWorkQuery(''); setWorkPickerOpen(false);
      const nextWork = globalSearch ? '' : rememberedWork.current;
      setWork(nextWork); el.showModal();
      if (globalSearch) search.current?.focus();
      else workButton.current?.focus();
    } else if (!open && el.open) el.close();
  }, [open, globalSearch]);
  const restoreWorkButton = useRef(false);
  useLayoutEffect(() => {
    if (workPickerOpen) workSearch.current?.focus();
    else if (restoreWorkButton.current) { restoreWorkButton.current = false; workButton.current?.focus(); }
  }, [workPickerOpen]);
  const toggle = (id: string) => setPending(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const chooseWork = (value: string) => {
    if (value !== work) setQuery('');
    setWork(value);
    rememberedWork.current = value;
    setWorkQuery('');
    restoreWorkButton.current = true;
    setWorkPickerOpen(false);
  };
  const leaveWorkPicker = () => { restoreWorkButton.current = true; setWorkPickerOpen(false); };
  const confirm = () => { if (pending.length) onConfirm(COUPLING_FACE_CHARACTERS.filter(character => pending.includes(character.id)).map(character => character.id)); };
  const cancelOrReturn = () => { if (workPickerOpen) leaveWorkPicker(); else onCancel(); };
  return <dialog id="coupling-batch-dialog" ref={dialog} className="coupling-batch-dialog" aria-labelledby="coupling-batch-title" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelOrReturn(); return; }
    if (event.key !== 'Tab') return;
    const element = dialog.current;
    if (!element) return;
    const focusable = Array.from(element.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')).filter(item => item.getClientRects().length > 0);
    if (!focusable.length) { event.preventDefault(); element.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }} onCancel={event => { event.preventDefault(); cancelOrReturn(); }} onClose={() => { if (open) onCancel(); }}>
    <div className="coupling-batch-shell">
      <header><h2 id="coupling-batch-title">{t.addCharacter}</h2><button className="coupling-btn" type="button" onClick={onCancel}>{t.close}</button></header>
      <div className={`coupling-batch-controls${workPickerOpen ? ' is-work-picker' : ''}`}>
        {workPickerOpen ? <>
          <label className="coupling-batch-field">{t.searchWorks}<input ref={workSearch} type="search" value={workQuery} onChange={event => setWorkQuery(event.target.value)} placeholder={t.searchPlaceholder}/></label>
          <button type="button" className="coupling-batch-work-back" onClick={leaveWorkPicker}>{t.backToCharacters}</button>
        </> : <>
          <div className="coupling-batch-work-select">
            <span>{t.work}</span>
            <button ref={workButton} type="button" aria-label={t.chooseWork} aria-describedby="coupling-batch-current-work" onClick={() => { setWorkQuery(''); setWorkPickerOpen(true); }}>
              <span>{t.chooseWork}</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <span id="coupling-batch-current-work">{selectedWorkName}</span>
          </div>
          <label className="coupling-batch-field">{t.search}<input ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder}/></label>
          <div className="coupling-batch-actions">
            <button type="button" onClick={() => setPending(ids => [...new Set([...ids, ...COUPLING_FACE_CHARACTERS.filter(character => (!work || character.group.ko === work) && !placed.has(character.id)).map(character => character.id)])])}>{work ? `${selectedWorkName} ${t.selectAll}` : t.selectAllCharacters}</button>
            <button type="button" onClick={() => setPending([])}>{t.clearSelection}</button>
          </div>
        </>}
      </div>
      <div className="coupling-batch-content">
        {workPickerOpen ? <div className="coupling-batch-work-grid">
          {matchingWorks.map((option, index) => {
            const count = availableCounts.get(option.value) ?? 0, descriptionId = `coupling-batch-work-count-${index}`;
            return <button key={option.value || 'all'} type="button" className="coupling-batch-work-tile" aria-label={option.name} aria-describedby={descriptionId} aria-pressed={work === option.value} onClick={() => chooseWork(option.value)}>
              <strong>{option.name}</strong><small id={descriptionId}>{t.availableCharacters.replace('{count}', String(count))}</small>
            </button>;
          })}
          {!matchingWorks.length && <p className="coupling-batch-empty">{t.noResults}</p>}
        </div> : <div className="coupling-batch-grid">
          {matches.map(character => {
            const checked = pending.includes(character.id), unavailable = placed.has(character.id);
            return <label key={character.id} className={`coupling-batch-choice${unavailable ? ' is-placed' : ''}`}>
              <input type="checkbox" checked={checked} disabled={unavailable} onChange={() => toggle(character.id)}/>
              <CharacterAvatar character={character} size={56} decorative/>
              <span><strong>{character[lang]}</strong><small>{unavailable ? t.placed : character.group[lang]}</small></span>
            </label>;
          })}
          {!matches.length && <p className="coupling-batch-empty">{t.noResults}</p>}
        </div>}
      </div>
      <footer>
        <div className="coupling-batch-pending" aria-live="polite">{pending.map(id => { const character = COUPLING_FACE_CHARACTERS.find(item => item.id === id)!; return <button type="button" key={id} aria-label={`${character[lang]} ${t.remove}`} onClick={() => toggle(id)}>{character[lang]} ×</button>; })}</div>
        <button className="coupling-btn" type="button" onClick={onCancel}>{t.cancel}</button>
        {!workPickerOpen&&<button className="coupling-btn coupling-btn-primary" type="button" disabled={!pending.length} onClick={confirm}>{t.addSelected.replace('{count}', String(pending.length))}</button>}
      </footer>
    </div>
  </dialog>;
}
