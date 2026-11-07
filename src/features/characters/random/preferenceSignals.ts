import { PROFILE_CHARACTERS } from '../../../data/profileCatalog';
import { readDraft } from '../../coupling/draftStorage';
import type { KeyboardDraft, MatrixDraft, PairsDraft, WhiteboardDraft } from '../../coupling/types';
import { readTasteBoard } from '../tasteBoardStorage';
import type { TasteBoard } from '../tasteBoardTypes';
import type { PreferenceSignals } from './types';

export type PreferenceSources = {
  tasteBoard?: TasteBoard | null;
  whiteboard?: WhiteboardDraft | null;
  keyboard?: KeyboardDraft | null;
  pairs?: PairsDraft | null;
  matrix?: MatrixDraft | null;
};

type SignalKind = 'favorite' | 'interested' | 'avoid';

/**
 * Read-only aggregation of saved taste-board and coupling preference markers.
 * Favorite wins over avoid; sets are kept disjoint so UI counts are honest.
 */
export function collectPreferenceSignals(sources: PreferenceSources, warning = false): PreferenceSignals {
  const favorite = new Set<string>();
  const interested = new Set<string>();
  const avoid = new Set<string>();

  const mark = (id: string | null | undefined, kind: SignalKind) => {
    if (!id) return;
    if (kind === 'favorite') {
      favorite.add(id);
      interested.delete(id);
      avoid.delete(id);
      return;
    }
    if (kind === 'avoid') {
      if (favorite.has(id)) return;
      avoid.add(id);
      interested.delete(id);
      return;
    }
    if (!favorite.has(id) && !avoid.has(id)) interested.add(id);
  };

  const markPreference = (a: string | null | undefined, b: string | null | undefined, preference: string | null | undefined) => {
    if (preference !== 'favorite' && preference !== 'avoid') return;
    mark(a, preference);
    mark(b, preference);
  };

  if (sources.tasteBoard) {
    for (const group of sources.tasteBoard.groups) {
      const kind: SignalKind = group.titlePreset?.kind === 'favorites' ? 'favorite' : 'interested';
      for (const cell of group.cells) {
        if (!cell) continue;
        for (const id of cell.characters) mark(id, kind);
      }
    }
  }

  for (const edge of sources.whiteboard?.edges ?? []) {
    markPreference(edge.from, edge.to, edge.preference);
  }
  for (const edge of sources.keyboard?.edges ?? []) {
    markPreference(edge.a, edge.b, edge.preference);
  }
  for (const pair of sources.pairs?.pairs ?? []) {
    markPreference(pair.a, pair.b, pair.preference);
  }
  for (const edge of sources.matrix?.directed ?? []) {
    markPreference(edge.from, edge.to, edge.preference);
  }
  for (const edge of sources.matrix?.unordered ?? []) {
    markPreference(edge.from, edge.to, edge.preference);
  }

  return { favorite, interested, avoid, warning };
}

/** Browser-only loader. All storage remains local; nothing is sent anywhere. */
export function loadPreferenceSignals(): PreferenceSignals {
  let warning = false;
  const characterIds = new Set(PROFILE_CHARACTERS.map(character => character.id));
  const boardResult = readTasteBoard(window.localStorage, characterIds);
  if (boardResult.kind === 'invalid' || boardResult.kind === 'unavailable') warning = true;

  const whiteboard = readDraft('whiteboard');
  const keyboard = readDraft('keyboard');
  const pairs = readDraft('pairs');
  const matrix = readDraft('matrix');
  for (const result of [whiteboard, keyboard, pairs, matrix]) {
    if (result.kind === 'invalid' || result.kind === 'unavailable') warning = true;
  }

  return collectPreferenceSignals({
    tasteBoard: boardResult.kind === 'valid' ? boardResult.data : null,
    whiteboard: whiteboard.kind === 'valid' ? whiteboard.data : null,
    keyboard: keyboard.kind === 'valid' ? keyboard.data : null,
    pairs: pairs.kind === 'valid' ? pairs.data : null,
    matrix: matrix.kind === 'valid' ? matrix.data : null,
  }, warning);
}
