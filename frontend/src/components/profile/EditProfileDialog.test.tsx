import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditProfileDialog from './EditProfileDialog';
import { FieldOtpState, OtpRequiredField, EditProfileFormData } from '@/types/profileTypes';
import { createInitialFieldOtpState } from '@/types/profileTypes';
import { useAppI18n } from '@/hooks/useAppI18n';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'editProfile.title': 'Edit Personal Information',
                'personalInfo.fullName': 'Full Name',
                'personalInfo.mobileNumber': 'Mobile Number',
                'personalInfo.emailId': 'Email ID',
                'personalInfo.alternateEmailId': 'Alternate Email ID',
                'editProfile.validate': 'Validate',
                'editProfile.sending': 'Sending...',
                'editProfile.verified': 'Verified',
                'save': 'Save',
                'editProfile.saving': 'Saving...',
                'forgotPasswordPage.enterCode': 'Enter the code',
                'editProfile.enterDigitCodePhone': 'Enter the 6 digit code',
                'editProfile.enterDigitCodeEmail': 'Enter the 6 digit code',
                'signUp.submit': 'Submit',
                'forgotPasswordPage.resendOtp': 'Resend OTP',
                'editProfile.submitting': 'Submitting...',
            };
            return translations[key] || key;
        },
    }),
}));

const defaultForm: EditProfileFormData = {
    fullName: 'John Doe',
    mobileNumber: '9876543210',
    emailId: 'john@example.com',
    alternateEmail: 'recovery@example.com',
};

const createFieldStates = (
    overrides: Partial<Record<OtpRequiredField, Partial<FieldOtpState>>> = {}
): Record<OtpRequiredField, FieldOtpState> => ({
    mobileNumber: { ...createInitialFieldOtpState(), ...overrides.mobileNumber },
    emailId: { ...createInitialFieldOtpState(), ...overrides.emailId },
    alternateEmail: { ...createInitialFieldOtpState(), ...overrides.alternateEmail },
});

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    form: defaultForm,
    updateField: vi.fn(),
    fieldStates: createFieldStates(),
    initiateOtp: vi.fn(),
    setFieldOtp: vi.fn(),
    verifyFieldOtp: vi.fn(),
    resendFieldOtp: vi.fn(),
    canSave: false,
    isSaving: false,
    handleSave: vi.fn(),
    formatTime: (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    triggerCaptcha: vi.fn((cb: (token?: string) => void) => cb('mock-captcha-token')),
};

