import { useEffect, useRef, type ReactNode } from 'react';

export default function TasteDialog({ label, className = '', onClose, opener, children }: { label: string; className?: string; onClose: () => void; opener: HTMLElement | null; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); opener?.focus(); };
  }, []);
  return <dialog ref={ref} role="dialog" className={`taste-character-dialog ${className}`} aria-label={label} onCancel={event => { if (event.target === event.currentTarget) { event.preventDefault(); onClose(); } }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
