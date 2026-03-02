import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyOTP } from './VerifyOTP';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string, data?: any) => {
            const translations: Record<string, string> = {
                'forgotPasswordTitle': 'Forgot Password',
                'forgotPasswordPage.enterCode': 'Enter the code',
                'forgotPasswordPage.otpSentInstruction': 'Enter the 6 digit code sent to your email/phone number and complete the verification',
                'forgotPasswordPage.otpValidity': 'OTP is valid for 30 minutes',
                'forgotPasswordPage.resendOtp': 'Resend OTP',
                'forgotPasswordPage.submitOtp': 'Submit OTP',
                'forgotPasswordPage.errorInvalidOtpRemaining': `Invalid OTP. You have ${data?.remaining || data?.remainingAttempt} attempt(s) remaining.`,
                'forgotPasswordPage.errorInvalidOtp': 'Invalid OTP. Please try again.',
            };
            return translations[key] || key;
        },
    }),
}));
import { OtpIdentifier } from '../../types/forgotPasswordTypes';

// Mock all external dependencies
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/components/AuthLayout', () => ({ AuthLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-layout">{children}</div> }));
vi.mock('react-google-recaptcha', () => ({
    default: React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            execute: () => props.onChange?.('mock-token'),
            reset: vi.fn()
        }));
        return <div />;
    })
}));
vi.mock('@/utils/validation-utils', () => ({ OTP_REGEX: /^\d{6}$/ }));
vi.mock('./ForgotPasswordComponents', () => ({
    Header: ({ title, subtitle }: { title: string, subtitle: string }) => (
        <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    ),
    PrimaryButton: ({ children, onClick, disabled, loading }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, loading?: boolean }) => (
        <button data-testid="submit-btn" onClick={onClick} disabled={disabled || loading}>
            {loading ? 'Loading' : children}
        </button>
    )
}));

vi.mock('@/components/common/InputOTP', () => ({
    InputOTP: ({ value, onChange, children }: { value: string, onChange: (val: string) => void, children: React.ReactNode }) => (
        <div>
            <input
                data-testid="otp-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <button data-testid="fill-otp" onClick={() => onChange('123456')}>Fill OTP</button>
            {children}
        </div>
    ),
    InputOTPGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    InputOTPSlot: ({ index }: { index: number }) => <div data-testid={`otp-slot-${index}`} />
}));

describe('VerifyOTP', () => {
    const mockVerifyOtp = vi.fn();
    const mockResetPassword = vi.fn();
    const mockGenerateOtp = vi.fn();
    const selectedIdentifier: OtpIdentifier = { id: 'u1', type: 'phone', value: '9876543210' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password',
            search: '',
            assign: vi.fn(),
            replace: vi.fn()
        });
    });

    it('handles successful verification', async () => {
        mockVerifyOtp.mockResolvedValue({ data: { result: { reqData: 'data' } } });
        mockResetPassword.mockResolvedValue({ data: { link: 'http://success' } });

        render(
            <VerifyOTP
                selectedIdentifier={selectedIdentifier}
                googleCaptchaSiteKey=""
                verifyOtp={mockVerifyOtp}
                resetPassword={mockResetPassword}
                generateOtp={mockGenerateOtp}
            />
        );

        fireEvent.click(screen.getByTestId('fill-otp'));
        fireEvent.click(screen.getByTestId('submit-btn'));

        await waitFor(() => {
            expect(mockVerifyOtp).toHaveBeenCalled();
            expect(mockResetPassword).toHaveBeenCalled();
            expect(window.location.href).toBe('http://success');
        });
    });

    it('shows error message on failure', async () => {
        const mockError = {
            response: {
                data: {
                    result: { remainingAttempt: 2 }
                }
            }
        };
        mockVerifyOtp.mockRejectedValue(mockError);

        render(
            <VerifyOTP
                selectedIdentifier={selectedIdentifier}
                googleCaptchaSiteKey=""
                verifyOtp={mockVerifyOtp}
                resetPassword={mockResetPassword}
                generateOtp={mockGenerateOtp}
            />
        );

        fireEvent.click(screen.getByTestId('fill-otp'));
        fireEvent.click(screen.getByTestId('submit-btn'));

        await waitFor(() => {
            expect(screen.getByText(/Invalid OTP. You have 2 attempt\(s\) remaining./i)).toBeInTheDocument();
        });
    });
});
