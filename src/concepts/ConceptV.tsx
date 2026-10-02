import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptV.css';

/** PC-98 RPG 메뉴 화면: 상태 윈도우 · 스테이터스/아이템 윈도우 · 메시지 윈도우 */
export default function ConceptV() {
  const d = useDerived();
  const lv = String(d.rollInt('lv', 1, 99)).padStart(2, '0');
  const h = d.rollInt('h', 0, 999);
  const mm = String(d.rollInt('m', 0, 59)).padStart(2, '0');
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="v">
      <section className="cv-win cv-party">
        <span className="cv-tab">SAVE 01</span>
        <span className="cv-tab cv-tab-r">東方</span>
        <div className="pc-z cv-party-body">
          <Avatar d={d} className="cv-avatar" />
          <div className="cv-who">
            <Clamp lines={2} as="div" className="cv-nick">
              {d.nickname}
            </Clamp>
            <Clamp lines={1} as="div" className="cv-char">
              {d.charName}
            </Clamp>
            <div className="cv-stat">
              <span className="cv-k">LV</span>
              <span className="cv-lv">{lv}</span>
              <span className="cv-k">TIME</span>
              <span className="cv-time">
                {h}:{mm}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-win cv-status">
        <span className="cv-tab">STATUS</span>
        <div className="pc-z cv-status-body">
          <div className="cv-stats">
            {metaList(d).map((m) => (
              <div key={m.key} className="cv-row">
                <span className="cv-row-k">{m.label}</span>
                <span className="cv-dots" />
                <Clamp lines={1} className="cv-row-v">
                  {m.value}
                </Clamp>
              </div>
            ))}
          </div>
          <div className="cv-items">
            <div className="cv-h">▶ ITEM</div>
            <SeriesChips d={d} max={6} />
            <AcctChips d={d} max={5} />
          </div>
          {notes.length > 0 && (
            <div className="cv-notes">
              {notes.map((n) => (
                <div key={n.key} className={`cv-note cv-note-${n.key}`}>
                  <span className="cv-note-k">{n.label}</span>
                  <Clamp lines={2} className="cv-note-v">
                    {n.value}
                  </Clamp>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="cv-win cv-msg">
        <div className="pc-z cv-msg-body">
          {d.freeText ? (
            <Clamp lines={4} as="p" className="cv-say">
              {d.freeText}
            </Clamp>
          ) : (
            <p className="cv-sys">SAVE COMPLETE.</p>
          )}
        </div>
        <span className="cv-next" aria-hidden="true">
          ▼
        </span>
      </section>
    </PhotoCardShell>
  );
}
