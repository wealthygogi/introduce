import { useEffect, useRef } from 'react';

type Props = {
  message: string;
  actionLabel?: string;
  dismissLabel: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
};

export default function CouplingSnackbar({
  message,
  actionLabel,
  dismissLabel,
  onAction,
  onDismiss,
  duration = 5000,
}: Props) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timeout = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, message]);

  return <div className="coupling-snackbar">
    <span role="status" aria-live="polite">{message}</span>
    {actionLabel && onAction && <button type="button" onClick={() => { onAction(); onDismiss(); }}>{actionLabel}</button>}
    <button type="button" aria-label={dismissLabel} onClick={onDismiss}>×</button>
  </div>;
}
