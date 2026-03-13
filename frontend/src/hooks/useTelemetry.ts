import { useContext } from 'react';
import { TelemetryContext } from '../providers/TelemetryProvider';
import { ITelemetryService, TelemetryEventInput } from '../services/TelemetryService';

export const useTelemetry = (): ITelemetryService => {
  const context = useContext(TelemetryContext);

  if (!context) {
    console.warn('useTelemetry must be used within a TelemetryProvider. Telemetry will not be recorded.');
    // Provide a safe mock fallback if used outside of provider to prevent crashes
    return {
      interact: (eventInput: TelemetryEventInput) => {},
      impression: (eventInput: TelemetryEventInput) => {},
      start: (config: Record<string, unknown> | any, contentId: string, contentVer: string, data: Record<string, unknown> | any, options?: Omit<TelemetryEventInput, 'edata'>) => {},
      end: (eventInput: TelemetryEventInput) => {},
      error: (eventInput: TelemetryEventInput) => {},
      audit: (eventInput: TelemetryEventInput) => {},
      log: (eventInput: TelemetryEventInput) => {},
      exData: (eventInput: TelemetryEventInput) => {},
      feedback: (eventInput: TelemetryEventInput) => {},
      share: (eventInput: TelemetryEventInput) => {},
      get isInitialized() {
        return false;
      }
    };
  }

  return context;
};
