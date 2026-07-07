import './ConceptO.css';
import { useDerived } from '../hooks/useDerived';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** pull "06" out of a "TH06 홍마향" style label, else fall back to first 2 chars */
function seriesCode(label: string): string {
  const m = label.match(/^TH(\d+)/);
  if (m) return m[1];
  return label.slice(0, 2);
}

/** Gensokyo-flavored "energy" types standing in for a TCG elemental symbol */
const ENERGY = [
  { glyph: '幻', color: '#b98bff' },
  { glyph: '霊', color: '#7ad9ff' },
  { glyph: '花', color: '#ff8ad1' },
  { glyph: '月', color: '#ffd76a' },
  { glyph: '夢', color: '#6ee7d8' },
];

export default function ConceptO() {
  const d = useDerived();

  const energy = ENERGY[hashStr(d.charSrc) % ENERGY.length];

  // HP: nickname+reroll seeded roll, 50–300 in steps of 10
  const autoHp = d.rollInt('hp', 5, 30) * 10;
  const hp = d.getCustom('hp', String(autoHp));

  // rarity is a 1–5 star rating; rolled value is the fallback, but a custom pick is clamped into the
  // same 1–5 range (must clamp — a raw '★'.repeat(n) with n > total pips throws, since '☆'.repeat() can't go negative)
  const RARITY_MAX = 5;
  const autoRarityFilled = d.rollInt('rarity', 1, RARITY_MAX);
  const parsedRarity = parseInt(d.getCustom('rarity', String(autoRarityFilled)), 10);
  const rarityFilled = Number.isFinite(parsedRarity) ? Math.min(RARITY_MAX, Math.max(1, parsedRarity)) : autoRarityFilled;
  const rarity = '★'.repeat(rarityFilled) + '☆'.repeat(RARITY_MAX - rarityFilled);

  // card serial — nickname+reroll seeded roll, reacts to 🎲
  const serial = String(d.rollInt('serial', 1, 998)).padStart(3, '0');

  // move damage — nickname+reroll seeded roll per account-type id, 10–120 in steps of 10
  const moves = d.acctList
    .map((a) => ({ ...a, dmg: d.rollInt('move-' + a.id, 1, 12) * 10 }))
    .sort((a, b) => b.dmg - a.dmg)
    .slice(0, 3);

  const setEntries = d.seriesList.slice(0, 4);
  const setOverflow = d.seriesList.length - setEntries.length;

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="co-frame">
        <div className="co-card">
          <div className="co-holo" aria-hidden />

          <div className="co-topbar">
            <div className="co-name-wrap">
              <span className="co-energy" style={{ background: energy.color }} aria-hidden>
                {energy.glyph}
              </span>
              <span className="co-name">{d.nickname}</span>
            </div>
            <div className="co-hp">
              <span className="co-hp-num">{hp}</span>
              <span className="co-hp-label font-pixel">HP</span>
            </div>
          </div>

          <div className="co-art">
            <div className="co-art-inner">
              <img className="px co-art-sprite" src={d.charSrc} alt={d.charName} />
              <div className="co-art-plate">
                <span className="co-art-kicker">{d.t.bestChar}</span>
                <span className="co-art-name">{d.charName}</span>
              </div>
            </div>
          </div>

          <div className="co-moves">
            {moves.length === 0 ? (
              <div className="co-move co-move-empty">
                <span className="co-move-name">{d.t.notSelected}</span>
                <span className="co-move-leader" aria-hidden />
                <span className="co-move-dmg font-pixel">--</span>
              </div>
            ) : (
              moves.map((m) => (
                <div className="co-move" key={m.id}>
                  <span className="co-move-name">{m.label}</span>
                  <span className="co-move-leader" aria-hidden />
                  <span className="co-move-dmg font-pixel">{m.dmg}</span>
                </div>
              ))
            )}
          </div>

          <div className="co-substats">
            <div className="co-substat">
              <div className="co-substat-label">{d.t.fub}</div>
              <div className="co-substat-value">{d.fubLabel}</div>
            </div>
            <div className="co-substat">
              <div className="co-substat-label">{d.t.parting}</div>
              <div className="co-substat-value">{d.partingLabel}</div>
            </div>
            <div className="co-substat">
              <div className="co-substat-label">{d.t.otherGenre}</div>
              <div className="co-substat-value">{d.otherLabel}</div>
            </div>
          </div>

          {d.freeText && <div className="co-flavor">“{d.freeText}”</div>}

          <div className="co-bottom-row">
            <div className="co-notes">
              {d.t.dislike} {d.dislike} · {d.t.pairing} {d.pairing}
            </div>
            <div className="co-rarity-set">
              <span className="co-rarity" aria-hidden>
                {rarity}
              </span>
              {setEntries.length > 0 && (
                <div className="co-set-symbols">
                  {setEntries.map((s) => (
                    <span className="co-set-symbol" key={s.id}>
                      <span>{seriesCode(s.label)}</span>
                    </span>
                  ))}
                  {setOverflow > 0 && <span className="co-set-overflow">+{setOverflow}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="co-footer">
            <span>Touhou Project © ZUN · Sprites by Majstek</span>
            <span className="font-pixel">No.{serial}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
