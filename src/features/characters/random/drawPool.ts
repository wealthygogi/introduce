import { PROFILE_WORKS } from '../../../data/profileCatalog';
import { filterGroupCharacters } from '../characterCategories';
import type {
  DrawCount,
  DrawOutcome,
  DrawMode,
  DrawResult,
  PoolEntry,
  PoolResult,
  PreferenceSignals,
  RandomFilter,
  RandomSettings,
  RandomScope,
} from './types';

export const DRAW_COUNTS: readonly DrawCount[] = [1, 2, 3, 5, 10];
export const RECENT_EXCLUSION_LIMIT = 10;

const mainlineIds = new Set(Array.from({ length: 15 }, (_, index) => `th${index + 6}`));
const pc98Ids = new Set(['th1', 'th2', 'th3', 'th4', 'th5']);
const gameWorks = PROFILE_WORKS.filter(work => work.category === 'game');
const spinoffIds = new Set(gameWorks.filter(work => !mainlineIds.has(work.id) && !pc98Ids.has(work.id)).map(work => work.id));
const allGameIds = new Set(gameWorks.map(work => work.id));

const scopeIds: Record<Exclude<RandomScope, 'books'>, Set<string>> = {
  all: allGameIds,
  mainline: mainlineIds,
  pc98: pc98Ids,
  spinoff: spinoffIds,
};

export function defaultRandomSettings(): RandomSettings {
  return {
    scope: 'all',
    workIds: [],
    roles: [],
    stage: null,
    count: 1,
    mode: 'pool',
    reflectPreferences: false,
    excludeRecent: true,
  };
}

/** True for the catalog's representative work group of a character. */
export function groupKeyOf(character: { group: Record<'ko' | 'ja' | 'en', string> }): string {
  return character.group.ko;
}

function filterForScope(settings: RandomFilter): RandomFilter {
  if (settings.scope === 'books') {
    return { scope: 'books', workIds: settings.workIds, roles: [], stage: null };
  }
  const scopeSet = scopeIds[settings.scope];
  const selected = settings.workIds.filter(id => scopeSet.has(id));
  const workIds = selected.length > 0 ? selected : [...scopeSet];
  return { scope: 'all', workIds, roles: settings.roles, stage: settings.stage };
}

function weightFor(id: string, signals: PreferenceSignals | null | undefined, enabled: boolean): number {
  if (!enabled || !signals) return 1;
  if (signals.favorite.has(id)) return 3;
  if (signals.avoid.has(id)) return 0;
  if (signals.interested.has(id)) return 1.5;
  return 1;
}

function isExcludedByPreference(id: string, signals: PreferenceSignals | null | undefined, enabled: boolean): boolean {
  if (!enabled || !signals) return false;
  return signals.avoid.has(id) && !signals.favorite.has(id);
}

/**
 * Build the draw pool. `recentIds` is only applied when `excludeRecent` is on.
 * If recent exclusion would leave too few candidates for the requested count,
 * recent characters are restored and `relaxedRecent` is reported.
 */
export function buildPool(
  settings: RandomSettings,
  signals: PreferenceSignals | null | undefined,
  recentIds: readonly string[] = [],
): PoolResult {
  const filter = filterForScope(settings);
  const candidates = filterGroupCharacters('', {
    scope: filter.scope,
    workIds: filter.workIds,
    roles: filter.roles,
    stage: filter.stage,
  });
  const reflect = settings.reflectPreferences;
  const recent = new Set(recentIds.slice(0, RECENT_EXCLUSION_LIMIT));
  const excludedByPreference = reflect
    ? candidates.filter(character => isExcludedByPreference(character.id, signals, reflect)).length
    : 0;

  const weighted = candidates
    .map(character => ({
      character,
      weight: weightFor(character.id, signals, reflect),
      groupKey: groupKeyOf(character),
    }))
    .filter(entry => entry.weight > 0);

  let entries = weighted;
  let relaxedRecent = false;
  if (settings.excludeRecent && recent.size > 0) {
    const withoutRecent = entries.filter(entry => !recent.has(entry.character.id));
    if (withoutRecent.length >= Math.min(settings.count, entries.length)) {
      entries = withoutRecent;
    } else if (withoutRecent.length < settings.count && withoutRecent.length < entries.length) {
      relaxedRecent = true;
    }
  }

  return {
    entries,
    totalCandidates: candidates.length,
    excludedByPreference,
    relaxedRecent,
    warning: Boolean(signals?.warning),
  };
}

function pickWeighted<T extends { weight: number }>(items: readonly T[], rng: () => number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;
  let target = rng() * total;
  for (const item of items) {
    target -= item.weight;
    if (target < 0) return item;
  }
  return items[items.length - 1];
}

function drawPoolMode(entries: readonly PoolEntry[], count: number, rng: () => number): PoolEntry[] {
  const remaining = [...entries];
  const picked: PoolEntry[] = [];
  while (picked.length < count && remaining.length > 0) {
    const entry = pickWeighted(remaining, rng);
    if (!entry) break;
    picked.push(entry);
    remaining.splice(remaining.indexOf(entry), 1);
  }
  return picked;
}

function drawBalanced(entries: readonly PoolEntry[], count: number, rng: () => number): PoolEntry[] {
  const groups = new Map<string, PoolEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.groupKey) ?? [];
    group.push(entry);
    groups.set(entry.groupKey, group);
  }
  const order = [...groups.keys()];
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(rng() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  const picked: PoolEntry[] = [];
  let progress = true;
  while (picked.length < count && progress) {
    progress = false;
    for (const key of order) {
      if (picked.length >= count) break;
      const group = groups.get(key) ?? [];
      if (group.length === 0) continue;
      const entry = pickWeighted(group, rng);
      if (!entry) continue;
      picked.push(entry);
      group.splice(group.indexOf(entry), 1);
      progress = true;
    }
  }
  return picked;
}

export function drawCharacters(
  pool: PoolResult,
  count: DrawCount,
  mode: DrawMode,
  rng: () => number = Math.random,
): DrawOutcome {
  const desired = Math.min(count, pool.entries.length);
  const picked = mode === 'balanced'
    ? drawBalanced(pool.entries, desired, rng)
    : drawPoolMode(pool.entries, desired, rng);
  return {
    characters: picked.map(entry => entry.character),
    requested: count,
    clamped: desired < count,
    relaxedRecent: pool.relaxedRecent,
  };
}

export function resolveDraw(
  settings: RandomSettings,
  signals: PreferenceSignals | null | undefined,
  recentIds: readonly string[] = [],
  rng: () => number = Math.random,
): DrawResult {
  const pool = buildPool(settings, signals, recentIds);
  return { pool, outcome: drawCharacters(pool, settings.count, settings.mode, rng) };
}

/** Flatten recent history into unique character IDs, newest first. */
export function recentCharacterIds(history: ReadonlyArray<{ characterIds: readonly string[] }>, limit = RECENT_EXCLUSION_LIMIT): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const record of history) {
    for (const id of record.characterIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
      if (result.length >= limit) return result;
    }
  }
  return result;
}
