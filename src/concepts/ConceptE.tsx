import './ConceptE.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

const TITLE_SUFFIX = { ko: 'OPTIONS.CFG', ja: 'OPTIONS.CFG', en: 'OPTIONS.CFG' };
const SECTION_CHAR = { ko: 'CHAR', ja: 'CHAR', en: 'CHAR' };
const SECTION_SNS = { ko: 'SNS', ja: 'SNS', en: 'SNS' };
const SECTION_ETC = { ko: 'ETC', ja: 'ETC', en: 'ETC' };
const OK_LABEL = { ko: '확인', ja: '決定', en: 'OK' };
const CANCEL_LABEL = { ko: '취소', ja: 'キャンセル', en: 'Cancel' };
const NAVI_HINT = { ko: '사나에가 안내합니다', ja: '早苗がご案内します', en: 'Guided by Sanae' };

function CheckRow({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`eopt-check-row ${on ? 'is-on' : ''}`}>
      <span className="eopt-check-box" aria-hidden="true" />
      <span className="eopt-check-label">{label}</span>
    </span>
  );
}

function ToggleRow({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`eopt-toggle-row ${on ? 'is-on' : ''}`}>
      <span className="eopt-toggle-track" aria-hidden="true">
        <span className="eopt-toggle-knob" />
      </span>
      <span className="eopt-toggle-label">{label}</span>
    </span>
  );
}

function RadioRow({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`eopt-radio-row ${on ? 'is-on' : ''}`}>
      <span className="eopt-radio-dot" aria-hidden="true" />
      <span className="eopt-radio-label">{label}</span>
    </span>
  );
}

export default function ConceptE() {
  const d = useDerived();
  const sliderStep = d.otherLabel === d.t.none ? 0 : d.otherLabel === d.t.sometimes ? 1 : 2;

  return (
    <div
      id="preview-card"
      className="card-frame"
      style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
    >
      <div className="eopt-card">
        <div className="eopt-titlebar">
          <span className="eopt-titlebar-text">
            {d.t.intro} — {d.t.brand}{' '}
            <span className="eopt-titlebar-tag">{d.getCustom('version', TITLE_SUFFIX[d.lang])}</span>
          </span>
          <span className="eopt-winctl" aria-hidden="true">
            <span>─</span>
            <span>□</span>
            <span>×</span>
          </span>
        </div>

        <div className="eopt-player">
          <div className={`eopt-avatar ${d.avatarIsPhoto ? 'photo' : ''}`}>
            <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt={d.charName} />
          </div>
          <div className="eopt-player-info">
            <span className="eopt-player-tag">{d.t.nickname}</span>
            <span className="eopt-player-name">{d.nickname}</span>
          </div>
          <img
            className="px eopt-navi"
            src={spriteUrl('1. Mainline Games/[10] Fuujinroku ~ Mountain of faith/Sanae Kochiya.png')}
            alt=""
          />
        </div>

        <div className="eopt-body">
          <section className="eopt-section">
            <h3 className="eopt-section-title">
              <span>{SECTION_CHAR[d.lang]}</span>
            </h3>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.bestChar}</span>
              <div className="eopt-select">
                <span className="eopt-select-arrow" aria-hidden="true">◀</span>
                <img className="px eopt-select-icon" src={d.charSrc} alt="" />
                <span className="eopt-select-value">{d.charName}</span>
                <span className="eopt-select-arrow" aria-hidden="true">▶</span>
              </div>
            </div>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.mainSeries}</span>
              <div className="eopt-checklist">
                {d.seriesList.length === 0 ? (
                  <CheckRow on={false} label={d.t.notSelected} />
                ) : (
                  d.seriesList.map((s) => <CheckRow key={s.id} on label={s.label} />)
                )}
              </div>
            </div>
          </section>

          <section className="eopt-section">
            <h3 className="eopt-section-title">
              <span>{SECTION_SNS[d.lang]}</span>
            </h3>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.acctType}</span>
              <div className="eopt-togglelist">
                {d.acctList.length === 0 ? (
                  <ToggleRow on={false} label={d.t.notSelected} />
                ) : (
                  d.acctList.map((a) => <ToggleRow key={a.id} on label={a.label} />)
                )}
              </div>
            </div>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.fub}</span>
              <div className="eopt-radiogroup">
                <RadioRow on={d.fubLabel === d.t.free} label={d.t.free} />
                <RadioRow on={d.fubLabel === d.t.r4r} label={d.t.r4r} />
              </div>
            </div>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.parting}</span>
              <div className="eopt-radiogroup">
                <RadioRow on={d.partingLabel === d.t.unfollow} label={d.t.unfollow} />
                <RadioRow on={d.partingLabel === d.t.blockunfollow} label={d.t.blockunfollow} />
                <RadioRow on={d.partingLabel === d.t.block} label={d.t.block} />
              </div>
            </div>
          </section>

          <section className="eopt-section">
            <h3 className="eopt-section-title">
              <span>{SECTION_ETC[d.lang]}</span>
            </h3>

            <div className="eopt-field">
              <span className="eopt-field-label">{d.t.otherGenre}</span>
              <div className="eopt-slider">
                <div className="eopt-slider-track">
                  <div className={`eopt-slider-fill step-${sliderStep}`} />
                  <div className={`eopt-slider-thumb step-${sliderStep}`} />
                </div>
                <div className="eopt-slider-ticks">
                  <span className={sliderStep === 0 ? 'is-on' : ''}>{d.t.none}</span>
                  <span className={sliderStep === 1 ? 'is-on' : ''}>{d.t.sometimes}</span>
                  <span className={sliderStep === 2 ? 'is-on' : ''}>{d.t.often}</span>
                </div>
              </div>
            </div>

            <div className="eopt-field compact">
              <span className="eopt-field-label">{d.t.dislike}</span>
              <span className={`eopt-readout${d.dislike ? '' : ' is-empty'}`}>{d.dislike || '—'}</span>
            </div>

            <div className="eopt-field compact">
              <span className="eopt-field-label">{d.t.pairing}</span>
              <span className={`eopt-readout${d.pairing ? '' : ' is-empty'}`}>{d.pairing || '—'}</span>
            </div>

            {d.freeText && (
              <div className="eopt-field compact">
                <span className="eopt-field-label">{d.t.freeText}</span>
                <span className="eopt-readout multiline">{d.freeText}</span>
              </div>
            )}
          </section>
        </div>

        <div className="eopt-footer">
          <span className="eopt-hint">{NAVI_HINT[d.lang]}</span>
          <div className="eopt-actions">
            <button type="button" className="eopt-btn primary" disabled>
              <span className="eopt-cursor" aria-hidden="true">▶</span>
              {OK_LABEL[d.lang]}
            </button>
            <button type="button" className="eopt-btn" disabled>
              {CANCEL_LABEL[d.lang]}
            </button>
          </div>
        </div>

        <div className="eopt-credit">
          <span className="eopt-credit-part">Touhou Project © ZUN</span>{' '}
          <span className="eopt-credit-part">· Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
