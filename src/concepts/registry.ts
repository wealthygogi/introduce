import type { ComponentType } from 'react';
import type { Messages, Lang } from '../data/i18n';
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
    id: 'q',
    name: (t) => t.conceptQ,
    desc: (t) => t.conceptQDesc,
    slug: 'ofuda',
    sprite: '4. Other/[1] Main Characters/Reimu Hakurei.png',
    tag: 'OFUDA',
    Component: ConceptQ,
  },
  {
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
    id: 's',
    name: (t) => t.conceptS,
    desc: (t) => t.conceptSDesc,
    slug: 'scarlet-invitation',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png',
    tag: 'INVITE',
    Component: ConceptS,
  },
  {
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
    id: 'u',
    name: (t) => t.conceptU,
    desc: (t) => t.conceptUDesc,
    slug: 'polaroid',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Sakuya Izayoi.png',
    tag: 'POLAROID',
    Component: ConceptU,
  },
  {
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
    id: 'w',
    name: (t) => t.conceptW,
    desc: (t) => t.conceptWDesc,
    slug: 'eientei-flyer',
    sprite: '1. Mainline Games/[8] Eiyashou ~ Imperishable Night/Reisen Udonge Inaba.png',
    tag: 'FLYER',
    Component: ConceptW,
  },
  {
    id: 'x',
    name: (t) => t.conceptX,
    desc: (t) => t.conceptXDesc,
    slug: 'sealing-club-file',
    sprite: '4. Other/[2] Hifuu Club/Renko Usami.png',
    tag: 'DOSSIER',
    Component: ConceptX,
  },
  {
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
