import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useTelemetry } from './useTelemetry';
import { TelemetryProvider } from '../providers/TelemetryProvider';
import { telemetryService } from '../services/TelemetryService';

vi.mock('../services/TelemetryService', () => ({
  telemetryService: {
    isInitialized: false,
    initialize: vi.fn(),
    interact: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: vi.fn(() => null), getSessionId: vi.fn(() => null) },
}));

vi.mock('@/services/AppCoreService', () => ({
  default: {
    getPData: vi.fn().mockResolvedValue({ id: 'app', ver: '1.0', pid: 'app' }),
    getDeviceId: vi.fn().mockResolvedValue('device-id'),
  },
}));

vi.mock('@/services/UserProfileService', () => ({
  default: { getChannel: vi.fn().mockResolvedValue('') },
}));

vi.mock('@/services/OrganizationService', () => ({
  OrganizationService: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      data: { response: { content: [] } },
      headers: {},
      status: 200,
    }),
  })),
}));

vi.mock('@/services/SystemSettingService', () => ({
  SystemSettingService: vi.fn().mockImplementation(() => ({
    read: vi.fn().mockResolvedValue({ data: { response: { value: 'sunbird' } }, status: 200 }),
  })),
}));

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
    // Hook returns the real telemetryService instance from context
    expect(result.current).toBe(telemetryService);
  });
});
