import { SERIES_BY_GROUP, type SeriesGroup } from '../data/series';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { tr } from '../data/i18n';

export default function SeriesPicker() {
  const { state, toggleSeries, toggleSeriesGroup } = useFormState();
  const { lang, t } = useLang();

  const labelFor: Record<SeriesGroup, string> = {
    old: t.oldWorks,
    new: t.newWorks,
    extra: t.extraWorks,
  };

  return (
    <div className="form-section">
      <label className="form-label">{t.mainSeries}</label>
      {(['old', 'new', 'extra'] as SeriesGroup[]).map((g) => {
        const list = SERIES_BY_GROUP[g];
        const allChecked = list.every((s) => state.selectedSeries.has(s.id));
        return (
          <div key={g} className="series-group">
            <div
              className="series-group-header"
              role="button"
              tabIndex={0}
              onClick={() =>
                toggleSeriesGroup(
                  list.map((s) => s.id),
                  allChecked
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSeriesGroup(
                    list.map((s) => s.id),
                    allChecked
                  );
                }
              }}
              title={t.expandHint}
            >
              <span>── {labelFor[g]}</span>
              <span style={{ fontSize: 12 }}>{allChecked ? '[−]' : '[+]'}</span>
            </div>
            <div className="series-checks">
              {list.map((s) => {
                const isOn = state.selectedSeries.has(s.id);
                const display = (s.num ? `TH${s.num} ` : '') + tr(s, lang);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${isOn ? 'active' : ''}`}
                    onClick={() => toggleSeries(s.id)}
                    aria-pressed={isOn}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
