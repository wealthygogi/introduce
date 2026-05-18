import { useFormState, type FubChoice, type PartingChoice, type OtherGenreChoice } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import CharacterPicker from './CharacterPicker';
import SeriesPicker from './SeriesPicker';
import AccountTypePicker from './AccountTypePicker';
import RadioGroup from './RadioGroup';
import PhotoUpload from './PhotoUpload';

export default function FormPanel() {
  const { state, set } = useFormState();
  const { t } = useLang();
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
          onChange={(e) => set('nickname', e.target.value)}
          placeholder={t.phNick}
        />
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
          onChange={(e) => set('dislike', e.target.value)}
          placeholder={t.phDis}
        />
      </div>
      <div className="form-section">
        <label className="form-label" htmlFor="inp-pairing">
          {t.pairing}
        </label>
        <input
          id="inp-pairing"
          className="form-input"
          value={state.pairing}
          onChange={(e) => set('pairing', e.target.value)}
          placeholder={t.phPair}
        />
      </div>
      <div className="form-section">
        <label className="form-label" htmlFor="inp-free">
          {t.freeText}
        </label>
        <textarea
          id="inp-free"
          className="form-textarea"
          value={state.freeText}
          onChange={(e) => set('freeText', e.target.value)}
          placeholder={t.phFree}
        />
      </div>
    </aside>
  );
}
