import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateOtp, useVerifyOtp } from './useOtp';
import React from 'react';

const { mockOtpService } = vi.hoisted(() => ({
  mockOtpService: {
    generateOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('../services/OtpService', () => ({
  OtpService: vi.fn(function () {
    return mockOtpService;
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useOtp hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useGenerateOtp calls service', async () => {
    const { result } = renderHook(() => useGenerateOtp(), { wrapper });
    const request = { userId: 'u1' };

    mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });

    await result.current.mutateAsync({ request });

    expect(mockOtpService.generateOtp).toHaveBeenCalled();
  });

  it('useVerifyOtp calls service', async () => {
    const { result } = renderHook(() => useVerifyOtp(), { wrapper });
    const request = { otp: '123456' };

    mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

    await result.current.mutateAsync({ request });

    expect(mockOtpService.verifyOtp).toHaveBeenCalled();
  });
});
