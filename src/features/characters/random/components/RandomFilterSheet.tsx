import { useEffect, useRef } from 'react';
import type { FilterProps } from './RandomFilterPanel';
import RandomFilterPanel from './RandomFilterPanel';

type Props = FilterProps & {
  open: boolean;
  onClose: () => void;
};

export default function RandomFilterSheet({ open, onClose, ...panel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const active = document.activeElement;
      returnFocusRef.current = active instanceof HTMLElement ? active : null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('button, input, select, summary, [tabindex]:not([tabindex="-1"])')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
  }, [open]);

  return <dialog
    ref={ref}
    className="random-filter-sheet"
    aria-label={panel.copy.filterDialog}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
  >
    <div className="random-filter-sheet-inner">
      <header className="random-filter-sheet-header">
        <span className="random-sheet-handle" aria-hidden="true" />
        <button type="button" className="random-text-button" onClick={onClose}>{panel.copy.close}</button>
      </header>
      <RandomFilterPanel {...panel} />
    </div>
  </dialog>;
}
