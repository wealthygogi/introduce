import './ConceptG.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

const OMIKUJI_LABEL = { ko: '오미쿠지', ja: '御神籤', en: 'OMIKUJI' };
const SHRINE_LABEL = { ko: '하쿠레이 신사', ja: '博麗神社', en: 'Hakurei Shrine' };
const ADVICE_TITLE = { ko: '신사의 조언', ja: '神社のお告げ', en: "Shrine's Advice" };
const WISH_TITLE = { ko: '소원 성취', ja: '願い事', en: 'Your Wish' };
const SEAL_TEXT = { ko: '験', ja: '験', en: 'SEAL' };
/** 가중 등급 배열 — 좋은 등급일수록 자주, 흉은 드물게 나오도록 중복 배치 */
const RANKS = ['大吉', '大吉', '大吉', '中吉', '中吉', '吉', '吉', '小吉', '末吉', '凶'];

function formatLot(lang: 'ko' | 'ja' | 'en', n: string) {
  if (lang === 'ko') return `제 ${n} 번`;
  if (lang === 'ja') return `第${n}番`;
  return `No. ${n}`;
}

export default function ConceptG() {
  const d = useDerived();
  const lotNo = d.getCustom('lotNo', String(d.rollInt('lotNo', 1, 88)));
  const rank = d.getCustom('rank', d.rollPick('rank', RANKS));
  const fubGlyph = d.fubLabel === d.t.free ? '吉' : '中吉';
  const partingGlyph =
    d.partingLabel === d.t.unfollow ? '小吉' : d.partingLabel === d.t.blockunfollow ? '凶' : '大凶';
  const otherGlyph = d.otherLabel === d.t.none ? '吉' : d.otherLabel === d.t.sometimes ? '中吉' : '末吉';
  const isVertical = d.lang !== 'en';

  return (
    <div id="preview-card" className="card-frame">
      <div className={`cg-card ${isVertical ? '' : 'cg-flat'}`}>
        <div className="cg-surface-mark" aria-hidden="true">
          籤
        </div>

        <div className="cg-slip">
          <div className="cg-slip-top">
            <div className="cg-rank">{rank}</div>
            <div className="cg-top-side">
              <div className="cg-vert-label">{OMIKUJI_LABEL[d.lang]}</div>
              <div className="cg-lot">{formatLot(d.lang, lotNo)}</div>
            </div>
          </div>

          <div className="cg-shrine">
            <img
              className="px cg-shrine-icon"
              src={spriteUrl('4. Other/[1] Main Characters/Reimu Hakurei.png')}
              alt=""
            />
            <span>{SHRINE_LABEL[d.lang]}</span>
          </div>

          <div className="cg-name">{d.nickname}</div>

          <div className="cg-columns">
            <div className="cg-col-row">
              <div className="cg-col">
                <span className="cg-col-label">{d.t.bestChar}</span>
                <span className="cg-col-sep">/</span>
                <span className="cg-col-value">{d.charName}</span>
              </div>

              <div className="cg-col">
                <span className="cg-col-label">{d.t.mainSeries}</span>
                <span className="cg-col-sep">/</span>
                <span className={`cg-col-value ${d.seriesList.length === 0 ? 'is-empty' : ''}`}>
                  {d.seriesList.length === 0 ? d.t.notSelected : d.seriesList.map((s) => s.label).join('・')}
                </span>
              </div>

              <div className="cg-col">
                <span className="cg-col-label">{d.t.acctType}</span>
                <span className="cg-col-sep">/</span>
                <span className={`cg-col-value ${d.acctList.length === 0 ? 'is-empty' : ''}`}>
                  {d.acctList.length === 0 ? d.t.notSelected : d.acctList.map((a) => a.label).join('・')}
                </span>
              </div>
            </div>

            <div className="cg-col-row">
              <div className="cg-col">
                <span className="cg-col-label">{d.t.fub}</span>
                <span className="cg-col-glyph">{fubGlyph}</span>
                <span className="cg-col-value">{d.fubLabel}</span>
              </div>

              <div className="cg-col">
                <span className="cg-col-label">{d.t.parting}</span>
                <span className="cg-col-glyph">{partingGlyph}</span>
                <span className="cg-col-value">{d.partingLabel}</span>
              </div>

              <div className="cg-col">
                <span className="cg-col-label">{d.t.otherGenre}</span>
                <span className="cg-col-glyph">{otherGlyph}</span>
                <span className="cg-col-value">{d.otherLabel}</span>
              </div>
            </div>
          </div>

          <div className="cg-oracle">
            <div className="cg-oracle-title">{ADVICE_TITLE[d.lang]}</div>
            <div className="cg-oracle-line">
              <span className="cg-oracle-tag">{d.t.dislike}</span>
              <span className="cg-oracle-value">{d.dislike}</span>
            </div>
            <div className="cg-oracle-line">
              <span className="cg-oracle-tag">{d.t.pairing}</span>
              <span className="cg-oracle-value">{d.pairing}</span>
            </div>
          </div>

          {d.freeText && (
            <div className="cg-wish">
              <div className="cg-wish-title">{WISH_TITLE[d.lang]}</div>
              <div className="cg-wish-text">{d.freeText}</div>
            </div>
          )}

          <div className="cg-stamp" aria-hidden="true">
            <span>{SEAL_TEXT[d.lang]}</span>
          </div>

          <div className="cg-footer">
            <span>Touhou Project © ZUN</span> · <span>Sprites by Majstek</span>
          </div>
        </div>
      </div>
    </div>
  );
}
