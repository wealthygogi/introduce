import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../../contexts/LangContext';
import { PROFILE_CHARACTER_BY_ID, type ProfileCharacter } from '../../../data/profileCatalog';
import { captureCardBlob, saveBlob } from '../../../lib/captureCard';
import copy from './copy';
import { buildPool, drawCharacters, recentCharacterIds } from './drawPool';
import { loadPreferenceSignals } from './preferenceSignals';
import {
  appendHistory,
  createDefaultRandomPicker,
  createDrawId,
  readRandomPicker,
  writeRandomPicker,
} from './randomPickerStorage';
import type {
  DrawOutcome,
  PreferenceSignals,
  RandomDrawRecord,
  RandomSettings,
} from './types';
import RandomDrawStage from './components/RandomDrawStage';
import RandomExport, { RANDOM_EXPORT_ID } from './components/RandomExport';
import RandomFilterSheet from './components/RandomFilterSheet';
import RandomFilterPanel from './components/RandomFilterPanel';
import RandomHistory from './components/RandomHistory';
import RandomResultCard from './components/RandomResultCard';
import './random-picker.css';

function charactersForRecord(record: RandomDrawRecord): ProfileCharacter[] {
  return record.characterIds
    .map(id => PROFILE_CHARACTER_BY_ID.get(id))
    .filter((character): character is ProfileCharacter => Boolean(character));
}

function recordFilename(count: number): string {
  const day = new Date().toISOString().slice(0, 10);
  return `gensokyo-random-${day}-${count}.png`;
}

