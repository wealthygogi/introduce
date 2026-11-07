import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID, type ProfileCharacter } from '../../data/profileCatalog';
import { getCharacterPortrait } from '../../data/characterPortraits';

export { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID };
export type { ProfileCharacter };
export const COUPLING_WORKS = [...new Set(PROFILE_CHARACTERS.map(character => character.group.ko))];
export const getCouplingPortrait = getCharacterPortrait;
