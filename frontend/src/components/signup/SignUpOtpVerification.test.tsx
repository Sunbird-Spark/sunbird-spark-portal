import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignUpOtpVerification } from './SignUpOtpVerification';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'forgotPasswordPage.enterCode': 'Enter Code',
        'signUp.enterCodeSubtitle': 'Enter OTP',
        'forgotPasswordPage.otpValidity': 'OTP is valid for 30 mins',
        'forgotPasswordPage.resendOtp': 'Resend OTP',
        'signUp.verifying': 'Verifying...',
        'signUp.submit': 'Submit',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../../pages/forgotPassword/ForgotPasswordComponents', () => ({
  Header: ({ title, subtitle }: any) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
  PrimaryButton: ({ children, disabled, onClick, ...props }: any) => (
    <button disabled={disabled} onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/common/InputOTP', () => ({
  InputOTP: ({ children, onChange, value }: any) => (
    <div data-testid="otp-input" data-value={value}>
      <input onChange={(e) => onChange(e.target.value)} />
      {children}
    </div>
  ),
  InputOTPGroup: ({ children }: any) => <div>{children}</div>,
  InputOTPSlot: ({ index }: any) => <span data-testid={`slot-${index}`} />,
}));

const defaultProps = {
  otp: '',
  setOtp: vi.fn(),
  isOtpValid: false,
  handleVerifyOtp: vi.fn(),
  handleResendOtp: vi.fn(),
};

describe('SignUpOtpVerification', () => {
  it('renders submit button text when not loading (line 95 false branch)', () => {
    render(<SignUpOtpVerification {...defaultProps} isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders verifying text when isLoading is true (line 95 true branch)', () => {
    render(<SignUpOtpVerification {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeInTheDocument();
  });

  it('submit button is disabled when isOtpValid is false (line 89)', () => {
    render(<SignUpOtpVerification {...defaultProps} isOtpValid={false} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is disabled when isLoading is true even with valid OTP (line 89)', () => {
    render(<SignUpOtpVerification {...defaultProps} isOtpValid={true} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
  });

  it('submit button is enabled when isOtpValid is true and not loading', () => {
    render(<SignUpOtpVerification {...defaultProps} isOtpValid={true} isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
  });
});
