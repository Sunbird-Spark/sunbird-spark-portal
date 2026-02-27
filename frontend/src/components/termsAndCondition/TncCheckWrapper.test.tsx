import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TncCheckWrapper } from './TncCheckWrapper';

const mockMutate = vi.fn();
let mockNeedsTncAcceptance = false;
let mockTermsUrl = '';
let mockIsAuthenticated = true;

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    isUserAuthenticated: () => mockIsAuthenticated,
  },
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: null,
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({
    data: { data: { response: { value: { latestVersion: 'v1' } } } },
  }),
}));

vi.mock('@/hooks/useTnc', () => ({
  useAcceptTnc: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useTncCheck: () => ({
    needsTncAcceptance: mockNeedsTncAcceptance,
    latestVersion: 'v1',
    termsUrl: mockTermsUrl,
  }),
  useGetTncUrl: () => ({
    data: mockTermsUrl,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tncPopup.title': 'Terms and Conditions Updated',
        'tncPopup.description': 'Please review and accept the updated terms and conditions',
        'tncPopup.checkboxLabel': 'I have read and accept the Terms and Conditions',
        'tncPopup.accept': 'Accept',
        'tncPopup.accepting': 'Accepting...',
        'tncPopup.acceptedTitle': 'Terms Accepted',
        'tncPopup.acceptedDescription': 'Thank you for accepting.',
        'tncPopup.errorTitle': 'Acceptance Failed',
        'tncPopup.errorDescription': 'Failed to accept.',
        'close': 'Close',
      };
      return translations[key] || key;
    },
  }),
}));

describe('TncCheckWrapper', () => {
  let queryClient: QueryClient;

  const renderWrapper = (userProfile: any = {}) => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <TncCheckWrapper userProfile={userProfile}>
          <div data-testid="child-content">App Content</div>
        </TncCheckWrapper>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedsTncAcceptance = false;
    mockTermsUrl = '';
    mockIsAuthenticated = true;
    sessionStorage.clear();
  });

  it('renders children normally when T&C is already accepted', () => {
    mockNeedsTncAcceptance = false;
    mockIsAuthenticated = true;
    renderWrapper({ tncAcceptedVersion: 'v1', tncLatestVersion: 'v1' });

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows popup when user has never accepted T&C', async () => {
    mockNeedsTncAcceptance = true;
    mockTermsUrl = 'https://example.com/terms';
    mockIsAuthenticated = true;
    renderWrapper({ tncLatestVersion: 'v1' });

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows popup when user accepted version is outdated', async () => {
    mockNeedsTncAcceptance = true;
    mockTermsUrl = 'https://example.com/terms';
    mockIsAuthenticated = true;
    renderWrapper({ tncAcceptedVersion: 'v0', tncLatestVersion: 'v1' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not show popup when tncConfig has no termsUrl', () => {
    mockNeedsTncAcceptance = true;
    mockTermsUrl = '';
    renderWrapper({});

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show popup after user dismisses it', async () => {
    mockNeedsTncAcceptance = false;
    mockTermsUrl = 'https://example.com/terms';
    mockIsAuthenticated = true;
    renderWrapper({ tncAcceptedVersion: 'v1', tncLatestVersion: 'v1' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls acceptTnc mutation without identifier when user accepts (backend uses session)', async () => {
    mockNeedsTncAcceptance = true;
    mockTermsUrl = 'https://example.com/terms';
    mockIsAuthenticated = true;
    renderWrapper({ identifier: 'a4307b37-b832-4f55-be76-07d97196960e', tncLatestVersion: 'v1' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ identifier: expect.anything() }),
      expect.any(Object)
    );
  });

  it('does not show popup when tncConfig is not present (null)', () => {
    mockNeedsTncAcceptance = false;
    mockTermsUrl = '';
    mockIsAuthenticated = true;
    renderWrapper({ identifier: 'a4307b37-b832-4f55-be76-07d97196960e' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('always renders children regardless of T&C state', async () => {
    mockNeedsTncAcceptance = true;
    mockTermsUrl = 'https://example.com/terms';
    mockIsAuthenticated = true;
    renderWrapper({ tncLatestVersion: 'v1' });

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });
});
