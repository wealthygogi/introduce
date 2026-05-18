import { useDerived } from '../hooks/useDerived';

function Radio({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`ce-radio ${on ? 'on' : 'off'}`}>
      {on ? '●' : '○'} {label}
    </span>
  );
}

export default function ConceptE() {
  const d = useDerived();
  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="ce-card">
        <div className="ce-titlebar">
          <span>{d.t.intro} — {d.t.brand}</span>
          <span className="ce-ver">ver.2024</span>
        </div>
        <div className="ce-header">
          <div className={`ce-portrait ${d.avatarIsPhoto ? 'photo' : ''}`}>
            <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt={d.charName} />
          </div>
          <div>
            <div className="ce-nick">{d.nickname}</div>
            <div className="ce-callme">▶ {d.charName}</div>
          </div>
        </div>

        <div className="ce-sep">── CHAR ─────────────────</div>
        <div className="ce-row">
          <span className="ce-key">▶ {d.t.bestChar}</span>
          <span className="ce-val">{d.charName}</span>
        </div>
        <div className="ce-row alt">
          <span className="ce-key">▶ {d.t.mainSeries}</span>
          <span className="ce-val">
            {d.seriesList.length === 0 ? (
              <span className="ce-radio off">—</span>
            ) : (
              d.seriesList.map((s) => (
                <span key={s.id} className="concept-chip">
                  {s.label}
                </span>
              ))
            )}
          </span>
        </div>

        <div className="ce-sep">── ACCOUNT ──────────────</div>
        <div className="ce-row">
          <span className="ce-key">▶ {d.t.acctType}</span>
          <span className="ce-val">
            {d.acctList.length === 0 ? (
              <span className="ce-radio off">—</span>
            ) : (
              d.acctList.map((a) => (
                <span key={a.id} className="concept-pill">
                  {a.label}
                </span>
              ))
            )}
          </span>
        </div>

        <div className="ce-sep">── SNS ──────────────────</div>
        <div className="ce-row alt">
          <span className="ce-key">▶ {d.t.fub}</span>
          <span className="ce-val">
            <Radio on={d.fubLabel === d.t.free} label={d.t.free} />
            <Radio on={d.fubLabel === d.t.r4r} label={d.t.r4r} />
          </span>
        </div>
        <div className="ce-row">
          <span className="ce-key">▶ {d.t.parting}</span>
          <span className="ce-val">
            <Radio on={d.partingLabel === d.t.unfollow} label={d.t.unfollow} />
            <Radio on={d.partingLabel === d.t.blockunfollow} label={d.t.blockunfollow} />
            <Radio on={d.partingLabel === d.t.block} label={d.t.block} />
          </span>
        </div>
        <div className="ce-row alt">
          <span className="ce-key">▶ {d.t.otherGenre}</span>
          <span className="ce-val">
            <Radio on={d.otherLabel === d.t.none} label={d.t.none} />
            <Radio on={d.otherLabel === d.t.sometimes} label={d.t.sometimes} />
            <Radio on={d.otherLabel === d.t.often} label={d.t.often} />
          </span>
        </div>

        <div className="ce-sep">── ETC ──────────────────</div>
        <div className="ce-row">
          <span className="ce-key">▶ {d.t.dislike}</span>
          <span className="ce-val">{d.dislike}</span>
        </div>
        <div className="ce-row alt">
          <span className="ce-key">▶ {d.t.pairing}</span>
          <span className="ce-val">{d.pairing}</span>
        </div>
        {d.freeText && (
          <div className="ce-row">
            <span className="ce-key">▶ {d.t.freeText}</span>
            <span className="ce-val">{d.freeText}</span>
          </div>
        )}

        <div className="ce-actions">
          <button type="button" className="ce-button primary" disabled>
            [ {d.lang === 'ko' ? '결정' : d.lang === 'ja' ? '決定' : 'OK'} ]
          </button>
          <button type="button" className="ce-button" disabled>
            [ {d.lang === 'ko' ? '취소' : d.lang === 'ja' ? 'キャンセル' : 'Cancel'} ]
          </button>
        </div>

        <div className="ce-credit">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
