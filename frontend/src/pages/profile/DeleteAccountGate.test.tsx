import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DeleteAccountGate from './DeleteAccountGate';

const mockUseIsAuthenticated = vi.fn();

vi.mock('@/hooks/useAuthInfo', () => ({
  useIsAuthenticated: () => mockUseIsAuthenticated(),
  useUserId: () => 'user-1',
}));

vi.mock('./DeleteAccount', () => ({
  default: () => <div data-testid="delete-account-page">Delete Account Page</div>,
}));

vi.mock('./DeleteAccountLanding', () => ({
  default: () => <div data-testid="delete-account-landing">Landing</div>,
}));

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

vi.mock('@/rbac/OnboardingGuard', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderGate = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <DeleteAccountGate />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('DeleteAccountGate', () => {
  beforeEach(() => {
    mockUseIsAuthenticated.mockReset();
  });

  it('renders a loader while auth info is loading', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: false, isLoading: true });
    renderGate();
    expect(screen.queryByTestId('delete-account-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-account-landing')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-layout')).not.toBeInTheDocument();
  });

  it('renders the landing page (no layout) when the user is not authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderGate();
    expect(screen.getByTestId('delete-account-landing')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-account-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-layout')).not.toBeInTheDocument();
  });

  it('renders the delete account page inside PageLayout when authenticated', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderGate();
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
    expect(screen.getByTestId('delete-account-page')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-account-landing')).not.toBeInTheDocument();
  });
});
