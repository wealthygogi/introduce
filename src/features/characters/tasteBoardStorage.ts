import type { TasteBoard, TasteCell, TasteGroup, TasteTheme } from './tasteBoardTypes';

export const TASTE_BOARD_STORAGE_KEY = 'introduce:characters:taste-board:v1';
export const MAX_CELLS_PER_GROUP = 100;
export const MAX_CELLS_TOTAL = 300;
export const MAX_GROUPS = 20;
const THEMES = new Set<TasteTheme>(['minimal', 'album', 'night']);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, maxLength: number): value is string => typeof value === 'string' && value.length <= maxLength;

export function createDefaultTasteBoard(): TasteBoard {
  return {
    title: '내 캐릭터 취향',
    theme: 'minimal',
    showNames: true,
    groups: [{ id: 'group-1', title: 'Favorites', rows: 3, columns: 3, cells: Array(9).fill(null) }],
  };
}

function isTasteCell(value: unknown, characters: ReadonlySet<string>): value is TasteCell {
  if (!isRecord(value) || !Array.isArray(value.characters) || value.characters.length < 1 || value.characters.length > 2 || !isText(value.label, 80)) return false;
  const ids = value.characters;
  return ids.every(id => typeof id === 'string' && characters.has(id)) && new Set(ids).size === ids.length;
}

function isTasteGroup(value: unknown, characters: ReadonlySet<string>): value is TasteGroup {
  if (!isRecord(value) || !isText(value.id, 80) || !value.id || !isText(value.title, 100) || !Number.isInteger(value.rows) || !Number.isInteger(value.columns)) return false;
  const rows = value.rows as number;
  const columns = value.columns as number;
  if (rows < 1 || columns < 1 || rows * columns > MAX_CELLS_PER_GROUP || !Array.isArray(value.cells) || value.cells.length !== rows * columns) return false;
  return value.cells.every(cell => cell === null || isTasteCell(cell, characters));
}

export type TasteBoardReadResult = { kind: 'valid'; data: TasteBoard } | { kind: 'invalid' };

export function parseTasteBoard(raw: string, characters: ReadonlySet<string>): TasteBoardReadResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.data)) return { kind: 'invalid' };
    const value = parsed.data;
    if (!isText(value.title, 120) || !THEMES.has(value.theme as TasteTheme) || typeof value.showNames !== 'boolean' || !Array.isArray(value.groups) || value.groups.length < 1 || value.groups.length > MAX_GROUPS) return { kind: 'invalid' };
    if (!value.groups.every(group => isTasteGroup(group, characters))) return { kind: 'invalid' };
    const groups = value.groups as TasteGroup[];
    if (new Set(groups.map(group => group.id)).size !== groups.length || groups.reduce((total, group) => total + group.cells.length, 0) > MAX_CELLS_TOTAL) return { kind: 'invalid' };
    return { kind: 'valid', data: value as unknown as TasteBoard };
  } catch {
    return { kind: 'invalid' };
  }
}

export function serializeTasteBoard(data: TasteBoard): string {
  return JSON.stringify({ version: 1, data });
}

export type TasteBoardStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type TasteBoardStorageResult = { kind: 'empty' } | TasteBoardReadResult | { kind: 'unavailable' };

export function readTasteBoard(storage: TasteBoardStorage, characters: ReadonlySet<string>): TasteBoardStorageResult {
  try {
    const raw = storage.getItem(TASTE_BOARD_STORAGE_KEY);
    return raw === null ? { kind: 'empty' } : parseTasteBoard(raw, characters);
  } catch {
    return { kind: 'unavailable' };
  }
}

export function writeTasteBoard(storage: TasteBoardStorage, data: TasteBoard): boolean {
  try {
    storage.setItem(TASTE_BOARD_STORAGE_KEY, serializeTasteBoard(data));
    return true;
  } catch {
    return false;
  }
}
