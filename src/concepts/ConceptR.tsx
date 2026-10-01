import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptR.css';

export default function ConceptR() {
  const d = useDerived();
  const row = String.fromCharCode(64 + d.rollInt('row', 1, 26));
  const seat = d.rollInt('seat', 1, 40);
  return (
    <PhotoCardShell concept="r" preset="a">
      <header className="pc-z pc-head cr-head">
        <span className="cr-admit">ADMIT ONE</span>
        <span className="cr-seat">
          SEAT {row}-{seat}
        </span>
      </header>
      <section className="pc-z pc-hero-side cr-hero">
        <Avatar d={d} className="cr-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cr-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cr-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cr-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cr-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cr-foot">
        <span>例大祭</span>
        <span className="cr-barcode" aria-hidden />
      </footer>
    </PhotoCardShell>
  );
}
