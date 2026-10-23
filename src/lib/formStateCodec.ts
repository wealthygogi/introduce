/**
 * 폼 상태 직렬화 · 영속화 · 공유 링크 코덱.
 *
 * - localStorage: 새로고침해도 입력이 유지되도록 전체 상태(업로드 사진 포함)를 저장.
 * - 공유 링크(?c=...): 상태를 base64url 로 인코딩해 URL 에 담는다. 단, 업로드 사진
 *   (data URL)은 용량이 커서 URL 에 넣지 않는다(공유받은 쪽은 사진만 빠진 채 복원).
 *
 * deserialize 는 외부(수정된 URL·구버전 저장값)에서 온 값을 신뢰하지 않고 키/타입/열거값을
 * 모두 검증한 뒤 defaultState 위에 병합한다.
 */
import { defaultState, type FormState, type FubChoice, type PartingChoice, type OtherGenreChoice } from '../contexts/FormStateContext';
import { SOCIAL_PLATFORMS } from './socialAccount';
import type { Lang } from '../data/i18n';
import { migrateProfileSelections } from '../data/profileCatalog';

const STORAGE_KEY = 'introduce:form:v2';
const LEGACY_STORAGE_KEY = 'introduce:form';
const SHARE_PARAM = 'c';

// The common fields retain Compact's input limits; Wide keeps independent, longer values.
const CAP = {
  nickname: 10,
  dislike: 40,
  pairing: 40,
  freeText: 120,
  wideDislike: 400,
  widePairing: 400,
  wideFreeText: 1200,
  customVal: 40,
  wideCustomVal: 400,
  socialAccount: 300,
};

const FUB: FubChoice[] = ['free', 'r4r'];
const PARTING: PartingChoice[] = ['unfollow', 'blockunfollow', 'block'];
const OTHER: OtherGenreChoice[] = ['none', 'sometimes', 'often'];
const SOCIAL: FormState['socialPlatform'][] = ['none', ...SOCIAL_PLATFORMS];

interface FormStatePlain {
  nickname?: unknown;
  profileImage?: unknown;
  selectedChar?: unknown;
  selectedSeries?: unknown;
  selectedAcct?: unknown;
  rankedCharacters?: unknown;
  favoriteWorks?: unknown;
  fub?: unknown;
  parting?: unknown;
  otherGenre?: unknown;
  dislike?: unknown;
  pairing?: unknown;
  freeText?: unknown;
  socialPlatform?: unknown;
  socialAccount?: unknown;
  custom?: unknown;
  reroll?: unknown;
}

const str = (v: unknown, fb: string, cap: number): string =>
  typeof v === 'string' ? v.slice(0, cap) : fb;
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const oneOf = <T extends string>(v: unknown, allowed: T[], fb: T): T =>
  typeof v === 'string' && (allowed as string[]).includes(v) ? (v as T) : fb;

/** state → 순수 객체. includeImage=false 면 사진을 뺀다(공유 링크용). */
function toPlain(state: FormState, includeImage: boolean): Record<string, unknown> {
  return {
    nickname: state.nickname,
    ...(includeImage ? { profileImage: state.profileImage } : {}),
    selectedChar: state.selectedChar,
    selectedSeries: [...state.selectedSeries],
    selectedAcct: [...state.selectedAcct],
    rankedCharacters: state.rankedCharacters,
    favoriteWorks: state.favoriteWorks,
    fub: state.fub,
    parting: state.parting,
    otherGenre: state.otherGenre,
    dislike: state.dislike,
    pairing: state.pairing,
    freeText: state.freeText,
    socialPlatform: state.socialPlatform,
    socialAccount: state.socialAccount.slice(0, CAP.socialAccount),
    custom: state.custom,
    reroll: state.reroll,
  };
}

