import { ACCT_TYPES } from '../data/accountTypes';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { tr } from '../data/i18n';

export default function AccountTypePicker() {
  const { state, toggleAcct } = useFormState();
  const { lang, t } = useLang();
  return (
    <div className="form-section">
      <label className="form-label">{t.acctType}</label>
      <div className="chip-group">
        {ACCT_TYPES.map((a) => {
          const on = state.selectedAcct.has(a.id);
          return (
            <button
              type="button"
              key={a.id}
              className={`chip ${on ? 'active' : ''}`}
              onClick={() => toggleAcct(a.id)}
              aria-pressed={on}
            >
              {tr(a, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
