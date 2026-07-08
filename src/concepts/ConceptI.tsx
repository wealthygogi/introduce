import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';
import './ConceptI.css';

const TOTAL_BOOTHS = 24;

export default function ConceptI() {
  const d = useDerived();
  const newBookLabel = { ko: '신간 정보', ja: '新刊情報', en: 'New Release' }[d.lang];

  // nickname+reroll seeded circle placement — same nickname+reroll always yields the same roll
  const myBooth = d.rollInt('booth', 0, TOTAL_BOOTHS - 1);
  const autoSpaceCode = `${d.rollPick('space-block', ['東', '西', '南', '北'])}-${d.rollInt('space-num', 1, 60)}${d.rollPick('space-ab', ['a', 'b'])}`;
  // space number defaults to the roll above, but the circle owner can pin their own
  const spaceCode = d.getCustom('space', autoSpaceCode);

  return (
    <div id="preview-card" className="card-frame ci-frame">
      <div className="ci-card">
        <div className="ci-masthead">
          <div className="ci-masthead-text">
            <span className="ci-masthead-title">COMIC MARKET</span>
            <span className="ci-masthead-sub">CIRCLE CUT SHEET</span>
          </div>
          <img
            className="px ci-cameo"
            src={spriteUrl('1. Mainline Games/[7] Youyoumu ~ Perfect Cherry Blossom/Alice Margatroid.png')}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className="ci-map-block">
          <div className="ci-map" aria-hidden="true">
            {Array.from({ length: TOTAL_BOOTHS }).map((_, i) => (
              <span key={i} className={`ci-booth${i === myBooth ? ' is-mine' : ''}`} />
            ))}
          </div>
          <div className="ci-map-info">
            <span className="ci-map-tag">PLACEMENT</span>
            <span className="ci-map-code">{spaceCode}</span>
          </div>
        </div>

        <div className="ci-main">
          <div className="ci-cut">
            <img className="px" src={d.charSrc} alt="" />
            <span className="ci-cut-tag">CIRCLE CUT</span>
          </div>
          <div className="ci-ident">
            <span className="ci-kicker">CIRCLE</span>
            <div className="ci-name">{d.nickname}</div>
            <div className="ci-fav">
              <span className="ci-fav-label">{d.t.bestChar}</span>
              <span className="ci-fav-value">{d.charName}</span>
            </div>
          </div>
        </div>

        <div className="ci-catalog">
          <div className="ci-catalog-col">
            <div className="ci-catalog-head">
              <span className="ci-eyebrow">GENRE INDEX</span>
              {d.t.mainSeries}
            </div>
            {d.seriesList.length === 0 ? (
              <div className="ci-empty">{d.t.notSelected}</div>
            ) : (
              <ol className="ci-index">
                {d.seriesList.map((s, i) => (
                  <li key={s.id}>
                    <span className="ci-index-no">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ci-index-label">{s.label}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="ci-catalog-col">
            <div className="ci-catalog-head">
              <span className="ci-eyebrow">PRICE LIST</span>
              {d.t.acctType}
            </div>
            {d.acctList.length === 0 ? (
              <div className="ci-empty">{d.t.notSelected}</div>
            ) : (
              <ul className="ci-price-list">
                {d.acctList.map((a) => (
                  <li key={a.id} className="ci-price-row">
                    <span className="ci-price-name">{a.label}</span>
                    <span className="ci-price-dots" aria-hidden="true" />
                    <span className="ci-price-value">¥{d.rollInt('price-' + a.id, 3, 25) * 100}-</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {d.freeText && (
          <div className="ci-newbook">
            <span className="ci-newbook-tag">{newBookLabel}</span>
            <p className="ci-newbook-text">{d.freeText}</p>
          </div>
        )}

        <div className="ci-notice">
          <span>
            <b>{d.t.fub}</b>
            {d.fubLabel}
          </span>
          <span>
            <b>{d.t.parting}</b>
            {d.partingLabel}
          </span>
          <span>
            <b>{d.t.otherGenre}</b>
            {d.otherLabel}
          </span>
          {d.dislike && (
            <span>
              <b>{d.t.dislike}</b>
              {d.dislike}
            </span>
          )}
          {d.pairing && (
            <span>
              <b>{d.t.pairing}</b>
              {d.pairing}
            </span>
          )}
        </div>

        <div className="ci-footer">
          <span>Touhou Project © ZUN</span> · <span>Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
