import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthInfo, useSessionId, useUserId, useIsAuthenticated } from './useAuthInfo';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getAuthInfo: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuthInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return auth info', async () => {
    const mockAuthInfo = {
      sid: 'session-123',
      uid: 'user-456',
      isAuthenticated: true,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useAuthInfo(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAuthInfo);
    expect(userAuthInfoService.getAuthInfo).toHaveBeenCalledTimes(1);
  });

  it('should handle anonymous users', async () => {
    const mockAuthInfo = {
      sid: 'session-789',
      uid: null,
      isAuthenticated: false,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useAuthInfo(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAuthInfo);
    expect(result.current.data?.uid).toBeNull();
    expect(result.current.data?.isAuthenticated).toBe(false);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Network error');
    vi.mocked(userAuthInfoService.getAuthInfo).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuthInfo(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.error).toBeTruthy();
  });
});

describe('useSessionId', () => {
  it('should return session ID from auth info', async () => {
    const mockAuthInfo = {
      sid: 'session-123',
      uid: 'user-456',
      isAuthenticated: true,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useSessionId(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe('session-123'));
  });

  it('should return null when auth info is not loaded', () => {
    vi.mocked(userAuthInfoService.getAuthInfo).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useSessionId(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeNull();
  });
});

describe('useUserId', () => {
  it('should return user ID from auth info', async () => {
    const mockAuthInfo = {
      sid: 'session-123',
      uid: 'user-456',
      isAuthenticated: true,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useUserId(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe('user-456'));
  });

  it('should return null for anonymous users', async () => {
    const mockAuthInfo = {
      sid: 'session-789',
      uid: null,
      isAuthenticated: false,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useUserId(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBeNull());
  });
});

describe('useIsAuthenticated', () => {
  it('should return true for authenticated users', async () => {
    const mockAuthInfo = {
      sid: 'session-123',
      uid: 'user-456',
      isAuthenticated: true,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('should return false for anonymous users', async () => {
    const mockAuthInfo = {
      sid: 'session-789',
      uid: null,
      isAuthenticated: false,
    };

    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(mockAuthInfo);

    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('should return false while loading', () => {
    vi.mocked(userAuthInfoService.getAuthInfo).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
  });
});
