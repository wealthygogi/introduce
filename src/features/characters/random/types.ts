import type { ProfileCharacter } from '../../../data/profileCatalog';
import type { AppearanceStage, RoleFilter } from '../characterCategories';

export type RandomScope = 'all' | 'mainline' | 'pc98' | 'spinoff' | 'books';
export type DrawCount = 1 | 3 | 5 | 10;
export type DrawMode = 'pool' | 'balanced';

export type RandomFilter = {
  scope: RandomScope;
  workIds: string[];
  roles: RoleFilter[];
  stage: AppearanceStage | null;
};

export type RandomSettings = RandomFilter & {
  count: DrawCount;
  mode: DrawMode;
  reflectPreferences: boolean;
  excludeRecent: boolean;
};

export type PreferenceSignals = {
  favorite: Set<string>;
  interested: Set<string>;
  avoid: Set<string>;
  warning: boolean;
};

export type PoolEntry = {
  character: ProfileCharacter;
  weight: number;
  groupKey: string;
};

export type PoolResult = {
  entries: PoolEntry[];
  totalCandidates: number;
  excludedByPreference: number;
  relaxedRecent: boolean;
  warning: boolean;
};

export type DrawOutcome = {
  characters: ProfileCharacter[];
  requested: number;
  clamped: boolean;
  relaxedRecent: boolean;
};

export type RandomDrawRecord = {
  id: string;
  at: number;
  characterIds: string[];
  /** Actual number of characters in this draw; may be below the requested count. */
  count: number;
  mode: DrawMode;
  /** Count the user asked for, kept so history can explain a clamped result. */
  requested?: number;
};

export type RandomPickerData = {
  settings: RandomSettings;
  history: RandomDrawRecord[];
};

export type RandomPickerReadResult =
  | { kind: 'empty' }
  | { kind: 'valid'; data: RandomPickerData }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };

export type DrawResult = {
  pool: PoolResult;
  outcome: DrawOutcome;
};
