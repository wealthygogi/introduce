import { useEffect, useRef } from 'react';
import type { FilterProps } from './RandomFilterPanel';
import RandomFilterPanel from './RandomFilterPanel';

type Props = FilterProps & {
  open: boolean;
  onClose: () => void;
};

export default function RandomFilterSheet({ open, onClose, ...panel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
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
