import { useDerived } from '../hooks/useDerived';
import PhotoCardShell from './photocard/PhotoCardShell';
import { Avatar, Clamp, SeriesChips, AcctChips, metaList, noteList } from './photocard/blocks';
import './ConceptT.css';

/**
 * 文々。SNS 프로필 화면: 풀블리드 배너 → 배너 경계에 걸친 원형 아바타 → 굵은 닉네임 · @handle →
 * bio(자유글) → 통계 행(값 굵게 + 라벨 회색) → 해시태그(시리즈 · 계정) → 고정 게시물(불호 · 커플링).
 */
export default function ConceptT() {
  const d = useDerived();
  const handle = d.getCustom('handle', '@gensokyo');
  const notes = noteList(d);
  return (
    <PhotoCardShell concept="t">
      <header className="ct-banner" aria-hidden>
        <span className="ct-app">Gensokyo SNS · 幻想郷</span>
        <span className="ct-mark">文々。</span>
      </header>

      <div className="ct-body">
        <div className="ct-top">
          <Avatar d={d} className="ct-avatar" />
          <span className="ct-follow" aria-hidden>
            Following
          </span>
        </div>

        <section className="pc-z ct-id">
          <div className="ct-nameline">
            <Clamp lines={2} className="ct-nick">
              {d.nickname}
            </Clamp>
            <span className="ct-badge" aria-hidden />
          </div>
          <Clamp lines={1} as="div" className="ct-handle">
            {handle}
          </Clamp>
          <Clamp lines={1} as="div" className="ct-char">
            {d.charName}
          </Clamp>
        </section>

        {d.freeText && (
          <section className="pc-z ct-bio">
            <Clamp lines={4} as="p" className="ct-bio-t">
              {d.freeText}
            </Clamp>
          </section>
        )}

        <section className="pc-z ct-stats">
          {metaList(d).map((m) => (
            <div key={m.key} className="ct-stat">
              <Clamp lines={1} as="div" className="ct-stat-v">
                {m.value}
              </Clamp>
              <div className="ct-stat-k">{m.label}</div>
            </div>
          ))}
        </section>

        <section className="pc-z ct-tags">
          <SeriesChips d={d} max={8} />
          <AcctChips d={d} max={6} />
        </section>

        <div className="ct-feed">
          <div className="ct-tabs" aria-hidden>
            <span className="ct-tab on">Posts</span>
            <span className="ct-tab">Media</span>
            <span className="ct-tab">Likes</span>
          </div>
          {notes.length > 0 ? (
            <section className="pc-z ct-pin">
              <div className="ct-pin-h" aria-hidden>
                <span className="ct-pin-ico" />
                Pinned
              </div>
              {notes.map((n) => (
                <div key={n.key} className="ct-note">
                  <div className="ct-note-k">{n.label}</div>
                  <Clamp lines={2} as="div" className="ct-note-v">
                    {n.value}
                  </Clamp>
                </div>
              ))}
            </section>
          ) : (
            <div className="ct-quiet" aria-hidden>
              <span className="ct-quiet-mark">文</span>
              <span>No posts yet</span>
            </div>
          )}
        </div>
      </div>
    </PhotoCardShell>
  );
}
