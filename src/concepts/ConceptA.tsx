import { useDerived } from '../hooks/useDerived';

export default function ConceptA() {
  const d = useDerived();
  return (
    <div id="preview-card" className="card-frame">
      <div className="ca-card">
        <div className="ca-head">
          <div className={`ca-avatar ${d.avatarIsPhoto ? 'photo' : ''}`}>
            <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt={d.charName} />
          </div>
          <div>
            <div className="ca-name">{d.nickname}</div>
            <div className="ca-job">▶ {d.charName}</div>
          </div>
        </div>

        <div className="ca-stats">
          <div className="ca-stat">
            <div className="ca-stat-label">{d.t.mainSeries}</div>
            <div className="ca-stat-value">
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
          <div className="ca-stat">
            <div className="ca-stat-label">{d.t.acctType}</div>
            <div className="ca-stat-value">
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
          </div>
          <div className="ca-stat">
            <div className="ca-stat-label">{d.t.fub} / {d.t.parting} / {d.t.otherGenre}</div>
            <div className="ca-stat-value">
              <strong>{d.fubLabel}</strong> · {d.partingLabel} · {d.otherLabel}
            </div>
          </div>
          <div className="ca-stat">
            <div className="ca-stat-label">{d.t.dislike} / {d.t.pairing}</div>
            <div className="ca-stat-value">
              <div>{d.dislike}</div>
              <div style={{ color: 'var(--fg-muted)' }}>{d.pairing}</div>
            </div>
          </div>
        </div>

        {d.freeText && (
          <div className="ca-notes">
            <div className="ca-notes-label">{d.t.freeText}</div>
            <div style={{ fontSize: 14, color: 'var(--fg-strong)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {d.freeText}
            </div>
          </div>
        )}

        <div className="ca-credits">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
