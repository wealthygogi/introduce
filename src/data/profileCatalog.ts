import catalog from './profileCatalog.json';
import type { Lang } from './i18n';

type Localized = Record<Lang, string>;
export type ProfileCharacter = Localized & { id: string; group: Localized; spriteRel: string | null };
export type WorkCategory = 'game' | 'book' | 'music';
export type ProfileWork = Localized & { id: string; category: WorkCategory; group: Localized };
export const PROFILE_CHARACTERS = catalog.characters as ProfileCharacter[];
export const PROFILE_WORKS = catalog.works as ProfileWork[];
export const PROFILE_CHARACTER_BY_ID = new Map(PROFILE_CHARACTERS.map(character => [character.id, character]));
export const PROFILE_WORK_BY_ID = new Map(PROFILE_WORKS.map(work => [work.id, work]));
export const MAX_RANKED_CHARACTERS = 7;
export const MAX_FAVORITE_WORKS = 5;

/** Preserve ordering, rejecting unknown and duplicate identities before applying the limit. */
export function normalizeProfileSelection(value: unknown, catalog: ReadonlyMap<string, unknown>, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== 'string' || !catalog.has(id) || seen.has(id)) continue;
    selected.push(id);
    seen.add(id);
    if (selected.length === limit) break;
  }
  return selected;
}

const normalizeName = (name: string) => name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const characterNames = new Map(PROFILE_CHARACTERS.flatMap(character => [character.ko, character.ja, character.en].map(name => [normalizeName(name), character.id] as const)));
const workNames = new Map(PROFILE_WORKS.flatMap(work => [work.ko, work.ja, work.en].map(name => [normalizeName(name), work.id] as const)));

/** Read old drafts once; legacy Compact choices and free-text notes remain intact for review. */
export function migrateProfileSelections(input: {
  rankedCharacters?: unknown;
  favoriteWorks?: unknown;
  selectedChar?: unknown;
  selectedSeries?: unknown;
  custom?: Record<string, string>;
}): { rankedCharacters: string[]; favoriteWorks: string[]; needsReview: boolean } {
  const characterCandidates: unknown[] = [];
  const workCandidates: unknown[] = [];
  let needsReview = false;
  if (!('rankedCharacters' in input)) {
    characterCandidates.push(input.selectedChar);
    for (const name of (input.custom?.['wide:characters'] ?? '').split(/[,\n]/).filter(value => value.trim())) {
      const id = characterNames.get(normalizeName(name));
      if (id) characterCandidates.push(id);
      else needsReview = true;
    }
  }
  if (!('favoriteWorks' in input)) {
    const legacySeries = input.selectedSeries instanceof Set ? input.selectedSeries : Array.isArray(input.selectedSeries) ? input.selectedSeries : [];
    for (const id of legacySeries) {
      if (typeof id === 'string' && PROFILE_WORK_BY_ID.has(id)) workCandidates.push(id);
      else needsReview = true;
    }
    for (const line of (input.custom?.['wide:otherWorks'] ?? '').split('\n').filter(value => value.trim())) {
      const exact = workNames.get(normalizeName(line));
      if (exact) { workCandidates.push(exact); continue; }
      for (const name of line.split(',').filter(value => value.trim())) {
        const id = workNames.get(normalizeName(name));
        if (id) workCandidates.push(id);
        else needsReview = true;
      }
    }
  }
  if (new Set(characterCandidates).size > MAX_RANKED_CHARACTERS || new Set(workCandidates).size > MAX_FAVORITE_WORKS) needsReview = true;
  return {
    rankedCharacters: normalizeProfileSelection('rankedCharacters' in input ? input.rankedCharacters : characterCandidates, PROFILE_CHARACTER_BY_ID, MAX_RANKED_CHARACTERS),
    favoriteWorks: normalizeProfileSelection('favoriteWorks' in input ? input.favoriteWorks : workCandidates, PROFILE_WORK_BY_ID, MAX_FAVORITE_WORKS),
    needsReview,
  };
}
