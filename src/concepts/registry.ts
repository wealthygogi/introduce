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
}

export const CONCEPTS: ConceptDef[] = [
  {
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
    id: 'd',
    name: (t) => t.conceptD,
    desc: (t) => t.conceptDDesc,
    slug: 'dialogue',
    sprite: '1. Mainline Games/[11] Chireiden ~ Subterranean Animism/Satori Komeiji.png',
    tag: 'DIALOGUE',
    Component: ConceptD,
  },
  {
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
];

export function findConcept(id: string): ConceptDef | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
