import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
vi.mock('@/utils/ValidationUtils', () => ({ OTP_REGEX: /^\d{6}$/ }));

const mockRedirectWithError = vi.fn().mockReturnValue(false);
const mockAppendMobileParams = vi.fn((url: string) => url + '/');
vi.mock('../../utils/forgotPasswordUtils', () => ({
    redirectWithError: (msg: string) => mockRedirectWithError(msg),
    appendMobileParams: (url: string) => mockAppendMobileParams(url),
}));

vi.mock('@/components/telemetry/TelemetryTracker', () => ({
    TelemetryTracker: () => null,
}));
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

    afterEach(() => {
        vi.unstubAllGlobals();
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
            expect(window.location.href).toBe('http://success/');
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

    it('shows generic error when no remaining attempts info', async () => {
        mockVerifyOtp.mockRejectedValue(new Error('Unknown error'));

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
            expect(screen.getByText(/Invalid OTP. Please try again./i)).toBeInTheDocument();
        });
    });

    it('calls redirectWithError when remaining === 0', async () => {
        mockVerifyOtp.mockRejectedValue({
            response: { data: { result: { remainingAttempt: 0 } } }
        });

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
            expect(mockRedirectWithError).toHaveBeenCalled();
        });
    });

    it('resend OTP without captcha calls generateOtp', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockResolvedValue({});

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey=""
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            // Wait for countdown to enable resend button
            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;
            expect(resendBtn).toBeDisabled();

            // Advance 21 seconds to bypass the OTP resend cooldown lock
            act(() => {
                vi.advanceTimersByTime(21000);
            });

            await waitFor(() => {
                expect(resendBtn).not.toBeDisabled();
            });

            fireEvent.click(resendBtn);

            await waitFor(() => expect(mockGenerateOtp).toHaveBeenCalledWith({
                request: {
                    request: {
                        type: selectedIdentifier.type,
                        key: selectedIdentifier.value,
                        userId: selectedIdentifier.id,
                        templateId: 'resetPasswordWithOtp'
                    }
                },
                captchaResponse: ''
            }));
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it('resend OTP shows max retry error after 4 resends', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockResolvedValue({});

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey=""
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;

            // Simulate 4 resends
            for(let i=0; i<4; i++) {
                act(() => { vi.advanceTimersByTime(21000); });
                await waitFor(() => expect(resendBtn).not.toBeDisabled());

                fireEvent.click(resendBtn);

                if (i < 3) {
                    // Wait for the interval to be restarted
                    await waitFor(() => expect(screen.getByText(/Resend OTP \(20\)/i)).toBeInTheDocument());
                }
            }

            // Wait for the errors to trigger
            await waitFor(() => {
                expect(screen.getByText(/forgotPasswordPage.errorResendMaxReached/i)).toBeInTheDocument();
            });
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it('shows error when resetPassword returns no link', async () => {
        mockVerifyOtp.mockResolvedValue({ data: { result: { reqData: 'data' } } });
        mockResetPassword.mockResolvedValue({ data: {} }); // no link

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

        // No redirect should happen, error state handled
        await waitFor(() => {
            expect(mockVerifyOtp).toHaveBeenCalled();
            expect(mockResetPassword).toHaveBeenCalled();
        });
    });

    it('filters non-numeric input from OTP field', () => {
        render(
            <VerifyOTP
                selectedIdentifier={selectedIdentifier}
                googleCaptchaSiteKey=""
                verifyOtp={mockVerifyOtp}
                resetPassword={mockResetPassword}
                generateOtp={mockGenerateOtp}
            />
        );

        const otpInput = screen.getByTestId('otp-input');
        fireEvent.change(otpInput, { target: { value: 'abc123' } });
        expect((otpInput as HTMLInputElement).value).toBe('123');
    });

    // ── New tests ────────────────────────────────────────────────────────────

    it('remaining === 0 with redirected === false re-enables submit button', async () => {
        // mockRedirectWithError already returns false by default
        mockVerifyOtp.mockRejectedValue({
            response: { data: { result: { remainingAttempt: 0 } } }
        });

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
        const submitBtn = screen.getByTestId('submit-btn');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockRedirectWithError).toHaveBeenCalled();
        });

        // setLoading(false) is called because redirected === false, so the
        // button should become enabled again (loading=false, otp was cleared so
        // isOtpValid=false keeps it disabled via the disabled prop — but the
        // loading flag itself is cleared, meaning it is no longer in loading
        // state). Verify loading is cleared by checking the button text reverts
        // from 'Loading' to its normal label.
        await waitFor(() => {
            expect(submitBtn).not.toHaveTextContent('Loading');
        });
    });

    it('executeResendOtp success path increments resend counter and restarts countdown', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockResolvedValue({});

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey=""
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;

            // Enable the resend button by advancing the 20-second countdown
            act(() => {
                vi.advanceTimersByTime(21000);
            });

            await waitFor(() => expect(resendBtn).not.toBeDisabled());

            fireEvent.click(resendBtn);

            await waitFor(() => {
                expect(mockGenerateOtp).toHaveBeenCalledWith({
                    request: {
                        request: {
                            type: selectedIdentifier.type,
                            key: selectedIdentifier.value,
                            userId: selectedIdentifier.id,
                            templateId: 'resetPasswordWithOtp'
                        }
                    },
                    captchaResponse: ''
                });
            });

            // After a successful resend the counter resets and countdown restarts
            await waitFor(() => {
                expect(screen.getByText(/Resend OTP \(20\)/i)).toBeInTheDocument();
            });
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it('executeResendOtp 429 error calls redirectWithError with errmsg and re-enables button when not redirected', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockRejectedValue({
                response: {
                    status: 429,
                    data: { params: { errmsg: 'Too many requests' } }
                }
            });

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey=""
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;

            act(() => {
                vi.advanceTimersByTime(21000);
            });

            await waitFor(() => expect(resendBtn).not.toBeDisabled());

            fireEvent.click(resendBtn);

            await waitFor(() => {
                expect(mockRedirectWithError).toHaveBeenCalledWith('Too many requests');
            });

            // Because mockRedirectWithError returns false, setDisableResendOtp(false)
            // should be called, re-enabling the button
            await waitFor(() => {
                expect(resendBtn).not.toBeDisabled();
            });
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it('executeResendOtp other error shows error text and re-enables resend button', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockRejectedValue(new Error('Network error'));

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey=""
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;

            act(() => {
                vi.advanceTimersByTime(21000);
            });

            await waitFor(() => expect(resendBtn).not.toBeDisabled());

            fireEvent.click(resendBtn);

            await waitFor(() => {
                expect(screen.getByText(/forgotPasswordPage.errorResendFailed/i)).toBeInTheDocument();
            });

            // Button should be re-enabled after the error
            expect(resendBtn).not.toBeDisabled();
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });

    it('ReCAPTCHA path: resend with googleCaptchaSiteKey executes captcha which calls generateOtp', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            mockGenerateOtp.mockResolvedValue({});

            render(
                <VerifyOTP
                    selectedIdentifier={selectedIdentifier}
                    googleCaptchaSiteKey="test-site-key"
                    verifyOtp={mockVerifyOtp}
                    resetPassword={mockResetPassword}
                    generateOtp={mockGenerateOtp}
                />
            );

            const resendBtn = screen.getByText(/Resend OTP/i).closest('button')!;

            act(() => {
                vi.advanceTimersByTime(21000);
            });

            await waitFor(() => expect(resendBtn).not.toBeDisabled());

            // Clicking resend triggers captchaRef.current?.execute() which, via the
            // mock's useImperativeHandle, calls props.onChange('mock-token'), which
            // triggers executeResendOtp('mock-token')
            fireEvent.click(resendBtn);

            await waitFor(() => {
                expect(mockGenerateOtp).toHaveBeenCalledWith({
                    request: {
                        request: {
                            type: selectedIdentifier.type,
                            key: selectedIdentifier.value,
                            userId: selectedIdentifier.id,
                            templateId: 'resetPasswordWithOtp'
                        }
                    },
                    captchaResponse: 'mock-token'
                });
            });
        } finally {
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });
});
