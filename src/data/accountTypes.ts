import type { Lang } from './i18n';

export type AccountType = {
  id: string;
} & Record<Lang, string>;

export const ACCT_TYPES: AccountType[] = [
  { id: 'daily', ko: '일상', ja: '日常', en: 'Daily' },
  { id: 'drawing', ko: '그림', ja: '絵', en: 'Drawing' },
  { id: 'game', ko: '게임', ja: 'ゲーム', en: 'Gaming' },
  { id: 'story', ko: '썰', ja: 'ネタ', en: 'Story' },
  { id: 'consume', ko: '소비', ja: '消費', en: 'Shopping' },
  { id: 'sub', ko: '구독', ja: '購読', en: 'Following' },
  { id: 'cos', ko: '코스', ja: 'コスプレ', en: 'Cosplay' },
  { id: 'rt', ko: 'RT', ja: 'RT', en: 'RT' },
  { id: 'like', ko: '마음', ja: 'いいね', en: 'Likes' },
  { id: 'chat', ko: '탐라대화', ja: 'TL会話', en: 'TL Chat' },
  { id: 'fan', ko: '앓이', ja: '推し活', en: 'Fangirling' },
];
