import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from './useUpdateProfile';
import React from 'react';

const { mockUserService } = vi.hoisted(() => ({
  mockUserService: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/UserService', () => ({
  UserService: vi.fn(function () {
    return mockUserService;
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls userService.updateProfile with the request', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    const request = {
      request: {
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    mockUserService.updateProfile.mockResolvedValue({ data: { response: 'SUCCESS' }, status: 200, headers: {} });

    await result.current.mutateAsync(request);

    expect(mockUserService.updateProfile).toHaveBeenCalledWith(request);
  });

  it('throws when service rejects', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    mockUserService.updateProfile.mockRejectedValue(new Error('Update failed'));

    await expect(
      result.current.mutateAsync({ request: { userId: 'user-123' } })
    ).rejects.toThrow('Update failed');
  });

  it('schedules userRead query invalidation on success', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    mockUserService.updateProfile.mockResolvedValue({ data: { response: 'SUCCESS' }, status: 200, headers: {} });

    await result.current.mutateAsync({ request: { userId: 'user-123' } });

    // Verify that setTimeout was called with the profile refresh delay (1500ms)
    const timeoutCalls = setTimeoutSpy.mock.calls.filter(
      (call) => call[1] === 1500
    );
    expect(timeoutCalls.length).toBeGreaterThan(0);

    setTimeoutSpy.mockRestore();
  });
});
