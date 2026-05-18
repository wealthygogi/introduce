import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { messages, type Lang, type Messages } from '../data/i18n';

const STORAGE_KEY = 'introduce:lang';
const DEFAULT_LANG: Lang = 'ko';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Messages;
}

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: messages.ko,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANG;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in messages) return stored;
    const nav = window.navigator.language.toLowerCase();
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('en')) return 'en';
    return 'ko';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = messages[lang];

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
