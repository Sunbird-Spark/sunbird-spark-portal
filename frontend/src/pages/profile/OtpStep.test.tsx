import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { OtpStep } from './DeleteAccountSteps';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params?.email ? `${key}:${params.email}` : key,
  }),
}));

const renderStep = (overrides: Partial<Parameters<typeof OtpStep>[0]> = {}) =>
  render(
    <OtpStep
      email="user@example.com"
      otp=""
      setOtp={vi.fn()}
      resendCounter={30}
      resendDisabled={true}
      submitting={false}
      errorMessage=""
      onResend={vi.fn()}
      onConfirm={vi.fn()}
      onBack={vi.fn()}
      {...overrides}
    />,
  );

describe('OtpStep', () => {
  it('renders the title, subtitle with email, and warning text', () => {
    renderStep({ email: 'jane@example.com' });
    expect(screen.getByText('deleteAccount.otpTitle')).toBeInTheDocument();
    expect(screen.getByText('deleteAccount.otpSubtitle:jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('deleteAccount.warning')).toBeInTheDocument();
  });

  it('disables the Resend button when resendDisabled is true', () => {
    renderStep({ resendDisabled: true });
    expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled();
  });

  it('enables the Resend button when resendDisabled is false', () => {
    renderStep({ resendDisabled: false });
    expect(screen.getByRole('button', { name: /resend/i })).toBeEnabled();
  });

  it('calls onResend when Resend is clicked', () => {
    const onResend = vi.fn();
    renderStep({ resendDisabled: false, onResend });
    fireEvent.click(screen.getByRole('button', { name: /resend/i }));
    expect(onResend).toHaveBeenCalled();
  });

  it('disables Confirm when the OTP is not 6 digits', () => {
    renderStep({ otp: '123' });
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
  });

  it('enables Confirm when the OTP is exactly 6 digits', () => {
    renderStep({ otp: '123456' });
    expect(screen.getByRole('button', { name: /confirm/i })).toBeEnabled();
  });

  it('calls onConfirm when Confirm is clicked with a valid OTP', () => {
    const onConfirm = vi.fn();
    renderStep({ otp: '123456', onConfirm });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables Confirm while submitting and shows the deleting label', () => {
    renderStep({ otp: '123456', submitting: true });
    const confirm = screen.getByRole('button', { name: /deleting/i });
    expect(confirm).toBeDisabled();
  });

  it('disables Back while submitting', () => {
    renderStep({ submitting: true });
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('calls onBack when Back is clicked', () => {
    const onBack = vi.fn();
    renderStep({ onBack });
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders the error message when provided', () => {
    renderStep({ errorMessage: 'Invalid code' });
    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });

  it('marks the Confirm button with the telemetry edataid', () => {
    renderStep({ otp: '123456' });
    expect(screen.getByRole('button', { name: /confirm/i })).toHaveAttribute(
      'data-edataid',
      'delete-account-confirm',
    );
  });
});
