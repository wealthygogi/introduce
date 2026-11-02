import snapshot from '../../data/characterAppearances.json';
import printworksSnapshot from '../../data/characterPrintworks.json';
import { PROFILE_CHARACTERS, PROFILE_WORKS, type ProfileCharacter } from '../../data/profileCatalog';
import type { Lang } from '../../data/i18n';
import { normalizeCouplingSearch } from '../coupling/relations';

export type AppearanceRole = 'playable' | 'boss' | 'midboss' | 'opponent' | 'support' | 'other';
export type AppearanceStage = number | 'extra' | 'phantasm' | 'final';
export type CharacterAppearance = { workId: string; role: AppearanceRole; stage: AppearanceStage | null; branch: string | null; conditional: boolean; sources: number[] };
export type CharacterTopic = { id: string; label: Record<Lang, string>; workIds: readonly string[]; catalogGroupKeys: readonly string[] };
export type RoleFilter = AppearanceRole | 'enemy';
export type CharacterFilter = { topicId: string | null; role: RoleFilter | null; stage: AppearanceStage | null };
export type GroupCharacterFilter = { scope: 'all' | 'mainline' | 'pc98' | 'spinoff' | 'books'; workIds: readonly string[]; roles: readonly RoleFilter[]; stage: AppearanceStage | null };
export const EMPTY_CHARACTER_FILTER: CharacterFilter = { topicId: null, role: null, stage: null };
const appearances = snapshot.characters as Record<string, CharacterAppearance[]>;
const games = PROFILE_WORKS.filter(work => work.category === 'game');
const groupKeys = [...new Map(PROFILE_CHARACTERS.map(character => [character.group.ko, character.group])).values()];
const gameTopics: CharacterTopic[] = games.map(work => ({ id: work.id, label: { ko: work.ko, ja: work.ja, en: work.en }, workIds: [work.id], catalogGroupKeys: groupKeys.filter(group => group.ko === work.ko || group.ja === work.ja || group.en === work.en).map(group => group.ko) }));
const usedGroups = new Set(gameTopics.flatMap(topic => topic.catalogGroupKeys));
export const CHARACTER_TOPICS: CharacterTopic[] = [...gameTopics, ...groupKeys.filter(group => !usedGroups.has(group.ko)).map(group => ({ id: `category:${group.ko}`, label: group, workIds: [], catalogGroupKeys: [group.ko] }))];
const mainIds = new Set(Array.from({ length: 20 }, (_, index) => `th${index + 1}`));
function aggregate(id: string, label: Record<Lang, string>, predicate: (topic: CharacterTopic) => boolean): CharacterTopic {
  const topics = gameTopics.filter(predicate);
  return { id, label, workIds: topics.flatMap(topic => topic.workIds), catalogGroupKeys: topics.flatMap(topic => topic.catalogGroupKeys) };
}
export const CHARACTER_TOPIC_BUNDLES: CharacterTopic[] = [
  aggregate('pc98', { ko: '구작', ja: '旧作', en: 'PC-98' }, topic => ['th1', 'th2', 'th3', 'th4', 'th5'].includes(topic.id)),
  aggregate('spinoff', { ko: '외전', ja: '外伝', en: 'Spin-offs' }, topic => !mainIds.has(topic.id)),
  aggregate('mainline', { ko: '정규작', ja: '整数作品', en: 'Mainline' }, topic => mainIds.has(topic.id)),
];
export const CHARACTER_TOPIC_BY_ID = new Map([...CHARACTER_TOPICS, ...CHARACTER_TOPIC_BUNDLES].map(topic => [topic.id, topic]));
export function allAppearances(characterId: string): CharacterAppearance[] { return appearances[characterId] ?? []; }
function inTopic(character: ProfileCharacter, topic: CharacterTopic): boolean {
  return topic.catalogGroupKeys.includes(character.group.ko) || allAppearances(character.id).some(appearance => topic.workIds.includes(appearance.workId));
}
export function matchingAppearances(characterId: string, filter: CharacterFilter): CharacterAppearance[] {
  const topic = filter.topicId ? CHARACTER_TOPIC_BY_ID.get(filter.topicId) : undefined;
  return allAppearances(characterId).filter(appearance => {
    if (topic?.workIds.length && !topic.workIds.includes(appearance.workId)) return false;
    if (filter.role && !(filter.role === 'enemy' ? ['boss', 'midboss', 'opponent'].includes(appearance.role) : appearance.role === filter.role)) return false;
    return filter.stage === null || appearance.stage === filter.stage;
  });
}
export function filterCharacters(query: string, filter: CharacterFilter): ProfileCharacter[] {
  const term = normalizeCouplingSearch(query);
  const topic = filter.topicId ? CHARACTER_TOPIC_BY_ID.get(filter.topicId) : undefined;
  return PROFILE_CHARACTERS.filter(character => {
    if (term && !normalizeCouplingSearch(`${character.ko} ${character.ja} ${character.en} ${character.group.ko} ${character.group.ja} ${character.group.en}`).includes(term)) return false;
    if (topic && !inTopic(character, topic)) return false;
    return !(filter.role || filter.stage !== null) || matchingAppearances(character.id, filter).length > 0;
  });
}

