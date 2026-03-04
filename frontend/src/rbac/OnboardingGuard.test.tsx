import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OnboardingGuard from './OnboardingGuard';

const mockUseFormRead = vi.fn();
const mockUseUserRead = vi.fn();

vi.mock('@/hooks/useForm', () => ({
  useFormRead: () => mockUseFormRead(),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => mockUseUserRead(),
}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderGuard = (children = <div>Protected Content</div>) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <OnboardingGuard>{children}</OnboardingGuard>
      </MemoryRouter>
    </QueryClientProvider>
  );

const formEnabled = {
  data: { data: { form: { data: { isEnabled: true, initialScreenId: 'role', screens: {} } } } },
  isLoading: false,
};

const formDisabled = {
  data: { data: { form: { data: { isEnabled: false, initialScreenId: 'role', screens: {} } } } },
  isLoading: false,
};

const userWithOnboarding = (onboardingDetails: any) => ({
  data: { data: { response: { framework: { onboardingDetails } } } },
  isLoading: false,
  isFetching: false,
});

const userWithoutOnboarding = {
  data: { data: { response: { framework: {} } } },
  isLoading: false,
  isFetching: false,
};

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows spinner while form data is loading', () => {
    mockUseFormRead.mockReturnValue({ data: null, isLoading: true });
    mockUseUserRead.mockReturnValue({ data: null, isLoading: false, isFetching: false });

    const { container } = renderGuard();
    expect(container.querySelector('.onboarding-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows spinner while user data is loading', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue({ data: null, isLoading: true, isFetching: true });

    const { container } = renderGuard();
    expect(container.querySelector('.onboarding-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows spinner while refetching when user has not yet completed onboarding', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue({ ...userWithoutOnboarding, isFetching: true });

    const { container } = renderGuard();
    expect(container.querySelector('.onboarding-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /onboarding when enabled and onboardingDetails is missing', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue(userWithoutOnboarding);

    renderGuard();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /onboarding when enabled and onboardingDetails is an empty array', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue(userWithOnboarding([]));

    renderGuard();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when onboarding is disabled (isEnabled: false)', () => {
    mockUseFormRead.mockReturnValue(formDisabled);
    mockUseUserRead.mockReturnValue(userWithoutOnboarding);

    renderGuard();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has completed onboarding', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue(
      userWithOnboarding(['{"isSkipped":false,"data":{"role":{"values":["teacher"]}}}'])
    );

    renderGuard();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has skipped onboarding', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue(
      userWithOnboarding(['{"isSkipped":true,"data":{}}'])
    );

    renderGuard();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not block rendering during background refetch when onboarding is already complete', () => {
    mockUseFormRead.mockReturnValue(formEnabled);
    mockUseUserRead.mockReturnValue({
      ...userWithOnboarding(['{"isSkipped":true,"data":{}}']),
      isFetching: true,
    });

    const { container } = renderGuard();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(container.querySelector('.onboarding-spinner')).not.toBeInTheDocument();
  });

  it('renders children when form API returns no data (fail open)', () => {
    mockUseFormRead.mockReturnValue({ data: null, isLoading: false });
    mockUseUserRead.mockReturnValue(userWithoutOnboarding);

    renderGuard();
    // isEnabled defaults to false when form data is absent → let through
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
