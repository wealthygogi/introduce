import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

export default function ConceptC() {
  const d = useDerived();
  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cc-card">
        <div className="cc-sprites">
          <img className="px" src={spriteUrl('4. Other/[1] Main Characters/Marisa Kirisame.png')} alt="" />
          <img className="px" src={d.charSrc} alt="" style={{ width: 64, height: 64 }} />
          <img className="px" src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Cirno.png')} alt="" />
        </div>
        <div className="cc-pre">★ TOUHOU INTRO ★</div>
        {d.avatarIsPhoto && (
          <img
            className="cc-photo"
            src={d.avatarSrc}
            alt=""
          />
        )}
        <h1 className="cc-title">{d.nickname}</h1>
        <div className="cc-subtitle">{d.charName}</div>

        <div className="cc-menu">
          {/* 다값 항목은 chip-row 블록 */}
          <div className="cc-menu-block">
            <div className="cc-block-label">{d.t.mainSeries}</div>
            <div className="cc-chips">
              {d.seriesList.length === 0 ? (
                <span className="cc-meta">{d.t.notSelected}</span>
              ) : (
                d.seriesList.map((s) => (
                  <span className="cc-chip" key={s.id}>
                    {s.label}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="cc-menu-block">
            <div className="cc-block-label">{d.t.acctType}</div>
            <div className="cc-chips">
              {d.acctList.length === 0 ? (
                <span className="cc-meta">{d.t.notSelected}</span>
              ) : (
                d.acctList.map((a) => (
                  <span className="cc-chip" key={a.id}>
                    {a.label}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 단일 값은 기존 inline 메뉴 */}
          <div className="cc-menu-item">
            <span className="label">{d.t.fub} / {d.t.parting} / {d.t.otherGenre}</span>
            <span className="value">{d.fubLabel} · {d.partingLabel} · {d.otherLabel}</span>
          </div>
          <div className="cc-menu-item">
            <span className="label">{d.t.dislike}</span>
            <span className="value">{d.dislike}</span>
          </div>
          <div className="cc-menu-item">
            <span className="label">{d.t.pairing}</span>
            <span className="value">{d.pairing}</span>
          </div>
        </div>

        {d.freeText && <div className="cc-free">{d.freeText}</div>}

        <div className="cc-credit">PRESS START · Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
