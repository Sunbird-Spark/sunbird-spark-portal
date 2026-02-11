import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLearnerFuzzySearch, useResetPassword, useSignup } from './useUser';
import React from 'react';

const { mockUserService } = vi.hoisted(() => ({
  mockUserService: {
    searchUser: vi.fn(),
    resetPassword: vi.fn(),
    signup: vi.fn(),
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

describe('useUser hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('useSignup', () => {
    it('should call signup with correct parameters', async () => {
      mockUserService.signup.mockResolvedValue({ 
        data: { userId: '123', accessToken: 'token', refreshToken: 'refresh' } 
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
