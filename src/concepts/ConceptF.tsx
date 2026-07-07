import './ConceptF.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

const MASTHEAD = { ko: '분분마루 신문', ja: '文々。新聞', en: 'Bunbunmaru News' };
const EDITION = { ko: '호외 · 특별판', ja: '号外・特別版', en: 'EXTRA EDITION' };
const PUBLISHER = { ko: '환상향 발행', ja: '幻想郷発行', en: 'Published in Gensokyo' };
const BYLINE = { ko: '기자 · 샤메이마루 아야', ja: '記者・射命丸文', en: 'Reporter: Aya Shameimaru' };
const FEATURE_TAG = { ko: '금주의 인물', ja: '今週の人物', en: 'Person of the Week' };
const HEAD_INDEX = { ko: '지면 안내', ja: '紙面案内', en: 'Inside This Issue' };
const HEAD_PROFILE = { ko: '인물', ja: '人物', en: 'PROFILE' };
const HEAD_SNS = { ko: 'SNS 동향', ja: 'SNS動向', en: 'SNS REPORT' };
const HEAD_VOICE = { ko: '독자의 소리', ja: '読者の声', en: "READER'S VOICE" };
const AD_TEXT = {
  ko: '광고 · 요괴 퇴치 상담은 하쿠레이 신사로',
  ja: '広告・妖怪退治のご相談は博麗神社まで',
  en: 'AD · For youkai extermination, consult Hakurei Shrine',
};
const PRICE_TAG = { ko: '정가 5문', ja: '定価5文', en: 'Price: 5 mon' };

export default function ConceptF() {
  const d = useDerived();
  // nickname+reroll seeded issue number — same nickname+reroll always yields the same roll
  const issueNo = d.getCustom('issueNo', String(d.rollInt('issueNo', 1, 999)));

  const lede = {
    ko: `취재 결과, ${d.nickname} 씨가 가장 아끼는 캐릭터는 「${d.charName}」인 것으로 밝혀졌다.`,
    ja: `取材の結果、${d.nickname}さんが最も大切にしているキャラクターは「${d.charName}」であることが判明した。`,
    en: `Sources confirm that ${d.nickname}'s favorite character is none other than "${d.charName}."`,
  }[d.lang];

  const voice = {
    ko: `한편 "${d.dislike}"는 되도록 피하고 싶다는 뜻을 전했으며, 최애 커플링으로는 "${d.pairing}"을 꼽았다.`,
    ja: `一方、「${d.dislike}」はできれば避けたいとのこと。推しカップリングには「${d.pairing}」を挙げた。`,
    en: `Meanwhile, they'd rather steer clear of "${d.dislike}" — and when it comes to pairings, "${d.pairing}" tops the list.`,
  }[d.lang];

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cf-card">
        <div className="cf-masthead">
          <div className="cf-masthead-title">{MASTHEAD[d.lang]}</div>
          <div className="cf-masthead-meta">
            <span>{EDITION[d.lang]}</span>
            <span>{PUBLISHER[d.lang]}</span>
            <span>No.{issueNo}</span>
          </div>
        </div>

        <div className="cf-headline">{d.nickname}</div>
        <div className="cf-byline">
          <img
            className="px cf-byline-icon"
            src={spriteUrl('1. Mainline Games/[9] Kaeizuka ~ Phantasmagoria of Flower View/Aya Shameimaru.png')}
            alt=""
          />
          <span>{BYLINE[d.lang]}</span>
        </div>

        <div className="cf-top">
          <div className="cf-photo">
            <div className="cf-photo-frame">
              <img
                className={d.avatarIsPhoto ? 'cf-photo-real' : 'px cf-photo-sprite'}
                src={d.avatarSrc}
                alt={d.nickname}
              />
            </div>
            <div className="cf-photo-caption">
              {FEATURE_TAG[d.lang]} · {d.nickname}
            </div>
          </div>

          <div className="cf-index">
            <div className="cf-index-title">{HEAD_INDEX[d.lang]}</div>
            <div className="cf-index-group">
              <div className="cf-index-group-label">{d.t.mainSeries}</div>
              {d.seriesList.length === 0 ? (
                <div className="cf-index-line muted">
                  <span>{d.t.notSelected}</span>
                </div>
              ) : (
                d.seriesList.map((s, i) => (
                  <div className="cf-index-line" key={s.id}>
                    <span className="cf-index-name">{s.label}</span>
                    <span className="cf-index-leader" aria-hidden="true" />
                    <span className="cf-index-page">{i + 1}</span>
                  </div>
                ))
              )}
            </div>
            <div className="cf-index-group">
              <div className="cf-index-group-label">{d.t.acctType}</div>
              {d.acctList.length === 0 ? (
                <div className="cf-index-line muted">
                  <span>{d.t.notSelected}</span>
                </div>
              ) : (
                d.acctList.map((a, i) => (
                  <div className="cf-index-line" key={a.id}>
                    <span className="cf-index-name">{a.label}</span>
                    <span className="cf-index-leader" aria-hidden="true" />
                    <span className="cf-index-page">{d.seriesList.length + i + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="cf-article">
          <div className="cf-subhead">{HEAD_PROFILE[d.lang]}</div>
          <p className="cf-lede-text">
            <img className="px cf-lede-icon" src={d.charSrc} alt={d.charName} />
            {lede}
          </p>

          <div className="cf-subhead">{HEAD_SNS[d.lang]}</div>
          <p className="cf-agate">
            {d.t.fub}: <strong>{d.fubLabel}</strong> · {d.t.parting}: <strong>{d.partingLabel}</strong> ·{' '}
            {d.t.otherGenre}: <strong>{d.otherLabel}</strong>
          </p>

          {d.freeText && (
            <blockquote className="cf-pullquote">
              <span className="cf-pullquote-mark" aria-hidden="true">
                “
              </span>
              {d.freeText}
            </blockquote>
          )}

          <div className="cf-subhead">{HEAD_VOICE[d.lang]}</div>
          <p className="cf-para">{voice}</p>
        </div>

        <div className="cf-bottom">
          <div className="cf-adbox">{AD_TEXT[d.lang]}</div>
          <div className="cf-issue">
            {PRICE_TAG[d.lang]} · {EDITION[d.lang]}
          </div>
        </div>

        <div className="cf-footer">
          <span className="cf-credit-part">Touhou Project © ZUN</span>{' '}
          <span className="cf-credit-part">· Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
