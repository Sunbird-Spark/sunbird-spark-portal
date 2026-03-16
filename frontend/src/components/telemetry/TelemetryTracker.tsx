import React, { useEffect, useRef } from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';

interface TelemetryTrackerProps {
  startEventInput?: any;
  endEventInput?: any;
}

export const TelemetryTracker: React.FC<TelemetryTrackerProps> = ({
  startEventInput,
  endEventInput,
}) => {
  const telemetry = useTelemetry();
  const hasStarted = useRef(false);
  const hasEnded = useRef(false);

  // Keep a ref of the latest endEventInput without causing effect re-runs
  const endEventInputRef = useRef(endEventInput);
  useEffect(() => {
    endEventInputRef.current = endEventInput;
  }, [endEventInput]);

  // Capture telemetry in a ref so beforeunload always has the latest reference
  const telemetryRef = useRef(telemetry);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    // Mark the component as "stably mounted" after one tick.
    // React StrictMode's fake unmount fires synchronously (within same microtask),
    // so when the real cleanup runs after a genuine navigation this flag is true.
    let isStableMount = false;
    const stableTimer = setTimeout(() => { isStableMount = true; }, 0);

    // Fire START only once per true mount
    if (startEventInput && !hasStarted.current) {
      hasStarted.current = true;
      telemetryRef.current.start(startEventInput, '', '', {});
    }

    const fireEnd = () => {
      if (endEventInputRef.current && !hasEnded.current) {
        hasEnded.current = true;
        telemetryRef.current.end({ edata: endEventInputRef.current });
      }
    };

    const handleUnload = () => fireEnd();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(stableTimer);
      window.removeEventListener('beforeunload', handleUnload);

      // Only fire END on genuine unmount, not on React StrictMode's fake cycle
      if (isStableMount) {
        fireEnd();
      } else {
        // StrictMode fake unmount — reset refs so the real mount can fire START again
        hasStarted.current = false;
        hasEnded.current = false;
      }
    };
  }, []);

  return null;
};
