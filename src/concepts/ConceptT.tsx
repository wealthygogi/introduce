import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, SeriesChips, AcctChips, MetaRows, Notes, FreeText } from './photocard/blocks';
import './ConceptT.css';

export default function ConceptT() {
  const d = useDerived();
  const handle = d.getCustom('handle', '@gensokyo');
  return (
    <PhotoCardShell concept="t" preset="a">
      <header className="pc-z pc-head ct-head">
        <span className="ct-brand">文々。</span>
      </header>
      <section className="pc-z pc-hero-side ct-hero">
        <Avatar d={d} className="ct-avatar" />
        <div className="pc-name-block">
          <div className="pc-name pc-clamp-2" data-clamp>
            {d.nickname}
          </div>
          <div className="ct-handle pc-clamp-1" data-clamp>
            {handle}
          </div>
          <div className="pc-char pc-clamp-1" data-clamp>
            {d.charName}
          </div>
        </div>
      </section>
      <section className="pc-z pc-chipzone ct-chips">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={5} />
      </section>
      <section className="pc-z ct-meta">
        <MetaRows d={d} />
      </section>
      <section className="pc-z ct-notes">
        <Notes d={d} lines={2} />
      </section>
      <section className="pc-z ct-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot ct-foot">
        <span>Gensokyo SNS · 幻想郷</span>
      </footer>
    </PhotoCardShell>
  );
}
