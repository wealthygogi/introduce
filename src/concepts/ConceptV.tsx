import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptV.css';

export default function ConceptV() {
  const d = useDerived();
  const lv = String(d.rollInt('lv', 1, 99)).padStart(2, '0');
  const h = d.rollInt('h', 0, 999);
  const mm = String(d.rollInt('m', 0, 59)).padStart(2, '0');
  return (
    <PhotoCardShell concept="v" preset="a">
      <header className="pc-z pc-head cv-head">
        <span className="cv-slot">SAVE 01</span>
        <span className="cv-stat">
          LV.{lv}  TIME {h}:{mm}
        </span>
      </header>
      <section className="pc-z pc-hero-side cv-hero">
        <Avatar d={d} className="cv-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cv-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cv-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cv-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cv-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cv-foot">
        <span>
          PRESS START · 東方 <span className="cv-cursor">▌</span>
        </span>
      </footer>
    </PhotoCardShell>
  );
}
