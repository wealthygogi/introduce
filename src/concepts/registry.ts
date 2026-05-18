import type { ComponentType } from 'react';
import type { Messages } from '../data/i18n';
import ConceptA from './ConceptA';
import ConceptB from './ConceptB';
import ConceptC from './ConceptC';
import ConceptD from './ConceptD';
import ConceptE from './ConceptE';

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
  },
  {
    id: 'b',
    name: (t) => t.conceptB,
    desc: (t) => t.conceptBDesc,
    slug: 'spell-card',
    sprite: '1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png',
    tag: 'SPELL CARD',
    Component: ConceptB,
  },
  {
    id: 'c',
    name: (t) => t.conceptC,
    desc: (t) => t.conceptCDesc,
    slug: 'title-screen',
    sprite: '4. Other/[1] Main Characters/Marisa Kirisame.png',
    tag: 'TITLE',
    Component: ConceptC,
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
  },
];

export function findConcept(id: string): ConceptDef | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
