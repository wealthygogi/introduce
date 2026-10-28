import type { Lang } from '../../data/i18n';
import type { PreferenceId, RelationId } from './types';

export type Relation = { id: RelationId; color: string; symbol: string; label: Record<Lang, string> };
export const RELATIONS: Relation[] = [
  { id: 'love', label: { ko: '커플링', ja: 'カップリング', en: 'Pairing' }, color: '#a04d71', symbol: '♥' },
  { id: 'friend', label: { ko: '친구·가족', ja: '友人・家族', en: 'Friends / family' }, color: '#357d70', symbol: '∞' },
  { id: 'ally', label: { ko: '동료·동맹', ja: '仲間・同盟', en: 'Colleagues / allies' }, color: '#4c6d9a', symbol: '🤝' },
  { id: 'rival', label: { ko: '라이벌·앙숙', ja: 'ライバル・犬猿', en: 'Rivals / feuds' }, color: '#9a5a3f', symbol: '⚔' },
  { id: 'complex', label: { ko: '복잡·미정', ja: '複雑・未定', en: 'Complicated / unclear' }, color: '#a17532', symbol: '≈' },
];
export type PreferenceOption = { id: PreferenceId; color: string; symbol: string; label: Record<Lang, string> };
export const PREFERENCES: PreferenceOption[] = [
  { id: null, label: { ko: '표시 없음', ja: '表示なし', en: 'None' }, color: '#68737d', symbol: '—' },
  { id: 'favorite', label: { ko: '최애', ja: '推し', en: 'Favorite' }, color: '#7852a5', symbol: '✦' },
  { id: 'avoid', label: { ko: '취향 아님', ja: '苦手', en: 'Not for me' }, color: '#687b98', symbol: '×' },
];
export const PREFERENCE_BY_ID = new Map(PREFERENCES.map(preference => [preference.id, preference]));
export const isPreferenceId = (value: unknown): value is PreferenceId => value === null || value === 'favorite' || value === 'avoid';
export const RELATION_BY_ID = new Map(RELATIONS.map(relation => [relation.id, relation]));
export const isRelationId = (value: unknown): value is RelationId => typeof value === 'string' && RELATION_BY_ID.has(value as RelationId);
export const normalizeCouplingSearch = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
