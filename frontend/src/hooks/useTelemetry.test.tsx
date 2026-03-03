import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useTelemetry } from './useTelemetry';
import { TelemetryProvider } from '../providers/TelemetryProvider';
import { telemetryService } from '../services/TelemetryService';

describe('useTelemetry', () => {
  it('should return default fallback object when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useTelemetry());
    expect(result.current.isInitialized).toBe(false);
    expect(typeof result.current.impression).toBe('function');
    expect(() => result.current.impression({ edata: { type: 'test' }})).not.toThrow();
    consoleSpy.mockRestore();
  });

  it('should return telemetryService when used inside provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TelemetryProvider>{children}</TelemetryProvider>
    );
    const { result } = renderHook(() => useTelemetry(), { wrapper });
    expect(result.current).toBe(telemetryService);
    expect(result.current.isInitialized).toBe(true);
  });
});
