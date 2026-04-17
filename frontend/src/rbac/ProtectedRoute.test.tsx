import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const { mockUsePermissions } = vi.hoisted(() => ({
  mockUsePermissions: vi.fn(),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: any) => <div data-testid="page-loader">{message}</div>,
}));

const renderRoute = (element: React.ReactNode, initialPath = '/protected') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/home" element={<div data-testid="home-page" />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/unauthorized" element={<div data-testid="unauthorized-page" />} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows PageLoader when loading and no fallback provided', () => {
      mockUsePermissions.mockReturnValue({ isLoading: true, isAuthenticated: false, hasAnyRole: () => false });
      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['PUBLIC']}>
            <div data-testid="content" />
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
      expect(screen.getByTestId('page-loader')).toHaveTextContent('Checking permissions...');
    });

    it('shows custom fallback when loading and fallback prop provided (line 31)', () => {
      mockUsePermissions.mockReturnValue({ isLoading: true, isAuthenticated: false, hasAnyRole: () => false });
      render(
        <MemoryRouter>
          <ProtectedRoute
            allowedRoles={['PUBLIC']}
            fallback={<div data-testid="custom-fallback">Loading…</div>}
          >
            <div data-testid="content" />
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated user (line 35)', () => {
    it('redirects to default unauthenticatedTo (/home) when not authenticated', () => {
      mockUsePermissions.mockReturnValue({ isLoading: false, isAuthenticated: false, hasAnyRole: () => false });
      renderRoute(
        <ProtectedRoute allowedRoles={['PUBLIC']}>
          <div data-testid="content" />
        </ProtectedRoute>
      );
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('redirects to custom unauthenticatedTo when specified', () => {
      mockUsePermissions.mockReturnValue({ isLoading: false, isAuthenticated: false, hasAnyRole: () => false });
      renderRoute(
        <ProtectedRoute allowedRoles={['PUBLIC']} unauthenticatedTo="/login">
          <div data-testid="content" />
        </ProtectedRoute>
      );
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('authenticated user without required role', () => {
    it('redirects to unauthorizedTo when user lacks the required role', () => {
      mockUsePermissions.mockReturnValue({ isLoading: false, isAuthenticated: true, hasAnyRole: () => false });
      renderRoute(
        <ProtectedRoute allowedRoles={['CONTENT_CREATOR']} unauthorizedTo="/unauthorized">
          <div data-testid="content" />
        </ProtectedRoute>
      );
      expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('redirects to default /home when unauthorizedTo is not specified', () => {
      mockUsePermissions.mockReturnValue({ isLoading: false, isAuthenticated: true, hasAnyRole: () => false });
      renderRoute(
        <ProtectedRoute allowedRoles={['CONTENT_CREATOR']}>
          <div data-testid="content" />
        </ProtectedRoute>
      );
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  describe('authenticated user with required role', () => {
    it('renders children when authenticated and has the required role', () => {
      mockUsePermissions.mockReturnValue({ isLoading: false, isAuthenticated: true, hasAnyRole: () => true });
      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['PUBLIC']}>
            <div data-testid="protected-content" />
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
