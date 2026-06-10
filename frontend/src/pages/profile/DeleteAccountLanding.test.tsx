import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import DeleteAccountLanding from './DeleteAccountLanding';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useImpression', () => ({
  default: vi.fn(),
}));

vi.mock('@/assets/sunbird-logo.svg', () => ({ default: 'sunbird-logo.svg' }));

describe('DeleteAccountLanding', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' } as Location,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('renders the title, message and login CTA', () => {
    render(<DeleteAccountLanding />);
    expect(screen.getByText('deleteAccountLanding.title')).toBeInTheDocument();
    expect(screen.getByText('deleteAccountLanding.message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deleteAccountLanding.loginCta/i })).toBeInTheDocument();
  });

  it('navigates to /portal/login with returnTo when CTA is clicked', () => {
    render(<DeleteAccountLanding />);
    fireEvent.click(screen.getByRole('button', { name: /deleteAccountLanding.loginCta/i }));
    expect(window.location.href).toBe(
      `/portal/login?prompt=none&returnTo=${encodeURIComponent('/profile/delete')}`,
    );
  });

  it('marks the login button with the telemetry edataid', () => {
    render(<DeleteAccountLanding />);
    const button = screen.getByRole('button', { name: /deleteAccountLanding.loginCta/i });
    expect(button).toHaveAttribute('data-edataid', 'delete-account-landing-login');
  });
});