/** 순수 객체(신뢰 불가) → 검증된 FormState. */
function fromPlain(p: FormStatePlain): FormState {
  const selectedChar = str(p.selectedChar, defaultState.selectedChar, 64);
  const selectedSeries = Array.isArray(p.selectedSeries) ? new Set(strArr(p.selectedSeries)) : new Set(defaultState.selectedSeries);
  const incomingCustom = p.custom && typeof p.custom === 'object'
    ? p.custom as Record<string, unknown>
    : {};
  const custom: Record<string, string> = {
    ...defaultState.custom,
  };
  for (const [k, v] of Object.entries(incomingCustom)) {
    if (typeof v !== 'string') continue;
    const cap = k === 'wide:dislike' ? CAP.wideDislike
      : k === 'wide:pairing' ? CAP.widePairing
      : k === 'wide:freeText' ? CAP.wideFreeText
      : k.startsWith('wide:') ? CAP.wideCustomVal
      : CAP.customVal;
    custom[k] = v.slice(0, cap);
  }
  const hasCustomKey = (key: string) => Object.prototype.hasOwnProperty.call(incomingCustom, key);
  if (!hasCustomKey('wide:dislike')) custom['wide:dislike'] = str(p.dislike, '', CAP.wideDislike);
  if (!hasCustomKey('wide:pairing')) custom['wide:pairing'] = str(p.pairing, '', CAP.widePairing);
  if (!hasCustomKey('wide:freeText')) custom['wide:freeText'] = str(p.freeText, '', CAP.wideFreeText);
  const selections = migrateProfileSelections({
    ...('rankedCharacters' in p ? { rankedCharacters: p.rankedCharacters } : {}),
    ...('favoriteWorks' in p ? { favoriteWorks: p.favoriteWorks } : {}),
    selectedChar, selectedSeries, custom,
  });
  if (selections.needsReview) custom['wide:selectionReview'] = '1';
  return {
    nickname: str(p.nickname, defaultState.nickname, CAP.nickname),
    profileImage: typeof p.profileImage === 'string' ? p.profileImage : null,
    selectedChar,
    selectedSeries,
    rankedCharacters: selections.rankedCharacters,
    favoriteWorks: selections.favoriteWorks,
    selectedAcct: Array.isArray(p.selectedAcct)
      ? new Set(strArr(p.selectedAcct))
      : new Set(defaultState.selectedAcct),
    fub: oneOf(p.fub, FUB, defaultState.fub),
    parting: oneOf(p.parting, PARTING, defaultState.parting),
    otherGenre: oneOf(p.otherGenre, OTHER, defaultState.otherGenre),
    dislike: str(p.dislike, '', CAP.dislike),
    pairing: str(p.pairing, '', CAP.pairing),
    freeText: str(p.freeText, '', CAP.freeText),
    socialPlatform: oneOf(p.socialPlatform, SOCIAL, defaultState.socialPlatform),
    socialAccount: str(p.socialAccount, '', CAP.socialAccount),
    custom,
    reroll: typeof p.reroll === 'number' && Number.isFinite(p.reroll) ? p.reroll >>> 0 : 0,
  };
}

// ── base64url (유니코드 안전) ─────────────────────────────────
function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── 공유 링크 (압축) ─────────────────────────────────────────
// URL 을 짧게 유지하려고 (1) 기본값과 같은 필드는 생략하고 (2) 키를 한 글자로 축약한다.
// 사진(profileImage)은 용량 때문에 애초에 포함하지 않는다.
const setEq = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((x) => b.has(x));

/** state → 단축키 + 비(非)기본값만 담은 객체. */
function toCompact(state: FormState): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  o.k = state.rankedCharacters;
  o.w = state.favoriteWorks;
  if (state.nickname !== defaultState.nickname) o.n = state.nickname;
  if (state.selectedChar !== defaultState.selectedChar) o.c = state.selectedChar;
  if (!setEq(state.selectedSeries, defaultState.selectedSeries)) o.s = [...state.selectedSeries];
  if (!setEq(state.selectedAcct, defaultState.selectedAcct)) o.a = [...state.selectedAcct];
  if (state.fub !== defaultState.fub) o.f = state.fub;
  if (state.parting !== defaultState.parting) o.p = state.parting;
  if (state.otherGenre !== defaultState.otherGenre) o.o = state.otherGenre;
  if (state.dislike) o.d = state.dislike.slice(0, CAP.dislike);
  if (state.pairing) o.g = state.pairing.slice(0, CAP.pairing);
  if (state.freeText) o.t = state.freeText.slice(0, CAP.freeText);
  if (state.socialPlatform !== defaultState.socialPlatform) o.q = state.socialPlatform;
  if (state.socialAccount) o.h = state.socialAccount.slice(0, CAP.socialAccount);
  if (Object.keys(state.custom).length) o.u = state.custom;
  if (state.reroll) o.r = state.reroll;
  return o;
}

