import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptY.css';

/** 스크랩북 다이어리 한 페이지: 사진 + 형광펜 제목 → 스티커 시트 → 포스트잇 → 체크리스트 · 메모지 */
export default function ConceptY() {
  const d = useDerived();
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="y">
      <header className="cy-head">
        <div className="cy-title">
          <b>MY DIARY ♡</b>
          <small>こころの日記</small>
        </div>
        <div className="cy-date" aria-hidden="true">
          <span className="cy-date-row">
            DATE <i className="cy-slot" />.<i className="cy-slot" />
          </span>
          <span className="cy-wx">
            <i className="on">☀</i>
            <i>☁</i>
            <i>☂</i>
          </span>
        </div>
      </header>

      <section className={`cy-hero${d.freeText ? '' : ' tall'}`}>
        <figure className="cy-photo">
          <Avatar d={d} className="cy-avatar" />
          <span className="cy-photo-cap" aria-hidden="true">♡</span>
          <span className="cy-tape" data-deco aria-hidden="true" />
        </figure>
        <div className="pc-z cy-id">
          <span className="cy-k">NAME</span>
          <Clamp lines={2} as="div" className="cy-nick">
            <span className="cy-hl">{d.nickname}</span>
          </Clamp>
          <div className="cy-bubble">
            <Clamp lines={2}>{d.charName}</Clamp>
          </div>
        </div>
      </section>

      <section className="pc-z cy-stk">
        <SeriesChips d={d} max={8} />
        <AcctChips d={d} max={6} />
      </section>

      {notes.length > 0 && (
        <section className="pc-z cy-posts">
          {notes.map((n) => (
            <div key={n.key} className={`cy-post ${n.key}`}>
              <span className="cy-post-k">{n.label}</span>
              <Clamp lines={2} as="div" className="cy-post-v">
                {n.value}
              </Clamp>
            </div>
          ))}
        </section>
      )}

      <section className={`cy-body${d.freeText ? '' : ' solo'}`}>
        <ul className="pc-z cy-check">
          {metaList(d).map((m) => (
            <li key={m.key}>
              <i className="cy-box" aria-hidden="true" />
              <span className="cy-ck-k">{m.label}</span>
              <Clamp lines={1} className="cy-ck-v">
                {m.value}
              </Clamp>
            </li>
          ))}
        </ul>
        {d.freeText && (
          <div className="cy-memo-wrap">
            <div className="pc-z cy-memo">
              <Clamp lines={5} as="p" className="cy-memo-t">
                {d.freeText}
              </Clamp>
            </div>
            <span className="cy-pin" data-deco aria-hidden="true" />
          </div>
        )}
      </section>

      <footer className="cy-foot">
        <span>Today&apos;s mood : ☺</span>
        <span>p.01 ♡</span>
      </footer>
    </PhotoCardShell>
  );
}
