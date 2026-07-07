import './ConceptL.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

function toRoman(n: number): string {
  const table: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let rem = n;
  for (const [value, sym] of table) {
    while (rem >= value) {
      out += sym;
      rem -= value;
    }
  }
  return out;
}

export default function ConceptL() {
  const d = useDerived();
  const archive =
    d.lang === 'ko'
      ? '홍마관 대도서관 「브와르」 소장'
      : d.lang === 'ja'
      ? '紅魔館大図書館「ヴォワル」所蔵'
      : 'Archived in the Voile, Scarlet Devil Mansion Library';
  const spellsHeading = { ko: '주문 목록', ja: '呪文目録', en: 'Spell Index' }[d.lang];
  const archiveHeading = { ko: '장서 색인', ja: '蔵書索引', en: 'Archive Catalog' }[d.lang];
  const prefaceHeading = { ko: '서문', ja: '序文', en: 'Preface' }[d.lang];
  // volume number defaults to a classic archival numeral; the reader can pin their own via the card-only field
  const volNo = d.getCustom('volNo', 'VII');

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cl-card">
        <div className="cl-cover">
          <span className="cl-sigil" aria-hidden="true">
            ✦ ✧ ✦
          </span>
          <span className="cl-overline">GRIMOIRE</span>
          <span className="cl-sigil" aria-hidden="true">
            ✦ ✧ ✦
          </span>
          <img
            className="px cl-mood-sprite"
            src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Patchouli Knowledge.png')}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className="cl-spread">
          <div className="cl-page cl-page-left">
            <div className="cl-circle" aria-hidden="true">
              <span className="cl-circle-sq" />
              <span className="cl-circle-sq cl-alt" />
            </div>

            <h1 className="cl-title font-serif">{d.nickname}</h1>
            <div className="cl-archive">{archive}</div>

            <div className="cl-rule" aria-hidden="true" />

            <div className="cl-author">
              <img className="px cl-author-sprite" src={d.charSrc} alt="" />
              <div className="cl-author-text">
                <div className="cl-author-label">{d.t.bestChar}</div>
                <div className="cl-author-name font-serif">{d.charName}</div>
              </div>
            </div>

            <div className="cl-margin">
              <div className="cl-margin-row">
                {d.t.fub} {d.fubLabel} · {d.t.parting} {d.partingLabel} · {d.t.otherGenre} {d.otherLabel}
              </div>
              <div className="cl-margin-row">
                {d.t.dislike} {d.dislike}
              </div>
              <div className="cl-margin-row">
                {d.t.pairing} {d.pairing}
              </div>
            </div>
          </div>

          <div className="cl-spine">
            <span className="cl-spine-vol font-serif">Vol. {volNo}</span>
          </div>

          <div className="cl-page cl-page-right">
            <div className="cl-section">
              <div className="cl-page-heading">{spellsHeading}</div>
              {d.acctList.length === 0 ? (
                <div className="cl-empty">{d.t.notSelected}</div>
              ) : (
                <ol className="cl-spell-list font-serif">
                  {d.acctList.map((a, i) => (
                    <li key={a.id}>
                      <span className="cl-spell-no">{toRoman(i + 1)}</span>
                      <span className="cl-spell-name">{a.label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="cl-section">
              <div className="cl-page-heading">{archiveHeading}</div>
              {d.seriesList.length === 0 ? (
                <div className="cl-empty">{d.t.notSelected}</div>
              ) : (
                <ul className="cl-index-list font-serif">
                  {d.seriesList.map((s) => (
                    <li key={s.id}>
                      <span className="cl-index-mark" aria-hidden="true">
                        §
                      </span>
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {d.freeText && (
              <div className="cl-section cl-preface">
                <div className="cl-page-heading">{prefaceHeading}</div>
                <p className="cl-preface-text font-serif">{d.freeText}</p>
              </div>
            )}

            <div className="cl-page-foot" aria-hidden="true">
              <span className="cl-sigil-sm">✦ ✧ ✦</span>
            </div>
          </div>
        </div>

        <div className="cl-credits">
          <span className="cl-credits-part">Touhou Project © ZUN</span>
          {' · '}
          <span className="cl-credits-part">Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
