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

const STORAGE_KEY = 'introduce:form';
const SHARE_PARAM = 'c';

// 붙여넣기 URL 남용 방지용 느슨한 상한(정상 입력은 넉넉히 통과).
const CAP = { nickname: 40, dislike: 400, pairing: 400, freeText: 1200, customVal: 400 };

const FUB: FubChoice[] = ['free', 'r4r'];
const PARTING: PartingChoice[] = ['unfollow', 'blockunfollow', 'block'];
const OTHER: OtherGenreChoice[] = ['none', 'sometimes', 'often'];

interface FormStatePlain {
  nickname?: unknown;
  profileImage?: unknown;
  selectedChar?: unknown;
  selectedSeries?: unknown;
  selectedAcct?: unknown;
  fub?: unknown;
  parting?: unknown;
  otherGenre?: unknown;
  dislike?: unknown;
  pairing?: unknown;
  freeText?: unknown;
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
    fub: state.fub,
    parting: state.parting,
    otherGenre: state.otherGenre,
    dislike: state.dislike,
    pairing: state.pairing,
    freeText: state.freeText,
    custom: state.custom,
    reroll: state.reroll,
  };
}

/** 순수 객체(신뢰 불가) → 검증된 FormState. */
function fromPlain(p: FormStatePlain): FormState {
  const custom: Record<string, string> = {};
  if (p.custom && typeof p.custom === 'object') {
    for (const [k, v] of Object.entries(p.custom as Record<string, unknown>)) {
      if (typeof v === 'string') custom[k] = v.slice(0, CAP.customVal);
    }
  }
  return {
    nickname: str(p.nickname, defaultState.nickname, CAP.nickname),
    profileImage: typeof p.profileImage === 'string' ? p.profileImage : null,
    selectedChar: str(p.selectedChar, defaultState.selectedChar, 64),
    selectedSeries: Array.isArray(p.selectedSeries)
      ? new Set(strArr(p.selectedSeries))
      : new Set(defaultState.selectedSeries),
    selectedAcct: Array.isArray(p.selectedAcct)
      ? new Set(strArr(p.selectedAcct))
      : new Set(defaultState.selectedAcct),
    fub: oneOf(p.fub, FUB, defaultState.fub),
    parting: oneOf(p.parting, PARTING, defaultState.parting),
    otherGenre: oneOf(p.otherGenre, OTHER, defaultState.otherGenre),
    dislike: str(p.dislike, '', CAP.dislike),
    pairing: str(p.pairing, '', CAP.pairing),
    freeText: str(p.freeText, '', CAP.freeText),
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
  if (state.nickname !== defaultState.nickname) o.n = state.nickname;
  if (state.selectedChar !== defaultState.selectedChar) o.c = state.selectedChar;
  if (!setEq(state.selectedSeries, defaultState.selectedSeries)) o.s = [...state.selectedSeries];
  if (!setEq(state.selectedAcct, defaultState.selectedAcct)) o.a = [...state.selectedAcct];
  if (state.fub !== defaultState.fub) o.f = state.fub;
  if (state.parting !== defaultState.parting) o.p = state.parting;
  if (state.otherGenre !== defaultState.otherGenre) o.o = state.otherGenre;
  if (state.dislike) o.d = state.dislike;
  if (state.pairing) o.g = state.pairing;
  if (state.freeText) o.t = state.freeText;
  if (Object.keys(state.custom).length) o.u = state.custom;
  if (state.reroll) o.r = state.reroll;
  return o;
}

/** 단축키 객체(신뢰 불가) → 검증된 FormState (없는 필드는 기본값). */
function fromCompact(o: Record<string, unknown>): FormState {
  const custom: Record<string, string> = {};
  if (o.u && typeof o.u === 'object') {
    for (const [k, v] of Object.entries(o.u as Record<string, unknown>)) {
      if (typeof v === 'string') custom[k] = v.slice(0, CAP.customVal);
    }
  }
  return {
    nickname: 'n' in o ? str(o.n, defaultState.nickname, CAP.nickname) : defaultState.nickname,
    profileImage: null, // 공유 링크에는 사진이 없다
    selectedChar: 'c' in o ? str(o.c, defaultState.selectedChar, 64) : defaultState.selectedChar,
    selectedSeries: Array.isArray(o.s) ? new Set(strArr(o.s)) : new Set(defaultState.selectedSeries),
    selectedAcct: Array.isArray(o.a) ? new Set(strArr(o.a)) : new Set(defaultState.selectedAcct),
    fub: 'f' in o ? oneOf(o.f, FUB, defaultState.fub) : defaultState.fub,
    parting: 'p' in o ? oneOf(o.p, PARTING, defaultState.parting) : defaultState.parting,
    otherGenre: 'o' in o ? oneOf(o.o, OTHER, defaultState.otherGenre) : defaultState.otherGenre,
    dislike: str(o.d, '', CAP.dislike),
    pairing: str(o.g, '', CAP.pairing),
    freeText: str(o.t, '', CAP.freeText),
    custom,
    reroll: typeof o.r === 'number' && Number.isFinite(o.r) ? o.r >>> 0 : 0,
  };
}

export function encodeShareParam(state: FormState): string {
  return b64urlEncode(JSON.stringify(toCompact(state)));
}
export function decodeShareParam(param: string): FormState | null {
  try {
    const o = JSON.parse(b64urlDecode(param));
    if (!o || typeof o !== 'object') return null;
    return fromCompact(o as Record<string, unknown>);
  } catch {
    return null;
  }
}
/** 현재 상태를 담은 절대 공유 URL(사진 제외). */
export function buildShareUrl(state: FormState): string {
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_PARAM, encodeShareParam(state));
  return url.toString();
}

// ── localStorage ─────────────────────────────────────────────
export function saveToStorage(state: FormState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPlain(state, true)));
  } catch {
    // 용량 초과(대개 업로드 사진) 시 사진 없이라도 저장 시도.
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPlain(state, false)));
    } catch {
      /* 저장 포기 — 세션 내 동작에는 영향 없음 */
    }
  }
}
function loadFromStorage(): FormState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
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
  const q = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
}
