import { useLang } from '../contexts/LangContext';
import type { Lang } from '../data/i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
];

export default function LangSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="switcher" role="group" aria-label={t.language}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
