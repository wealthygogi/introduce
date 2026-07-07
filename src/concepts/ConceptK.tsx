import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';
import './ConceptK.css';

function renderTrack(total: number, level: number) {
  return (
    <span className="ck-track" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`ck-seg${i <= level ? ' is-lit' : ''}`} />
      ))}
    </span>
  );
}

export default function ConceptK() {
  const d = useDerived();
  const flavor = {
    ko: { specimen: '개체명', species: '종족', habitat: '서식지', trait: '특성', danger: '위험도', note: '관찰 노트' },
    ja: { specimen: '個体名', species: '種族', habitat: '生息地', trait: '特性', danger: '危険度', note: '観察ノート' },
    en: {
      specimen: 'Specimen',
      species: 'Species',
      habitat: 'Habitat',
      trait: 'Traits',
      danger: 'Danger Lv.',
      note: 'Field Notes',
    },
  }[d.lang];

  // nickname+reroll seeded flavor numbers — same nickname+reroll always yields the same roll
  const autoDexNo = String(d.rollInt('dexNo', 1, 255)).padStart(3, '0');
  const dexNo = d.getCustom('dexNo', autoDexNo);

  // danger is a 1–5 star rating; rolled value is the fallback, but a custom pick is clamped into
  // the same 1–5 range (must clamp — '★'.repeat(n) with n outside 0..5 throws on the negative side)
  const autoDangerLevel = d.rollInt('danger', 1, 5);
  const parsedDanger = parseInt(d.getCustom('danger', String(autoDangerLevel)), 10);
  const dangerLevel = Number.isFinite(parsedDanger) ? Math.min(5, Math.max(1, parsedDanger)) : autoDangerLevel;

  // real ability gauges — the ordinal position of each actual answer
  const fubLevel = d.fubLabel === d.t.free ? 0 : 1;
  const otherLevel = d.otherLabel === d.t.none ? 0 : d.otherLabel === d.t.sometimes ? 1 : 2;
  const partingLevel = d.partingLabel === d.t.unfollow ? 0 : d.partingLabel === d.t.blockunfollow ? 1 : 2;

  return (
    <div id="preview-card" className="card-frame ck-frame-outer">
      <div className="ck-card">
        <img
          className="px ck-cameo"
          src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Cirno.png')}
          alt=""
          aria-hidden="true"
        />

        <div className="ck-topbar">
          <span className="ck-dexno">No.{dexNo}</span>
          <span className="ck-type">YOUKAI</span>
        </div>

        <div className="ck-main">
          <div className="ck-portrait-col">
            <div className="ck-frame">
              <span className="ck-corner ck-tl" aria-hidden="true" />
              <span className="ck-corner ck-tr" aria-hidden="true" />
              <span className="ck-corner ck-bl" aria-hidden="true" />
              <span className="ck-corner ck-br" aria-hidden="true" />
              <img className="px" src={d.charSrc} alt="" />
            </div>
            <div className="ck-specimen">{flavor.specimen}</div>
            <div className="ck-name">{d.nickname}</div>
            <div className="ck-species">
              <span className="ck-species-label">{flavor.species}</span>
              <span className="ck-species-value">{d.charName}</span>
            </div>
            <div className="ck-danger">
              <span className="ck-danger-label">{flavor.danger}</span>
              <span className="ck-danger-stars" aria-hidden="true">
                <span className="ck-star-filled">{'★'.repeat(dangerLevel)}</span>
                <span className="ck-star-empty">{'☆'.repeat(5 - dangerLevel)}</span>
              </span>
            </div>
          </div>

          <div className="ck-stats-col">
            <div className="ck-gauges">
              <span className="ck-gauge-label">{d.t.fub}</span>
              {renderTrack(2, fubLevel)}
              <span className="ck-gauge-value">{d.fubLabel}</span>

              <span className="ck-gauge-label">{d.t.otherGenre}</span>
              {renderTrack(3, otherLevel)}
              <span className="ck-gauge-value">{d.otherLabel}</span>

              <span className="ck-gauge-label">{d.t.parting}</span>
              {renderTrack(3, partingLevel)}
              <span className="ck-gauge-value">{d.partingLabel}</span>
            </div>

            <div className="ck-classify">
              <div className="ck-classify-label">
                {flavor.habitat} · {d.t.mainSeries}
              </div>
              {d.seriesList.length === 0 ? (
                <div className="ck-empty">{d.t.notSelected}</div>
              ) : (
                <div className="ck-classify-grid">
                  {d.seriesList.map((s) => (
                    <span className="ck-classify-item" key={s.id}>
                      <span className="ck-marker" aria-hidden="true" />
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="ck-classify">
              <div className="ck-classify-label">
                {flavor.trait} · {d.t.acctType}
              </div>
              {d.acctList.length === 0 ? (
                <div className="ck-empty">{d.t.notSelected}</div>
              ) : (
                <div className="ck-tag-row">
                  {d.acctList.map((a) => (
                    <span className="ck-tag" key={a.id}>
                      [ {a.label} ]
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ck-notes">
          <div className="ck-notes-label">{flavor.note}</div>
          <div className="ck-notes-row">
            <span className="ck-notes-key">{d.t.dislike}</span>
            {d.dislike}
          </div>
          <div className="ck-notes-row">
            <span className="ck-notes-key">{d.t.pairing}</span>
            {d.pairing}
          </div>
          {d.freeText && <div className="ck-notes-free">{d.freeText}</div>}
        </div>

        <div className="ck-footer">
          <span className="ck-footer-part">Touhou Project © ZUN</span>
          {' · '}
          <span className="ck-footer-part">Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
