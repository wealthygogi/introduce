import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useLang } from '../../contexts/LangContext';
import { createDefaultDrafts, DRAFT_KEYS, readDraft, serializeDraft } from './draftStorage';
import type { Drafts, EditorId, DraftSaveStatus } from './types';
import copy from './copy';

type DraftEntry<K extends EditorId> = {
  draft: Drafts[K]; hasDraft: boolean; dirty: boolean; saveStatus: DraftSaveStatus;
  restoreError: boolean; storageError: boolean;
};
type Entries = { [K in EditorId]: DraftEntry<K> };
type CouplingDraftContextValue = {
  entries: Entries;
  setDraft: <K extends EditorId>(id: K, action: SetStateAction<Drafts[K]>) => void;
  resetDraft: <K extends EditorId>(id: K) => Drafts[K];
  flush: () => void;
};
const CouplingDraftContext = createContext<CouplingDraftContextValue | null>(null);
const ids: EditorId[] = ['whiteboard', 'keyboard', 'pairs', 'matrix'];

function readEntry<K extends EditorId>(id: K, fallback: Drafts[K]): DraftEntry<K> {
  const result = readDraft(id);
  if (result.kind === 'valid') return { draft: result.data, hasDraft: true, dirty: result.migrated, saveStatus: result.migrated ? 'saving' : 'saved', restoreError: false, storageError: false };
  return {
    draft: fallback, hasDraft: false, dirty: false,
    saveStatus: result.kind === 'unavailable' ? 'memory-only' : 'saved',
    restoreError: result.kind === 'invalid', storageError: result.kind === 'unavailable',
  };
}

function loadEntries(): Entries {
  const defaults = createDefaultDrafts();
  if (typeof window === 'undefined') return {
    whiteboard: { draft: defaults.whiteboard, hasDraft: false, dirty: false, saveStatus: 'saved', restoreError: false, storageError: false },
    keyboard: { draft: defaults.keyboard, hasDraft: false, dirty: false, saveStatus: 'saved', restoreError: false, storageError: false },
    pairs: { draft: defaults.pairs, hasDraft: false, dirty: false, saveStatus: 'saved', restoreError: false, storageError: false },
    matrix: { draft: defaults.matrix, hasDraft: false, dirty: false, saveStatus: 'saved', restoreError: false, storageError: false },
  };
  return {
    whiteboard: readEntry('whiteboard', defaults.whiteboard),
    keyboard: readEntry('keyboard', defaults.keyboard),
    pairs: readEntry('pairs', defaults.pairs),
    matrix: readEntry('matrix', defaults.matrix),
  };
}

export function CouplingDraftProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entries>(loadEntries);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const flush = useCallback(() => {
    for (const id of ids) {
      const entry = entriesRef.current[id];
      if (!entry.dirty) continue;
      try {
        window.localStorage.setItem(DRAFT_KEYS[id], serializeDraft(entry.draft));
        setEntries(previous => ({ ...previous, [id]: { ...previous[id], dirty: false, saveStatus: 'saved', storageError: false } } as Entries));
      } catch {
        setEntries(previous => ({ ...previous, [id]: { ...previous[id], dirty: true, saveStatus: 'memory-only', storageError: true } } as Entries));
      }
    }
  }, []);

  const setDraft = useCallback(<K extends EditorId,>(id: K, action: SetStateAction<Drafts[K]>) => {
    setEntries(previous => {
      const entry = previous[id];
      const next = typeof action === 'function' ? (action as (value: Drafts[K]) => Drafts[K])(entry.draft) : action;
      return { ...previous, [id]: { ...entry, draft: next, hasDraft: true, dirty: true, saveStatus: 'saving', restoreError: false } } as Entries;
    });
  }, []);
  const resetDraft = useCallback(<K extends EditorId,>(id: K): Drafts[K] => {
    const initial = createDefaultDrafts()[id];
    let storageError = false;
    try {
      window.localStorage.removeItem(DRAFT_KEYS[id]);
    } catch {
      storageError = true;
    }
    setEntries(previous => ({
      ...previous,
      [id]: {
        draft: initial, hasDraft: false, dirty: false,
        saveStatus: storageError ? 'memory-only' : 'saved', restoreError: false, storageError,
      },
    } as Entries));
    return initial;
  }, []);


  useEffect(() => {
    if (!ids.some(id => entries[id].dirty && entries[id].saveStatus === 'saving')) return;
    const timer = window.setTimeout(flush, 300);
    return () => window.clearTimeout(timer);
  }, [entries, flush]);

  useEffect(() => {
    const onPageHide = () => flush();
    window.addEventListener('pagehide', onPageHide);
    return () => { window.removeEventListener('pagehide', onPageHide); flush(); };
  }, [flush]);

  const value = useMemo(() => ({ entries, setDraft, resetDraft, flush }), [entries, setDraft, resetDraft, flush]);
  return <CouplingDraftContext.Provider value={value}>{children}</CouplingDraftContext.Provider>;
}

export function useCouplingDraft<K extends EditorId>(id: K): {
  draft: Drafts[K]; setDraft: Dispatch<SetStateAction<Drafts[K]>>; resetDraft: () => Drafts[K]; hasDraft: boolean; saveStatus: DraftSaveStatus; warning: string | null;
} {
  const context = useContext(CouplingDraftContext);
  const { lang } = useLang();
  if (!context) throw new Error('useCouplingDraft must be used inside CouplingDraftProvider');
  const entry = context.entries[id];
  const setDraft = useCallback<Dispatch<SetStateAction<Drafts[K]>>>(action => context.setDraft(id, action), [context.setDraft, id]);
  const resetDraft = useCallback(() => context.resetDraft(id), [context.resetDraft, id]);
  const warning = entry.storageError ? copy[lang].saveFailed
    : entry.restoreError ? copy[lang].restoreFailed : null;
  return { draft: entry.draft, setDraft, resetDraft, hasDraft: entry.hasDraft, saveStatus: entry.saveStatus, warning };
}
