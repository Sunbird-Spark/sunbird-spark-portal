import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUp from './SignUp';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock hooks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("@/hooks/useToast", () => ({
    useToast: () => ({ toast: mockToast })
}));

// Telemetry / impression mocks
vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useTelemetry', () => ({ useTelemetry: () => ({ log: vi.fn() }) }));
vi.mock('@/components/telemetry/TelemetryTracker', () => ({ TelemetryTracker: () => null }));

// Auth layout mock
vi.mock('@/components/auth/AuthLayout', () => ({
    AuthLayout: ({ children, onClose }: any) => (
        <div>
            <button data-testid="close-btn" onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

// Configurable mutation responses — tests can override these
const signupMutateImpl = vi.fn((_variables: any, options: any) => {
    options?.onSuccess?.({ status: 200 });
});
const generateOtpMutateImpl = vi.fn((_variables: any, options: any) => {
    options?.onSuccess?.({ status: 200 });
});
const verifyOtpMutateImpl = vi.fn((_variables: any, options: any) => {
    options?.onSuccess?.({ status: 200 });
});
const checkUserExistsMutateImpl = vi.fn((_variables: any, options: any) => {
    options?.onSuccess?.({ data: { exists: false } });
});

// Mock user hooks
vi.mock('@/hooks/useUser', () => ({
    useSignup: () => ({
        mutate: signupMutateImpl,
        isPending: false
    }),
    useCheckUserExists: () => ({
        mutate: checkUserExistsMutateImpl,
        isPending: false
    })
}));

// Mock OTP hooks
vi.mock('@/hooks/useOtp', () => ({
    useGenerateOtp: () => ({
        mutate: generateOtpMutateImpl,
        isPending: false
    }),
    useVerifyOtp: () => ({
        mutate: verifyOtpMutateImpl,
        isPending: false
    })
}));

// Mock ReCAPTCHA — calling execute() triggers onChange with a fake token
vi.mock('react-google-recaptcha', async () => {
    const React = await import('react');
    return {
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                execute: () => props.onChange?.('mock-captcha-token'),
                reset: vi.fn(),
            }));
            return null;
        })
    };
});

// SystemSetting hook — no captcha key by default
const mockSystemSettingData: { value: string } = { value: '' };

vi.mock('@/hooks/useSystemSetting', () => ({
    useSystemSetting: () => ({
        data: { data: { response: { value: mockSystemSettingData.value } } },
        isLoading: false,
    })
}));

// Mock individual step components to control the flow in the Page test
vi.mock('@/components/signup/SignUpForm', () => ({
    SignUpForm: ({ handleContinue, setFirstName, setEmailOrMobile, setPassword, setConfirmPassword, isStep1Valid, userExists, isCheckingUser }: any) => (
        <div>
            <button data-testid="continue-btn" onClick={handleContinue} data-step1valid={isStep1Valid ? 'true' : 'false'} data-checking={isCheckingUser ? 'true' : 'false'}>Continue</button>
            <input data-testid="firstname-input" onChange={(e) => setFirstName(e.target.value)} />
            <input data-testid="email-input" onChange={(e) => setEmailOrMobile(e.target.value)} />
            <input data-testid="pass-input" onChange={(e) => setPassword(e.target.value)} />
            <input data-testid="conf-input" onChange={(e) => setConfirmPassword(e.target.value)} />
            {userExists && <span data-testid="user-exists-error">Already registered</span>}
        </div>
    )
}));

vi.mock('@/components/signup/SignUpOtpVerification', () => ({
    SignUpOtpVerification: ({ handleVerifyOtp, handleResendOtp, setOtp }: any) => (
        <div>
            <button data-testid="verify-btn" onClick={handleVerifyOtp}>Verify</button>
            <button data-testid="resend-btn" onClick={handleResendOtp}>Resend OTP</button>
            <button data-testid="fill-otp-btn" onClick={() => setOtp('123456')}>Fill OTP</button>
        </div>
    )
}));

vi.mock('@/components/signup/SignUpSuccess', () => ({
    SignUpSuccess: ({ handleProceed }: any) => (
        <div>
            <div data-testid="success-message">Congratulations!</div>
            <button data-testid="proceed-btn" onClick={handleProceed}>Proceed to Login</button>
        </div>
    )
}));


