import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

// ───────────────────────────────────────────────────────────────
// Mocks
// ───────────────────────────────────────────────────────────────

vi.mock('@/assets/sunbird-logo.svg', () => ({ default: 'sunbird-logo.svg' }));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'onboarding.altSunbird': 'Sunbird',
        courses: 'Courses',
        'footer.resources': 'Resources',
        'footer.videos': 'Videos',
        about: 'About',
        contact: 'Contact',
        'footer.products': 'Products',
        'footer.company': 'Company',
        'footer.terms': 'Terms and Conditions',
        'footer.privacy': 'Privacy Policy',
      };
      return map[key] ?? key;
    },
  }),
}));

const mockUseSystemSetting = vi.fn();
vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: (...args: unknown[]) => mockUseSystemSetting(...args),
}));

const mockUseGetTncUrl = vi.fn();
vi.mock('@/hooks/useTnc', () => ({
  useGetTncUrl: (...args: unknown[]) => mockUseGetTncUrl(...args),
}));

vi.mock('@/components/termsAndCondition/TermsAndConditionsDialog', () => ({
  TermsAndConditionsDialog: ({
    children,
    termsUrl,
    title,
  }: {
    children: React.ReactNode;
    termsUrl: string;
    title?: string;
  }) => (
    <div data-testid="tnc-dialog" data-terms-url={termsUrl} data-title={title}>
      {children}
    </div>
  ),
}));

// ───────────────────────────────────────────────────────────────
// Helper
// ───────────────────────────────────────────────────────────────

const renderFooter = () =>
  render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );

// ───────────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────────

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSystemSetting.mockReturnValue({ data: null });
    mockUseGetTncUrl.mockReturnValue({ data: undefined });
  });

  // ── Static rendering ──────────────────────────────────────────

  describe('static rendering', () => {
    it('renders the Sunbird logo', () => {
      renderFooter();
      expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
    });

    it('renders Products section heading', () => {
      renderFooter();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('renders Company section heading', () => {
      renderFooter();
      expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('renders all product links', () => {
      renderFooter();
      expect(screen.getByText('Courses')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Videos')).toBeInTheDocument();
    });

    it('renders all company links', () => {
      renderFooter();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  // ── System setting hooks ───────────────────────────────────────

  describe('system setting hooks', () => {
    it('fetches tncConfig system setting', () => {
      renderFooter();
      expect(mockUseSystemSetting).toHaveBeenCalledWith('tncConfig');
    });

    it('fetches privacyPolicyConfig system setting', () => {
      renderFooter();
      expect(mockUseSystemSetting).toHaveBeenCalledWith('privacyPolicyConfig');
    });
  });

  // ── Terms and Conditions link ──────────────────────────────────

  describe('Terms and Conditions link', () => {
    it('renders as a plain span when termsUrl is not available', () => {
      // default mock: useGetTncUrl returns { data: undefined }
      renderFooter();
      const el = screen.getByText('Terms and Conditions');
      expect(el.tagName).toBe('SPAN');
      expect(
        screen
          .queryAllByTestId('tnc-dialog')
          .some((d) => d.getAttribute('data-title') === 'Terms and Conditions')
      ).toBe(false);
    });

    it('wraps link in TermsAndConditionsDialog when termsUrl is available', () => {
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: 'https://example.com/terms' }) // tncConfig → termsUrl
        .mockReturnValueOnce({ data: undefined });                   // privacyConfig → privacyUrl
      renderFooter();

      const termsDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Terms and Conditions');

      expect(termsDialog).toBeDefined();
      expect(termsDialog).toHaveAttribute('data-terms-url', 'https://example.com/terms');
    });

    it('renders a button trigger (not a span) when termsUrl is available', () => {
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: 'https://example.com/terms' })
        .mockReturnValueOnce({ data: undefined });
      renderFooter();

      const termsDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Terms and Conditions');

      const btn = termsDialog?.querySelector('button');
      expect(btn).toBeDefined();
      expect(btn?.textContent).toBe('Terms and Conditions');
    });
  });

  // ── Privacy Policy link ────────────────────────────────────────

  describe('Privacy Policy link', () => {
    it('renders as a plain span when neither privacyUrl nor termsUrl is available', () => {
      // default mock: useGetTncUrl returns { data: undefined } for both calls
      renderFooter();
      const el = screen.getByText('Privacy Policy');
      expect(el.tagName).toBe('SPAN');
      expect(
        screen
          .queryAllByTestId('tnc-dialog')
          .some((d) => d.getAttribute('data-title') === 'Privacy Policy')
      ).toBe(false);
    });

    it('opens dialog with privacyUrl when privacyPolicyConfig is configured', () => {
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: 'https://example.com/terms' })
        .mockReturnValueOnce({ data: 'https://example.com/privacy' });
      renderFooter();

      const privacyDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Privacy Policy');

      expect(privacyDialog).toBeDefined();
      expect(privacyDialog).toHaveAttribute('data-terms-url', 'https://example.com/privacy');
    });

    it('falls back to termsUrl when privacyUrl is not available', () => {
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: 'https://example.com/terms' }) // tncConfig → termsUrl
        .mockReturnValueOnce({ data: undefined });                   // privacyConfig → no privacyUrl
      renderFooter();

      const privacyDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Privacy Policy');

      expect(privacyDialog).toBeDefined();
      expect(privacyDialog).toHaveAttribute('data-terms-url', 'https://example.com/terms');
    });

    it('renders a button trigger (not a span) when any URL is available', () => {
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: 'https://example.com/terms' })
        .mockReturnValueOnce({ data: undefined });
      renderFooter();

      const privacyDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Privacy Policy');

      const btn = privacyDialog?.querySelector('button');
      expect(btn).toBeDefined();
      expect(btn?.textContent).toBe('Privacy Policy');
    });

    it('opens dialog with privacyUrl when only privacyUrl is available but termsUrl is not', () => {
      // Edge case: privacyPolicyConfig has a URL but tncConfig does not
      mockUseGetTncUrl
        .mockReturnValueOnce({ data: undefined })                    // tncConfig → no termsUrl
        .mockReturnValueOnce({ data: 'https://example.com/privacy' });// privacyConfig → privacyUrl
      renderFooter();

      const privacyDialog = screen
        .getAllByTestId('tnc-dialog')
        .find((d) => d.getAttribute('data-title') === 'Privacy Policy');

      expect(privacyDialog).toBeDefined();
      expect(privacyDialog).toHaveAttribute('data-terms-url', 'https://example.com/privacy');
    });
  });
});
