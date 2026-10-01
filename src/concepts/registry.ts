import type { ComponentType } from 'react';
import type { Messages, Lang } from '../data/i18n';
import ConceptA from './ConceptA';
import ConceptB from './ConceptB';
import ConceptC from './ConceptC';
import ConceptD from './ConceptD';
import ConceptE from './ConceptE';
import ConceptF from './ConceptF';
import ConceptG from './ConceptG';
import ConceptH from './ConceptH';
import ConceptI from './ConceptI';
import ConceptJ from './ConceptJ';
import ConceptK from './ConceptK';
import ConceptL from './ConceptL';
import ConceptM from './ConceptM';
import ConceptN from './ConceptN';
import ConceptO from './ConceptO';
import ConceptP from './ConceptP';
import ConceptQ from './ConceptQ';
import ConceptR from './ConceptR';
import ConceptS from './ConceptS';
import ConceptT from './ConceptT';
import ConceptU from './ConceptU';
import ConceptV from './ConceptV';
import ConceptW from './ConceptW';
import ConceptX from './ConceptX';
import ConceptY from './ConceptY';

/**
 * 컨셉 전용 커스텀 입력 필드 정의.
 * 값은 FormState.custom[key] 에 저장되고, 비어 있으면 각 컨셉 tsx 가 넘기는
 * 자동값(useDerived().getCustom(key, fallback))이 대신 쓰인다.
 * placeholder 는 그 자동/예시값 힌트(언어 무관).
 */
export interface CustomFieldDef {
  key: string;
  label: Record<Lang, string>;
  placeholder: string;
  maxLength?: number;
}

export interface CaptureOptions {
  /** 캡처 래퍼 여백(px). 포토카드는 0 → PNG 가 카드와 정확히 일치 */
  padding: number;
  /** domToBlob scale. 360px 카드 ×3 = 1080px */
  scale: number;
}

export interface ConceptDef {
  id: string;
  /** lookup function for localized display name */
  name: (t: Messages) => string;
  desc: (t: Messages) => string;
  /** filename slug used when downloading */
  slug: string;
  /** path to a representative sprite, relative to BASE_URL + 'Touhou 16x16 Mini Pack Full/' */
  sprite: string;
  /** preview thumbnail label (short Latin/decorative tag) */
  tag: string;
  Component: ComponentType;
  /** 이 컨셉 전용 커스텀 입력 필드(선택). FormPanel 이 렌더한다. */
  customFields?: CustomFieldDef[];
  /** 랜덤 스탯(닉네임 시드 + 다시뽑기)을 쓰는 컨셉이면 true → 프리뷰 툴바에 🎲 버튼 표시 */
  hasRandomStats?: boolean;
  /** 카드 레이아웃 폭(CSS px). useCardScale 기준 폭 · .card-scaler --card-w */
  cardWidth: number;
  capture: CaptureOptions;
  /** true 면 랜딩 그리드에서 숨기고 ConceptPage 에 구버전 배너 표시 */
  legacy?: true;
}

const LEGACY = { cardWidth: 640, capture: { padding: 48, scale: 2 }, legacy: true } as const;
const PHOTOCARD = { cardWidth: 360, capture: { padding: 0, scale: 3 } } as const;

