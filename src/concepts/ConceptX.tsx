import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptX.css';

export default function ConceptX() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="x" preset="a">
      <header className="pc-z pc-head cx-head">
        <span className="cx-case">CASE FILE</span>
        <span className="cx-club">秘封倶楽部</span>
      </header>
      <section className="pc-z pc-hero-side cx-hero">
        <Avatar d={d} className="cx-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cx-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cx-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cx-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cx-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cx-foot">
        <span>{'// END OF RECORD'}</span>
      </footer>
    </PhotoCardShell>
  );
}
