import type { CharacterFilter } from './characterCategories';

export type TasteTheme = 'minimal' | 'paper' | 'album' | 'terminal' | 'night';

export interface TasteCell {
  characters: string[];
  label: string;
  imageId?: string;
  versionWorkIds?: Record<string, string>;
}

export type TasteGroupTitlePreset =
  | { kind: 'favorites' }
  | { kind: 'collection' }
  | { kind: 'free'; number: number };

export interface TasteSlot {
  label: string;
  topicId?: string;
  labelSource?: 'topic' | 'custom';
}

export interface TasteGroup {
  id: string;
  title: string;
  titleSource?: 'auto' | 'custom';
  titlePreset?: TasteGroupTitlePreset;
  rows: number;
  columns: number;
  cells: Array<TasteCell | null>;
  slots?: Array<TasteSlot | null>;
  showAppearances?: boolean;
  appearanceContext?: CharacterFilter;
}

export interface TasteBoard {
  title: string;
  titleSource?: 'auto' | 'custom';
  theme: TasteTheme;
  showNames: boolean;
  groups: TasteGroup[];
}
