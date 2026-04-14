import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/* ── Mocks must be hoisted before imports ── */

const mockUseAuthInfo = vi.fn();

vi.mock('./useAuthInfo', () => ({
  useAuthInfo: () => mockUseAuthInfo(),
}));

// Mock UserService as a class with vi.fn prototype methods
// Important: use class syntax so `new UserService()` works at module load
vi.mock('../services/UserService', () => {
  const getUserRoles = vi.fn();
  return {
    UserService: class {
      getUserRoles = getUserRoles;
      searchUser = vi.fn();
      resetPassword = vi.fn();
      signup = vi.fn();
    },
    __getUserRoles: getUserRoles, // expose for test setup
  };
});

/* ── Imports after mocks ── */
import { useIsAdmin, useIsContentCreator } from './useUser';
import * as UserServiceModule from '../services/UserService';

/* ── Helper ── */
function getGetUserRoles() {
  return (UserServiceModule as any).__getUserRoles as ReturnType<typeof vi.fn>;
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/* ── useIsAdmin tests ── */

describe('useIsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-123', uid: 'user123', isAuthenticated: true },
      isSuccess: true,
    });
  });

  it('returns false when userId is unavailable', () => {
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-789', uid: null, isAuthenticated: false },
      isSuccess: true,
    });

    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });
    expect(result.current).toBe(false);
  });

  it('returns true when user has ORG_ADMIN role', async () => {
    getGetUserRoles().mockResolvedValue({
      data: { response: { roles: [{ role: 'ORG_ADMIN' }] } },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when user does not have ORG_ADMIN role', async () => {
    getGetUserRoles().mockResolvedValue({
      data: { response: { roles: [{ role: 'CONTENT_CREATOR' }] } },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });
    await waitFor(() => expect(getGetUserRoles()).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('falls back to getAuthInfo when getUserId returns null', async () => {
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-456', uid: 'fallback-uid', isAuthenticated: true },
      isSuccess: true,
    });
    getGetUserRoles().mockResolvedValue({
      data: { response: { roles: [{ role: 'ORG_ADMIN' }] } },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useIsAdmin(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current).toBe(true));
  });
});

/* ── useIsContentCreator tests ── */

describe('useIsContentCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-123', uid: 'user123', isAuthenticated: true },
      isSuccess: true,
    });
  });

  it('returns false when userId is unavailable', () => {
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-789', uid: null, isAuthenticated: false },
      isSuccess: true,
    });

    const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });
    expect(result.current).toBe(false);
  });

  it('returns true when user has CONTENT_CREATOR role', async () => {
    getGetUserRoles().mockResolvedValue({
      data: { response: { roles: [{ role: 'CONTENT_CREATOR' }] } },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when user lacks CONTENT_CREATOR role', async () => {
    getGetUserRoles().mockResolvedValue({
      data: { response: { roles: [{ role: 'ORG_ADMIN' }] } },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });
    await waitFor(() => expect(getGetUserRoles()).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});