/** 단축키 객체(신뢰 불가) → 검증된 FormState (없는 필드는 기본값). */
function fromCompact(o: Record<string, unknown>): FormState {
  return fromPlain({
    nickname: o.n,
    profileImage: null,
    selectedChar: o.c,
    selectedSeries: o.s,
    selectedAcct: o.a,
    ...('k' in o ? { rankedCharacters: o.k } : {}),
    ...('w' in o ? { favoriteWorks: o.w } : {}),
    fub: o.f,
    parting: o.p,
    otherGenre: o.o,
    dislike: o.d,
    pairing: o.g,
    freeText: o.t,
    socialPlatform: o.q,
    socialAccount: o.h,
    custom: o.u,
    reroll: o.r,
  });
}

export function encodeShareParam(state: FormState): string {
  return b64urlEncode(JSON.stringify(toCompact(state)));
}
export function decodeShareParam(param: string): FormState | null {
  try {
    const o = JSON.parse(b64urlDecode(param));
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    return fromCompact(o as Record<string, unknown>);
  } catch {
    return null;
  }
}
/** 현재 상태를 담은 절대 공유 URL(사진 제외). */
export function buildShareUrl(state: FormState, lang: Lang): string {
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_PARAM, encodeShareParam(state));
  url.searchParams.set('lang', lang);
  return url.toString();
}

// ── localStorage ─────────────────────────────────────────────
export function saveToStorage(state: FormState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPlain(state, true)));
  } catch {
    // Keep a recoverable legacy photo draft when duplicating it exceeds storage quota.
    let preserveLegacyPhoto = false;
    try {
      if (state.profileImage && window.localStorage.getItem(STORAGE_KEY) === null) {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const legacyDraft = JSON.parse(legacy) as FormStatePlain;
          preserveLegacyPhoto = typeof legacyDraft.profileImage === 'string';
        }
      }
    } catch {
      // If storage cannot be inspected, retain the existing no-image fallback.
    }
    if (preserveLegacyPhoto) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPlain(state, false)));
    } catch {
      /* Storage full; the current session remains usable. */
    }
  }
}
function loadFromStorage(): FormState | null {
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw === null) return null;
    return fromPlain(JSON.parse(raw) as FormStatePlain);
  } catch {
    return null;
  }
}

/**
 * 초기 상태 결정: 공유 링크(?c=) > localStorage > 기본값.
 *
 * 순수 함수로 유지한다(useState 초기화 함수에서 호출됨 → React StrictMode 가 두 번
 * 호출해도 같은 값을 반환해야 한다). URL 정리는 부수효과이므로 stripShareParam() 으로
 * 분리해 마운트 후 useEffect 에서 호출한다.
 */
export function loadInitialState(): FormState {
  if (typeof window === 'undefined') return defaultState;
  const c = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  if (c) {
    const decoded = decodeShareParam(c);
    if (decoded) return decoded;
  }
  return loadFromStorage() ?? defaultState;
}

/**
 * 공유 링크를 적용한 뒤 URL 에서 ?c= 를 제거한다(이후 편집/저장이 자연스럽게 이어지고
 * 주소창에 낡은 상태가 남지 않도록). 경로는 그대로라 라우터에는 영향이 없고, 여러 번
 * 호출해도(StrictMode) 두 번째부터는 no-op 이라 안전하다.
 */
export function stripShareParam(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has(SHARE_PARAM)) return;
  params.delete(SHARE_PARAM);
  params.delete('lang');
  const q = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
}
