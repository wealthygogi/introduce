import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptW.css';

/** 永遠亭 瓦版 1면: 제호 → 헤드라인(닉네임) → 사진 + 기사(자유글) → 키워드 → 社告(메타·불호·커플링) */
export default function ConceptW() {
  const d = useDerived();
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="w">
      <header className="pc-z cw-mast">
        <div className="cw-ear">
          <span>第八號</span>
          <span>Vol. 8</span>
        </div>
        <div className="cw-title">永遠亭 瓦版</div>
        <div className="cw-ear cw-ear-r">
          <span>竹林の奥</span>
          <span>定價 壹錢</span>
        </div>
        <div className="cw-dateline">永夜暦 葉月十五日 · 晴のち満月 · 迷いの竹林 発</div>
      </header>

      <section className="pc-z cw-lead">
        <Clamp lines={2} as="h2" className="cw-headline">
          {d.nickname}
        </Clamp>
        <div className="cw-sub">
          <span className="cw-kicker">推</span>
          <Clamp lines={1} className="cw-char">
            {d.charName}
          </Clamp>
        </div>
      </section>

      <section className={`pc-z cw-body${d.freeText ? '' : ' cw-solo'}`}>
        <figure className="cw-fig">
          <Avatar d={d} className="cw-photo" />
          <figcaption className="cw-cap">▲ 本人近影</figcaption>
        </figure>
        {d.freeText && (
          <div className="cw-col">
            <Clamp lines={6} as="p" className="cw-article">
              <b className="cw-from">【竹林発】</b>
              {d.freeText}
            </Clamp>
          </div>
        )}
      </section>

      <section className="pc-z cw-keys">
        <span className="cw-key-k">作品</span>
        <SeriesChips d={d} max={8} />
        <span className="cw-key-k">用途</span>
        <AcctChips d={d} max={6} />
      </section>

      <section className="pc-z cw-notice">
        <span className="cw-notice-tag">社告</span>
        <dl className="cw-meta">
          {metaList(d).map((m) => (
            <div key={m.key} className="cw-meta-i">
              <dt>{m.label}</dt>
              <Clamp lines={1} as="dd">
                {m.value}
              </Clamp>
            </div>
          ))}
        </dl>
        {notes.length > 0 && (
          <dl className="cw-notes">
            {notes.map((n) => (
              <div key={n.key} className="cw-note">
                <dt>{n.label}</dt>
                <Clamp lines={2} as="dd">
                  {n.value}
                </Clamp>
              </div>
            ))}
          </dl>
        )}
      </section>
    </PhotoCardShell>
  );
}
