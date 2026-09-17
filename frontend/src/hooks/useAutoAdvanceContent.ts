import { useEffect, useRef } from 'react';

const COMPLETE_STATUS = 2;
/** Long enough for the "Completed" tick to register before the view changes. */
export const AUTO_ADVANCE_DELAY_MS = 1200;

interface UseAutoAdvanceContentArgs {
  contentId: string | undefined;
  /** The current content's status from the path summary; 2 means complete. */
  status: number | undefined;
  /** Next leaf in the course, or undefined on the last one. */
  nextContentId: string | undefined;
  onAdvance: (nextContentId: string) => void;
  enabled?: boolean;
  delayMs?: number;
}

/**
 * Moves the learner to the next content once the current one completes.
 *
 * ONLY ON A TRANSITION. The status is read from the path summary, so an
 * already-finished leaf reports 2 the moment it is opened - advancing on the
 * value rather than the change would make a completed course impossible to
 * revisit: every open would immediately bounce forward, and the last leaf would
 * be the only one a learner could ever look at again.
 *
 * So the first status seen for a given contentId is recorded and never acted
 * on; only a later change into 2 advances. The ref is keyed by contentId so
 * navigating to a new leaf re-arms cleanly.
 */
export function useAutoAdvanceContent({
  contentId,
  status,
  nextContentId,
  onAdvance,
  enabled = true,
  delayMs = AUTO_ADVANCE_DELAY_MS,
}: UseAutoAdvanceContentArgs): void {
  // contentId the ref's `seen` value belongs to, so a leaf change resets it
  const seenFor = useRef<string | undefined>(undefined);
  const seen = useRef<number | undefined>(undefined);
  // Set once per leaf, so a re-render cannot schedule a second advance.
  const armed = useRef(false);

  // onAdvance is typically an inline arrow at the call site, so it has a new identity on every
  // render. Holding it in a ref keeps it OUT of the effect's dependencies: with it in, the effect
  // re-ran on every render, and its cleanup cancelled the pending timer before the delay elapsed.
  // Completing a leaf triggers a summary refetch, so a re-render within 1200ms is the normal case -
  // the advance was therefore cancelled essentially every time, and could not re-arm because
  // `seen` had already been moved to 2, making `justCompleted` false thereafter.
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  useEffect(() => {
    if (!enabled || !contentId) return;

    if (seenFor.current !== contentId) {
      // first observation for this leaf - baseline only, never advance
      seenFor.current = contentId;
      seen.current = status;
      armed.current = false;
      return;
    }

    const previous = seen.current;
    seen.current = status;

    if (armed.current) return;
    const justCompleted = previous !== COMPLETE_STATUS && status === COMPLETE_STATUS;
    if (!justCompleted || !nextContentId) return;

    armed.current = true;
    const next = nextContentId;
    const timer = setTimeout(() => advanceRef.current(next), delayMs);
    return () => clearTimeout(timer);
  }, [contentId, status, nextContentId, enabled, delayMs]);
}
