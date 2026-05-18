import { createContext, useContext, useState, ReactNode } from 'react';

export type FubChoice = 'free' | 'r4r';
export type PartingChoice = 'unfollow' | 'blockunfollow' | 'block';
export type OtherGenreChoice = 'none' | 'sometimes' | 'often';

export interface FormState {
  nickname: string;
  profileImage: string | null;
  selectedChar: string;
  selectedSeries: Set<string>;
  selectedAcct: Set<string>;
  fub: FubChoice;
  parting: PartingChoice;
  otherGenre: OtherGenreChoice;
  dislike: string;
  pairing: string;
  freeText: string;
}

interface FormStateContextValue {
  state: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleSeries: (id: string) => void;
  toggleSeriesGroup: (ids: string[], allChecked: boolean) => void;
  toggleAcct: (id: string) => void;
}

const defaultState: FormState = {
  nickname: '',
  profileImage: null,
  selectedChar: 'reimu',
  selectedSeries: new Set(['th6', 'th7', 'th8']),
  selectedAcct: new Set(['daily', 'drawing']),
  fub: 'free',
  parting: 'unfollow',
  otherGenre: 'sometimes',
  dislike: '',
  pairing: '',
  freeText: '',
};

const FormStateContext = createContext<FormStateContextValue>({
  state: defaultState,
  set: () => {},
  toggleSeries: () => {},
  toggleSeriesGroup: () => {},
  toggleAcct: () => {},
});

export function FormStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormState>(defaultState);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const toggleSeries = (id: string) => {
    setState((s) => {
      const next = new Set(s.selectedSeries);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, selectedSeries: next };
    });
  };

  const toggleSeriesGroup = (ids: string[], allChecked: boolean) => {
    setState((s) => {
      const next = new Set(s.selectedSeries);
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return { ...s, selectedSeries: next };
    });
  };

  const toggleAcct = (id: string) => {
    setState((s) => {
      const next = new Set(s.selectedAcct);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, selectedAcct: next };
    });
  };

  return (
    <FormStateContext.Provider value={{ state, set, toggleSeries, toggleSeriesGroup, toggleAcct }}>
      {children}
    </FormStateContext.Provider>
  );
}

export const useFormState = () => useContext(FormStateContext);
