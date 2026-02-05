import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLearnerFuzzySearch, useResetPassword } from './useUser';
import React from 'react';

const { mockUserService } = vi.hoisted(() => ({
  mockUserService: {
    searchUser: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('../services/UserService', () => ({
  UserService: vi.fn(function () {
    return mockUserService;
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

describe('useUser hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useLearnerFuzzySearch calls service', async () => {
    const { result } = renderHook(() => useLearnerFuzzySearch(), { wrapper });
    const identifier = 'test@example.com';
    const name = 'John';

    mockUserService.searchUser.mockResolvedValue({ data: 'success' });

    await result.current.mutateAsync({ identifier, name });

    expect(mockUserService.searchUser).toHaveBeenCalledWith(identifier, name, undefined);
  });

  it('useResetPassword calls service', async () => {
    const { result } = renderHook(() => useResetPassword(), { wrapper });
    const request = { password: 'new' };

    mockUserService.resetPassword.mockResolvedValue({ data: 'success' });

    await result.current.mutateAsync({ request });

    expect(mockUserService.resetPassword).toHaveBeenCalled();
  });
});
