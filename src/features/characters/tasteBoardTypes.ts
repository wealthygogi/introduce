import type { CharacterFilter } from './characterCategories';

export type TasteTheme = 'minimal' | 'paper' | 'album' | 'terminal' | 'night';

export interface TasteCell {
  characters: string[];
  label: string;
  imageId?: string;
}

export interface TasteSlot {
  label: string;
  topicId?: string;
}

export interface TasteGroup {
  id: string;
  title: string;
  rows: number;
  columns: number;
  cells: Array<TasteCell | null>;
  slots?: Array<TasteSlot | null>;
  showAppearances?: boolean;
  appearanceContext?: CharacterFilter;
}

export interface TasteBoard {
  title: string;
  theme: TasteTheme;
  showNames: boolean;
  groups: TasteGroup[];
}
