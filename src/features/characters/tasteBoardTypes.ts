export type TasteTheme = 'minimal' | 'paper' | 'album' | 'terminal' | 'night';

export interface TasteCell {
  characters: string[];
  label: string;
  imageId?: string;
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
