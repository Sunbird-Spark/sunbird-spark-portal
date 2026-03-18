import React, { useEffect, useRef } from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';

interface TelemetryTrackerOptions {
  object?: any;
  context?: any;
}

interface TelemetryTrackerProps {
  startEventInput?: any;
  endEventInput?: any;
  startOptions?: TelemetryTrackerOptions;
  endOptions?: TelemetryTrackerOptions;
  /** When true, START event is suppressed until data is ready. Pass false/undefined once data loads. */
  disabled?: boolean;
}

export const TelemetryTracker: React.FC<TelemetryTrackerProps> = ({
  startEventInput,
  endEventInput,
  startOptions,
  endOptions,
  disabled,
}) => {
  const telemetry = useTelemetry();
  const hasStarted = useRef(false);
  const hasEnded = useRef(false);

  // Keep live refs so beforeunload always reads latest values without retriggering the effect
  const endEventInputRef = useRef(endEventInput);
  useEffect(() => { endEventInputRef.current = endEventInput; }, [endEventInput]);

  const endOptionsRef = useRef(endOptions);
  useEffect(() => { endOptionsRef.current = endOptions; }, [endOptions]);

  const telemetryRef = useRef(telemetry);
  useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);

  // Effect that fires START once data is available (disabled becomes false).
  // `startEventInput` and `startOptions` are intentionally excluded from deps:
  // START must fire exactly once when disabled flips to false, not re-fire
  // if props change later (hasStarted.current guards the single-fire semantic).
  useEffect(() => {
    if (disabled) return;
    if (startEventInput && !hasStarted.current) {
      hasStarted.current = true;
      telemetryRef.current.start(startEventInput, '', '', {}, startOptions);
    }
  }, [disabled]);

  useEffect(() => {
    // isStableMount guards against React StrictMode's fake mount/unmount cycle.
    // StrictMode unmounts synchronously so the timer won't fire before cleanup.
    // A genuine navigation unmount happens after at least one tick.
    let isStableMount = false;
    const stableTimer = setTimeout(() => { isStableMount = true; }, 0);

    const fireEnd = () => {
      if (endEventInputRef.current && !hasEnded.current) {
        hasEnded.current = true;
        telemetryRef.current.end({ edata: endEventInputRef.current, ...endOptionsRef.current });
      }
    };

    const handleUnload = () => fireEnd();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(stableTimer);
      window.removeEventListener('beforeunload', handleUnload);

      if (isStableMount) {
        fireEnd();
      } else {
        // StrictMode fake unmount — reset so the real mount can fire START/END
        hasStarted.current = false;
        hasEnded.current = false;
      }
    };
  }, []);

  return null;
};
