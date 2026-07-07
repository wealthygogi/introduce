import { useDerived } from '../hooks/useDerived';
import './ConceptB.css';

/** Real spell card names read as a short punchy phrase, not a paragraph.
 *  freeText can run up to 300 chars, so only short entries become the hero
 *  title — longer ones fall back to the nickname and surface as a note
 *  instead, so nothing is ever dropped or rendered as an oversized wall of text. */
const SPELL_NAME_MAX = 30;

export default function ConceptB() {
  const d = useDerived();
  const useFreeTextAsTitle = d.freeText.length > 0 && d.freeText.length <= SPELL_NAME_MAX;
  const title = useFreeTextAsTitle ? d.freeText : `「${d.nickname}」`;
  const longNote = !useFreeTextAsTitle ? d.freeText : '';
  // Difficulty stars: nickname+reroll seeded roll (1–5); custom override (parsed +
  // clamped 1–5) layered on top, falling back to the rolled value when non-numeric.
  const rolledStarCount = d.rollInt('difficulty', 1, 5);
  const parsedDifficulty = parseInt(d.getCustom('difficulty', String(rolledStarCount)), 10);
  const starCount = Number.isNaN(parsedDifficulty) ? rolledStarCount : Math.min(5, Math.max(1, parsedDifficulty));
  const seriesCaption = d.seriesList.length === 0 ? d.t.notSelected : d.seriesList.map((s) => s.label).join(' · ');
  const acctCaption = d.acctList.length === 0 ? d.t.notSelected : d.acctList.map((a) => a.label).join(' · ');

  return (
    <div
      id="preview-card"
      className="card-frame"
      style={{
        background: 'radial-gradient(ellipse at 50% 34%, #6b0f24 0%, #290611 55%, #070204 100%)',
        border: '1px solid rgba(255, 205, 140, 0.4)',
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <div className="dmk-card">
        <div className="dmk-rings" aria-hidden="true" />
        <div className="dmk-dots" aria-hidden="true" />

        <div className="dmk-kicker font-dot">SPELL CARD</div>

        <div className="dmk-sprite-wrap">
          <img className="px dmk-sprite" src={d.charSrc} alt={d.charName} />
          {d.avatarIsPhoto && <img className="dmk-sprite-photo" src={d.avatarSrc} alt="" />}
        </div>

        <h1 className="dmk-title font-serif">{title}</h1>

        {useFreeTextAsTitle && (
          <div className="dmk-caster">
            <span className="dmk-caster-tag font-dot">CASTER</span>
            <span className="dmk-caster-name">{d.nickname}</span>
          </div>
        )}

        <div className="dmk-fav">
          <span className="dmk-fav-label">{d.t.bestChar}</span>
          <span className="dmk-fav-name">{d.charName}</span>
        </div>

        <div className="dmk-stars-block">
          <div className="dmk-stars-row" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`dmk-star ${i < starCount ? 'is-filled' : ''}`}>
                ★
              </span>
            ))}
            <span className="dmk-stars-count">×{d.seriesList.length}</span>
          </div>
          <div className="dmk-series-caption">{seriesCaption}</div>
        </div>

        <div className="dmk-symbol-row">
          <span className="dmk-symbol-label">{d.t.acctType}</span>
          <span className="dmk-symbol-val">{acctCaption}</span>
        </div>

        <div className="dmk-micro-row">
          <span>{d.fubLabel}</span>
          <span className="dmk-sep">·</span>
          <span>{d.partingLabel}</span>
          <span className="dmk-sep">·</span>
          <span>{d.otherLabel}</span>
        </div>
        <div className="dmk-micro-row dmk-muted">
          <span>
            {d.t.dislike} {d.dislike}
          </span>
          <span className="dmk-sep">·</span>
          <span>
            {d.t.pairing} {d.pairing}
          </span>
        </div>

        {longNote && (
          <div className="dmk-note">
            <span className="dmk-note-tag font-dot">INCANTATION</span>
            <p className="dmk-note-text">{longNote}</p>
          </div>
        )}

        <div className="dmk-footer font-dot">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
