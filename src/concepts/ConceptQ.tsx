import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptQ.css';

export default function ConceptQ() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="q" preset="a">
      <header className="pc-z pc-head cq-head">
        <span className="cq-title">博麗神社 奉納</span>
        <span className="cq-vert" data-deco>
          御札
        </span>
      </header>
      <section className="pc-z pc-hero-side cq-hero">
        <Avatar d={d} className="cq-avatar" />
        <NameBlock d={d} />
        <span className="cq-stamp" data-deco>
          封
        </span>
      </section>
      <section className="pc-z pc-chipzone cq-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cq-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cq-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z cq-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cq-foot">
        <span className="cq-foot-text">厄除 · 開運 · 良縁</span>
      </footer>
    </PhotoCardShell>
  );
}