// These representative groups identify a specific catalog book, not a verified
// first appearance or a claim that every member is a principal character.
const bookGroupWorkIds: Record<string, string> = {
  '동방향림당': 'book-a25651d7162c',
  '동방삼월정': 'book-e9c222ac2afe',
  '동방맹월초': 'book-3cac6f6a7f4c',
  '동방자가선': 'book-6f0e94646a6d',
  '동방영나암': 'book-b036981ba92d',
  '동방지령기전': 'book-22a4c5f71f5c',
  '동방취접화': 'book-65450b4366e9',
};
// These labels identify books as a category but not one particular work.
const broadBookGroups: Record<string, true> = { '기타(서적)': true, '동방구문사기 / 동방구문구수': true };
const printworks = printworksSnapshot.characters as Record<string, Array<{ workId: string; sources: number[] }>>;
// The generated snapshot may omit this optional field.
const appearanceSnapshot = snapshot as typeof snapshot & { finalStageByWork?: Record<string, number> };
const finalStageByWork = appearanceSnapshot.finalStageByWork ?? {};

/** Find candidates; role and stage restrictions always refer to the same game appearance. */
export function filterGroupCharacters(query: string, filter: GroupCharacterFilter): ProfileCharacter[] {
  const term = normalizeCouplingSearch(query);
  const selectedWorks = new Set(filter.workIds);
  const scopeWorks = filter.scope === 'books'
    ? new Set(PROFILE_WORKS.filter(work => work.category === 'book').map(work => work.id))
    : new Set(filter.scope === 'all'
      ? games.map(work => work.id)
      : CHARACTER_TOPIC_BY_ID.get(filter.scope)?.workIds ?? []);
  const allowedWorks = new Set([...scopeWorks].filter(id => !selectedWorks.size || selectedWorks.has(id)));
  const hasAppearanceFilter = filter.roles.length > 0 || filter.stage !== null;

  return PROFILE_CHARACTERS.filter(character => {
    if (term && !normalizeCouplingSearch(`${character.ko} ${character.ja} ${character.en} ${character.group.ko} ${character.group.ja} ${character.group.en}`).includes(term)) return false;
    if (filter.scope === 'books') {
      if (hasAppearanceFilter) return false;
      const groupWorkId = bookGroupWorkIds[character.group.ko];
      return (printworks[character.id] ?? []).some(record => allowedWorks.has(record.workId))
        || (!!groupWorkId && allowedWorks.has(groupWorkId))
        || (!selectedWorks.size && !!broadBookGroups[character.group.ko]);
    }
    if (filter.scope === 'all' && !selectedWorks.size && !hasAppearanceFilter) return true;
    const records = allAppearances(character.id);
    if (hasAppearanceFilter) {
      return records.some(record => allowedWorks.has(record.workId)
        && (!filter.roles.length || filter.roles.some(role => role === 'enemy'
          ? ['boss', 'midboss', 'opponent'].includes(record.role)
          : role === record.role))
        && (filter.stage === null || record.stage === filter.stage
          || (typeof filter.stage === 'number' && record.stage === 'final' && finalStageByWork[record.workId] === filter.stage)));
    }
    return records.some(record => allowedWorks.has(record.workId))
      || gameTopics.some(topic => allowedWorks.has(topic.id) && topic.catalogGroupKeys.includes(character.group.ko));
  });
}
