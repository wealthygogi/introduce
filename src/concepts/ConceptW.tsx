import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, NameBlock, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptW.css';

export default function ConceptW() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="w" preset="a">
      <header className="pc-z pc-head cw-head">
        <span className="cw-title">永遠亭 瓦版</span>
        <span className="cw-vol">Vol. 8</span>
      </header>
      <section className="pc-z pc-hero-side cw-hero">
        <Avatar d={d} className="cw-avatar" />
        <NameBlock d={d} />
      </section>
      <section className="pc-z pc-chipzone cw-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z cw-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z cw-notes">
        <Notes d={d} lines={3} className="cw-two-col" />
      </section>
      <section className="pc-z cw-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cw-foot">
        <span>竹林の奥 · 永遠亭</span>
      </footer>
    </PhotoCardShell>
  );
}
