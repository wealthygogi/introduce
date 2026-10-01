import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, SeriesChips, AcctChips, MetaInline, Notes, FreeText } from './photocard/blocks';
import './ConceptU.css';

export default function ConceptU() {
  const d = useDerived();
  return (
    <PhotoCardShell concept="u" preset="b">
      <header className="pc-z pc-head cu-head">
        <span className="cu-title">★ 紅魔館 ★</span>
      </header>
      <section className="pc-z cu-hero">
        <div className="cu-polaroid">
          <span className="cu-tape cu-tape-l" data-deco />
          <span className="cu-tape cu-tape-r" data-deco />
          <Avatar d={d} className="cu-avatar" />
          <div className="cu-caption">
            <div className="cu-nick pc-clamp-1" data-clamp>
              {d.nickname}
            </div>
            <div className="pc-char pc-clamp-1" data-clamp>
              {d.charName}
            </div>
          </div>
        </div>
      </section>
      <section className="pc-z pc-chipzone cu-chips">
        <SeriesChips d={d} max={4} />
        <AcctChips d={d} max={3} />
      </section>
      <section className="pc-z cu-meta">
        <MetaInline d={d} />
      </section>
      <section className="pc-z cu-notes">
        <Notes d={d} lines={1} />
      </section>
      <section className="pc-z cu-free">
        <FreeText d={d} />
      </section>
      <footer className="pc-z pc-foot cu-foot">
        <span>Perfect and Elegant</span>
      </footer>
    </PhotoCardShell>
  );
}