describe('EditProfileDialog', () => {
    it('renders all form fields with labels', () => {
        render(<EditProfileDialog {...defaultProps} />);

        expect(screen.getByText('Full Name')).toBeInTheDocument();
        expect(screen.getByText('Mobile Number')).toBeInTheDocument();
        expect(screen.getByText('Email ID')).toBeInTheDocument();
        expect(screen.getByText('Alternate Email ID')).toBeInTheDocument();
    });

    it('renders form values in inputs', () => {
        render(<EditProfileDialog {...defaultProps} />);

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('recovery@example.com')).toBeInTheDocument();
    });

    it('renders dialog title', () => {
        render(<EditProfileDialog {...defaultProps} />);

        expect(screen.getByText('Edit Personal Information')).toBeInTheDocument();
    });

    it('shows Validate button when field status is modified', () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);

        expect(screen.getByText('Validate')).toBeInTheDocument();
    });

    it('does not show Validate button when field status is pristine', () => {
        render(<EditProfileDialog {...defaultProps} />);

        expect(screen.queryByText('Validate')).not.toBeInTheDocument();
    });

    it('shows Sending... when field status is otp_sending', () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'otp_sending' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);

        expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('opens OTP verification dialog when Validate is clicked', async () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);
        fireEvent.click(screen.getByText('Validate'));

        await vi.waitFor(() => {
            expect(screen.getByText('Enter the code')).toBeInTheDocument();
        });
        expect(screen.getByText(/Enter the 6 digit code/)).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(screen.getByText('Resend OTP')).toBeInTheDocument();
    });

    it('shows Submitting... in OTP dialog when field status is otp_verifying', async () => {
        const fieldStatesModified = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        const { rerender } = render(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesModified} />);
        fireEvent.click(screen.getByText('Validate'));

        const fieldStatesVerifying = createFieldStates({
            mobileNumber: { status: 'otp_verifying', otp: '123456' },
        });
        rerender(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesVerifying} />);

        await vi.waitFor(() => {
            expect(screen.getByText('Submitting...')).toBeInTheDocument();
        });
    });

    it('shows Verified badge when field status is verified', () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'verified' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);

        expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows error message when field status is error', () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'error', errorMessage: 'Enter a valid 10-digit mobile number starting with 6-9' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);

        expect(screen.getByText('Enter a valid 10-digit mobile number starting with 6-9')).toBeInTheDocument();
    });

    it('disables Resend OTP button when timer is active', async () => {
        const fieldStatesModified = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        const { rerender } = render(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesModified} />);
        fireEvent.click(screen.getByText('Validate'));

        const fieldStatesOtpSent = createFieldStates({
            mobileNumber: { status: 'otp_sent', resendCount: 2, maxResendAttempts: 4, resendTimer: 20, otp: '' },
        });
        rerender(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesOtpSent} />);

        await vi.waitFor(() => {
            const resendButton = screen.getByText('Resend OTP');
            expect(resendButton).toBeDisabled();
        });
        expect(screen.getByText('00:20')).toBeInTheDocument();
    });

    it('disables Save button when canSave is false', () => {
        render(<EditProfileDialog {...defaultProps} canSave={false} />);

        const saveButton = screen.getByRole('button', { name: /Save/i });
        expect(saveButton).toBeDisabled();
    });

    it('enables Save button when canSave is true', () => {
        render(<EditProfileDialog {...defaultProps} canSave={true} />);

        const saveButton = screen.getByRole('button', { name: /Save/i });
        expect(saveButton).toBeEnabled();
    });

    it('shows Saving... text when isSaving is true', () => {
        render(<EditProfileDialog {...defaultProps} canSave={true} isSaving={true} />);

        expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<EditProfileDialog {...defaultProps} onClose={onClose} />);

        const closeButtons = screen.getAllByRole('button');
        const closeBtn = closeButtons.find(btn => btn.querySelector('svg'));
        if (closeBtn) fireEvent.click(closeBtn);

        expect(onClose).toHaveBeenCalled();
    });

    it('calls handleSave when Save button is clicked', () => {
        const handleSave = vi.fn();
        render(<EditProfileDialog {...defaultProps} canSave={true} handleSave={handleSave} />);

        const saveButton = screen.getByRole('button', { name: /Save/i });
        fireEvent.click(saveButton);

        expect(handleSave).toHaveBeenCalled();
    });

    it('calls triggerCaptcha and initiateOtp with token when Validate is clicked', async () => {
        const initiateOtp = vi.fn();
        const triggerCaptcha = vi.fn((cb: (token?: string) => void) => cb('mock-captcha-token'));
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} initiateOtp={initiateOtp} triggerCaptcha={triggerCaptcha} />);

        const validateButton = screen.getByText('Validate');
        fireEvent.click(validateButton);

        await vi.waitFor(() => {
            expect(triggerCaptcha).toHaveBeenCalled();
            expect(initiateOtp).toHaveBeenCalledWith('mobileNumber', 'mock-captcha-token');
        });
    });

    it('calls verifyFieldOtp when Submit button is clicked in OTP dialog', async () => {
        const verifyFieldOtp = vi.fn();
        const fieldStatesModified = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        const { rerender } = render(
            <EditProfileDialog {...defaultProps} fieldStates={fieldStatesModified} verifyFieldOtp={verifyFieldOtp} />
        );
        fireEvent.click(screen.getByText('Validate'));

        const fieldStatesOtpSent = createFieldStates({
            mobileNumber: { status: 'otp_sent', otp: '123456', resendTimer: 10 },
        });
        rerender(
            <EditProfileDialog {...defaultProps} fieldStates={fieldStatesOtpSent} verifyFieldOtp={verifyFieldOtp} />
        );

        await vi.waitFor(() => {
            const submitButton = screen.getByText('Submit');
            fireEvent.click(submitButton);
        });

        expect(verifyFieldOtp).toHaveBeenCalledWith('mobileNumber');
    });

    it('disables Submit button when OTP is incomplete', async () => {
        const fieldStatesModified = createFieldStates({
            mobileNumber: { status: 'modified' },
        });

        const { rerender } = render(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesModified} />);
        fireEvent.click(screen.getByText('Validate'));

        const fieldStatesOtpSent = createFieldStates({
            mobileNumber: { status: 'otp_sent', otp: '123', resendTimer: 10 },
        });
        rerender(<EditProfileDialog {...defaultProps} fieldStates={fieldStatesOtpSent} />);

        await vi.waitFor(() => {
            const submitButton = screen.getByText('Submit');
            expect(submitButton).toBeDisabled();
        });
    });

    it('disables input when field has OTP in progress', () => {
        const fieldStates = createFieldStates({
            mobileNumber: { status: 'otp_sent', otp: '', resendTimer: 20 },
        });

        render(<EditProfileDialog {...defaultProps} fieldStates={fieldStates} />);

        const mobileInput = screen.getByDisplayValue('9876543210');
        expect(mobileInput).toBeDisabled();
    });

    it('does not show Validate button for Full Name field', () => {
        render(<EditProfileDialog {...defaultProps} />);

        // Full name input should not have a validate button regardless of state
        const fullNameInput = screen.getByDisplayValue('John Doe');
        const fullNameContainer = fullNameInput.closest('div');
        expect(fullNameContainer?.querySelector('button')).toBeNull();
    });

    it('does not render when isOpen is false', () => {
        render(<EditProfileDialog {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Edit Personal Information')).not.toBeInTheDocument();
    });
});
