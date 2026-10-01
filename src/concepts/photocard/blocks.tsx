import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Derived } from '../../hooks/useDerived';

/**
 * 포토카드 사용자 데이터 블록. 10개 컨셉은 사용자 입력을 반드시 이 블록으로만 그린다
 * (마크업 중복 · clamp 누락 방지). 사용자 입력 요소에는 data-clamp + .pc-clamp-* 가 붙는다.
 */

export function capList<T>(list: T[], max: number): { shown: T[]; rest: number } {
  return { shown: list.slice(0, max), rest: Math.max(0, list.length - max) };
}

/**
 * 칩 컨테이너 높이(고정 행 수) 안에 들어가는 칩 개수(≤ max)를 측정한다.
 * 마지막 칩(+N 포함)이 컨테이너 바닥을 넘으면 하나씩 줄여 +N 이 항상 보이게 한다.
 * offsetTop 은 transform(모바일 축소·회전 스티커)의 영향을 받지 않는다.
 */
function useFitCount(ref: RefObject<HTMLDivElement>, sig: string, max: number): number {
  const key = `${max}\u0002${sig}`;
  const [st, setSt] = useState({ key, n: max });
  const n = st.key === key ? st.n : max;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.clientHeight + 1;
    const over = Array.from(el.children as HTMLCollectionOf<HTMLElement>).some(
      (c) => c.offsetTop + c.offsetHeight > bottom,
    );
    if (over && n > 0) setSt({ key, n: n - 1 });
    else if (st.key !== key) setSt({ key, n });
  });

  // 웹폰트 로드로 글리프 폭이 바뀌면 처음부터 다시 맞춘다.
  useEffect(() => {
    const fonts = document.fonts;
    const reset = () => setSt({ key: '', n: max });
    fonts.addEventListener('loadingdone', reset);
    return () => fonts.removeEventListener('loadingdone', reset);
  }, [max]);

  return n;
}

export function Chips({
  items,
  max,
  className = '',
}: {
  items: { id: string; label: string }[];
  max: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fit = useFitCount(ref, items.map((i) => i.label).join('\u0001'), max);
  const { shown, rest } = capList(items, fit);
  return (
    <div className={`pc-chips ${className}`} ref={ref}>
      {shown.map((i) => (
        <span key={i.id} className="pc-chip pc-clamp-1" data-clamp>
          {i.label}
        </span>
      ))}
      {rest > 0 && <span className="pc-chip more">+{rest}</span>}
    </div>
  );
}

export function SeriesChips({ d, max }: { d: Derived; max: number }) {
  return <Chips items={d.seriesList} max={max} className="pc-series" />;
}

export function AcctChips({ d, max }: { d: Derived; max: number }) {
  return <Chips items={d.acctList} max={max} className="pc-acct" />;
}

export function Avatar({ d, className = '' }: { d: Derived; className?: string }) {
  return (
    <div className={`pc-avatar ${d.avatarIsPhoto ? 'photo' : 'sprite'} ${className}`}>
      <img className={d.avatarIsPhoto ? '' : 'px'} src={d.avatarSrc} alt={d.charName} />
    </div>
  );
}

/** 프리셋 A: 라벨/값 3행 */
export function MetaRows({ d }: { d: Derived }) {
  const rows: [string, string][] = [
    [d.t.fub, d.fubLabel],
    [d.t.parting, d.partingLabel],
    [d.t.otherGenre, d.otherLabel],
  ];
  return (
    <>
      {rows.map(([k, v]) => (
        <div key={k} className="pc-meta-row">
          <span className="pc-meta-k">{k}</span>
          <span className="pc-meta-v pc-clamp-1" data-clamp>
            {v}
          </span>
        </div>
      ))}
    </>
  );
}

/** 프리셋 B: 값만 한 줄로 */
export function MetaInline({ d }: { d: Derived }) {
  return (
    <div className="pc-meta-inline">
      {[d.fubLabel, d.partingLabel, d.otherLabel].map((v, i) => (
        <span key={i} className="pc-clamp-1" data-clamp>
          {v}
        </span>
      ))}
    </div>
  );
}

export function Notes({ d, lines, className = '' }: { d: Derived; lines: 1 | 2 | 3; className?: string }) {
  const rows: [string, string][] = [
    [d.t.dislike, d.dislike],
    [d.t.pairing, d.pairing],
  ];
  return (
    <div className={`pc-notes ${className}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="pc-note">
          <span className="pc-note-k">{k}</span>
          <span className={`pc-note-v pc-clamp-${lines}`} data-clamp>
            {v || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FreeText({ d, lines = 4 }: { d: Derived; lines?: 3 | 4 }) {
  return (
    <p className={`pc-free pc-clamp-${lines}`} data-clamp>
      {d.freeText || '—'}
    </p>
  );
}

/** 닉네임(최대 10자도 잘리지 않게 2줄까지) + 캐릭터명 */
export function NameBlock({ d, className = '' }: { d: Derived; className?: string }) {
  return (
    <div className={`pc-name-block ${className}`}>
      <div className="pc-name pc-clamp-2" data-clamp>
        {d.nickname}
      </div>
      <div className="pc-char pc-clamp-1" data-clamp>
        {d.charName}
      </div>
    </div>
  );
}
