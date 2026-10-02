import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptS.css';

/**
 * 홍마관 연회 초대장: 이중 금테 안에 중앙 정렬 편지 — 문장(紋章) · 메달리온 · 초대 문구 · 손님 이름(주인공)
 * · 편지 본문 · 관심사 한 줄 · 하단 R.S.V.P. 응답란, 우하단 밀랍 봉인.
 */
export default function ConceptS() {
  const d = useDerived();
  const notes = noteList(d);
  const rsvp = [...metaList(d), ...notes];
  return (
    <PhotoCardShell concept="s">
      <header className="cs-crest" aria-hidden>
        <span className="cs-crest-mark">紅魔館</span>
        <span className="cs-crest-sub">Scarlet Devil Mansion</span>
      </header>

      <main className="pc-z cs-letter">
        <div className="cs-medal">
          <Avatar d={d} className="cs-avatar" />
        </div>
        <p className="cs-invited">You are cordially invited</p>
        <Clamp lines={2} as="h2" className="cs-guest">
          {d.nickname}
        </Clamp>
        <Clamp lines={1} as="div" className="cs-with">
          {d.charName}
        </Clamp>
        <div className="cs-flourish" aria-hidden>
          <span>✦</span>
        </div>
        {d.freeText ? (
          <Clamp lines={4} as="p" className="cs-body">
            {d.freeText}
          </Clamp>
        ) : (
          <p className="cs-body cs-soiree">to a moonlit soirée at the mansion</p>
        )}
        <div className="cs-tastes">
          <SeriesChips d={d} max={6} />
          <AcctChips d={d} max={6} />
        </div>
      </main>

      <footer className="pc-z cs-rsvp">
        <div className="cs-rsvp-title" aria-hidden>
          R.S.V.P.
        </div>
        <dl className="cs-rsvp-list">
          {rsvp.map((r) => {
            const note = r.key === 'dislike' || r.key === 'pairing';
            return (
              <div key={r.key} className={`cs-rsvp-row${note ? ' cs-note' : ''}`}>
                <dt>{r.label}</dt>
                <Clamp lines={note ? 2 : 1} as="dd">
                  {r.value}
                </Clamp>
              </div>
            );
          })}
        </dl>
      </footer>

      <span className="cs-seal" data-deco aria-hidden>
        <span>紅</span>
      </span>
    </PhotoCardShell>
  );
}
