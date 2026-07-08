import './ConceptH.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

const CLINIC_NAME = { ko: '영원정', ja: '永遠亭', en: 'Eientei' };
const CHART_TITLE = { ko: '진료 차트', ja: '診療チャート', en: 'Medical Chart' };
const DOCTOR_LABEL = { ko: '담당의 · 야고코로 에이린', ja: '担当医・八意永琳', en: 'Attending: Dr. Eirin Yagokoro' };
const DOCTOR_STAMP = { ko: '永琳', ja: '永琳', en: 'E.Y.' };
const PATIENT_LABEL = { ko: '환자', ja: '患者', en: 'Patient' };
const VITALS_LABEL = { ko: '바이탈', ja: 'バイタル', en: 'Vitals' };
const ALLERGY_TAG = { ko: '알레르기 소견', ja: 'アレルギー所見', en: 'Allergy Note' };
const HISTORY_TAG = { ko: '기왕력', ja: '既往歴', en: 'History' };
const RX_TAG = { ko: '처방', ja: '処方', en: 'Rx' };
const RX_DOSAGE = {
  ko: '용법 · 1일 3회, SNS 접속 시마다 복용',
  ja: '用法・1日3回、SNS接続の都度服用',
  en: 'Dosage · 3x daily, with every SNS login',
};
const NO_RX = { ko: '처방 없음', ja: '処方なし', en: 'No prescription' };
const ASSESSMENT_TAG = { ko: '소견', ja: '所見', en: 'Assessment' };
const INTERACTION_TAG = { ko: '병용 조합', ja: '併用', en: 'Combined With' };
const NOTE_TAG = { ko: '특이사항', ja: '特記事項', en: 'Special Notes' };
const SIGNATURE_LABEL = { ko: '처방의 서명', ja: '処方医署名', en: "Physician's Signature" };

/** vitals line — temp/pulse/devotion are nickname+reroll seeded rolls, spliced into the localized template */
function formatVitals(lang: 'ko' | 'ja' | 'en', temp: string, pulse: number, devotion: string) {
  if (lang === 'ko') return `체온 ${temp}℃ · 맥박 ${pulse}회/분 · 최애 지수 ${devotion}%`;
  if (lang === 'ja') return `体温${temp}℃・脈拍${pulse}回/分・推し指数${devotion}%`;
  return `Temp ${temp}°C · Pulse ${pulse}bpm · Devotion ${devotion}%`;
}

export default function ConceptH() {
  const d = useDerived();

  // vitals — nickname+reroll seeded rolls so the "덕질 발열" joke actually varies on 🎲
  const pulse = d.rollInt('pulse', 60, 180);
  const temp = (d.rollInt('temp', 360, 420) / 10).toFixed(1);
  const devotion = d.getCustom('devotion', String(d.rollInt('devotion', 1, 100)));

  return (
    <div id="preview-card" className="card-frame">
      <div className="ch-card">
        <div className="ch-header">
          <div className="ch-rx-symbol" aria-hidden="true">
            ℞
          </div>
          <div className="ch-clinic">
            <div className="ch-clinic-name">{CLINIC_NAME[d.lang]}</div>
            <div className="ch-clinic-sub">{CHART_TITLE[d.lang]}</div>
            <div className="ch-doctor">
              <img
                className="px ch-doctor-icon"
                src={spriteUrl('1. Mainline Games/[8] Eiyashou ~ Imperishable Night/Eirin Yagokoro.png')}
                alt=""
              />
              <span>{DOCTOR_LABEL[d.lang]}</span>
            </div>
          </div>
        </div>

        <div className="ch-vitals">
          <span className="ch-vitals-tag">{VITALS_LABEL[d.lang]}</span>
          <span className="ch-vitals-text">{formatVitals(d.lang, temp, pulse, devotion)}</span>
        </div>

        <div className="ch-patient">
          <span className={`ch-avatar ${d.avatarIsPhoto ? 'photo' : ''}`}>
            <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt="" />
          </span>
          <div>
            <div className="ch-patient-tag">
              {PATIENT_LABEL[d.lang]} ({d.t.nickname})
            </div>
            <div className="ch-patient-name">{d.nickname}</div>
          </div>
        </div>

        <table className="ch-table">
          <tbody>
            <tr>
              <th scope="row">{d.t.bestChar}</th>
              <td>
                <div className="ch-fav">
                  <img className="px" src={d.charSrc} alt={d.charName} />
                  <span>{d.charName}</span>
                </div>
              </td>
            </tr>
            {d.dislike && (
              <tr>
                <th scope="row">{ALLERGY_TAG[d.lang]}</th>
                <td>
                  <span className="ch-check-item ch-check-item-wrap">
                    <span className="ch-check is-on" aria-hidden="true" />
                    {d.dislike}
                  </span>
                </td>
              </tr>
            )}
            <tr>
              <th scope="row">
                {HISTORY_TAG[d.lang]} <small>({d.t.mainSeries})</small>
              </th>
              <td>
                <div className="ch-check-wrap">
                  {d.seriesList.length === 0 ? (
                    <span className="ch-check-item">
                      <span className="ch-check" aria-hidden="true" />
                      {d.t.notSelected}
                    </span>
                  ) : (
                    d.seriesList.map((s) => (
                      <span className="ch-check-item" key={s.id}>
                        <span className="ch-check is-on" aria-hidden="true" />
                        {s.label}
                      </span>
                    ))
                  )}
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">
                {RX_TAG[d.lang]} <small>({d.t.acctType})</small>
              </th>
              <td>
                {d.acctList.length === 0 ? (
                  <div className="ch-rx-empty">{NO_RX[d.lang]}</div>
                ) : (
                  <>
                    <ol className="ch-rx-list">
                      {d.acctList.map((a) => (
                        <li key={a.id}>{a.label}</li>
                      ))}
                    </ol>
                    <div className="ch-rx-dosage">{RX_DOSAGE[d.lang]}</div>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">{ASSESSMENT_TAG[d.lang]}</th>
              <td className="ch-small">
                {d.t.fub}: {d.fubLabel} · {d.t.parting}: {d.partingLabel} · {d.t.otherGenre}: {d.otherLabel}
              </td>
            </tr>
            {d.pairing && (
              <tr>
                <th scope="row">
                  {INTERACTION_TAG[d.lang]} <small>({d.t.pairing})</small>
                </th>
                <td>{d.pairing}</td>
              </tr>
            )}
            {d.freeText && (
              <tr>
                <th scope="row">{NOTE_TAG[d.lang]}</th>
                <td className="ch-pre">{d.freeText}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="ch-signature">
          <div className="ch-signature-line">
            <span className="ch-signature-tag">{SIGNATURE_LABEL[d.lang]}</span>
            <span className="ch-signature-script">Eirin Yagokoro</span>
          </div>
          <div className="ch-stamp" aria-hidden="true">
            <span>{DOCTOR_STAMP[d.lang]}</span>
          </div>
        </div>

        <div className="ch-footer">
          <span>Touhou Project © ZUN</span> · <span>Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
