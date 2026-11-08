import portraitIds from './characterPortraitIds.json';
import type { ProfileCharacter } from './profileCatalog';

const FACE_IDS = new Set<string>(portraitIds);

/**
 * Small coupling/random-picker portrait for a catalog character.
 * Face-less characters deliberately fall back to an initial in the UI.
 */
export function getCharacterPortrait(character: ProfileCharacter): { src: string | null; kind: 'face' | 'initial' } {
  if (FACE_IDS.has(character.id)) return { src: `${import.meta.env.BASE_URL}coupling/faces/${character.id}.webp`, kind: 'face' };
  return { src: null, kind: 'initial' };
}

export const CHARACTER_PORTRAIT_IDS: readonly string[] = portraitIds;
