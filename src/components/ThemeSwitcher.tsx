import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LangContext';

const THEME_ORDER: Theme[] = ['light', 'dark', 'spring', 'summer', 'autumn', 'winter'];

const SWATCH: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#1a1a25',
  spring: '#f4a5bd',
  summer: '#7dcb92',
  autumn: '#d49a6a',
  winter: '#8cc1de',
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLang();

  const label = (th: Theme): string => {
    switch (th) {
      case 'light':
        return t.themeLight;
      case 'dark':
        return t.themeDark;
      case 'spring':
        return t.themeSpring;
      case 'summer':
        return t.themeSummer;
      case 'autumn':
        return t.themeAutumn;
      case 'winter':
        return t.themeWinter;
    }
  };

  return (
    <div className="switcher" role="group" aria-label={t.theme}>
      {THEME_ORDER.map((th) => (
        <button
          key={th}
          type="button"
          className={`btn ${theme === th ? 'active' : ''}`}
          onClick={() => setTheme(th)}
          aria-pressed={theme === th}
          title={label(th)}
        >
          <span
            className="swatch"
            style={{
              background:
                th === 'light' || th === 'dark'
                  ? SWATCH[th]
                  : `linear-gradient(135deg, ${SWATCH[th]}, ${SWATCH[th]}aa)`,
            }}
            aria-hidden
          />
          <span>{label(th)}</span>
        </button>
      ))}
    </div>
  );
}
