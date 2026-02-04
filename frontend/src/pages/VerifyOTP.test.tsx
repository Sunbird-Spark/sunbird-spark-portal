import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyOTP } from './VerifyOTP';

// Mock all external dependencies
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/components/AuthLayout', () => ({ AuthLayout: ({ children }: any) => <div data-testid="auth-layout">{children}</div> }));
vi.mock('react-google-recaptcha', () => ({
    default: React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            execute: () => props.onChange?.('mock-token'),
            reset: vi.fn()
        }));
        return <div />;
    })
}));
vi.mock('@/lib/auth-utils', () => ({ OTP_REGEX: /^\d{6}$/ }));
vi.mock('./ForgotPasswordComponents', () => ({
    Header: ({ title, subtitle }: any) => (
        <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    ),
    PrimaryButton: ({ children, onClick, disabled, loading }: any) => (
        <button data-testid="submit-btn" onClick={onClick} disabled={disabled || loading}>
            {loading ? 'Loading' : children}
        </button>
    ),
    OTPInput: ({ otp, setOtp }: any) => (
        <button data-testid="fill-otp" onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}>Fill OTP</button>
    )
}));

describe('VerifyOTP', () => {
    const mockVerifyOtp = vi.fn();
    const mockResetPassword = vi.fn();
    const mockGenerateOtp = vi.fn();
    const selectedIdentifier = { id: 'u1', type: 'phone', value: '9876543210' };

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