describe('SignUp Page', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSystemSettingData.value = '';
        // Reset mutation implementations to default success
        signupMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 200 });
        });
        generateOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 200 });
        });
        verifyOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 200 });
        });
        checkUserExistsMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ data: { exists: false } });
        });
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {component}
                </BrowserRouter>
            </QueryClientProvider>
        );
    };

    /** Helper: advance the form to step 2 */
    const advanceToStep2 = async () => {
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        await screen.findByTestId('verify-btn');
    };

    it('renders Step 1 initially', () => {
        renderWithProviders(<SignUp />);
        expect(screen.getByTestId('continue-btn')).toBeInTheDocument();
    });

    it('shows error if identifier is invalid', () => {
        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Invalid Email or Mobile' }));
    });

    it('shows error if password is weak', () => {
        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'weak' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Weak Password' }));
    });

    it('shows error if passwords mismatch', () => {
        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Different!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Passwords Mismatch' }));
    });

    it('transitions to Step 2 when validation passes', async () => {
        renderWithProviders(<SignUp />);
        await advanceToStep2();
        expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    it('handles OTP verification and navigation', async () => {
        delete (window as any).location;
        window.location = { href: '' } as any;

        renderWithProviders(<SignUp />);
        await advanceToStep2();

        fireEvent.click(screen.getByTestId('fill-otp-btn'));
        fireEvent.click(screen.getByTestId('verify-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('success-message')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('proceed-btn'));
        expect(window.location.href).toBe('/portal/login?prompt=none');
    });

    // ── handleOtpSuccess — non-200 response (lines 59-66) ──────────────────────
    it('shows error toast when OTP generation returns non-200 status', async () => {
        generateOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 500 });
        });

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
        // Step should NOT advance to step 2
        expect(screen.queryByTestId('verify-btn')).not.toBeInTheDocument();
    });

    // ── handleOtpError — OTP generation network failure (lines 89-102) ─────────
    it('shows error toast when OTP generation fails with a network error', async () => {
        generateOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onError?.({ message: 'Network error', response: { status: 500 } });
        });

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
    });

    it('shows captcha-specific error when OTP generation fails with status 418', async () => {
        generateOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onError?.({ message: 'Captcha failed', response: { status: 418 } });
        });

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
    });

    // ── handleOtpVerificationSuccess — non-200 response (lines 162-168) ────────
    it('shows error toast when OTP verification returns non-200 status', async () => {
        verifyOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 400 });
        });

        renderWithProviders(<SignUp />);
        await advanceToStep2();
        fireEvent.click(screen.getByTestId('verify-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
        // Should stay on step 2
        expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    // ── handleOtpVerificationError (lines 193-199) ──────────────────────────────
    it('shows error toast when OTP verification throws an error', async () => {
        verifyOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onError?.({ message: 'Invalid OTP' });
        });

        renderWithProviders(<SignUp />);
        await advanceToStep2();
        fireEvent.click(screen.getByTestId('verify-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
    });

    // ── handleSignupSuccess — non-200 response (lines 132-138) ─────────────────
    it('shows error toast when signup returns non-200 status after OTP verification', async () => {
        signupMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ status: 500 });
        });

        renderWithProviders(<SignUp />);
        await advanceToStep2();
        fireEvent.click(screen.getByTestId('fill-otp-btn'));
        fireEvent.click(screen.getByTestId('verify-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
        // Should NOT advance to step 3
        expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    // ── handleSignupError (lines 153-158) ───────────────────────────────────────
    it('shows error toast when signup mutation throws an error', async () => {
        signupMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onError?.({ message: 'Signup service unavailable' });
        });

        renderWithProviders(<SignUp />);
        await advanceToStep2();
        fireEvent.click(screen.getByTestId('fill-otp-btn'));
        fireEvent.click(screen.getByTestId('verify-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
            }));
        });
    });

    // ── handleResendOtp — calls generateOtp with isResend=true (lines 213-215) ──
    it('calls generateOtp when resend OTP is clicked (no captcha)', async () => {
        // Default: OTP generation succeeds on first call (step → 2),
        // and on resend call triggers the isResend=true branch (success toast but no step change)
        let callCount = 0;
        generateOtpMutateImpl.mockImplementation((_variables: any, options: any) => {
            callCount++;
            options?.onSuccess?.({ status: 200 });
        });

        renderWithProviders(<SignUp />);
        await advanceToStep2();

        // Reset toast call history
        mockToast.mockClear();

        // Click resend
        fireEvent.click(screen.getByTestId('resend-btn'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'success',
            }));
        });
        // generateOtp was called twice — once for initial OTP, once for resend
        expect(callCount).toBe(2);
        // Still on step 2
        expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    // ── handleClose — non-mobile redirect (lines 221-225) ───────────────────────
    it('redirects to /portal/login when close is clicked (non-mobile)', () => {
        delete (window as any).location;
        window.location = { href: '', search: '' } as any;

        renderWithProviders(<SignUp />);
        fireEvent.click(screen.getByTestId('close-btn'));
        expect(window.location.href).toBe('/portal/login?prompt=none');
    });

    // ── handleClose — mobile redirect (lines 221-225) ──────────────────────────
    it('redirects to safe redirect URL when close is clicked from mobile app context', () => {
        delete (window as any).location;
        window.location = {
            href: '',
            search: '?client=mobileApp&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
        } as any;

        renderWithProviders(<SignUp />);
        fireEvent.click(screen.getByTestId('close-btn'));
        expect(window.location.href).toBe('https://example.com/callback');
    });

    // ── User existence check — checking (in-flight) ───────────────────────────
    it('disables Continue while existence check is in flight', async () => {
        // Never resolve — keeps component in 'checking' state
        checkUserExistsMutateImpl.mockImplementation(() => {});

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });

        await waitFor(() => {
            expect(screen.getByTestId('continue-btn')).toHaveAttribute('data-checking', 'true');
        });
        expect(screen.getByTestId('continue-btn')).toHaveAttribute('data-step1valid', 'false');
    });

    // ── User existence check — exists: true ─────────────────────────────────────
    it('disables Continue and shows error when user already exists', async () => {
        checkUserExistsMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onSuccess?.({ data: { exists: true } });
        });

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'existing@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });

        await waitFor(() => {
            expect(screen.getByTestId('user-exists-error')).toBeInTheDocument();
        });
        expect(screen.getByTestId('continue-btn')).toHaveAttribute('data-step1valid', 'false');
    });

    // ── User existence check — API error ────────────────────────────────────────
    it('blocks Continue and shows captcha failed toast when existence check errors', async () => {
        checkUserExistsMutateImpl.mockImplementation((_variables: any, options: any) => {
            options?.onError?.(new Error('Request failed'));
        });

        renderWithProviders(<SignUp />);
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'signUpPage.captchaFailed',
                variant: 'destructive',
            }));
        });
        expect(screen.getByTestId('continue-btn')).toHaveAttribute('data-step1valid', 'false');
    });
});
