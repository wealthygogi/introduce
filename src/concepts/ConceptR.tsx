import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptR.css';

/** 예대제 입장권: 위 본권(행사명 · 티켓 필드) / 절취선 / 아래 반권(주의사항처럼 작게 인쇄된 상세) */
export default function ConceptR() {
  const d = useDerived();
  const row = String.fromCharCode(64 + d.rollInt('row', 1, 26));
  const seat = d.rollInt('seat', 1, 40);
  const seatNo = `${row}-${seat}`;
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="r">
      <section className="pc-z cr-main">
        <div className="cr-top">
          <span className="cr-admit">ADMIT ONE</span>
          <span className="cr-org">博麗神社 · 東方Project</span>
        </div>
        <div className="cr-title">
          <div className="cr-event">
            <span className="cr-event-jp">例大祭</span>
            <span className="cr-event-en">HAKUREI SHRINE REITAISAI</span>
          </div>
          <Avatar d={d} className="cr-avatar" />
        </div>
        <div className="cr-field cr-name">
          <span className="cr-k">NAME</span>
          <Clamp lines={2} as="div" className="cr-name-v">
            {d.nickname}
          </Clamp>
        </div>
        <div className="cr-fields">
          <div className="cr-field">
            <span className="cr-k">CHARACTER</span>
            <Clamp lines={1} as="div" className="cr-v">
              {d.charName}
            </Clamp>
          </div>
          <div className="cr-field">
            <span className="cr-k">SEAT</span>
            <span className="cr-v cr-seat">{seatNo}</span>
          </div>
          <div className="cr-field">
            <span className="cr-k">GATE</span>
            <span className="cr-v">東</span>
          </div>
        </div>
      </section>

      <div className="cr-perf" aria-hidden />

      <section className="cr-stub">
        <div className="cr-stub-head">
          <span>半券 · STUB</span>
          <span>SEAT {seatNo}</span>
        </div>
        <div className="pc-z cr-chips">
          <SeriesChips d={d} max={8} />
          <AcctChips d={d} max={8} />
        </div>
        <dl className="pc-z cr-meta">
          {metaList(d).map((m) => (
            <div key={m.key} className="cr-meta-cell">
              <dt className="cr-k">{m.label}</dt>
              <Clamp lines={1} as="dd" className="cr-meta-v">
                {m.value}
              </Clamp>
            </div>
          ))}
        </dl>
        {notes.length > 0 && (
          <dl className="pc-z cr-notes">
            {notes.map((n) => (
              <div key={n.key} className="cr-note">
                <dt className="cr-note-k">※ {n.label}</dt>
                <Clamp lines={2} as="dd" className="cr-note-v">
                  {n.value}
                </Clamp>
              </div>
            ))}
          </dl>
        )}
        {d.freeText && (
          <div className="pc-z cr-free">
            <Clamp lines={4} as="p" className="cr-free-v">
              {d.freeText}
            </Clamp>
          </div>
        )}
        <span className="cr-stamp" data-deco aria-hidden>
          <span className="cr-stamp-small">REITAISAI</span>
          <span className="cr-stamp-big">入場</span>
          <span className="cr-stamp-small">ENTRY</span>
        </span>
        <div className="cr-bottom">
          <span className="cr-fine">本券一枚一名様限 · 再入場不可 · 転売禁止</span>
          <div className="cr-code">
            <span className="cr-barcode" aria-hidden />
            <span className="cr-code-no">
              RT {row}
              {String(seat).padStart(2, '0')} 0510
            </span>
          </div>
        </div>
      </section>
    </PhotoCardShell>
  );
}
