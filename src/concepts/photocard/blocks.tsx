import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode, type RefObject } from 'react';
import type { Derived } from '../../hooks/useDerived';

/**
 * 포토카드 primitive. 컨셉은 레이아웃을 자유롭게 짜되, 사용자 입력 텍스트는 반드시 <Clamp>
 * (또는 Chips)로 그린다 → data-clamp + .pc-clamp-N 이 붙어 E2E 가 넘침·잘림을 검사한다.
 * 사용자 입력은 항상 .pc-z(overflow:hidden 존) 안에 둔다.
 */

/** 사용자 입력 텍스트: 가로로는 절대 넘치지 않고(긴 토큰도 줄바꿈) lines 줄을 넘으면 … 으로 잘린다 */
export function Clamp({
  lines,
  as: Tag = 'span',
  className = '',
  children,
}: {
  lines: 1 | 2 | 3 | 4 | 5 | 6;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`pc-clamp-${lines} ${className}`} data-clamp>
      {children}
    </Tag>
  );
}

/** 짧은 선택값 3종(FUB · 이별 · 타장르): 라벨과 값 */
export function metaList(d: Derived): { key: string; label: string; value: string }[] {
  return [
    { key: 'fub', label: d.t.fub, value: d.fubLabel },
    { key: 'parting', label: d.t.parting, value: d.partingLabel },
    { key: 'other', label: d.t.otherGenre, value: d.otherLabel },
  ];
}

/** 불호 · 커플링 중 입력된 것만(빈 값은 카드에서 숨긴다) */
export function noteList(d: Derived): { key: string; label: string; value: string }[] {
  return [
    { key: 'dislike', label: d.t.dislike, value: d.dislike },
    { key: 'pairing', label: d.t.pairing, value: d.pairing },
  ].filter((n) => n.value);
}

function capList<T>(list: T[], max: number): { shown: T[]; rest: number } {
  return { shown: list.slice(0, max), rest: Math.max(0, list.length - max) };
}

/**
 * 칩 컨테이너(컨셉 CSS 가 height/max-height 로 행 수를 정한다) 안에 들어가는 칩 개수(≤ max)를 측정한다.
 * 마지막 칩(+N 포함)이 컨테이너 바닥을 넘으면 하나씩 줄여 +N 이 항상 보이게 한다.
 * offsetTop 은 transform(모바일 축소·회전 스티커)의 영향을 받지 않는다.
 */
function useFitCount(ref: RefObject<HTMLDivElement>, sig: string, max: number): number {
  const key = `${max}\u0002${sig}`;
  const [st, setSt] = useState({ key, n: max });
  const n = st.key === key ? st.n : max;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.clientHeight === 0) return; // 숨김(모바일 입력 탭) 상태에서는 측정하지 않는다
    const bottom = el.clientHeight + 1;
    const over = Array.from(el.children as HTMLCollectionOf<HTMLElement>).some(
      (c) => c.offsetTop + c.offsetHeight > bottom,
    );
    if (over && n > 0) setSt({ key, n: n - 1 });
    else if (st.key !== key) setSt({ key, n });
  });

  // 웹폰트 로드(글리프 폭 변화)나 숨김→표시(폭 0→N) 때 처음부터 다시 맞춘다.
  // 높이 변화는 무시한다 — 칩 개수가 바꾸는 높이에 반응하면 측정이 루프를 돈다.
  useEffect(() => {
    const el = ref.current;
    const fonts = document.fonts;
    const reset = () => setSt({ key: '', n: max });
    let lastW = el?.clientWidth ?? 0;
    const ro = new ResizeObserver(() => {
      const w = el?.clientWidth ?? 0;
      if (w !== lastW) {
        lastW = w;
        reset();
      }
    });
    if (el) ro.observe(el);
    fonts.addEventListener('loadingdone', reset);
    return () => {
      ro.disconnect();
      fonts.removeEventListener('loadingdone', reset);
    };
  }, [ref, max]);

  return n;
}

function Chips({
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