export const CONCEPTS: ConceptDef[] = [
  {
    ...LEGACY,
    id: 'a',
    name: (t) => t.conceptA,
    desc: (t) => t.conceptADesc,
    slug: 'rpg-status',
    sprite: '4. Other/[1] Main Characters/Reimu Hakurei.png',
    tag: 'PLAYER STATS',
    Component: ConceptA,
    hasRandomStats: true,
    customFields: [
      { key: 'level', label: { ko: '레벨', ja: 'レベル', en: 'Level' }, placeholder: '28', maxLength: 3 },
    ],
  },
  {
    ...LEGACY,
    id: 'b',
    name: (t) => t.conceptB,
    desc: (t) => t.conceptBDesc,
    slug: 'spell-card',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png',
    tag: 'SPELL CARD',
    Component: ConceptB,
    hasRandomStats: true,
    customFields: [
      { key: 'difficulty', label: { ko: '난이도 (별 1~5)', ja: '難易度 (星 1~5)', en: 'Difficulty (1-5)' }, placeholder: '3', maxLength: 1 },
    ],
  },
  {
    ...LEGACY,
    id: 'c',
    name: (t) => t.conceptC,
    desc: (t) => t.conceptCDesc,
    slug: 'title-screen',
    sprite: '4. Other/[1] Main Characters/Marisa Kirisame.png',
    tag: 'TITLE',
    Component: ConceptC,
    customFields: [
      { key: 'version', label: { ko: '버전', ja: 'バージョン', en: 'Version' }, placeholder: '1.00', maxLength: 6 },
    ],
  },
  {
    ...LEGACY,
    id: 'd',
    name: (t) => t.conceptD,
    desc: (t) => t.conceptDDesc,
    slug: 'dialogue',
    sprite: '1. Mainline Games/[11] Chireiden ~ Subterranean Animism/Satori Komeiji.png',
    tag: 'DIALOGUE',
    Component: ConceptD,
  },
  {
    ...LEGACY,
    id: 'e',
    name: (t) => t.conceptE,
    desc: (t) => t.conceptEDesc,
    slug: 'config-menu',
    sprite: '1. Mainline Games/[10] Fuujinroku ~ Mountain of faith/Sanae Kochiya.png',
    tag: 'CONFIG',
    Component: ConceptE,
    customFields: [
      { key: 'version', label: { ko: '버전', ja: 'バージョン', en: 'Version' }, placeholder: '2026', maxLength: 8 },
    ],
  },
  {
    ...LEGACY,
    id: 'f',
    name: (t) => t.conceptF,
    desc: (t) => t.conceptFDesc,
    slug: 'newspaper',
    sprite: '1. Mainline Games/[9] Kaeizuka ~ Phantasmagoria of Flower View/Aya Shameimaru.png',
    tag: 'NEWS',
    Component: ConceptF,
    hasRandomStats: true,
    customFields: [
      { key: 'issueNo', label: { ko: '호수', ja: '号数', en: 'Issue No.' }, placeholder: '42', maxLength: 5 },
    ],
  },
  {
    ...LEGACY,
    id: 'g',
    name: (t) => t.conceptG,
    desc: (t) => t.conceptGDesc,
    slug: 'fortune',
    sprite: '4. Other/[1] Main Characters/Reimu Hakurei.png',
    tag: 'FORTUNE',
    Component: ConceptG,
    hasRandomStats: true,
    customFields: [
      { key: 'rank', label: { ko: '운세 등급', ja: '運勢', en: 'Fortune' }, placeholder: '大吉', maxLength: 4 },
      { key: 'lotNo', label: { ko: '제비 번호', ja: '籤番号', en: 'Lot No.' }, placeholder: '15', maxLength: 4 },
    ],
  },
  {
    ...LEGACY,
    id: 'h',
    name: (t) => t.conceptH,
    desc: (t) => t.conceptHDesc,
    slug: 'prescription',
    sprite: '1. Mainline Games/[8] Eiyashou ~ Imperishable Night/Eirin Yagokoro.png',
    tag: 'Rx',
    Component: ConceptH,
    hasRandomStats: true,
    customFields: [
      { key: 'devotion', label: { ko: '충성도 %', ja: '献身度 %', en: 'Devotion %' }, placeholder: '100', maxLength: 3 },
    ],
  },
  {
    ...LEGACY,
    id: 'i',
    name: (t) => t.conceptI,
    desc: (t) => t.conceptIDesc,
    slug: 'circle',
    sprite: '1. Mainline Games/[7] Youyoumu ~ Perfect Cherry Blossom/Alice Margatroid.png',
    tag: 'CIRCLE',
    Component: ConceptI,
    hasRandomStats: true,
    customFields: [
      { key: 'space', label: { ko: '스페이스 번호', ja: 'スペース番号', en: 'Space No.' }, placeholder: '南-27a', maxLength: 8 },
    ],
  },
  {
    ...LEGACY,
    id: 'j',
    name: (t) => t.conceptJ,
    desc: (t) => t.conceptJDesc,
    slug: 'pc98',
    sprite: '4. Other/[1] Main Characters/Marisa Kirisame.png',
    tag: 'PC-9801',
    Component: ConceptJ,
    hasRandomStats: true,
    customFields: [
      { key: 'hiScore', label: { ko: '하이스코어', ja: 'ハイスコア', en: 'Hi-Score' }, placeholder: '999999990', maxLength: 12 },
    ],
  },
  {
    ...LEGACY,
    id: 'k',
    name: (t) => t.conceptK,
    desc: (t) => t.conceptKDesc,
    slug: 'bestiary',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Cirno.png',
    tag: 'DEX',
    Component: ConceptK,
    hasRandomStats: true,
    customFields: [
      { key: 'dexNo', label: { ko: '도감 번호', ja: '図鑑番号', en: 'Dex No.' }, placeholder: '007', maxLength: 5 },
      { key: 'danger', label: { ko: '위험도 (별 1~5)', ja: '危険度 (星 1~5)', en: 'Danger (1-5)' }, placeholder: '4', maxLength: 1 },
    ],
  },
  {
    ...LEGACY,
    id: 'l',
    name: (t) => t.conceptL,
    desc: (t) => t.conceptLDesc,
    slug: 'grimoire',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Patchouli Knowledge.png',
    tag: 'GRIMOIRE',
    Component: ConceptL,
    customFields: [
      { key: 'volNo', label: { ko: '장서 번호', ja: '蔵書番号', en: 'Vol. No.' }, placeholder: 'VII', maxLength: 6 },
    ],
  },
  {
    ...LEGACY,
    id: 'm',
    name: (t) => t.conceptM,
    desc: (t) => t.conceptMDesc,
    slug: 'banquet',
    sprite: '1. Mainline Games/[7] Youyoumu ~ Perfect Cherry Blossom/Yuyuko Saigyouji.png',
    tag: 'BANQUET',
    Component: ConceptM,
    hasRandomStats: true,
    customFields: [
      { key: 'seat', label: { ko: '좌석', ja: '座席', en: 'Seat' }, placeholder: 'C-13', maxLength: 6 },
      { key: 'time', label: { ko: '시간', ja: '時間', en: 'Time' }, placeholder: '19:30', maxLength: 6 },
    ],
  },
  {
    ...LEGACY,
    id: 'n',
    name: (t) => t.conceptN,
    desc: (t) => t.conceptNDesc,
    slug: 'messenger',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png',
    tag: '@CHAT',
    Component: ConceptN,
    customFields: [
      { key: 'handle', label: { ko: '아이디', ja: 'ID', en: 'Handle' }, placeholder: '@scarlet', maxLength: 20 },
    ],
  },
  {
    ...LEGACY,
    id: 'o',
    name: (t) => t.conceptO,
    desc: (t) => t.conceptODesc,
    slug: 'tcg',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Flandre Scarlet.png',
    tag: 'TCG',
    Component: ConceptO,
    hasRandomStats: true,
    customFields: [
      { key: 'hp', label: { ko: 'HP', ja: 'HP', en: 'HP' }, placeholder: '125', maxLength: 4 },
      { key: 'rarity', label: { ko: '레어도 (별 1~5)', ja: 'レア度 (星 1~5)', en: 'Rarity (1-5)' }, placeholder: '3', maxLength: 1 },
    ],
  },
  {
    ...PHOTOCARD,
    id: 'p',
    name: (t) => t.conceptP,
    desc: (t) => t.conceptPDesc,
    slug: 'spell-photocard',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Flandre Scarlet.png',
    tag: 'SPELL',
    Component: ConceptP,
    hasRandomStats: true,
  },
  {
    ...PHOTOCARD,
    id: 'q',
    name: (t) => t.conceptQ,
    desc: (t) => t.conceptQDesc,
    slug: 'ofuda',
    sprite: '4. Other/[1] Main Characters/Reimu Hakurei.png',
    tag: 'OFUDA',
    Component: ConceptQ,
  },
  {
    ...PHOTOCARD,
    id: 'r',
    name: (t) => t.conceptR,
    desc: (t) => t.conceptRDesc,
    slug: 'ticket',
    sprite: '4. Other/[1] Main Characters/Marisa Kirisame.png',
    tag: 'TICKET',
    Component: ConceptR,
    hasRandomStats: true,
  },
  {
    ...PHOTOCARD,
    id: 's',
    name: (t) => t.conceptS,
    desc: (t) => t.conceptSDesc,
    slug: 'scarlet-invitation',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png',
    tag: 'INVITE',
    Component: ConceptS,
  },
  {
    ...PHOTOCARD,
    id: 't',
    name: (t) => t.conceptT,
    desc: (t) => t.conceptTDesc,
    slug: 'sns-profile',
    sprite: '1. Mainline Games/[9] Kaeizuka ~ Phantasmagoria of Flower View/Aya Shameimaru.png',
    tag: 'PROFILE',
    Component: ConceptT,
    customFields: [
      { key: 'handle', label: { ko: '아이디', ja: 'ID', en: 'Handle' }, placeholder: '@gensokyo', maxLength: 20 },
    ],
  },
  {
    ...PHOTOCARD,
    id: 'u',
    name: (t) => t.conceptU,
    desc: (t) => t.conceptUDesc,
    slug: 'polaroid',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Sakuya Izayoi.png',
    tag: 'POLAROID',
    Component: ConceptU,
  },
  {
    ...PHOTOCARD,
    id: 'v',
    name: (t) => t.conceptV,
    desc: (t) => t.conceptVDesc,
    slug: 'save-slot',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Cirno.png',
    tag: 'SAVE',
    Component: ConceptV,
    hasRandomStats: true,
  },
  {
    ...PHOTOCARD,
    id: 'w',
    name: (t) => t.conceptW,
    desc: (t) => t.conceptWDesc,
    slug: 'eientei-flyer',
    sprite: '1. Mainline Games/[8] Eiyashou ~ Imperishable Night/Reisen Udonge Inaba.png',
    tag: 'FLYER',
    Component: ConceptW,
  },
  {
    ...PHOTOCARD,
    id: 'x',
    name: (t) => t.conceptX,
    desc: (t) => t.conceptXDesc,
    slug: 'sealing-club-file',
    sprite: '4. Other/[2] Hifuu Club/Renko Usami.png',
    tag: 'DOSSIER',
    Component: ConceptX,
  },
  {
    ...PHOTOCARD,
    id: 'y',
    name: (t) => t.conceptY,
    desc: (t) => t.conceptYDesc,
    slug: 'sticker-diary',
    sprite: '1. Mainline Games/[11] Chireiden ~ Subterranean Animism/Koishi Komeiji.png',
    tag: 'DIARY',
    Component: ConceptY,
  },
];

export function findConcept(id: string): ConceptDef | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
