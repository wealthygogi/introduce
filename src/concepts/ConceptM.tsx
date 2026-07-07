import './ConceptM.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';
import type { Lang } from '../data/i18n';

/** "1부 · 그림" / "第1部 · 絵" / "Part 1 · Drawing" */
function programLine(lang: Lang, index: number, label: string): string {
  const n = index + 1;
  if (lang === 'ko') return `${n}부 · ${label}`;
  if (lang === 'ja') return `第${n}部 · ${label}`;
  return `Part ${n} · ${label}`;
}

/** pull "06" out of a "TH06 홍마향" style label, else fall back to first 2 chars */
function seriesCode(label: string): string {
  const m = label.match(/^TH(\d+)/);
  if (m) return m[1];
  return label.slice(0, 2);
}

const SEAL_TILT = [-6, 4, -3, 7, -5, 3, -7, 5, -4, 6, -2, 8, -8, 2, -5, 4, 3, -6, 5, -3, 7, -4];

export default function ConceptM() {
  const d = useDerived();

  const T = {
    ko: {
      invite: '이변 해결을 기념하여 여는 연회에 귀하를 초대합니다',
      seat: '좌석',
      time: '시간',
      guest: '동반',
      program: '연회 순서',
      roll: '참석 회차',
      rsvp: '회신',
    },
    ja: {
      invite: '事件解決を記念する宴に貴方をご招待いたします',
      seat: '座席',
      time: '時間',
      guest: '同伴',
      program: '宴の次第',
      roll: '参加回',
      rsvp: '返信',
    },
    en: {
      invite: 'You are cordially invited to the Gensokyo banquet',
      seat: 'Seat',
      time: 'Time',
      guest: 'Guest',
      program: 'Program',
      roll: 'In Attendance',
      rsvp: 'RSVP',
    },
  }[d.lang];

  // nickname+reroll seeded invitation fiction, but the guest can pin their own via the card-only fields
  const autoSeat = `${d.rollPick('seat-row', ['A', 'B', 'C', 'D', 'E', 'F'])}-${String(d.rollInt('seat-num', 1, 20)).padStart(2, '0')}`;
  const TIMES = ['18:00', '19:00', '19:30', '20:00', '20:30'];
  const autoTime = d.rollPick('time', TIMES);
  const seatLabel = d.getCustom('seat', autoSeat);
  const timeLabel = d.getCustom('time', autoTime);

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cm-card">
        <div className="cm-invite-panel">
          <img
            className="px cm-watermark"
            src={spriteUrl('1. Mainline Games/[7] Youyoumu ~ Perfect Cherry Blossom/Yuyuko Saigyouji.png')}
            alt=""
            aria-hidden
          />

          <div className="cm-orn" aria-hidden>
            ❧ ❦ ❧
          </div>
          <div className="cm-kicker">{T.invite}</div>
          <h1 className="cm-title font-serif">{d.nickname}</h1>
          <div className="cm-rule" aria-hidden />

          <div className="cm-notice-block">
            <div className="cm-notice">
              <span>
                {d.t.fub} · {d.fubLabel}
              </span>
              <span>
                {d.t.parting} · {d.partingLabel}
              </span>
              <span>
                {d.t.otherGenre} · {d.otherLabel}
              </span>
            </div>
            <div className="cm-notice">
              <span>
                {d.t.dislike} · {d.dislike}
              </span>
              <span>
                {d.t.pairing} · {d.pairing}
              </span>
            </div>
          </div>

          {d.freeText && (
            <div className="cm-rsvp">
              <div className="cm-rsvp-label">{T.rsvp}</div>
              <div className="cm-rsvp-text font-serif">“{d.freeText}”</div>
            </div>
          )}
        </div>

        <div className="cm-stub">
          <div className="cm-stub-top">
            <div className="cm-stub-cell">
              <div className="cm-stub-label">{T.seat}</div>
              <div className="cm-stub-value">{seatLabel}</div>
            </div>
            <div className="cm-stub-cell">
              <div className="cm-stub-label">{T.time}</div>
              <div className="cm-stub-value">{timeLabel}</div>
            </div>
            <div className="cm-stub-cell wide">
              <div className="cm-stub-label">{T.guest}</div>
              <div className="cm-stub-guest">
                <img className="px cm-guest-sprite" src={d.charSrc} alt="" />
                <span className="cm-guest-name font-serif">{d.charName}</span>
              </div>
            </div>
          </div>

          <div className="cm-program">
            <div className="cm-program-label">{T.program}</div>
            {d.acctList.length === 0 ? (
              <div className="cm-empty">{d.t.notSelected}</div>
            ) : (
              <ul className="cm-program-list">
                {d.acctList.map((a, i) => (
                  <li key={a.id}>{programLine(d.lang, i, a.label)}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="cm-roll">
            <div className="cm-program-label">{T.roll}</div>
            {d.seriesList.length === 0 ? (
              <div className="cm-empty">{d.t.notSelected}</div>
            ) : (
              <div className="cm-seals">
                {d.seriesList.map((s, i) => (
                  <span
                    className="cm-seal"
                    key={s.id}
                    style={{ transform: `rotate(${SEAL_TILT[i % SEAL_TILT.length]}deg)` }}
                  >
                    {seriesCode(s.label)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="cm-orn" aria-hidden>
            ❧ ❦ ❧
          </div>
          <div className="cm-credits">Touhou Project © ZUN · Sprites by Majstek</div>
        </div>
      </div>
    </div>
  );
}
