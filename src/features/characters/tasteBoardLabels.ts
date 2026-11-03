import { PROFILE_WORK_BY_ID } from '../../data/profileCatalog';
import { tr, type Lang } from '../../data/i18n';
import { CHARACTER_TOPIC_BY_ID } from './characterCategories';
import type { TasteBoard, TasteGroup, TasteGroupTitlePreset, TasteSlot } from './tasteBoardTypes';

export type ResolvedTasteText = { text: string; automatic: boolean };

const boardTitles: Record<Lang, string> = {
  ko: '내 캐릭터 취향',
  ja: 'お気に入りのキャラクター',
  en: 'My favorite characters',
};
const favoriteTitles: Record<Lang, string> = {
  ko: '작품별 최애',
  ja: '作品別の推し',
  en: 'Favorites by work',
};
const collectionTitles: Record<Lang, string> = {
  ko: '내 그룹',
  ja: 'マイグループ',
  en: 'My group',
};
const legacyFavoriteTitles = ['작품별 최애', '作品別の推し', 'Favorites by work'];
const legacyCollectionTitles = [...Object.values(collectionTitles), 'Favorites'];

export function getTasteGroupDefaultTitle(preset: TasteGroupTitlePreset, lang: Lang): string {
  if (preset.kind === 'favorites') return tr(favoriteTitles, lang);
  const base = tr(collectionTitles, lang);
  return preset.kind === 'free' ? `${base} ${preset.number}` : base;
}

function inferredGroupPreset(title: string): TasteGroupTitlePreset | null {
  if (legacyFavoriteTitles.includes(title)) return { kind: 'favorites' };
  if (legacyCollectionTitles.includes(title)) return { kind: 'collection' };
  for (const base of Object.values(collectionTitles)) {
    const suffix = title.startsWith(`${base} `) ? title.slice(base.length + 1) : '';
    if (!/^[1-9][0-9]*$/.test(suffix)) continue;
    const number = Number(suffix);
    if (Number.isSafeInteger(number)) return { kind: 'free', number };
  }
  return null;
}

export function resolveTasteBoardTitle(board: TasteBoard, lang: Lang): ResolvedTasteText {
  const automatic = board.titleSource === 'auto' || (board.titleSource === undefined && Object.values(boardTitles).includes(board.title));
  return { text: automatic ? tr(boardTitles, lang) : board.title, automatic };
}

export function resolveTasteGroupTitle(group: TasteGroup, lang: Lang, ordinal: number): ResolvedTasteText & { preset: TasteGroupTitlePreset } {
  const inferred = group.titlePreset ?? inferredGroupPreset(group.title) ?? { kind: 'free' as const, number: ordinal };
  const automatic = group.titleSource === 'auto' || (group.titleSource === undefined && inferredGroupPreset(group.title) !== null);
  return { text: automatic ? getTasteGroupDefaultTitle(inferred, lang) : group.title, automatic, preset: inferred };
}

export function resolveTasteSlotLabel(slot: TasteSlot, lang: Lang): ResolvedTasteText & { canReset: boolean } {
  const topic = slot.topicId ? CHARACTER_TOPIC_BY_ID.get(slot.topicId) : undefined;
  if (!topic) return { text: slot.label, automatic: false, canReset: false };
  const knownLabel = Object.values(topic.label).includes(slot.label);
  const automatic = slot.labelSource === 'topic' || (slot.labelSource === undefined && knownLabel);
  return { text: automatic ? tr(topic.label, lang) : slot.label, automatic, canReset: !automatic };
}

export function formatTasteVersion(workId: string, lang: Lang): string {
  const suffix: Record<Lang, string> = { ko: '버전', ja: 'バージョン', en: 'version' };
  return `${PROFILE_WORK_BY_ID.get(workId)?.[lang] ?? workId} ${tr(suffix, lang)}`;
}
