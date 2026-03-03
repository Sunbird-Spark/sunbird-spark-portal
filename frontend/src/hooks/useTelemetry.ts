import { useContext } from 'react';
import { TelemetryContext } from '../providers/TelemetryProvider';
import { TelemetryEventInput } from '../services/TelemetryService';

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);

  if (!context) {
    console.warn('useTelemetry must be used within a TelemetryProvider. Telemetry will not be recorded.');
    // Provide a safe mock fallback if used outside of provider to prevent crashes
    return {
      initialize: () => {},
      interact: (eventInput: TelemetryEventInput) => {},
      impression: (eventInput: TelemetryEventInput) => {},
      start: (config: any, contentId: string, contentVer: string, data: any, options?: any) => {},
      end: (eventInput: TelemetryEventInput) => {},
      error: (eventInput: TelemetryEventInput) => {},
      audit: (eventInput: TelemetryEventInput) => {},
      share: (eventInput: TelemetryEventInput) => {},
      log: (eventInput: TelemetryEventInput) => {},
      exData: (eventInput: TelemetryEventInput) => {},
      feedback: (eventInput: TelemetryEventInput) => {},
      get isInitialized() {
        return false;
      }
    };
  }

  return context;
};
