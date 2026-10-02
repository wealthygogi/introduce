import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptP.css';

/** 스펠카드 선언 화면: 중앙 대칭 — 「符」 문장 · 마법진 속 아바타 · 「스펠 이름」 · 아래로 갈수록 작아지는 정보 */
export default function ConceptP() {
  const d = useDerived();
  const serial = String(d.rollInt('serial', 1, 999)).padStart(3, '0');
  const notes = noteList(d);
  const sparse = notes.length === 0 && !d.freeText;
  return (
    <PhotoCardShell concept="p">
      <header className="cp-head">
        <span className="cp-head-l">SPELL CARD</span>
        <span className="cp-sigil" aria-hidden>
          <span>符</span>
        </span>
        <span className="cp-head-r">No.{serial}</span>
      </header>

      <main className={`cp-main${sparse ? ' cp-sparse' : ''}`}>
        <section className="pc-z cp-hero">
          <span className="cp-circle" data-deco aria-hidden />
          <Avatar d={d} className="cp-avatar" />
        </section>

        <section className="pc-z cp-title">
          <div className="cp-spell">
            <span className="cp-br" aria-hidden>
              「
            </span>
            <Clamp lines={2} className="cp-nick">
              {d.nickname}
            </Clamp>
            <span className="cp-br" aria-hidden>
              」
            </span>
          </div>
          <Clamp lines={1} as="div" className="cp-char">
            {d.charName}
          </Clamp>
        </section>

        <section className="pc-z cp-chips">
          <SeriesChips d={d} max={6} />
          <AcctChips d={d} max={5} />
        </section>

        <section className="pc-z cp-meta">
          {metaList(d).map((m) => (
            <div key={m.key} className="cp-meta-i">
              <Clamp lines={1} as="div" className="cp-k">
                {m.label}
              </Clamp>
              <Clamp lines={1} as="div" className="cp-v">
                {m.value}
              </Clamp>
            </div>
          ))}
        </section>

        {!sparse && <div className="cp-rule" aria-hidden />}

        {notes.length > 0 && (
          <section className={`pc-z cp-notes${notes.length === 1 ? ' cp-solo' : ''}`}>
            {notes.map((n) => (
              <div key={n.key} className="cp-note">
                <Clamp lines={1} as="div" className="cp-note-k">
                  {n.label}
                </Clamp>
                <Clamp lines={2} as="div" className="cp-note-v">
                  {n.value}
                </Clamp>
              </div>
            ))}
          </section>
        )}

        {d.freeText && (
          <section className="pc-z cp-free">
            <Clamp lines={4} as="p" className="cp-quote">
              {d.freeText}
            </Clamp>
          </section>
        )}
      </main>

      <footer className="cp-foot">東方 Project · 弾幕結界</footer>
    </PhotoCardShell>
  );
}