export default function RandomPickerPage() {
  const { lang } = useLang();
  const t = copy[lang];
  const navigate = useNavigate();
  const [boot] = useState(() => {
    const read = readRandomPicker(window.localStorage);
    if (read.kind === 'valid') return { data: read.data, warning: null as 'restore' | null };
    return {
      data: createDefaultRandomPicker(),
      warning: read.kind === 'invalid' || read.kind === 'unavailable' ? 'restore' as const : null,
    };
  });
  const [settings, setSettings] = useState<RandomSettings>(boot.data.settings);
  const [history, setHistory] = useState<RandomDrawRecord[]>(boot.data.history);
  const [result, setResult] = useState<ProfileCharacter[] | null>(null);
  const [lastOutcome, setLastOutcome] = useState<DrawOutcome | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'drawing'>('idle');
  const [signals, setSignals] = useState<PreferenceSignals | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [writeWarning, setWriteWarning] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'preparing' | 'ready' | 'failed'>('idle');
  const [undoSnapshot, setUndoSnapshot] = useState<RandomDrawRecord[] | null>(null);
  const timerRef = useRef<number | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const recent = useMemo(() => recentCharacterIds(history), [history]);
  const pool = useMemo(() => buildPool(settings, signals, recent), [settings, signals, recent]);

  useEffect(() => {
    if (!settings.reflectPreferences) {
      setSignals(null);
      return;
    }
    setSignals(loadPreferenceSignals());
  }, [settings.reflectPreferences]);

  useEffect(() => {
    const ok = writeRandomPicker(window.localStorage, { settings, history });
    if (!ok) setWriteWarning(true);
  }, [settings, history]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const updateSettings = (patch: Partial<RandomSettings>) => {
    setSettings(current => ({ ...current, ...patch }));
    setCopyState('idle');
    setSaveState('idle');
    pendingBlobRef.current = null;
  };

  const resetFilters = () => {
    updateSettings({
      scope: 'all',
      workIds: [],
      roles: [],
      stage: null,
      mode: 'pool',
      reflectPreferences: false,
      excludeRecent: true,
    });
  };

  const finishDraw = () => {
    const outcome = drawCharacters(pool, settings.count, settings.mode);
    const record: RandomDrawRecord = {
      id: createDrawId(),
      at: Date.now(),
      characterIds: outcome.characters.map(character => character.id),
      count: outcome.characters.length,
      requested: settings.count,
      mode: settings.mode,
    };
    setResult(outcome.characters);
    setLastOutcome(outcome);
    setActiveId(record.id);
    setHistory(current => appendHistory(current, record));
    setPhase('idle');
    setCopyState('idle');
    setSaveState('idle');
    pendingBlobRef.current = null;
    window.requestAnimationFrame(() => liveRef.current?.focus?.());
  };

  const draw = () => {
    if (phase === 'drawing') return;
    if (pool.entries.length === 0) {
      setResult([]);
      setLastOutcome(null);
      setActiveId(null);
      setCopyState('idle');
      setSaveState('idle');
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      finishDraw();
      return;
    }
    setPhase('drawing');
    timerRef.current = window.setTimeout(finishDraw, 620);
  };

  const openRecord = (record: RandomDrawRecord) => {
    setResult(charactersForRecord(record));
    setLastOutcome(null);
    setActiveId(record.id);
    setCopyState('idle');
    setSaveState('idle');
    pendingBlobRef.current = null;
  };

  const clearHistory = () => {
    setUndoSnapshot(history);
    setHistory([]);
    setActiveId(null);
  };

  const undoClear = () => {
    if (undoSnapshot) setHistory(undoSnapshot);
    setUndoSnapshot(null);
  };

  const copyResultText = async () => {
    if (!result?.length) return;
    const lines = result.map((character, index) => `${index + 1}. ${character[lang]} (${character.group[lang]})`);
    const text = `${t.heading}\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const saveResult = async () => {
    if (!result?.length || saveState === 'preparing') return;
    if (pendingBlobRef.current) {
      saveBlob(pendingBlobRef.current, recordFilename(result.length));
      pendingBlobRef.current = null;
      setSaveState('idle');
      return;
    }
    setSaveState('preparing');
    try {
      await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
      const blob = await captureCardBlob(RANDOM_EXPORT_ID, {
        scale: 1,
        resetPosition: true,
        maxPixelArea: 16_000_000,
      });
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        pendingBlobRef.current = blob;
        setSaveState('ready');
      } else {
        saveBlob(blob, recordFilename(result.length));
        setSaveState('idle');
      }
    } catch (error) {
      console.error('Random picker save failed', error);
      setSaveState('failed');
    }
  };

  const openPair = () => {
    if (result?.length !== 2) return;
    const [a, b] = result;
    navigate(`/coupling/pairs?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`);
  };

  const empty = result !== null && result.length === 0;
  const preferenceEmpty = empty && settings.reflectPreferences && pool.totalCandidates > 0;
  const notice = lastOutcome
    ? lastOutcome.clamped
      ? t.clamped(lastOutcome.requested, lastOutcome.characters.length)
      : lastOutcome.relaxedRecent
        ? t.relaxedRecent
        : null
    : null;
  const chips = [
    t.scopes[settings.scope],
    t.counts[settings.count],
    ...settings.roles.map(role => t.roleLabels[role]),
    settings.stage === null ? null : typeof settings.stage === 'number' ? t.stageNumber(settings.stage) : t.stageLabels[settings.stage],
    t.modes[settings.mode],
    settings.reflectPreferences ? t.personalization : null,
  ].filter((chip): chip is string => Boolean(chip));
  const announce = result?.length ? t.resultAnnounce(result.map(character => character[lang]).join(', ')) : '';

  const filterProps = {
    settings,
    onChange: updateSettings,
    copy: t,
    signals,
    poolCount: pool.entries.length,
    onReset: resetFilters,
  };

  return <div className="random-page">
    <header className="random-hero">
      <span className="random-eyebrow">{t.eyebrow}</span>
      <h1>{t.heading}</h1>
      <p>{t.intro}</p>
    </header>

    <div className="random-layout">
      <aside className="random-settings" aria-label={t.filters}>
        <RandomFilterPanel {...filterProps} />
      </aside>

      <div className="random-main">
        <div className="random-toolbar">
          <ul className="random-chips" aria-label={t.filters}>
            {chips.map(chip => <li key={chip} className="random-chip">{chip}</li>)}
          </ul>
          <button type="button" className="random-settings-trigger" onClick={() => setSheetOpen(true)}>
            <span aria-hidden="true">⚙</span> {t.filters}
          </button>
        </div>

        {boot.warning === 'restore' && <p className="random-notice" role="status">{t.restoreWarning}</p>}
        {writeWarning && <p className="random-notice" role="status">{t.storageWarning}</p>}
        {notice && <p className="random-notice" role="status">{notice}</p>}

        <RandomDrawStage phase={phase} result={result} copy={t} poolEmpty={pool.entries.length === 0} onDraw={draw} />

        {empty && <section className="random-empty" role="status">
          <h2>{preferenceEmpty ? t.emptyPreferenceTitle : t.emptyTitle}</h2>
          <p>{preferenceEmpty ? t.emptyPreferenceBody : t.emptyBody}</p>
          <div className="random-empty-actions">
            {preferenceEmpty && <button type="button" className="random-secondary-action" onClick={() => updateSettings({ reflectPreferences: false })}>{t.turnOffPreferences}</button>}
            <button type="button" className="random-secondary-action" onClick={resetFilters}>{t.resetFilters}</button>
          </div>
        </section>}

        {result && result.length > 0 && <RandomResultCard
          characters={result}
          copy={t}
          onCopy={copyResultText}
          onSave={saveResult}
          onOpenPair={result.length === 2 ? openPair : undefined}
          copyState={copyState}
          saveState={saveState}
        />}

        <RandomHistory
          records={history}
          copy={t}
          activeId={activeId}
          onOpen={openRecord}
          onClear={clearHistory}
          canUndo={undoSnapshot !== null}
          onUndo={undoClear}
        />

        <p className="random-sr-only" aria-live="polite" ref={liveRef} tabIndex={-1}>{announce}</p>
      </div>
    </div>

    <RandomFilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} {...filterProps} />

    {result && result.length > 0 && <RandomExport characters={result} copy={t} />}
  </div>;
}
