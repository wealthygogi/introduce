import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptQ.css';

/** 하쿠레이 오후다: 왼쪽 주홍 띠 + 세로로 긴 부적 종이에 가운데 정렬로 적어 내려간다 */
export default function ConceptQ() {
  const d = useDerived();
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="q">
      <aside className="cq-band" data-deco aria-hidden="true">
        <span className="cq-band-text">博麗神社</span>
        <span className="cq-band-rule" />
        <span className="cq-band-text">奉納</span>
      </aside>

      <main className="pc-z cq-paper">
        <div className="cq-body">
          <div className="cq-incant" aria-hidden="true">
            急急如律令
          </div>
          <Avatar d={d} className="cq-avatar" />
          <div className="cq-names">
            <Clamp lines={2} as="div" className="cq-nick">
              {d.nickname}
            </Clamp>
            <Clamp lines={1} as="div" className="cq-char">
              {d.charName}
            </Clamp>
          </div>

          <i className="cq-dot" aria-hidden="true" />

          <dl className="cq-meta">
            {metaList(d).map((m) => (
              <div key={m.key} className="cq-meta-item">
                <dt>{m.label}</dt>
                <dd>
                  <Clamp lines={2}>{m.value}</Clamp>
                </dd>
              </div>
            ))}
          </dl>

          <div className="cq-tags">
            <SeriesChips d={d} max={8} />
            <AcctChips d={d} max={6} />
          </div>

          {(notes.length > 0 || d.freeText) && <i className="cq-dot" aria-hidden="true" />}

          {notes.length > 0 && (
            <dl className="cq-notes">
              {notes.map((n) => (
                <div key={n.key} className="cq-note">
                  <dt>{n.label}</dt>
                  <dd>
                    <Clamp lines={3}>{n.value}</Clamp>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {d.freeText && (
            <Clamp lines={3} as="p" className="cq-free">
              {d.freeText}
            </Clamp>
          )}
        </div>

        <footer className="cq-foot">厄除 · 開運 · 良縁</footer>
        <span className="cq-seal" data-deco aria-hidden="true">
          封
        </span>
      </main>
    </PhotoCardShell>
  );
}
