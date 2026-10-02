import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptX.css';

/** 비봉클럽 조사파일 — 기록 단말에 띄운 기밀 인물 파일 */
export default function ConceptX() {
  const d = useDerived();
  const notes = noteList(d);
  let sec = 0;
  const num = () => String(++sec).padStart(2, '0');

  return (
    <PhotoCardShell concept="x">
      {/* 결계 탐지 스코프: 본문 뒤 옅은 계기판. 내용이 적을 때 빈 하단을 채운다 */}
      <span className="cx-scope" data-deco aria-hidden />
      <header className="cx-head">
        <span className="cx-case">
          CASE FILE <b>#0B-17</b>
        </span>
        <span className="cx-club">秘封倶楽部</span>
      </header>

      <section className="cx-hero">
        <div className="cx-photo">
          <Avatar d={d} className="cx-avatar" />
          <span className="cx-fig">FIG.01 · SUBJECT</span>
          <span className="cx-stamp" data-deco aria-hidden>
            <b>機密</b>
            <i>CLASSIFIED</i>
          </span>
        </div>
        <dl className="pc-z cx-fields">
          <dt>SUBJECT</dt>
          <dd>
            <Clamp lines={2} className="cx-nick">
              {d.nickname}
            </Clamp>
          </dd>
          <dt>ALIAS</dt>
          <dd>
            <Clamp lines={2} className="cx-alias">
              {d.charName}
            </Clamp>
          </dd>
          <dt>STATUS</dt>
          <dd className="cx-status">UNDER OBSERVATION</dd>
        </dl>
      </section>

      <section className="pc-z cx-sec cx-tags">
        <h3 className="cx-h">
          <span>{num()}</span>TAGS
        </h3>
        <SeriesChips d={d} max={8} />
        <AcctChips d={d} max={8} />
      </section>

      <section className="pc-z cx-sec">
        <h3 className="cx-h">
          <span>{num()}</span>PROFILE
        </h3>
        <dl className="cx-meta">
          {metaList(d).map((m) => (
            <div key={m.key}>
              <dt>{m.label}</dt>
              <dd>
                <Clamp lines={2}>{m.value}</Clamp>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {notes.length > 0 && (
        <section className="pc-z cx-sec">
          <h3 className="cx-h">
            <span>{num()}</span>NOTES
          </h3>
          <dl className="cx-notes">
            {notes.map((n) => (
              <div key={n.key}>
                <dt>{n.label}</dt>
                <dd>
                  <Clamp lines={2}>{n.value}</Clamp>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {d.freeText && (
        <section className="pc-z cx-sec">
          <h3 className="cx-h">
            <span>{num()}</span>LOG
          </h3>
          <Clamp lines={4} as="p" className="cx-log">
            {d.freeText}
          </Clamp>
        </section>
      )}

      <footer className="cx-foot">
        <span>{'// END OF RECORD'}</span>
        <span className="cx-cursor">
          PAGE 1/1 <i>▌</i>
        </span>
      </footer>
    </PhotoCardShell>
  );
}
