import { useDerived } from '../hooks/useDerived';
import './ConceptA.css';

/** Deterministic decorative gauge fill (55–98%) — flavor only, never the source of truth for the label text next to it. */
function gaugeFill(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 55 + (hash % 44);
}

export default function ConceptA() {
  const d = useDerived();
  // Flavor-only "level": nickname+reroll seeded roll (5–99), overridable via the
  // per-card `level` custom field (falls back to the rolled value).
  const rolledLv = d.rollInt('level', 5, 99);
  const lv = d.getCustom('level', String(rolledLv));

  return (
    <div
      id="preview-card"
      className="card-frame"
      style={{
        background: 'linear-gradient(150deg, #1c2033 0%, #0a0b13 100%)',
        border: '2px solid #48507a',
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <div className="rpgs-card">
        <div className="rpgs-titlebar">
          <span className="rpgs-titlebar-text font-dot">STATUS WINDOW</span>
          <span className="rpgs-titlebar-lv font-dot">Lv.{lv}</span>
        </div>

        <div className="rpgs-body">
          <div className="rpgs-left">
            <div className="rpgs-portrait-frame">
              <img className="px rpgs-portrait" src={d.charSrc} alt={d.charName} />
              {d.avatarIsPhoto && <img className="rpgs-idphoto" src={d.avatarSrc} alt="" />}
            </div>
            <div className="rpgs-name">{d.nickname}</div>
            <div className="rpgs-charname">▸ {d.charName}</div>

            <div className="rpgs-vitals">
              <div className="rpgs-vital">
                <span className="rpgs-vital-label font-dot">HP</span>
                <div className="rpgs-vital-track">
                  <div className="rpgs-vital-fill rpgs-hp" />
                </div>
              </div>
              <div className="rpgs-vital">
                <span className="rpgs-vital-label font-dot">MP</span>
                <div className="rpgs-vital-track">
                  <div className="rpgs-vital-fill rpgs-mp" />
                </div>
              </div>
            </div>
          </div>

          <div className="rpgs-right">
            <div className="rpgs-gauge-group">
              <div className="rpgs-gauge-header">
                <span className="rpgs-kicker font-dot">SKILL</span>
                <span>{d.t.mainSeries}</span>
              </div>
              {d.seriesList.length === 0 ? (
                <div className="rpgs-empty">{d.t.notSelected}</div>
              ) : (
                d.seriesList.map((s) => (
                  <div className="rpgs-gauge-row" key={s.id}>
                    <span className="rpgs-gauge-label">{s.label}</span>
                    <div className="rpgs-gauge-track">
                      <div className="rpgs-gauge-fill rpgs-fill-series" style={{ width: `${gaugeFill(s.id)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rpgs-gauge-group">
              <div className="rpgs-gauge-header">
                <span className="rpgs-kicker font-dot">STYLE</span>
                <span>{d.t.acctType}</span>
              </div>
              {d.acctList.length === 0 ? (
                <div className="rpgs-empty">{d.t.notSelected}</div>
              ) : (
                d.acctList.map((a) => (
                  <div className="rpgs-gauge-row" key={a.id}>
                    <span className="rpgs-gauge-label">{a.label}</span>
                    <div className="rpgs-gauge-track">
                      <div className="rpgs-gauge-fill rpgs-fill-acct" style={{ width: `${gaugeFill(a.id)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rpgs-stat-grid">
              <div className="rpgs-stat-tile">
                <div className="rpgs-stat-tag">{d.t.fub}</div>
                <div className="rpgs-stat-val">{d.fubLabel}</div>
              </div>
              <div className="rpgs-stat-tile">
                <div className="rpgs-stat-tag">{d.t.parting}</div>
                <div className="rpgs-stat-val">{d.partingLabel}</div>
              </div>
              <div className="rpgs-stat-tile">
                <div className="rpgs-stat-tag">{d.t.otherGenre}</div>
                <div className="rpgs-stat-val">{d.otherLabel}</div>
              </div>
            </div>

            <div className="rpgs-effects">
              <div className="rpgs-effect">
                <span className="rpgs-effect-tag">{d.t.dislike}</span>
                <span className="rpgs-effect-val">{d.dislike}</span>
              </div>
              <div className="rpgs-effect">
                <span className="rpgs-effect-tag">{d.t.pairing}</span>
                <span className="rpgs-effect-val">{d.pairing}</span>
              </div>
            </div>

            {d.freeText && (
              <div className="rpgs-log">
                <div className="rpgs-log-label">{d.t.freeText}</div>
                <div className="rpgs-log-text">{d.freeText}</div>
              </div>
            )}
          </div>
        </div>

        <div className="rpgs-footer font-dot">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
