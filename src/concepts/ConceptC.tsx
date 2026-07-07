import { useDerived } from '../hooks/useDerived';
import './ConceptC.css';

export default function ConceptC() {
  const d = useDerived();
  const seriesText = d.seriesList.length === 0 ? d.t.notSelected : d.seriesList.map((s) => s.label).join(' · ');
  const acctText = d.acctList.length === 0 ? d.t.notSelected : d.acctList.map((a) => a.label).join(' · ');
  // Small "ver.X" build stamp under the title/subtitle — separate from the
  // localized subtitle text above it, so the subtitle wording never gets clobbered.
  const version = d.getCustom('version', '1.00');

  return (
    <div id="preview-card" className="card-frame tsc-frame">
      <div className="tsc-card">
        <span className="tsc-corner tl" aria-hidden="true" />
        <span className="tsc-corner tr" aria-hidden="true" />
        <span className="tsc-corner bl" aria-hidden="true" />
        <span className="tsc-corner br" aria-hidden="true" />

        <div className="tsc-badge font-pixel">TOUHOU INTRO</div>

        <div className="tsc-sprite-wrap">
          <img className="px tsc-sprite" src={d.charSrc} alt={d.charName} />
          {d.avatarIsPhoto && <img className="tsc-sprite-photo" src={d.avatarSrc} alt="" />}
        </div>

        <div className="tsc-titles">
          <h1 className="tsc-title">{d.nickname}</h1>
          <div className="tsc-subtitle">{d.t.cardLabel}</div>
          <div className="tsc-version font-dot">ver.{version}</div>
        </div>

        <nav className="tsc-menu">
          <div className="tsc-menu-item tsc-menu-cta">
            <span className="tsc-arrow">▶</span>
            <span>{d.t.startCta}</span>
          </div>
          <div className="tsc-menu-item">
            <span className="tsc-arrow">▶</span>
            <span className="tsc-menu-label">{d.t.bestChar}</span>
            <span className="tsc-menu-value">{d.charName}</span>
          </div>
          <div className="tsc-menu-item">
            <span className="tsc-arrow">▶</span>
            <span className="tsc-menu-label">{d.t.mainSeries}</span>
            <span className="tsc-menu-value">{seriesText}</span>
          </div>
          <div className="tsc-menu-item">
            <span className="tsc-arrow">▶</span>
            <span className="tsc-menu-label">{d.t.acctType}</span>
            <span className="tsc-menu-value">{acctText}</span>
          </div>
          <div className="tsc-menu-item tsc-menu-sub">
            <span className="tsc-arrow">▶</span>
            <span className="tsc-menu-label">SNS</span>
            <span className="tsc-menu-value">
              {d.fubLabel} · {d.partingLabel} · {d.otherLabel}
            </span>
          </div>
          <div className="tsc-menu-item tsc-menu-sub">
            <span className="tsc-arrow">▶</span>
            <span className="tsc-menu-label">
              {d.t.dislike} / {d.t.pairing}
            </span>
            <span className="tsc-menu-value">
              {d.dislike} / {d.pairing}
            </span>
          </div>
          {d.freeText && (
            <div className="tsc-menu-item tsc-menu-sub">
              <span className="tsc-arrow">▶</span>
              <span className="tsc-menu-label">{d.t.freeText}</span>
              <span className="tsc-menu-value">{d.freeText}</span>
            </div>
          )}
        </nav>

        <div className="tsc-footer font-dot">
          <span className="tsc-footer-part">Touhou Project © ZUN</span> · <span className="tsc-footer-part">Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
