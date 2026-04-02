import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignUpForm } from './SignUpForm';
import { SignUpOtpVerification } from './SignUpOtpVerification';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'signUp.welcomeTitle': 'Welcome to Sunbird!',
                'signUp.welcomeSubtitle': 'Your learning journey starts here - sign up to get started.',
                'signUp.signInWithGoogle': 'Sign in with Google',
                'signUp.or': 'OR',
                'signUp.firstName': 'First Name',
                'signUp.enterFirstName': 'Enter First Name',
                'signUp.emailOrMobileLabel': 'Email ID / Mobile Number',
                'signUp.enterEmailOrMobile': 'Enter Email ID / Mobile Number',
                'password': 'Password',
                'signUp.enterPassword': 'Enter Password',
                'signUp.showPassword': 'Show password',
                'signUp.hidePassword': 'Hide password',
                'signUp.confirmPassword': 'Confirm Password',
                'signUp.reenterPassword': 'Re-enter Password',
                'signUp.showConfirmPassword': 'Show confirm password',
                'signUp.hideConfirmPassword': 'Hide confirm password',
                'signUp.invalidEmailOrMobile': 'Enter valid Email or 10-digit Mobile (6-9)',
                'signUp.passwordRequirements': 'Password must be 8+ chars (upper, lower, num, special)',
                'signUp.passwordsDoNotMatch': 'Passwords do not match',
                'signUp.iUnderstand': 'I understand &',
                'signUp.acceptTermsOfUse': 'accept the SUNBIRD Terms of Use',
                'signUp.creatingAccount': 'Creating Account...',
                'continue': 'Continue',
                'signUp.alreadyHaveAccount': 'Already have an account?',
                'login': 'Login',
                'forgotPasswordPage.enterCode': 'Enter the code',
                'signUp.enterCodeSubtitle': 'Enter the 6 digit code sent to your Email ID and complete the verification',
                'forgotPasswordPage.otpValidity': 'OTP is valid for 30 minutes',
                'forgotPasswordPage.resendOtp': 'Resend OTP',
                'signUp.verifying': 'Verifying...',
                'signUp.submit': 'Submit',
            };
            return translations[key] || key;
        },
    }),
}));

// Mock useSystemSetting hook
vi.mock('@/hooks/useSystemSetting', () => ({
    useSystemSetting: vi.fn(() => ({
        data: {
            data: {
                response: {
                    value: JSON.stringify({
                        latestVersion: 'v1',
                        v1: {
                            url: 'https://example.com/terms'
                        }
                    })
                }
            }
        }
    }))
}));

