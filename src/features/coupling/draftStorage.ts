import { PROFILE_CHARACTER_BY_ID } from './data';
import { isRelationId } from './relations';
import type { Drafts, EditorId, PairCard, PairFields } from './types';

export const DRAFT_KEYS: Record<EditorId, string> = {
  whiteboard: 'introduce:coupling:whiteboard:v1',
  keyboard: 'introduce:coupling:keyboard:v1',
  pairs: 'introduce:coupling:pairs:v1',
  matrix: 'introduce:coupling:matrix:v1',
};

const STARTER_ROSTER = ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCharacter = (value: unknown): value is string => typeof value === 'string' && PROFILE_CHARACTER_BY_ID.has(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isUnique = <T,>(items: readonly T[]) => new Set(items).size === items.length;
const isDirection = (value: unknown): value is 'forward' | 'mutual' | 'reverse' => value === 'forward' || value === 'mutual' || value === 'reverse';
const pairKey = (pair: Pick<PairFields, 'a' | 'b' | 'direction'>) => pair.direction === 'mutual'
  ? JSON.stringify(['mutual', ...[pair.a, pair.b].sort()])
  : JSON.stringify(['directed', ...(pair.direction === 'reverse' ? [pair.b, pair.a] : [pair.a, pair.b])]);

export function createDefaultDrafts(): Drafts {
  return {
    whiteboard: {
      nodes: STARTER_ROSTER.map((id, index) => ({ id, x: (index % 3) * 128, y: Math.floor(index / 3) * 128 })),
      edges: [], view: { x: 0, y: 0, zoom: 1 },
    },
    keyboard: { sourceId: 'reimu', edges: [] },
    pairs: { pairs: [], draft: { a: null, b: null, relation: 'love', direction: 'forward', memo: '' }, activeSlot: 'a', editingId: null },
    matrix: { roster: [...STARTER_ROSTER], mode: 'directed', directed: [], unordered: [] },
  };
}

function validWhiteboard(value: unknown): value is Drafts['whiteboard'] {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges) || !isRecord(value.view)) return false;
  const nodes = value.nodes;
  const nodeIds: string[] = [];
  for (const node of nodes) {
    if (!isRecord(node) || !isCharacter(node.id) || !isFiniteNumber(node.x) || !isFiniteNumber(node.y)) return false;
    nodeIds.push(node.id);
  }
  if (!isUnique(nodeIds)) return false;
  const nodeSet = new Set(nodeIds);
  const edgeIds: string[] = [];
  const edgePairs: string[] = [];
  for (const edge of value.edges) {
    if (!isRecord(edge) || typeof edge.id !== 'string' || !edge.id || !isCharacter(edge.from) || !isCharacter(edge.to) || edge.from === edge.to || !nodeSet.has(edge.from) || !nodeSet.has(edge.to) || !isRelationId(edge.type) || (edge.direction !== 'both' && edge.direction !== 'forward')) return false;
    edgeIds.push(edge.id);
    edgePairs.push(edge.direction === 'both' ? JSON.stringify([edge.from, edge.to].sort()) : JSON.stringify([edge.from, edge.to]));
  }
  const view = value.view;
  return isUnique(edgeIds) && isUnique(edgePairs) && isFiniteNumber(view.x) && isFiniteNumber(view.y) && isFiniteNumber(view.zoom) && view.zoom >= 0.04 && view.zoom <= 4;
}

function validKeyboard(value: unknown): value is Drafts['keyboard'] {
  if (!isRecord(value) || !isCharacter(value.sourceId) || !Array.isArray(value.edges)) return false;
  const keys: string[] = [];
  for (const edge of value.edges) {
    if (!isRecord(edge) || !isCharacter(edge.a) || !isCharacter(edge.b) || edge.a === edge.b || !isRelationId(edge.relation)) return false;
    keys.push(JSON.stringify([edge.a, edge.b].sort()));
  }
  return isUnique(keys);
}

function isPairFields(value: unknown): value is PairFields {
  return isRecord(value) && (value.a === null || isCharacter(value.a)) && (value.b === null || isCharacter(value.b)) && (value.a === null || value.b === null || value.a !== value.b) && isRelationId(value.relation) && isDirection(value.direction) && typeof value.memo === 'string';
}
function validPairCard(value: unknown): value is PairCard {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0 && isCharacter(value.a) && isCharacter(value.b) && value.a !== value.b && isRelationId(value.relation) && isDirection(value.direction) && typeof value.memo === 'string';
}
function validPairs(value: unknown): value is Drafts['pairs'] {
  if (!isRecord(value) || !Array.isArray(value.pairs) || !isPairFields(value.draft) || (value.activeSlot !== 'a' && value.activeSlot !== 'b') || !(value.editingId === null || typeof value.editingId === 'string')) return false;
  if (!value.pairs.every(validPairCard)) return false;
  const ids = value.pairs.map(pair => pair.id);
  const keys = value.pairs.map(pairKey);
  return isUnique(ids) && isUnique(keys);
}

function validMatrix(value: unknown): value is Drafts['matrix'] {
  if (!isRecord(value) || !Array.isArray(value.roster) || value.roster.length > 16 || (value.mode !== 'directed' && value.mode !== 'unordered') || !Array.isArray(value.directed) || !Array.isArray(value.unordered)) return false;
  if (!value.roster.every(isCharacter) || !isUnique(value.roster)) return false;
  const roster = new Set(value.roster);
  const directedKeys: string[] = [];
  for (const edge of value.directed) {
    if (!isRecord(edge) || !isCharacter(edge.from) || !isCharacter(edge.to) || edge.from === edge.to || !roster.has(edge.from) || !roster.has(edge.to) || !isRelationId(edge.relation)) return false;
    directedKeys.push(JSON.stringify([edge.from, edge.to]));
  }
  const unorderedKeys: string[] = [];
  for (const edge of value.unordered) {
    if (!isRecord(edge) || !isCharacter(edge.from) || !isCharacter(edge.to) || edge.from === edge.to || !roster.has(edge.from) || !roster.has(edge.to) || !isRelationId(edge.relation)) return false;
    unorderedKeys.push(JSON.stringify([edge.from, edge.to].sort()));
  }
  return isUnique(directedKeys) && isUnique(unorderedKeys);
}

export type DraftReadResult<K extends EditorId> =
  | { kind: 'empty' }
  | { kind: 'valid'; data: Drafts[K] }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };

export function readDraft<K extends EditorId>(id: K): DraftReadResult<K> {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEYS[id]);
    if (raw === null) return { kind: 'empty' };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return { kind: 'invalid' }; }
    if (!isRecord(parsed) || parsed.version !== 1 || !('data' in parsed)) return { kind: 'invalid' };
    const valid = id === 'whiteboard' ? validWhiteboard(parsed.data)
      : id === 'keyboard' ? validKeyboard(parsed.data)
        : id === 'pairs' ? validPairs(parsed.data)
          : validMatrix(parsed.data);
    if (!valid) return { kind: 'invalid' };
    if (id === 'pairs') {
      const pairs = parsed.data as Drafts['pairs'];
      if (pairs.editingId !== null && !pairs.pairs.some(pair => pair.id === pairs.editingId)) {
        return { kind: 'valid', data: { ...pairs, editingId: null } as Drafts[K] };
      }
    }
    return { kind: 'valid', data: parsed.data as Drafts[K] };
  } catch {
    return { kind: 'unavailable' };
  }
}

export function serializeDraft(data: Drafts[EditorId]): string {
  return JSON.stringify({ version: 1, data });
}
