import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from './usePermission';

const { mockIsUserAuthenticated, mockUseUserRead } = vi.hoisted(() => ({
  mockIsUserAuthenticated: vi.fn(),
  mockUseUserRead: vi.fn(),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    isUserAuthenticated: mockIsUserAuthenticated,
  },
}));

vi.mock('./useUserRead', () => ({
  useUserRead: mockUseUserRead,
}));

const mockRefetch = vi.fn().mockResolvedValue(undefined);

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsUserAuthenticated.mockReturnValue(true);
    mockUseUserRead.mockReturnValue({
      data: {
        data: {
          response: {
            roles: [{ role: 'CONTENT_CREATOR' }, { role: 'ORG_ADMIN' }],
          },
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('returns normalized roles from userRead data', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toContain('CONTENT_CREATOR');
    expect(result.current.roles).toContain('ORG_ADMIN');
  });

  it('returns PUBLIC when user is not authenticated', () => {
    mockIsUserAuthenticated.mockReturnValue(false);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toEqual(['PUBLIC']);
  });

  it('returns PUBLIC when userRead data has no roles', () => {
    mockUseUserRead.mockReturnValue({
      data: { data: { response: { roles: [] } } },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toEqual(['PUBLIC']);
  });

  it('returns PUBLIC when userRead data is undefined', () => {
    mockUseUserRead.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toEqual(['PUBLIC']);
  });

  it('hasAnyRole returns true when user has one of the specified roles', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAnyRole(['CONTENT_CREATOR', 'BOOK_CREATOR'])).toBe(true);
  });

  it('hasAnyRole returns false when user has none of the specified roles', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAnyRole(['BOOK_CREATOR', 'BOOK_REVIEWER'])).toBe(false);
  });

  it('hasAnyRole returns true when requiredRoles is empty', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAnyRole([])).toBe(true);
  });

  it('canAccessFeature returns true for view_workspace when user has CONTENT_CREATOR', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessFeature('view_workspace')).toBe(true);
  });

  it('canAccessFeature returns false for view_workspace when user only has PUBLIC', () => {
    mockUseUserRead.mockReturnValue({
      data: { data: { response: { roles: [{ role: 'PUBLIC' }] } } },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccessFeature('view_workspace')).toBe(false);
  });

  it('exposes isLoading and isAuthenticated from underlying hook', () => {
    mockUseUserRead.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('exposes error from underlying hook', () => {
    const err = new Error('fetch failed');
    mockUseUserRead.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: err,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.error).toBe(err);
  });

  it('refetch calls underlying refetch and awaits it', async () => {
    const { result } = renderHook(() => usePermissions());
    await result.current.refetch();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles string roles from API (not object)', () => {
    mockUseUserRead.mockReturnValue({
      data: { data: { response: { roles: ['CONTENT_REVIEWER', 'ORG_ADMIN'] } } },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.roles).toContain('CONTENT_REVIEWER');
  });
});