// Mock child components from ForgotPasswordComponents
vi.mock('../../pages/forgotPassword/ForgotPasswordComponents', () => ({
    Header: ({ title, subtitle }: any) => (
        <div data-testid="header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    ),
    InputLabel: ({ children, required }: any) => (
        <label>
            {children}
            {required && <span>*</span>}
        </label>
    ),
    PrimaryButton: ({ children, onClick, disabled }: any) => (
        <button data-testid="primary-button" onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}));

// Mock InputOTP components
vi.mock('@/components/common/InputOTP', () => ({
    InputOTP: ({ value, onChange, children }: any) => (
        <div data-testid="otp-input">
            <input
                data-testid="otp-input-field"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {children}
        </div>
    ),
    InputOTPGroup: ({ children }: any) => <div>{children}</div>,
    InputOTPSlot: ({ index }: any) => <div data-testid={`otp-slot-${index}`} />
}));

// Mock icons
vi.mock('react-icons/fc', () => ({ FcGoogle: () => <div data-testid="google-icon" /> }));
vi.mock('react-icons/fi', () => ({
    FiEye: () => <div data-testid="eye-icon" />,
    FiEyeOff: () => <div data-testid="eye-off-icon" />,
    FiCheck: () => <div data-testid="check-icon" />,
    FiX: () => <div data-testid="x-icon" />
}));

describe('SignUpForm', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
    });

    const defaultProps = {
        firstName: '',
        setFirstName: vi.fn(),
        emailOrMobile: '',
        setEmailOrMobile: vi.fn(),
        password: '',
        setPassword: vi.fn(),
        confirmPassword: '',
        setConfirmPassword: vi.fn(),
        showPassword: false,
        setShowPassword: vi.fn(),
        showConfirmPassword: false,
        setShowConfirmPassword: vi.fn(),
        handleContinue: vi.fn(),
        isStep1Valid: false,
    };

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    it('renders Step 1 correctly', () => {
        renderWithProviders(<SignUpForm {...defaultProps} />);
        expect(screen.getByText('Welcome to Sunbird!')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Email ID / Mobile Number')).toBeInTheDocument();
    });

    it('handles input changes', () => {
        renderWithProviders(<SignUpForm {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('Enter First Name'), { target: { value: 'John' } });
        expect(defaultProps.setFirstName).toHaveBeenCalledWith('John');

        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: 'test@example.com' } });
        expect(defaultProps.setEmailOrMobile).toHaveBeenCalledWith('test@example.com');

        fireEvent.change(screen.getByPlaceholderText('Enter Password'), { target: { value: 'Pass123!' } });
        expect(defaultProps.setPassword).toHaveBeenCalledWith('Pass123!');

        fireEvent.change(screen.getByPlaceholderText('Re-enter Password'), { target: { value: 'Pass123!' } });
        expect(defaultProps.setConfirmPassword).toHaveBeenCalledWith('Pass123!');
    });

    it('shows validation errors for invalid email/mobile', () => {
        const props = { ...defaultProps, emailOrMobile: 'invalid' };
        renderWithProviders(<SignUpForm {...props} />);
        expect(screen.getByText('Enter valid Email or 10-digit Mobile (6-9)')).toBeInTheDocument();
    });

    it('shows validation errors for weak password', () => {
        const props = { ...defaultProps, password: 'weak' };
        renderWithProviders(<SignUpForm {...props} />);
        expect(screen.getByText(/Password must be 8\+ chars/)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', () => {
        const props = { ...defaultProps, password: 'Password123!', confirmPassword: 'Different!' };
        renderWithProviders(<SignUpForm {...props} />);
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        const setShowPassword = vi.fn();
        const setShowConfirmPassword = vi.fn();
        renderWithProviders(<SignUpForm {...defaultProps} setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword} />);

        const eyeButtons = screen.getAllByRole('button');
        // Indices 0 and 1 are eye buttons (Google button removed)
        if (eyeButtons[0]) fireEvent.click(eyeButtons[0]);
        expect(setShowPassword).toHaveBeenCalled();

        if (eyeButtons[1]) fireEvent.click(eyeButtons[1]);
        expect(setShowConfirmPassword).toHaveBeenCalled();
    });

    it('calls handleContinue when primary button is clicked', () => {
        const props = { ...defaultProps, isStep1Valid: true };
        renderWithProviders(<SignUpForm {...props} />);
        fireEvent.click(screen.getByTestId('primary-button'));
        expect(props.handleContinue).toHaveBeenCalled();
    });
});

describe('SignUpOtpVerification', () => {
    const defaultProps = {
        otp: '',
        setOtp: vi.fn(),
        isOtpValid: false,
        handleVerifyOtp: vi.fn(),
        handleResendOtp: vi.fn(),
    };

    it('renders Step 2 correctly', () => {
        render(<SignUpOtpVerification {...defaultProps} />);
        expect(screen.getByText('Enter the code')).toBeInTheDocument();
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
    });

    it('handles OTP input change', () => {
        render(<SignUpOtpVerification {...defaultProps} />);
        const otpInput = screen.getByTestId('otp-input-field');
        fireEvent.change(otpInput, { target: { value: '123456' } });
        expect(defaultProps.setOtp).toHaveBeenCalledWith('123456');
    });

    it('calls handleVerifyOtp when OTP is valid and button is clicked', () => {
        const props = { ...defaultProps, isOtpValid: true };
        render(<SignUpOtpVerification {...props} />);
        fireEvent.click(screen.getByTestId('primary-button'));
        expect(props.handleVerifyOtp).toHaveBeenCalled();
    });

    it('calls handleResendOtp when resend button is clicked', async () => {
        vi.useFakeTimers();
        const { rerender } = render(<SignUpOtpVerification {...defaultProps} />);

        // Wait for the initial timer to complete (20 seconds)
        await vi.advanceTimersByTimeAsync(20000);

        // Force a re-render to update the button state
        rerender(<SignUpOtpVerification {...defaultProps} />);

        const resendButton = screen.getByText(/Resend OTP/);
        expect(resendButton).not.toBeDisabled();

        fireEvent.click(resendButton);
        expect(defaultProps.handleResendOtp).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
