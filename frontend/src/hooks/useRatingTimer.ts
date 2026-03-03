import { useCallback, useEffect, useRef } from "react";

/**
 * Manages a delayed rating popup timer.
 * - `onContentEnd`: schedules the popup after `delayMs` (cancels any pending timer first).
 * - `onContentStart`: cancels any pending timer (e.g. when content is replayed).
 * The timer is also cleared on unmount.
 */
export function useRatingTimer(onOpen: () => void, delayMs = 5000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onContentEnd = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onOpen, delayMs);
  }, [onOpen, delayMs]);

  const onContentStart = useCallback(() => {
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }, []);

  return { onContentEnd, onContentStart };
}
