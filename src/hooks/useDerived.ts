import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { CHARACTERS, getCharacter, spriteUrl } from '../data/characters';
import { SERIES } from '../data/series';
import { ACCT_TYPES } from '../data/accountTypes';
import { tr, type Messages, type Lang } from '../data/i18n';

/** FNV-1a 문자열 해시 → uint32 */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** uint32 시드 → [0,1) 결정론적 난수 */
function seeded(n: number): number {
  n = (n ^ 0x9e3779b9) >>> 0;
  n = Math.imul(n ^ (n >>> 15), 1 | n);
  n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
  return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
}

export interface Derived {
  nickname: string;
  profileImage: string | null;
  charName: string;
  charSrc: string;
  /** primary avatar src — profileImage if set, else charSrc */
  avatarSrc: string;
  /** whether the avatar is a user-uploaded photo (true) or a pixel sprite (false) */
  avatarIsPhoto: boolean;
  seriesList: { id: string; label: string }[];
  acctList: { id: string; label: string }[];
  fubLabel: string;
  partingLabel: string;
  otherLabel: string;
  dislike: string;
  pairing: string;
  freeText: string;
  /** 컨셉 전용 커스텀 입력값 raw map */
  custom: Record<string, string>;
  /** 커스텀 값을 읽되 비어있으면 fallback(자동값)을 반환 */
  getCustom: (key: string, fallback: string) => string;
  /** 랜덤 스탯 시드 (닉네임 ^ reroll). 같은 닉네임+reroll = 같은 값 */
  rollSeed: number;
  /** 시드 기반 결정론적 정수 [min,max]. salt로 스탯마다 다른 값 */
  rollInt: (salt: string, min: number, max: number) => number;
  /** 시드 기반 배열 선택 */
  rollPick: <T>(salt: string, arr: T[]) => T;
  t: Messages;
  lang: Lang;
}

export function useDerived(): Derived {
  const { state } = useFormState();
  const { t, lang } = useLang();
  const char = getCharacter(state.selectedChar) ?? CHARACTERS[0];

  const seriesList = Array.from(state.selectedSeries)
    .map((id) => SERIES.find((s) => s.id === id))
    .filter((s): s is (typeof SERIES)[number] => Boolean(s))
    .sort((a, b) => SERIES.indexOf(a) - SERIES.indexOf(b))
    .map((s) => ({
      id: s.id,
      label: (s.num ? `TH${s.num} ` : '') + tr(s, lang),
    }));

  const acctList = ACCT_TYPES.filter((a) => state.selectedAcct.has(a.id)).map((a) => ({
    id: a.id,
    label: tr(a, lang),
  }));

  const fubLabel = state.fub === 'free' ? t.free : t.r4r;
  const partingLabel =
    state.parting === 'unfollow' ? t.unfollow : state.parting === 'blockunfollow' ? t.blockunfollow : t.block;
  const otherLabel =
    state.otherGenre === 'none' ? t.none : state.otherGenre === 'sometimes' ? t.sometimes : t.often;

  const rollSeed = (hashStr(state.nickname || 'gensokyo') ^ Math.imul(state.reroll, 2654435761)) >>> 0;
  const rollInt = (salt: string, min: number, max: number) => {
    // rollSeed 와 salt 를 곱셈 해시로 충분히 섞어 salt 간 상관·좁은 범위 구간 편향 제거
    let h = Math.imul((rollSeed ^ hashStr(salt)) >>> 0, 2654435761);
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = (h ^ (h >>> 13)) >>> 0;
    const r = seeded(h);
    return min + Math.floor(r * (max - min + 1));
  };
  const rollPick = <T>(salt: string, arr: T[]): T => arr[rollInt(salt, 0, arr.length - 1)];

  return {
    nickname: state.nickname.trim() || t.nickFallback,
    profileImage: state.profileImage,
    charName: tr(char, lang),
    charSrc: spriteUrl(char.rel),
    avatarSrc: state.profileImage ?? spriteUrl(char.rel),
    avatarIsPhoto: Boolean(state.profileImage),
    seriesList,
    acctList,
    fubLabel,
    partingLabel,
    otherLabel,
    dislike: state.dislike.trim() || t.phDis,
    pairing: state.pairing.trim() || t.phPair,
    freeText: state.freeText.trim(),
    custom: state.custom,
    getCustom: (key, fallback) => {
      const v = state.custom[key]?.trim();
      return v ? v : fallback;
    },
    rollSeed,
    rollInt,
    rollPick,
    t,
    lang,
  };
}
