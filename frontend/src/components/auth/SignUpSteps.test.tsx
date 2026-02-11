import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignUpStep1, SignUpStep2 } from './SignUpSteps';

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
    ),
    OTPInput: ({ otp, setOtp }: any) => (
        <div data-testid="otp-input">
            {otp.map((digit: string, i: number) => (
                <input
                    key={i}
                    data-testid={`otp-${i}`}
                    value={digit}
                    onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[i] = e.target.value;
                        setOtp(newOtp);
                    }}
                />
            ))}
        </div>
    )
}));

// Mock icons
vi.mock('react-icons/fc', () => ({ FcGoogle: () => <div data-testid="google-icon" /> }));
vi.mock('react-icons/fi', () => ({
    FiEye: () => <div data-testid="eye-icon" />,
    FiEyeOff: () => <div data-testid="eye-off-icon" />,
    FiCheck: () => <div data-testid="check-icon" />
}));

describe('SignUpStep1', () => {
    const defaultProps = {
        firstName: '',
        setFirstName: vi.fn(),
        emailOrMobile: '',
        setEmailOrMobile: vi.fn(),
        password: '',
        setPassword: vi.fn(),
        confirmPassword: '',
        setConfirmPassword: vi.fn(),
        isTermsAccepted: false,
        setIsTermsAccepted: vi.fn(),
        showPassword: false,
        setShowPassword: vi.fn(),
        showConfirmPassword: false,
        setShowConfirmPassword: vi.fn(),
        handleContinue: vi.fn(),
        isStep1Valid: false,
    };

    it('renders Step 1 correctly', () => {
        render(<SignUpStep1 {...defaultProps} />);
        expect(screen.getByText('Welcome to Sunbird!')).toBeInTheDocument();
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Email ID / Mobile Number')).toBeInTheDocument();
    });

    it('handles input changes', () => {
        render(<SignUpStep1 {...defaultProps} />);

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
        render(<SignUpStep1 {...props} />);
        expect(screen.getByText('Enter valid Email or 10-digit Mobile (6-9)')).toBeInTheDocument();
    });

    it('shows validation errors for weak password', () => {
        const props = { ...defaultProps, password: 'weak' };
        render(<SignUpStep1 {...props} />);
        expect(screen.getByText(/Password must be 8\+ chars/)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', () => {
        const props = { ...defaultProps, password: 'Password123!', confirmPassword: 'Different!' };
        render(<SignUpStep1 {...props} />);
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        const setShowPassword = vi.fn();
        const setShowConfirmPassword = vi.fn();
        render(<SignUpStep1 {...defaultProps} setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword} />);

        const eyeButtons = screen.getAllByRole('button');
        // Index 0 is Google Sign In, indices 1 and 2 are eye buttons
        if (eyeButtons[1]) fireEvent.click(eyeButtons[1]);
        expect(setShowPassword).toHaveBeenCalled();

        if (eyeButtons[2]) fireEvent.click(eyeButtons[2]);
        expect(setShowConfirmPassword).toHaveBeenCalled();
    });

    it('handles terms checkbox', () => {
        render(<SignUpStep1 {...defaultProps} />);
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(defaultProps.setIsTermsAccepted).toHaveBeenCalled();
    });

    it('calls handleContinue when primary button is clicked', () => {
        const props = { ...defaultProps, isStep1Valid: true };
        render(<SignUpStep1 {...props} />);
        fireEvent.click(screen.getByTestId('primary-button'));
        expect(props.handleContinue).toHaveBeenCalled();
    });
});

describe('SignUpStep2', () => {
    const defaultProps = {
        otp: ['', '', '', '', '', ''],
        setOtp: vi.fn(),
        isOtpValid: false,
        handleVerifyOtp: vi.fn(),
        handleResendOtp: vi.fn(),
    };

    it('renders Step 2 correctly', () => {
        render(<SignUpStep2 {...defaultProps} />);
        expect(screen.getByText('Enter the code')).toBeInTheDocument();
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
    });

    it('handles OTP input change', () => {
        render(<SignUpStep2 {...defaultProps} />);
        const firstDigit = screen.getByTestId('otp-0');
        fireEvent.change(firstDigit, { target: { value: '1' } });
        expect(defaultProps.setOtp).toHaveBeenCalled();
    });

    it('calls handleVerifyOtp when OTP is valid and button is clicked', () => {
        const props = { ...defaultProps, isOtpValid: true };
        render(<SignUpStep2 {...props} />);
        fireEvent.click(screen.getByTestId('primary-button'));
        expect(props.handleVerifyOtp).toHaveBeenCalled();
    });

    it('calls handleResendOtp when resend button is clicked', async () => {
        vi.useFakeTimers();
        const { rerender } = render(<SignUpStep2 {...defaultProps} />);
        
        // Wait for the initial timer to complete (20 seconds)
        await vi.advanceTimersByTimeAsync(20000);
        
        // Force a re-render to update the button state
        rerender(<SignUpStep2 {...defaultProps} />);
        
        const resendButton = screen.getByText(/Resend OTP/);
        expect(resendButton).not.toBeDisabled();
        
        fireEvent.click(resendButton);
        expect(defaultProps.handleResendOtp).toHaveBeenCalled();
        
        vi.useRealTimers();
    });
});
