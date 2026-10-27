import type { Lang } from '../../data/i18n';
import type { RelationId } from './types';

export type Relation = { id: RelationId; color: string; symbol: string; label: Record<Lang, string> };
export const RELATIONS: Relation[] = [
  { id: 'love', label: { ko: '커플링', ja: 'カップリング', en: 'Pairing' }, color: '#a04d71', symbol: '♥' },
  { id: 'favorite', label: { ko: '최애 커플링', ja: '推しカップリング', en: 'Favorite pairing' }, color: '#7852a5', symbol: '✦' },
  { id: 'friend', label: { ko: '친구·가족', ja: '友人・家族', en: 'Friends / family' }, color: '#357d70', symbol: '∞' },
  { id: 'complex', label: { ko: '복잡한 관계', ja: '複雑な関係', en: 'Complicated' }, color: '#a17532', symbol: '≈' },
  { id: 'avoid', label: { ko: '취향 아님', ja: '苦手', en: 'Not for me' }, color: '#687b98', symbol: '×' },
];
export const RELATION_BY_ID = new Map(RELATIONS.map(relation => [relation.id, relation]));
export const isRelationId = (value: unknown): value is RelationId => typeof value === 'string' && RELATION_BY_ID.has(value as RelationId);
export const normalizeCouplingSearch = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
