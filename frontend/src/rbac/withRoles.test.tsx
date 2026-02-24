import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { withRoles } from './withRoles';

/* ── Mock dependencies ────────────────────────────────────────────────── */

vi.mock('@/auth/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    isUserAuthenticated: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('../services/UserService', () => ({
  UserService: class {
    getUserRoles = vi.fn();
  },
}));

import { useAuth } from '@/auth/AuthContext';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { useQuery } from '@tanstack/react-query';

const MockComponent = () => <div>Protected Content</div>;


const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithRoles(allowedRoles: any[], queryClient: QueryClient) {
  const Protected = withRoles(allowedRoles)(MockComponent);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Protected />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('withRoles HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (userAuthInfoService.isUserAuthenticated as any).mockReturnValue(false);
  });

  describe('unauthenticated user', () => {
    it('redirects to /home when not authenticated', () => {
      (useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
      (useQuery as any).mockReturnValue({ data: [], isLoading: false });

      renderWithRoles(['admin'], createQueryClient());
      expect(screen.queryByText('Protected Content')).toBeNull();
    });

    it('uses userAuthInfoService as fallback for authentication', () => {
      (useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
      (userAuthInfoService.isUserAuthenticated as any).mockReturnValue(true);
      (useQuery as any).mockReturnValue({ data: [{ role: 'ORG_ADMIN' }], isLoading: false });

      renderWithRoles(['admin'], createQueryClient());
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({ isAuthenticated: true, user: null });
    });

    it('renders null (loading state) while roles are loading', () => {
      (useQuery as any).mockReturnValue({ data: undefined, isLoading: true });

      const { container } = renderWithRoles(['admin'], createQueryClient());
      expect(screen.queryByText('Protected Content')).toBeNull();
      expect(container.firstChild).toBeNull();
    });

    it('renders component when user has the required role', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'ORG_ADMIN' }], isLoading: false });

      renderWithRoles(['admin'], createQueryClient());
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to /unauthorized when user lacks the required role', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'CONTENT_CREATOR' }], isLoading: false });

      renderWithRoles(['admin'], createQueryClient());
      expect(screen.queryByText('Protected Content')).toBeNull();
    });

    it('grants access for content_creator role', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'CONTENT_CREATOR' }], isLoading: false });

      renderWithRoles(['content_creator'], createQueryClient());
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('grants access for content_reviewer role', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'CONTENT_REVIEWER' }], isLoading: false });

      renderWithRoles(['content_reviewer'], createQueryClient());
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('grants access when user has one of multiple allowed roles', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'ORG_ADMIN' }], isLoading: false });

      renderWithRoles(['admin', 'content_creator'], createQueryClient());
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('returns false for unknown roles not in the map', () => {
      (useQuery as any).mockReturnValue({ data: [{ role: 'ORG_ADMIN' }], isLoading: false });

      // 'guest' has no backend role mapping — should redirect to unauthorized
      renderWithRoles(['guest'], createQueryClient());
      expect(screen.queryByText('Protected Content')).toBeNull();
    });

    it('sets correct displayName on wrapped component', () => {
      const Protected = withRoles(['admin'])(MockComponent);
      expect(Protected.displayName).toBe('withRoles(MockComponent)');
    });
  });
});
