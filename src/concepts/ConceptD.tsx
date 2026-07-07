import { useDerived } from '../hooks/useDerived';
import type { Derived } from '../hooks/useDerived';
import './ConceptD.css';

/** True if the last Hangul syllable of `text` carries a batchim (final consonant). */
function hasBatchim(text: string): boolean {
  const ch = text.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}
/** Attaches the correct 이에요/예요 ending so dynamic values stay grammatical. */
function eoyo(word: string): string {
  return hasBatchim(word) ? `${word}이에요` : `${word}예요`;
}

interface Line {
  key: string;
  text: string;
  size?: 'lg' | 'sm';
  highlight?: boolean;
}

function buildLines(d: Derived): Line[] {
  const sep = d.lang === 'ja' ? '、' : ', ';
  const seriesText = d.seriesList.length ? d.seriesList.map((s) => s.label).join(sep) : d.t.notSelected;
  const acctText = d.acctList.length ? d.acctList.map((a) => a.label).join(sep) : d.t.notSelected;
  const isOtherNone = d.otherLabel === d.t.none;

  if (d.lang === 'ko') {
    return [
      { key: 'greet', text: `안녕하세요, 전 ${eoyo(d.nickname)}.`, size: 'lg' },
      { key: 'fav', text: `제 최애 캐릭터는 ${d.charName} 쪽이에요.`, size: 'lg' },
      {
        key: 'series',
        text: d.seriesList.length ? `주로 ${seriesText} 시리즈를 좋아해요.` : '주력 시리즈는 아직 못 정했어요.',
      },
      {
        key: 'acct',
        text: d.acctList.length ? `주 활동은 ${acctText} 계열이에요.` : '계정 성향은 아직 미정이에요.',
      },
      { key: 'fub', text: `팔로우는 ${d.fubLabel} 스타일, 헤어질 땐 ${d.partingLabel} 편이에요.`, size: 'sm' },
      {
        key: 'other',
        text: isOtherNone ? '다른 장르 이야기는 거의 안 해요.' : `다른 장르 언급은 ${d.otherLabel} 정도예요.`,
        size: 'sm',
      },
      { key: 'dislike', text: `불호는 ${d.dislike} 쪽이에요.`, size: 'sm' },
      { key: 'pairing', text: `최애 커플링은 ${d.pairing} 조합이에요.` },
      ...(d.freeText
        ? [{ key: 'free', text: `그리고 이 말은 꼭 하고 싶어요. "${d.freeText}"`, highlight: true }]
        : []),
    ];
  }

  if (d.lang === 'ja') {
    return [
      { key: 'greet', text: `こんにちは、${d.nickname}です。`, size: 'lg' },
      { key: 'fav', text: `推しキャラは${d.charName}です。`, size: 'lg' },
      {
        key: 'series',
        text: d.seriesList.length ? `よく追ってるシリーズは${seriesText}です。` : 'まだ主力シリーズは決めてません。',
      },
      {
        key: 'acct',
        text: d.acctList.length ? `アカウントの傾向は${acctText}です。` : 'アカウントの方向性はまだ未定です。',
      },
      { key: 'fub', text: `フォローは${d.fubLabel}スタイルで、別れる時は${d.partingLabel}する方です。`, size: 'sm' },
      {
        key: 'other',
        text: isOtherNone ? '他ジャンルの話はほとんどしません。' : `他ジャンルの話題は${d.otherLabel}です。`,
        size: 'sm',
      },
      { key: 'dislike', text: `苦手なものは${d.dislike}です。`, size: 'sm' },
      { key: 'pairing', text: `推しカップリングは${d.pairing}です。` },
      ...(d.freeText ? [{ key: 'free', text: `どうしてもこれだけは伝えたいです。「${d.freeText}」`, highlight: true }] : []),
    ];
  }

  return [
    { key: 'greet', text: `Hi there, I'm ${d.nickname}.`, size: 'lg' },
    { key: 'fav', text: `My favorite character is ${d.charName}.`, size: 'lg' },
    {
      key: 'series',
      text: d.seriesList.length ? `I'm mainly into ${seriesText}.` : "I haven't settled on a main series yet.",
    },
    {
      key: 'acct',
      text: d.acctList.length ? `My account leans toward ${acctText}.` : 'My account type is still undecided.',
    },
    {
      key: 'fub',
      text: `I'm a ${d.fubLabel} follower, and when it's time to part ways, I go with ${d.partingLabel}.`,
      size: 'sm',
    },
    {
      key: 'other',
      text: isOtherNone ? "I rarely bring up other genres." : `I mention other genres ${d.otherLabel.toLowerCase()}.`,
      size: 'sm',
    },
    { key: 'dislike', text: `I'd rather steer clear of ${d.dislike}.`, size: 'sm' },
    { key: 'pairing', text: `My favorite ship is ${d.pairing}.` },
    ...(d.freeText ? [{ key: 'free', text: `One more thing I really want to say — "${d.freeText}"`, highlight: true }] : []),
  ];
}

export default function ConceptD() {
  const d = useDerived();
  const lines = buildLines(d);

  return (
    <div id="preview-card" className="card-frame" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div className="vnd-card">
        <div className="vnd-nameplate">
          <div className="vnd-portrait-wrap">
            <img className="px vnd-portrait" src={d.charSrc} alt={d.charName} />
            {d.avatarIsPhoto && <img className="vnd-portrait-photo" src={d.avatarSrc} alt="" />}
          </div>
          <div className="vnd-nameplate-text">
            <div className="vnd-nameplate-name">{d.charName}</div>
            <span className="vnd-nameplate-tag font-dot">NOW TALKING</span>
          </div>
        </div>

        <div className="vnd-log">
          {lines.map((line) => (
            <div
              key={line.key}
              className={[
                'vnd-bubble',
                line.size === 'lg' ? 'vnd-lg' : '',
                line.size === 'sm' ? 'vnd-sm' : '',
                line.highlight ? 'vnd-highlight' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className="vnd-footer">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
