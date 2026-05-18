import { useEffect } from 'react';

const CARD_BASE_WIDTH = 640;
const MIN_DIFF = 0.005;
const DESKTOP_BREAKPOINT = 880;

export function useCardScale(
  wrapRef: React.RefObject<HTMLDivElement>,
  scalerRef: React.RefObject<HTMLDivElement>,
) {
  useEffect(() => {
    const wrap = wrapRef.current;
    const scaler = scalerRef.current;
    if (!wrap || !scaler) return;
    const parent = wrap.parentElement;
    if (!parent) return;

    let raf = 0;
    let lastScale = -1;

    const recompute = () => {
      raf = 0;
      // On desktop, let CSS take over completely: clear scale + height.
      if (parent.clientWidth >= DESKTOP_BREAKPOINT) {
        if (lastScale !== 1) {
          scaler.style.removeProperty('--card-scale');
          wrap.style.removeProperty('height');
          lastScale = 1;
        }
        return;
      }

      // Subtract horizontal padding so the scaled visual fits inside the content box.
      // getComputedStyle is used once per recompute; padding rarely changes.
      const style = getComputedStyle(parent);
      const hPad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const available = parent.clientWidth - hPad;
      const scale = Math.min(available / CARD_BASE_WIDTH, 1);
      if (Math.abs(scale - lastScale) < MIN_DIFF) return;
      lastScale = scale;
      scaler.style.setProperty('--card-scale', String(scale));
      // transform doesn't affect layout → set wrap height from card's natural height
      const card = scaler.firstElementChild as HTMLElement | null;
      const naturalH = card ? card.offsetHeight : scaler.offsetHeight;
      wrap.style.height = `${Math.ceil(naturalH * scale)}px`;
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(recompute);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    // Observe parent (width) and inner card frame (height). NEVER observe wrap
    // itself — we mutate wrap.style.height which would re-trigger and loop.
    ro.observe(parent);
    const card = scaler.firstElementChild;
    if (card) ro.observe(card);

    window.addEventListener('orientationchange', schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [wrapRef, scalerRef]);
}
