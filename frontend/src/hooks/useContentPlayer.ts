import { useCallback } from 'react';

interface PlayerEvent {
  type: string;
  data?: any;
  timestamp?: number;
}

interface TelemetryEvent {
  type: string;
  eid?: string;
  edata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  timestamp?: number;
}

interface UseContentPlayerOptions {
  onPlayerEvent?: (event: PlayerEvent) => void;
  onTelemetryEvent?: (event: TelemetryEvent) => void;
  enableLogging?: boolean;
}

export const useContentPlayer = (options: UseContentPlayerOptions = {}) => {
  const { onPlayerEvent, onTelemetryEvent, enableLogging = true } = options;

  const handlePlayerEvent = useCallback((event: PlayerEvent) => {
    if (enableLogging) {
      console.log('Player Event:', event);
    }
    onPlayerEvent?.(event);
  }, [onPlayerEvent, enableLogging]);

  const handleTelemetryEvent = useCallback((event: TelemetryEvent) => {
    if (enableLogging) {
      console.log('Telemetry Event:', event);
    }
    onTelemetryEvent?.(event);
  }, [onTelemetryEvent, enableLogging]);

  return {
    handlePlayerEvent,
    handleTelemetryEvent,
  };
};