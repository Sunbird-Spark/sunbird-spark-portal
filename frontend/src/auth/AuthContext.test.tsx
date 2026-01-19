import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth, User, Role } from './AuthContext';

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null user and isAuthenticated false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user and set isAuthenticated to true', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const testUser: User = {
      id: '123',
      name: 'Test User',
      role: 'admin',
    };

    act(() => {
      result.current.login(testUser);
    });

    expect(result.current.user).toEqual(testUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout user and set isAuthenticated to false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const testUser: User = {
      id: '123',
      name: 'Test User',
      role: 'content_creator',
    };

    act(() => {
      result.current.login(testUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should support all role types', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const roles: Role[] = ['admin', 'content_creator', 'content_reviewer', 'guest'];

    roles.forEach((role) => {
      const testUser: User = {
        id: '123',
        name: `User ${role}`,
        role: role,
      };

      act(() => {
        result.current.login(testUser);
      });

      expect(result.current.user?.role).toBe(role);
    });
  });
});
