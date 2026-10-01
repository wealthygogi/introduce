import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaInline, Notes, FreeText } from './photocard/blocks';
import './ConceptY.css';

export default function ConceptY() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="y" preset="b">
      <header className="pc-z pc-head cy-head">
        <span className="cy-title">MY DIARY ♡</span>
        <span className="cy-sub">こころの日記</span>
      </header>
      <section className="pc-z pc-hero-top cy-hero">
        <Avatar d={d} className="cy-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cy-chips">
        <SeriesChips d={d} max={4} />
        <AcctChips d={d} max={3} />
      </section>
      <section className="pc-z cy-meta">
        <MetaInline d={d} />
      </section>
      <section className="pc-z cy-notes">
        <Notes d={d} lines={1} />
      </section>
      <section className="pc-z cy-free">
        <FreeText d={d} lines={3} />
      </section>
      <footer className="pc-z pc-foot cy-foot">
        <span>Today's mood: ☺</span>
      </footer>
    </PhotoCardShell>
  );
}
