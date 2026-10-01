import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptP.css';

export default function ConceptP() {
  const d = useDerived();
  const serial = String(d.rollInt('serial', 1, 999)).padStart(3, '0');
  return (
    <PhotoCardShell concept="p" preset="a">
      <header className="pc-z pc-head cp-head">
        <span className="cp-title">
          <span className="cp-fu">符</span>
          <span>SPELL CARD</span>
        </span>
        <span className="cp-no">No.{serial}</span>
      </header>
      <section className="pc-z pc-hero-side cp-hero">
        <Avatar d={d} className="cp-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cp-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cp-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cp-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cp-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cp-foot">
        <span>東方 Project · 弾幕結界</span>
      </footer>
    </PhotoCardShell>
  );
}
