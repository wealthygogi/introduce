import assert from 'node:assert/strict';
import { LIMITS } from '../../src/data/limits';
import { SERIES } from '../../src/data/series';
import { ACCT_TYPES } from '../../src/data/accountTypes';

export type Lang = 'ko' | 'ja' | 'en';

export const NEW_IDS = 'pqrstuvwxy'.split('');
/** /introduce/v1/ 아카이브로 넘기는 v1 컨셉 id */
export const V1_IDS = 'abcdefghijklmno'.split('');
/** 프리셋 B(사진 중심) 컨셉 — 칩 상한이 다르다 */
export const PRESET_B_IDS = ['u', 'y'];

export const ALL_SERIES = SERIES.map((s) => s.id);
export const ALL_ACCT = ACCT_TYPES.map((a) => a.id);

/** localStorage 'introduce:form' 에 넣는 평문 상태(formStateCodec.toPlain 형식) */
export interface PlainState {
  nickname: string;
  selectedChar: string;
  selectedSeries: string[];
  selectedAcct: string[];
  fub: 'free' | 'r4r';
  parting: 'unfollow' | 'blockunfollow' | 'block';
  otherGenre: 'none' | 'sometimes' | 'often';
  dislike: string;
  pairing: string;
  freeText: string;
  custom: Record<string, string>;
  reroll: number;
  profileImage?: string | null;
}

/** s 를 반복해 정확히 n 글자(코드포인트)로 만든다 */
const rep = (s: string, n: number) => [...s.repeat(Math.ceil(n / [...s].length))].slice(0, n).join('');

const full: PlainState = {
  nickname: '샤메이마루',
  selectedChar: 'marisa',
  selectedSeries: ['th6', 'th7', 'th8'],
  selectedAcct: ['daily', 'drawing'],
  fub: 'free',
  parting: 'unfollow',
  otherGenre: 'sometimes',
  dislike: '지각',
  pairing: '다 좋아요',
  freeText: '비계/부계 @sanaisanae\n환상향에서 뉴스를 씁니다',
  custom: { handle: '@aya_news' },
  reroll: 0,
};

export const SCENARIOS: Record<'full' | 'long' | 'edge' | 'ja' | 'en', PlainState> = {
  full,
  long: {
    ...full,
    nickname: rep('샤메이마루아야쨩', LIMITS.nickname),
    selectedSeries: ALL_SERIES,
    selectedAcct: ALL_ACCT,
    dislike: rep('약속에 늦는 사람 답장 느린 사람 ', LIMITS.dislike),
    pairing: rep('레이무X마리사 사나에X스와코 ', LIMITS.pairing),
    freeText: rep('안녕하세요! 동방 좋아하는 트친소 왔습니다. 그림 그리고 글도 써요. ', LIMITS.freeText),
  },
  edge: {
    ...full,
    nickname: 'Wealthygog',
    dislike: rep('a', LIMITS.dislike),
    pairing: 'https://twitter.com/some_long_handle_123',
    freeText: rep('ReallyLongUnbreakableWord_1234567890_ABCDEFGHIJKLMNOPQRSTUV ★☆♥♪✿ @mention #hashtag ', LIMITS.freeText),
  },
  ja: { ...full, nickname: '射命丸文', dislike: '遅刻', pairing: '全部好き', freeText: '幻想郷でニュースを書いています。よろしくお願いします。' },
  en: { ...full, nickname: 'Aya Shamei', dislike: 'Being late', pairing: 'Anything goes', freeText: 'Writing news from Gensokyo. Nice to meet you!' },
};

export const EMPTY: PlainState = {
  nickname: '',
  selectedChar: 'reimu',
  selectedSeries: ['th6', 'th7', 'th8'],
  selectedAcct: ['daily', 'drawing'],
  fub: 'free',
  parting: 'unfollow',
  otherGenre: 'sometimes',
  dislike: '',
  pairing: '',
  freeText: '',
  custom: {},
  reroll: 0,
};

/** characters.ts 는 import.meta.env 를 써서 Node 에서 import 불가 → 표시명 상수 */
export const CHAR_NAME: Record<'marisa' | 'reimu', Record<Lang, string>> = {
  marisa: { ko: '키리사메 마리사', ja: '霧雨魔理沙', en: 'Marisa Kirisame' },
  reimu: { ko: '하쿠레이 레이무', ja: '博麗霊夢', en: 'Reimu Hakurei' },
};

// fixtures 자가 검증: 모든 텍스트가 입력 상한 이내여야 테스트가 앱의 잘림과 섞이지 않는다.
for (const s of [...Object.values(SCENARIOS), EMPTY]) {
  for (const k of ['nickname', 'dislike', 'pairing', 'freeText'] as const) {
    assert.ok([...s[k]].length <= LIMITS[k], `fixture ${k} exceeds LIMITS.${k}`);
  }
}
assert.equal([...SCENARIOS.long.nickname].length, LIMITS.nickname);
assert.equal([...SCENARIOS.long.freeText].length, LIMITS.freeText);
