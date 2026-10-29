export type TasteTheme = 'minimal' | 'album' | 'night';

export interface TasteCell {
  characters: string[];
  label: string;
}

export interface TasteGroup {
  id: string;
  title: string;
  rows: number;
  columns: number;
  cells: Array<TasteCell | null>;
}

export interface TasteBoard {
  title: string;
  theme: TasteTheme;
  showNames: boolean;
  groups: TasteGroup[];
}
