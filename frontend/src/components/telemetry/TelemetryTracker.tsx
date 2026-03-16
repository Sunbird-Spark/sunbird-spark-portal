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
  
  // Keep track of the latest endEventInput without causing effect re-runs
  const endEventInputRef = useRef(endEventInput);
  useEffect(() => {
    endEventInputRef.current = endEventInput;
  }, [endEventInput]);

  useEffect(() => {
    if (startEventInput && !hasStarted.current) {
      hasStarted.current = true;
      telemetry.start(startEventInput, '', '', {});
    }

    const handleUnload = () => {
      if (endEventInputRef.current) {
        telemetry.end({ edata: endEventInputRef.current });
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (endEventInputRef.current) {
        telemetry.end({ edata: endEventInputRef.current });
      }
      window.removeEventListener('beforeunload', handleUnload);
    };
    // We explicitly omit startEventInput to prevent re-triggering. We only want this once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry]);

  return null;
};
