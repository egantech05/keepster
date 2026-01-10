import { useCallback, useRef, useState } from 'react';

const DEFAULT_DURATION = 2400;

type ToastHook = {
  message: string | null;
  showToast: (message: string, durationMs?: number) => void;
  clearToast: () => void;
};

export function useToast(): ToastHook {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage(null);
  }, []);

  const showToast = useCallback(
    (nextMessage: string, durationMs = DEFAULT_DURATION) => {
      setMessage(nextMessage);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    []
  );

  return { message, showToast, clearToast };
}
