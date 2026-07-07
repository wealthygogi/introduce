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
  /** 컨셉 전용 커스텀 입력값 (key -> value). registry.customFields 로 정의 */
  custom: Record<string, string>;
  /** 랜덤 스탯 시드. 🎲 다시 뽑기 버튼이 갱신. 0 이면 닉네임 시드만 사용 */
  reroll: number;
}

interface FormStateContextValue {
  state: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setCustom: (key: string, value: string) => void;
  doReroll: () => void;
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
  custom: {},
  reroll: 0,
};

const FormStateContext = createContext<FormStateContextValue>({
  state: defaultState,
  set: () => {},
  setCustom: () => {},
  doReroll: () => {},
  toggleSeries: () => {},
  toggleSeriesGroup: () => {},
  toggleAcct: () => {},
});

export function FormStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormState>(defaultState);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const setCustom = (key: string, value: string) => {
    setState((s) => ({ ...s, custom: { ...s.custom, [key]: value } }));
  };

  const doReroll = () => {
    setState((s) => ({ ...s, reroll: (s.reroll + 1 + Math.floor(Math.random() * 1_000_000)) >>> 0 }));
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
    <FormStateContext.Provider value={{ state, set, setCustom, doReroll, toggleSeries, toggleSeriesGroup, toggleAcct }}>
      {children}
    </FormStateContext.Provider>
  );
}

export const useFormState = () => useContext(FormStateContext);
