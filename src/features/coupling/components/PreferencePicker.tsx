import { useLang } from '../../../contexts/LangContext';
import { PREFERENCES } from '../relations';
import type { PreferenceId } from '../types';

type Props = {
  value: PreferenceId;
  onChange: (value: PreferenceId) => void;
  label: string;
  className?: string;
};

export default function PreferencePicker({ value, onChange, label, className = '' }: Props) {
  const { lang } = useLang();
  return <div className={`coupling-preference-picker${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
    {PREFERENCES.map(preference => <button key={preference.id ?? 'none'} className="coupling-btn coupling-preference-option" data-preference={preference.id ?? 'none'} type="button" aria-pressed={value === preference.id} style={{ '--preference-color': preference.color } as React.CSSProperties} onClick={() => onChange(preference.id)}>
      <span aria-hidden="true">{preference.symbol}</span><span>{preference.label[lang]}</span>
    </button>)}
  </div>;
}
