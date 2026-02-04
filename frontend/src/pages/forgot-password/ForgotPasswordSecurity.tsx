
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
                <p className="otp-validity-text text-center text-[0.85rem] text-sunbird-ink">
                    OTP is valid for 30 minutes
                </p>

                <div className="otp-container flex justify-between gap-2 max-w-[25rem] mx-auto">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            className="otp-input w-[3.25rem] h-[3.25rem] border-[0.125rem] border-sunbird-brick !bg-white rounded-[0.25rem] text-center text-[1.25rem] focus:outline-none focus:ring-[0.125rem] focus:ring-sunbird-brick/20"
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

                <div className="resend-otp-container text-center text-[0.875rem] font-medium text-sunbird-ink mt-6">
                    <span>04:00 </span>
                    <button className="text-sunbird-brick hover:underline font-semibold ml-1">
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
                        className="h-12 !bg-white rounded-[0.625rem] border-sunbird-ink/50 focus:border-sunbird-brick focus:ring-0 focus:shadow-[0_0_0_0.125rem_white,0_0_0_0.25rem_theme(colors.sunbird.brick)] pr-12 px-4 text-[0.875rem] placeholder:text-sunbird-ink/40"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sunbird-ink/50 hover:text-sunbird-ink p-1"
                    >
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                    <p className={`passwderr text-[0.75rem] text-sunbird-brick ${(!isPasswordValid && password) ? '' : 'invisible'}`}>
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
                        className="h-12 !bg-white rounded-[0.625rem] border-sunbird-ink/50 focus:border-sunbird-brick focus:ring-0 focus:shadow-[0_0_0_0.125rem_white,0_0_0_0.25rem_theme(colors.sunbird.brick)] pr-12 px-4 text-[0.875rem] placeholder:text-sunbird-ink/40"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sunbird-ink/50 hover:text-sunbird-ink p-1"
                    >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                    <p className={`confpasswderr text-[0.75rem] text-sunbird-brick ${(confirmPassword && password !== confirmPassword) ? '' : 'invisible'}`}>
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
            <div className="success-icon w-[4.5rem] h-[4.5rem] rounded-full bg-sunbird-moss flex items-center justify-center shadow-md">
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
