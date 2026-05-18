import { useDerived } from '../hooks/useDerived';

export default function ConceptD() {
  const d = useDerived();
  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cd-card">
        <div className="cd-scene">
          <img className="px cd-portrait" src={d.charSrc} alt={d.charName} />
          {d.avatarIsPhoto && (
            <img className="cd-user-photo" src={d.avatarSrc} alt="" />
          )}
        </div>
        <div className="cd-dialogue">
          <div className="cd-speaker">{d.charName}</div>
          <div className="cd-text">
            <strong>「{d.nickname}」</strong>
            {' '}
            {d.lang === 'ko'
              ? '잘 부탁드려요.'
              : d.lang === 'ja'
              ? 'よろしくお願いします。'
              : 'Nice to meet you.'}
            {d.freeText ? `\n\n${d.freeText}` : ''}
          </div>
          <div className="cd-chip-block">
            <div className="cd-chip-label">{d.t.mainSeries}</div>
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
          <div className="cd-chip-block">
            <div className="cd-chip-label">{d.t.acctType}</div>
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
          <div className="cd-meta">
            <div className="cd-meta-item">
              <div className="cd-meta-label">{d.t.fub}</div>
              <div className="cd-meta-value">{d.fubLabel}</div>
            </div>
            <div className="cd-meta-item">
              <div className="cd-meta-label">{d.t.parting}</div>
              <div className="cd-meta-value">{d.partingLabel}</div>
            </div>
            <div className="cd-meta-item">
              <div className="cd-meta-label">{d.t.otherGenre}</div>
              <div className="cd-meta-value">{d.otherLabel}</div>
            </div>
            <div className="cd-meta-item">
              <div className="cd-meta-label">{d.t.dislike}</div>
              <div className="cd-meta-value">{d.dislike}</div>
            </div>
            <div className="cd-meta-item">
              <div className="cd-meta-label">{d.t.pairing}</div>
              <div className="cd-meta-value">{d.pairing}</div>
            </div>
          </div>
        </div>
        <div className="cd-footer">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
