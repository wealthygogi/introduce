import { PROFILE_CHARACTER_BY_ID, PROFILE_WORK_BY_ID } from '../../../data/profileCatalog';
import { DRAW_COUNTS, defaultRandomSettings } from './drawPool';
import type {
  DrawCount,
  DrawMode,
  RandomDrawRecord,
  RandomPickerData,
  RandomPickerReadResult,
  RandomScope,
  RandomSettings,
} from './types';

export const RANDOM_PICKER_STORAGE_KEY = 'introduce:characters:random-picker:v1';
export const MAX_RANDOM_HISTORY = 50;

const SCOPES = new Set<RandomScope>(['all', 'mainline', 'pc98', 'spinoff', 'books']);
const ROLES = new Set(['playable', 'boss', 'midboss', 'opponent', 'support', 'other', 'enemy']);
const MODES = new Set<DrawMode>(['pool', 'balanced']);
const STAGES = new Set(['extra', 'phantasm', 'final']);
const COUNTS = new Set<number>(DRAW_COUNTS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isUnique = <T,>(items: readonly T[]) => new Set(items).size === items.length;

function parseStage(value: unknown): RandomSettings['stage'] | undefined {
  if (value === null) return null;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 20) return value;
  if (typeof value === 'string' && STAGES.has(value)) return value as RandomSettings['stage'];
  return undefined;
}

function parseCount(value: unknown): DrawCount | undefined {
  return typeof value === 'number' && COUNTS.has(value) ? value as DrawCount : undefined;
}

function parseSettings(value: unknown): RandomSettings | null {
  if (!isRecord(value)) return null;
  if (typeof value.scope !== 'string' || !SCOPES.has(value.scope as RandomScope)) return null;
  if (!Array.isArray(value.workIds) || !value.workIds.every(id => typeof id === 'string' && PROFILE_WORK_BY_ID.has(id))) return null;
  if (!isUnique(value.workIds)) return null;
  if (!Array.isArray(value.roles) || !value.roles.every(role => typeof role === 'string' && ROLES.has(role))) return null;
  if (!isUnique(value.roles)) return null;
  const stage = parseStage(value.stage);
  if (stage === undefined) return null;
  const count = parseCount(value.count);
  if (count === undefined) return null;
  if (typeof value.mode !== 'string' || !MODES.has(value.mode as DrawMode)) return null;
  if (typeof value.reflectPreferences !== 'boolean' || typeof value.excludeRecent !== 'boolean') return null;
  return {
    scope: value.scope as RandomScope,
    workIds: [...value.workIds] as string[],
    roles: [...value.roles] as RandomSettings['roles'],
    stage,
    count,
    mode: value.mode as DrawMode,
    reflectPreferences: value.reflectPreferences,
    excludeRecent: value.excludeRecent,
  };
}

function parseHistory(value: unknown): RandomDrawRecord[] | null {
  if (!Array.isArray(value) || value.length > MAX_RANDOM_HISTORY) return null;
  const records: RandomDrawRecord[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (!isText(item.id, 120) || !isFiniteNumber(item.at) || item.at < 0) return null;
    if (!Array.isArray(item.characterIds) || item.characterIds.length < 1 || item.characterIds.length > 10) return null;
    if (!isFiniteNumber(item.count) || !Number.isInteger(item.count) || item.count !== item.characterIds.length) return null;
    if (typeof item.mode !== 'string' || !MODES.has(item.mode as DrawMode)) return null;
    if (!item.characterIds.every(id => typeof id === 'string' && PROFILE_CHARACTER_BY_ID.has(id))) return null;
    if (!isUnique(item.characterIds)) return null;
    const requested = item.requested === undefined ? undefined : parseCount(item.requested);
    if (item.requested !== undefined && requested === undefined) return null;
    records.push({
      id: item.id,
      at: item.at,
      characterIds: [...item.characterIds] as string[],
      count: item.count,
      mode: item.mode as DrawMode,
      ...(requested === undefined ? {} : { requested }),
    });
  }
  return records;
}

export function createDefaultRandomPicker(): RandomPickerData {
  return { settings: defaultRandomSettings(), history: [] };
}

export function parseRandomPicker(raw: string): RandomPickerReadResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.data)) return { kind: 'invalid' };
    const settings = parseSettings(parsed.data.settings);
    const history = parseHistory(parsed.data.history);
    if (!settings || !history) return { kind: 'invalid' };
    return { kind: 'valid', data: { settings, history } };
  } catch {
    return { kind: 'invalid' };
  }
}

export function serializeRandomPicker(data: RandomPickerData): string {
  return JSON.stringify({ version: 1, data });
}

export function readRandomPicker(storage: Pick<Storage, 'getItem'>): RandomPickerReadResult {
  try {
    const raw = storage.getItem(RANDOM_PICKER_STORAGE_KEY);
    return raw === null ? { kind: 'empty' } : parseRandomPicker(raw);
  } catch {
    return { kind: 'unavailable' };
  }
}

export function writeRandomPicker(storage: Pick<Storage, 'setItem'>, data: RandomPickerData): boolean {
  try {
    storage.setItem(RANDOM_PICKER_STORAGE_KEY, serializeRandomPicker(data));
    return true;
  } catch {
    return false;
  }
}

export function appendHistory(history: readonly RandomDrawRecord[], record: RandomDrawRecord): RandomDrawRecord[] {
  return [record, ...history].slice(0, MAX_RANDOM_HISTORY);
}

export function createDrawId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through to the timestamp-based id
  }
  return `draw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
