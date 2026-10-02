import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, AcctChips, Clamp, SeriesChips, metaList, noteList } from './photocard/blocks';
import './ConceptU.css';

/**
 * 메이드 폴라로이드 — 책상 위에 테이프로 붙인 폴라로이드 한 장이 주인공.
 * 아래쪽 책상에는 라벨 스티커(칩) · 줄 노트 메모(자유글) · 인덱스 카드(메타 · 불호/커플링)만 놓는다.
 * 회전하는 종이(폴라로이드 · 메모)는 그 자체가 .pc-z 라 안쪽 텍스트가 존 밖으로 나가지 않는다.
 */
export default function ConceptU() {
  const d = useDerived();
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="u">
      <section className="cu-hero">
        <div className="pc-z cu-polaroid">
          <div className="cu-photo-wrap">
            <Avatar d={d} className="cu-photo" />
            <span className="cu-date" data-deco aria-hidden>
              &apos;02 8 11
            </span>
          </div>
          <div className="cu-caption">
            <Clamp lines={2} as="div" className="cu-nick">
              {d.nickname}
            </Clamp>
            <Clamp lines={1} as="div" className="cu-char">
              {d.charName}
            </Clamp>
          </div>
        </div>
        <span className="cu-tape cu-tape-hero" data-deco aria-hidden />
        <span className="cu-watch" data-deco aria-hidden />
      </section>

      <section className="pc-z cu-tags">
        <SeriesChips d={d} max={6} />
        <AcctChips d={d} max={6} />
      </section>

      <section className={`cu-desk${d.freeText ? '' : ' is-solo'}`}>
        {d.freeText && (
          <div className="cu-memo-wrap">
            <span className="cu-tape cu-tape-memo" data-deco aria-hidden />
            <div className="pc-z cu-memo">
              <Clamp lines={6} as="p" className="cu-free">
                {d.freeText}
              </Clamp>
            </div>
          </div>
        )}
        <div className="pc-z cu-card">
          <dl className="cu-meta">
            {metaList(d).map((m) => (
              <div key={m.key} className="cu-meta-row">
                <dt>{m.label}</dt>
                <Clamp lines={1} as="dd">
                  {m.value}
                </Clamp>
              </div>
            ))}
          </dl>
          {notes.length > 0 && (
            <div className="cu-notes">
              {notes.map((n) => (
                <Clamp key={n.key} lines={2} as="p" className="cu-note">
                  <b>{n.label}</b>
                  {n.value}
                </Clamp>
              ))}
            </div>
          )}
        </div>
        {!d.freeText && (
          <p className="cu-sign" aria-hidden>
            Perfect and Elegant
          </p>
        )}
      </section>
    </PhotoCardShell>
  );
}
