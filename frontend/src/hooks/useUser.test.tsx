import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLearnerFuzzySearch, useResetPassword, useSignup, useIsContentCreator } from './useUser';
import React from 'react';

const { mockUserService, mockUseAuthInfo } = vi.hoisted(() => ({
  mockUserService: {
    searchUser: vi.fn(),
    resetPassword: vi.fn(),
    signup: vi.fn(),
    getUserRoles: vi.fn(),
  },
  mockUseAuthInfo: vi.fn(),
}));

vi.mock('../services/UserService', () => ({
  UserService: vi.fn(function () {
    return mockUserService;
  }),
}));

vi.mock('./useAuthInfo', () => ({
  useAuthInfo: () => mockUseAuthInfo(),
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

describe('useUser hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: userId available from auth info
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-123', uid: 'user-123', isAuthenticated: true },
      isSuccess: true,
    });
  });

  describe('useLearnerFuzzySearch', () => {
    it('should call searchUser with correct parameters', async () => {
      mockUserService.searchUser.mockResolvedValue({ data: 'success' });
      
      const { result } = renderHook(() => useLearnerFuzzySearch(), { wrapper: createWrapper() });
      
      await result.current.mutateAsync({
        identifier: 'test@example.com',
        name: 'John Doe',
        captchaResponse: 'captcha-token'
      });

      expect(mockUserService.searchUser).toHaveBeenCalledWith(
        'test@example.com',
        'John Doe',
        'captcha-token'
      );
    });
  });

  describe('useResetPassword', () => {
    it('should call resetPassword with correct parameters', async () => {
      const request = {
        key: 'test@example.com',
        password: 'newPassword123!'
      };
      mockUserService.resetPassword.mockResolvedValue({ data: 'success' });
      
      const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });
      
      await result.current.mutateAsync({ request });

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(request);
    });
  });

  /* ── useIsContentCreator ── */
  describe('useIsContentCreator', () => {
    it('returns true when API response includes CONTENT_CREATOR role', async () => {
      mockUserService.getUserRoles.mockResolvedValue({
        data: {
          response: {
            roles: [{ role: 'CONTENT_CREATOR' }, { role: 'PUBLIC' }],
          },
        },
      });

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
      expect(mockUserService.getUserRoles).toHaveBeenCalledWith('user-123');
    });

    it('returns false when API response does NOT include CONTENT_CREATOR role', async () => {
      mockUserService.getUserRoles.mockResolvedValue({
        data: {
          response: {
            roles: [{ role: 'PUBLIC' }, { role: 'REPORT_VIEWER' }],
          },
        },
      });

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockUserService.getUserRoles).toHaveBeenCalled();
      });
      expect(result.current).toBe(false);
    });

    it('returns false when roles array is empty', async () => {
      mockUserService.getUserRoles.mockResolvedValue({
        data: { response: { roles: [] } },
      });

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockUserService.getUserRoles).toHaveBeenCalled();
      });
      expect(result.current).toBe(false);
    });

    it('returns false (loading) before the query resolves', () => {
      // Never resolves — query stays in pending state
      mockUserService.getUserRoles.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      // While loading, data is undefined → false
      expect(result.current).toBe(false);
    });

    it('falls back to getAuthInfo when getUserId returns null', async () => {
      mockUseAuthInfo.mockReturnValue({
        data: { sid: 'session-456', uid: 'auth-user-456', isAuthenticated: true },
        isSuccess: true,
      });
      mockUserService.getUserRoles.mockResolvedValue({
        data: {
          response: {
            roles: [{ role: 'CONTENT_CREATOR' }],
          },
        },
      });

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
      expect(mockUserService.getUserRoles).toHaveBeenCalledWith('auth-user-456');
    });

    it('returns false when both getUserId and getAuthInfo return no userId', async () => {
      mockUseAuthInfo.mockReturnValue({
        data: { sid: 'session-789', uid: null, isAuthenticated: false },
        isSuccess: true,
      });

      const { result } = renderHook(() => useIsContentCreator(), { wrapper: createWrapper() });

      // queryFn returns [] when userId is absent — hook returns false
      await waitFor(() => {
        expect(mockUseAuthInfo).toHaveBeenCalled();
      });
      expect(result.current).toBe(false);
      expect(mockUserService.getUserRoles).not.toHaveBeenCalled();
    });
  });

  describe('useSignup', () => {
    it('should call signup with correct parameters', async () => {
      mockUserService.signup.mockResolvedValue({ 
        data: { userId: '123' } 
      });
      
      const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
      
      await result.current.mutateAsync({
        firstName: 'John',
        identifier: 'test@example.com',
        password: 'Password123!',
        deviceId: 'device-123'
      });

      expect(mockUserService.signup).toHaveBeenCalledWith(
        'John',
        'test@example.com',
        'Password123!',
        'device-123'
      );
    });

    it('should handle signup without deviceId', async () => {
      mockUserService.signup.mockResolvedValue({ 
        data: { userId: '123' } 
      });
      
      const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
      
      await result.current.mutateAsync({
        firstName: 'Jane',
        identifier: 'test@example.com',
        password: 'Password123!'
      });

      expect(mockUserService.signup).toHaveBeenCalledWith(
        'Jane',
        'test@example.com',
        'Password123!',
        undefined
      );
    });
  });
});
