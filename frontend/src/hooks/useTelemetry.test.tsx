import { renderHook } from '@testing-library/react';
import { useTelemetry } from './useTelemetry';
import { TelemetryProvider } from '../providers/TelemetryProvider';
import { telemetryService } from '../services/TelemetryService';
import { vi } from 'vitest';

describe('useTelemetry', () => {
  it('should return default fallback object when used outside provider', () => {
    // Suppress console.warn for this test
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useTelemetry());
    
    expect(result.current.isInitialized).toBe(false);
    expect(typeof result.current.impression).toBe('function');
    
    // Ensure fallback doesn't throw when called
    expect(() => result.current.impression({ edata: { type: 'test' }})).not.toThrow();
    
    consoleSpy.mockRestore();
  });

  it('should return telemetryService when used inside provider', () => {
    const config: any = {
      pdata: { id: 'test', ver: '1.0' },
      env: 'test',
      channel: 'test'
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TelemetryProvider>{children}</TelemetryProvider>
    );

    const { result } = renderHook(() => useTelemetry(), { wrapper });
    
    expect(result.current).toBe(telemetryService);
    // Should be initialized due to Provider's useEffect
    expect(result.current.isInitialized).toBe(true);
  });
});
