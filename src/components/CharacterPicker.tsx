import { useMemo, useState } from 'react';
import { CHARACTERS, spriteUrl } from '../data/characters';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { tr } from '../data/i18n';

export default function CharacterPicker() {
  const { state, set } = useFormState();
  const { lang, t } = useLang();
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHARACTERS;
    return CHARACTERS.filter((c) =>
      [c.id, c.ko, c.ja, c.en].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const selected = CHARACTERS.find((c) => c.id === state.selectedChar);

  return (
    <div className="form-section">
      <div className="picker-header">
        <label className="form-label">{t.bestChar}</label>
        <button
          type="button"
          className="btn ghost picker-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? t.collapse : t.expand}
        >
          <span className={`chev ${open ? 'down' : 'up'}`}>▾</span>
          <span>{open ? t.collapse : t.expand}</span>
        </button>
      </div>

      {selected && (
        <div className="picker-current">
          <img className="px" src={spriteUrl(selected.rel)} alt="" />
          <span>{tr(selected, lang)}</span>
        </div>
      )}

      {open && (
        <>
          <input
            className="form-input picker-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`🔍 ${t.searchChar}`}
          />
          <div className="char-grid">
            {filtered.length === 0 ? (
              <span className="form-hint">—</span>
            ) : (
              filtered.map((c) => {
                const name = tr(c, lang);
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`char-thumb ${state.selectedChar === c.id ? 'selected' : ''}`}
                    onClick={() => set('selectedChar', c.id)}
                    title={name}
                    aria-label={name}
                  >
                    <img className="px" src={spriteUrl(c.rel)} alt="" loading="lazy" decoding="async" />
                  </button>
                );
              })
            )}
          </div>
          <div className="form-hint">
            {filtered.length}/{CHARACTERS.length}
          </div>
        </>
      )}
    </div>
  );
}
