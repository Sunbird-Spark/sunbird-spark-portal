
import { FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { Input } from '@/components/input';
import { Header, InputLabel, PrimaryButton } from './ForgotPasswordUI';

interface StepOtpVerificationProps {
    otp: string[];
    setOtp: (val: string[]) => void;
    isOtpValid: boolean;
    handleConfirm: () => void;
}

export const StepOtpVerification = ({
    otp,
    setOtp,
    isOtpValid,
    handleConfirm
}: StepOtpVerificationProps) => (
    <>
        <Header
            title="Enter the code"
            subtitle="Enter the 6 digit code sent to your phone number and complete the verification"
        />

        <div className="space-y-5">
            <div className="space-y-6">
                <p className="fp-otp-validity">
                    OTP is valid for 30 minutes
                </p>

                <div className="fp-otp-container">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            className="fp-otp-input"
                            value={digit}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                // If deleting
                                if (!val && !e.target.value) {
                                    const newOtp = [...otp];
                                    newOtp[index] = '';
                                    setOtp(newOtp);
                                    return;
                                }

                                if (val) {
                                    const newOtp = [...otp];
                                    newOtp[index] = val;
                                    setOtp(newOtp);
                                    if (index < 5) {
                                        document.getElementById(`otp-${index + 1}`)?.focus();
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                    document.getElementById(`otp-${index - 1}`)?.focus();
                                }
                            }}
                        />
                    ))}
                </div>

                <div className="fp-resend-container">
                    <span>04:00 </span>
                    <button className="fp-resend-btn">
                        Resend OTP
                    </button>
                </div>
            </div>

            <PrimaryButton
                disabled={!isOtpValid}
                onClick={handleConfirm}
            >
                Confirm and Proceed
            </PrimaryButton>
        </div>
    </>
);

interface StepResetPasswordProps {
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
    isPasswordValid: boolean;
    isConfirmValid: boolean;
    handleReset: () => void;
}

export const StepResetPassword = ({
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isPasswordValid,
    isConfirmValid,
    handleReset
}: StepResetPasswordProps) => (
    <>
        <Header
            title="Create New Password"
            subtitle="Please choose a strong password to protect your account."
        />

        <div className="space-y-5">
            {/* New Password */}
            <div className="form-group mb-5">
                <InputLabel required>New Password</InputLabel>
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter New Password"
                        className="fp-input-field fp-input-field-pr"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="fp-password-toggle"
                    >
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                    <p className={`passwderr fp-error-text ${(!isPasswordValid && password) ? '' : 'invisible'}`}>
                        Password must be 8+ chars with upper, lower, number & special character
                    </p>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group mb-6">
                <InputLabel required>Confirm Password</InputLabel>
                <div className="relative">
                    <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="fp-input-field fp-input-field-pr"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="fp-password-toggle"
                    >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                    <p className={`confpasswderr fp-error-text ${(confirmPassword && password !== confirmPassword) ? '' : 'invisible'}`}>
                        Passwords do not match
                    </p>
                </div>
            </div>

            <PrimaryButton
                disabled={!isPasswordValid || !isConfirmValid}
                onClick={handleReset}
                className="mt-6"
            >
                Reset Password
            </PrimaryButton>
        </div>
    </>
);

export const StepSuccess = ({ handleProceed }: { handleProceed: () => void }) => (
    <div className="flex flex-col items-center">

        <Header
            title="Congratulations!"
            subtitle="Your password has been successfully reset."
        />

        <div className="flex justify-center mb-10">
            <div className="fp-success-icon-container">
                <FiCheck className="text-white text-4xl" />
            </div>
        </div>

        <PrimaryButton
            onClick={handleProceed}
        >
            Proceed to Login
        </PrimaryButton>
    </div>
);
