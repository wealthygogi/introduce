import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

export default function ConceptB() {
  const d = useDerived();

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none', paddingTop: 48, overflow: 'visible' }}>
      <div className="cb-card">
        <div className="cb-sprites" aria-hidden>
          <img className="px cb-sprite" src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png')} alt="" />
          <img className="px cb-sprite mid" src={d.charSrc} alt="" />
          <img className="px cb-sprite" src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Patchouli Knowledge.png')} alt="" />
        </div>
        <div className="cb-header">
          <div className="cb-header-tag">SPELL CARD</div>
          <div className="cb-header-title">「{d.t.intro}」</div>
        </div>
        <div className="cb-body">
          <section className="cb-section">
            <h3>{d.t.nickname}</h3>
            <div className="cb-name-row">
              <span className={`cb-avatar ${d.avatarIsPhoto ? 'photo' : ''}`}>
                <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt="" />
              </span>
              <span className="cb-nick">{d.nickname}</span>
            </div>
          </section>

          <section className="cb-section">
            <h3>{d.t.bestChar}</h3>
            <div className="cb-fav-row">
              <img className="px" src={d.charSrc} alt="" style={{ width: 52, height: 52 }} />
              <div>
                <div className="cb-fav-name">{d.charName}</div>
                <div className="cb-fav-series-label">{d.t.mainSeries}:</div>
                <div className="concept-chip-row">
                  {d.seriesList.length === 0 ? (
                    <span className="concept-meta">{d.t.notSelected}</span>
                  ) : (
                    d.seriesList.map((s) => (
                      <span className="concept-chip" key={s.id}>
                        {s.label}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="cb-section">
            <h3>{d.t.acctType}</h3>
            <div style={{ paddingLeft: 13 }}>
              <div className="concept-chip-row">
                {d.acctList.length === 0 ? (
                  <span className="concept-meta">{d.t.notSelected}</span>
                ) : (
                  d.acctList.map((a) => (
                    <span className="concept-pill" key={a.id}>
                      {a.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="cb-section">
            <h3>SNS</h3>
            <div className="cb-grid3">
              <div>
                <div className="label">{d.t.fub}</div>
                <div className="value">{d.fubLabel}</div>
              </div>
              <div>
                <div className="label">{d.t.parting}</div>
                <div className="value">{d.partingLabel}</div>
              </div>
              <div>
                <div className="label">{d.t.otherGenre}</div>
                <div className="value">{d.otherLabel}</div>
              </div>
            </div>
          </section>

          <section className="cb-section">
            <h3>+</h3>
            <div className="cb-misc">
              <div className="cb-misc-row">
                <div className="label">{d.t.dislike}</div>
                <div className="value">{d.dislike}</div>
              </div>
              <div className="cb-misc-row">
                <div className="label">{d.t.pairing}</div>
                <div className="value">{d.pairing}</div>
              </div>
              {d.freeText && (
                <div className="cb-misc-row">
                  <div className="label">{d.t.freeText}</div>
                  <div className="value">{d.freeText}</div>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="cb-footer">
          <span>Touhou Project © ZUN</span>
          <span>·</span>
          <span>Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
