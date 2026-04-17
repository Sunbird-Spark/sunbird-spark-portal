import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VerifyOtpDialog from './VerifyOtpDialog';
import { OtpRequiredField, FieldOtpState, createInitialFieldOtpState } from '@/types/profileTypes';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'forgotPasswordPage.enterCode': 'Enter the code',
                'editProfile.enterDigitCodePhone': 'Enter the 6-digit code sent to your phone number',
                'editProfile.enterDigitCodeEmail': 'Enter the 6-digit code sent to your email',
                'forgotPasswordPage.otpValidity': 'The OTP is valid for 10 minutes',
                'forgotPasswordPage.resendOtp': 'Resend OTP',
                'signUp.submit': 'Submit',
                'editProfile.submitting': 'Submitting...',
            };
            return translations[key] || key;
        },
    }),
}));

// Mock the common components
vi.mock('@/components/common/Dialog', () => ({
    Dialog: ({ children, open, onOpenChange }: any) =>
        open ? (
            <div data-testid="dialog">
                <button data-testid="dialog-overlay-close" onClick={() => onOpenChange?.(false)} />
                {children}
            </div>
        ) : null,
    DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
}));

vi.mock('@/components/common/InputOTP', () => ({
    InputOTP: ({ children, value, onChange }: any) => (
        <div data-testid="input-otp">
            <input
                data-testid="otp-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {children}
        </div>
    ),
    InputOTPGroup: ({ children, className }: any) => <div className={className}>{children}</div>,
    InputOTPSlot: ({ index, className }: any) => <div data-testid={`otp-slot-${index}`} className={className} />,
}));

describe('VerifyOtpDialog', () => {
    const defaultField: OtpRequiredField = 'mobileNumber';
    const defaultFieldState: FieldOtpState = {
        ...createInitialFieldOtpState(),
        resendTimer: 0,
        resendCount: 0,
        maxResendAttempts: 4,
    };

    const defaultProps = {
        field: defaultField,
        fieldState: defaultFieldState,
        setFieldOtp: vi.fn(),
        verifyFieldOtp: vi.fn(),
        resendFieldOtp: vi.fn(),
        formatTime: vi.fn((s) => `00:${s.toString().padStart(2, '0')}`),
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly for phone number field', () => {
        render(<VerifyOtpDialog {...defaultProps} />);

        expect(screen.getByText('Enter the code')).toBeInTheDocument();
        expect(screen.getByText(/sent to your phone number/i)).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(screen.getByText('Resend OTP')).toBeInTheDocument();
    });

    it('renders correctly for email field', () => {
        render(<VerifyOtpDialog {...defaultProps} field="emailId" />);

        expect(screen.getByText(/sent to your email/i)).toBeInTheDocument();
    });

    it('calls setFieldOtp when OTP value changes', () => {
        render(<VerifyOtpDialog {...defaultProps} />);

        const input = screen.getByTestId('otp-input');
        fireEvent.change(input, { target: { value: '123456' } });

        expect(defaultProps.setFieldOtp).toHaveBeenCalledWith('mobileNumber', '123456');
    });

    it('calls verifyFieldOtp when Submit is clicked', async () => {
        const fieldState = { ...defaultFieldState, otp: '123456' };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        const submitBtn = screen.getByText('Submit');
        fireEvent.click(submitBtn);

        expect(defaultProps.verifyFieldOtp).toHaveBeenCalledWith('mobileNumber');
    });

    it('disables Submit button if OTP is not exactly 6 digits', () => {
        const fieldState = { ...defaultFieldState, otp: '123' };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        const submitBtn = screen.getByText('Submit');
        expect(submitBtn).toBeDisabled();
    });

    it('shows "Submitting..." during verification', () => {
        const fieldState = { ...defaultFieldState, otp: '123456', status: 'otp_verifying' as const };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    });

    it('calls resendFieldOtp when Resend OTP is clicked', () => {
        render(<VerifyOtpDialog {...defaultProps} />);

        const resendBtn = screen.getByText('Resend OTP');
        fireEvent.click(resendBtn);

        expect(defaultProps.resendFieldOtp).toHaveBeenCalledWith('mobileNumber');
    });

    it('disables Resend OTP button when timer is active', () => {
        const fieldState = { ...defaultFieldState, resendTimer: 30 };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        const resendBtn = screen.getByText('Resend OTP');
        expect(resendBtn).toBeDisabled();
    });

    it('disables Resend OTP button after maximum attempts', () => {
        const fieldState = { ...defaultFieldState, resendCount: 4, maxResendAttempts: 4 };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        const resendBtn = screen.getByText('Resend OTP');
        expect(resendBtn).toBeDisabled();
    });

    it('shows error message if present', () => {
        const fieldState = { ...defaultFieldState, errorMessage: 'Invalid OTP' };
        render(<VerifyOtpDialog {...defaultProps} fieldState={fieldState} />);

        expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<VerifyOtpDialog {...defaultProps} />);

        // The close button has the MdOutlineClose icon — select all unlabelled buttons
        // and pick the one that is NOT the dialog-overlay-close (which has testid)
        const allButtons = screen.getAllByRole('button');
        const closeBtn = allButtons.find(
            (b) => !b.dataset['testid'] && b.getAttribute('aria-label') === null
                && !b.textContent?.trim()
        );
        fireEvent.click(closeBtn!);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose automatically when status is verified', () => {
        const { rerender } = render(<VerifyOtpDialog {...defaultProps} />);

        const verifiedState = { ...defaultFieldState, status: 'verified' as const };
        rerender(<VerifyOtpDialog {...defaultProps} fieldState={verifiedState} />);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose via Dialog onOpenChange when dialog is dismissed (line 51)', () => {
        const onClose = vi.fn();
        render(<VerifyOtpDialog {...defaultProps} onClose={onClose} />);

        const overlayCloseBtn = screen.getByTestId('dialog-overlay-close');
        fireEvent.click(overlayCloseBtn);

        expect(onClose).toHaveBeenCalled();
    });
});
