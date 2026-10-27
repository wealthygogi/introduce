import portraitIds from './portraitIds.json';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID, type ProfileCharacter } from '../../data/profileCatalog';
import { spriteUrl } from '../../data/characters';

const FACE_IDS = new Set<string>(portraitIds);
export { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID };
export type { ProfileCharacter };
export const COUPLING_WORKS = [...new Set(PROFILE_CHARACTERS.map(character => character.group.ko))];

export function getCouplingPortrait(character: ProfileCharacter): { src: string | null; kind: 'face' | 'pixel' | 'initial' } {
  if (FACE_IDS.has(character.id)) return { src: `${import.meta.env.BASE_URL}coupling/faces/${character.id}.png`, kind: 'face' };
  if (character.spriteRel) return { src: spriteUrl(character.spriteRel), kind: 'pixel' };
  return { src: null, kind: 'initial' };
}
