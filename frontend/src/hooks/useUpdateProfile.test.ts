import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUpdateProfile } from './useUpdateProfile';

const { mockUpdateProfile } = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
}));

vi.mock('../services/UserService', () => ({
  UserService: class {
    updateProfile = mockUpdateProfile;
  },
}));

describe('useUpdateProfile', () => {
  let queryClient: QueryClient;
  let invalidateQueriesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    mockUpdateProfile.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createWrapper = (client: QueryClient) =>
    ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);

  it('calls userService.updateProfile with the provided request', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ request: { userId: 'u1', profileDetails: {} } } as any);
    });

    expect(mockUpdateProfile).toHaveBeenCalledOnce();
  });

  it('does not call invalidateQueries before the 1500ms delay (line 22)', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ request: { userId: 'u1', profileDetails: {} } } as any);
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('calls queryClient.invalidateQueries with userRead after 1500ms on success (line 22)', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ request: { userId: 'u1', profileDetails: {} } } as any);
    });

    act(() => { vi.advanceTimersByTime(1500); });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['userRead'] });
  });
});
