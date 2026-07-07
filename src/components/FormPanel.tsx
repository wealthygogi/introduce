import { useParams } from 'react-router-dom';
import { useFormState, type FubChoice, type PartingChoice, type OtherGenreChoice } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { findConcept } from '../concepts/registry';
import CharacterPicker from './CharacterPicker';
import SeriesPicker from './SeriesPicker';
import AccountTypePicker from './AccountTypePicker';
import RadioGroup from './RadioGroup';
import PhotoUpload from './PhotoUpload';

const LIMITS = {
  nickname: 10,
  dislike: 100,
  pairing: 100,
  freeText: 300,
} as const;

function CharCount({ value, max }: { value: string; max: number }) {
  const len = [...value].length;
  return (
    <div className={`form-charcount${len >= max ? ' full' : ''}`}>
      {len}/{max}
    </div>
  );
}

export default function FormPanel() {
  const { state, set, setCustom } = useFormState();
  const { t, lang } = useLang();
  const { id } = useParams<{ id: string }>();
  const customFields = (id ? findConcept(id)?.customFields : undefined) ?? [];
  const cardOnlyLabel = lang === 'ja' ? 'このカード専用' : lang === 'en' ? 'This Card Only' : '이 카드 전용';
  return (
    <aside className="form-panel" aria-label={t.intro}>
      <div className="form-section">
        <label className="form-label" htmlFor="inp-nickname">
          {t.nickname}
        </label>
        <input
          id="inp-nickname"
          className="form-input"
          value={state.nickname}
          maxLength={LIMITS.nickname}
          onChange={(e) => set('nickname', e.target.value.slice(0, LIMITS.nickname))}
          placeholder={t.phNick}
        />
        <CharCount value={state.nickname} max={LIMITS.nickname} />
      </div>

      <hr className="form-hr" />
      <PhotoUpload />

      <hr className="form-hr" />
      <CharacterPicker />

      <hr className="form-hr" />
      <SeriesPicker />

      <hr className="form-hr" />
      <AccountTypePicker />

      <hr className="form-hr" />
      <RadioGroup<FubChoice>
        label={t.fub}
        value={state.fub}
        onChange={(v) => set('fub', v)}
        options={[
          { value: 'free', label: t.free },
          { value: 'r4r', label: t.r4r },
        ]}
      />
      <RadioGroup<PartingChoice>
        label={t.parting}
        value={state.parting}
        onChange={(v) => set('parting', v)}
        options={[
          { value: 'unfollow', label: t.unfollow },
          { value: 'blockunfollow', label: t.blockunfollow },
          { value: 'block', label: t.block },
        ]}
      />
      <RadioGroup<OtherGenreChoice>
        label={t.otherGenre}
        value={state.otherGenre}
        onChange={(v) => set('otherGenre', v)}
        options={[
          { value: 'none', label: t.none },
          { value: 'sometimes', label: t.sometimes },
          { value: 'often', label: t.often },
        ]}
      />

      <hr className="form-hr" />
      <div className="form-section">
        <label className="form-label" htmlFor="inp-dislike">
          {t.dislike}
        </label>
        <input
          id="inp-dislike"
          className="form-input"
          value={state.dislike}
          maxLength={LIMITS.dislike}
          onChange={(e) => set('dislike', e.target.value.slice(0, LIMITS.dislike))}
          placeholder={t.phDis}
        />
        <CharCount value={state.dislike} max={LIMITS.dislike} />
      </div>
      <div className="form-section">
        <label className="form-label" htmlFor="inp-pairing">
          {t.pairing}
        </label>
        <input
          id="inp-pairing"
          className="form-input"
          value={state.pairing}
          maxLength={LIMITS.pairing}
          onChange={(e) => set('pairing', e.target.value.slice(0, LIMITS.pairing))}
          placeholder={t.phPair}
        />
        <CharCount value={state.pairing} max={LIMITS.pairing} />
      </div>
      <div className="form-section">
        <label className="form-label" htmlFor="inp-free">
          {t.freeText}
        </label>
        <textarea
          id="inp-free"
          className="form-textarea"
          value={state.freeText}
          maxLength={LIMITS.freeText}
          onChange={(e) => set('freeText', e.target.value.slice(0, LIMITS.freeText))}
          placeholder={t.phFree}
        />
        <CharCount value={state.freeText} max={LIMITS.freeText} />
      </div>

      {customFields.length > 0 && (
        <>
          <hr className="form-hr" />
          <div className="form-section">
            <label className="form-label">🎴 {cardOnlyLabel}</label>
            {customFields.map((f) => (
              <div key={f.key} className="form-section" style={{ gap: 4 }}>
                <label className="form-hint" htmlFor={`inp-custom-${f.key}`}>
                  {f.label[lang]}
                </label>
                <input
                  id={`inp-custom-${f.key}`}
                  className="form-input"
                  value={state.custom[f.key] ?? ''}
                  maxLength={f.maxLength}
                  onChange={(e) => setCustom(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
