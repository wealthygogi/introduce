export type RelationId = 'love' | 'favorite' | 'friend' | 'complex' | 'avoid';
export type EditorId = 'whiteboard' | 'keyboard' | 'pairs' | 'matrix';
export type View = { x: number; y: number; zoom: number };

export type WhiteboardDraft = {
  nodes: Array<{ id: string; x: number; y: number }>;
  edges: Array<{ id: string; from: string; to: string; type: RelationId; direction: 'both' | 'forward' }>;
  view: View;
};
export type KeyboardDraft = {
  sourceId: string;
  edges: Array<{ a: string; b: string; relation: RelationId }>;
};
export type PairFields = {
  a: string | null;
  b: string | null;
  relation: RelationId;
  direction: 'forward' | 'mutual' | 'reverse';
  memo: string;
};
export type PairCard = PairFields & { id: string; a: string; b: string };
export type PairsDraft = {
  pairs: PairCard[];
  draft: PairFields;
  activeSlot: 'a' | 'b';
  editingId: string | null;
};
export type MatrixDraft = {
  roster: string[];
  mode: 'directed' | 'unordered';
  directed: Array<{ from: string; to: string; relation: RelationId }>;
  unordered: Array<{ from: string; to: string; relation: RelationId }>;
};
export type Drafts = {
  whiteboard: WhiteboardDraft;
  keyboard: KeyboardDraft;
  pairs: PairsDraft;
  matrix: MatrixDraft;
};
export type DraftDocument<K extends EditorId = EditorId> = { version: 1; data: Drafts[K] };
export type DraftSaveStatus = 'saved' | 'saving' | 'memory-only';
