import type { ReactNode } from 'react';
import './ConceptN.css';
import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';

const SYSTEM_SPRITE = spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png');

function Received({ text }: { text: string }) {
  return (
    <div className="cn-msg cn-msg-received">
      <img className="px cn-msg-avatar" src={SYSTEM_SPRITE} alt="" aria-hidden />
      <div className="cn-bubble-wrap">
        <div className="cn-bubble received">{text}</div>
      </div>
    </div>
  );
}

function Sent({ children, time, hero }: { children: ReactNode; time: string; hero?: boolean }) {
  return (
    <div className="cn-msg cn-msg-sent">
      <div className="cn-bubble-wrap">
        <div className={hero ? 'cn-bubble sent hero' : 'cn-bubble sent'}>{children}</div>
        <span className="cn-msg-time">{time}</span>
      </div>
    </div>
  );
}

export default function ConceptN() {
  const d = useDerived();
  // default handle is nickname-derived; a custom handle may be typed with or without the leading '@'
  const autoHandle = '@' + d.nickname.replace(/\s+/g, '');
  const rawHandle = d.getCustom('handle', autoHandle);
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const onlineLabel = d.lang === 'ko' ? '온라인' : d.lang === 'ja' ? 'オンライン' : 'Online';

  const S = {
    ko: {
      q: [
        '안녕! 자기소개랑 최애 좀 알려줄래?',
        '어떤 시리즈를 제일 좋아해?',
        '탐라 스타일이랑 SNS는 어때?',
        '마지막으로 하나만 더!',
      ],
      times: ['오후 3:01', '오후 3:04', '오후 3:07', '오후 3:11'],
      hi: (n: string) => `안녕, 나는 ${n}!`,
    },
    ja: {
      q: [
        'こんにちは!自己紹介と推しキャラを教えて?',
        '一番好きなシリーズは?',
        '普段の呟き方とアカウントは?',
        '最後にもう一つだけ!',
      ],
      times: ['午後3:01', '午後3:04', '午後3:07', '午後3:11'],
      hi: (n: string) => `こんにちは、${n}です!`,
    },
    en: {
      q: [
        "Hey! Introduce yourself, and who's your favorite character?",
        'Which series do you love most?',
        "What's your timeline & account style?",
        'One last thing!',
      ],
      times: ['3:01 PM', '3:04 PM', '3:07 PM', '3:11 PM'],
      hi: (n: string) => `Hi, I'm ${n}!`,
    },
  }[d.lang];

  const seriesLine = d.seriesList.length === 0 ? d.t.notSelected : d.seriesList.map((s) => s.label).join(' · ');
  const habitsLine = `${d.t.fub} ${d.fubLabel} · ${d.t.parting} ${d.partingLabel} · ${d.t.otherGenre} ${d.otherLabel}`;
  // dislike/pairing are free text and may both be blank — fall back to whichever
  // one is filled in, and skip the closing Q&A pair entirely when neither is
  const hasDislike = Boolean(d.dislike);
  const hasPairing = Boolean(d.pairing);
  const noteLine =
    hasDislike && hasPairing
      ? `${d.t.dislike} ${d.dislike} · ${d.t.pairing} ${d.pairing}`
      : hasDislike
        ? `${d.t.dislike} ${d.dislike}`
        : hasPairing
          ? `${d.t.pairing} ${d.pairing}`
          : '';

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="cn-card">
        <div className="cn-cover">
          <img className="px cn-cover-sprite" src={SYSTEM_SPRITE} alt="" aria-hidden />
        </div>

        <div className={`cn-avatar ${d.avatarIsPhoto ? 'photo' : ''}`}>
          <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt={d.charName} />
        </div>

        <div className="cn-body">
          <div className="cn-name-row">
            <div className="cn-name-block">
              <div className="cn-nickname">{d.nickname}</div>
              <div className="cn-handle">{handle}</div>
            </div>
            <div className="cn-online">
              <span className="cn-online-dot" aria-hidden />
              {onlineLabel}
            </div>
          </div>

          {d.freeText && <div className="cn-status">{d.freeText}</div>}

          <div className="cn-badge-row">
            {d.acctList.length === 0 ? (
              <span className="cn-badge cn-badge-empty">{d.t.notSelected}</span>
            ) : (
              d.acctList.map((a) => (
                <span className="cn-badge" key={a.id}>
                  {a.label}
                </span>
              ))
            )}
          </div>

          <div className="cn-stream">
            <Received text={S.q[0]} />
            <Sent time={S.times[0]} hero>
              <span className="cn-hero-greet">{S.hi(d.nickname)}</span>
              <span className="cn-hero-row">
                <img className="px cn-hero-sprite" src={d.charSrc} alt="" />
                <span className="cn-hero-text">
                  <span className="cn-hero-kicker">{d.t.bestChar}</span>
                  <span className="cn-hero-name">{d.charName}</span>
                </span>
              </span>
            </Sent>

            <Received text={S.q[1]} />
            <Sent time={S.times[1]}>{seriesLine}</Sent>

            <Received text={S.q[2]} />
            <Sent time={S.times[2]}>{habitsLine}</Sent>

            {noteLine && (
              <>
                <Received text={S.q[3]} />
                <Sent time={S.times[3]}>{noteLine}</Sent>
              </>
            )}
          </div>
        </div>

        <div className="cn-footer">
          <span>Touhou Project © ZUN</span>
          <span aria-hidden>·</span>
          <span>Sprites by Majstek</span>
        </div>
      </div>
    </div>
  );
}
