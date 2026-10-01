import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptS.css';

export default function ConceptS() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="s" preset="a">
      <header className="pc-z pc-head cs-head">
        <span className="cs-title">INVITATION</span>
        <span className="cs-house">紅魔館</span>
      </header>
      <section className="pc-z pc-hero-side cs-hero">
        <Avatar d={d} className="cs-avatar" />
        <NameBlock d={d} />
        <span className="cs-seal" data-deco>
          紅
        </span>
      </section>
      <section className="pc-z pc-chipzone cs-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cs-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cs-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cs-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cs-foot">
        <span className="cs-foot-text">Scarlet Devil Mansion</span>
      </footer>
    </PhotoCardShell>
  );
}
