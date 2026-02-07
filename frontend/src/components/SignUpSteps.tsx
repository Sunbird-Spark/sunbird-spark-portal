import React, { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Checkbox } from "@/components/CheckBox";
import { Header, InputLabel, PrimaryButton, OTPInput } from "../pages/ForgotPasswordComponents";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from "@/utils/ValidationUtils";


interface Step1Props {
    emailOrMobile: string;
    setEmailOrMobile: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    isTermsAccepted: boolean;
    setIsTermsAccepted: (val: boolean) => void;
    showPassword: boolean;
    setShowPassword: (val: React.SetStateAction<boolean>) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (val: React.SetStateAction<boolean>) => void;
    handleContinue: () => void;
    isStep1Valid: boolean;
}

export const SignUpStep1 = ({
    emailOrMobile, setEmailOrMobile,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isTermsAccepted, setIsTermsAccepted,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    handleContinue,
    isStep1Valid
}: Step1Props) => (
    <>
        <Header
            title="Welcome to Sunbird!"
            subtitle="Your learning journey starts here - sign up to get started."
        />

        <div className="space-y-3">
            {/* Google Sign In */}
            <Button
                variant="outline"
                className="secondary-outline-button"
                onClick={() => console.log('Google Sign In')}
            >
                <FcGoogle className="w-5 h-5" />
                Sign in with Google
            </Button>

            {/* Divider */}
            <div className="form-divider-container">
                <div className="form-divider-line"></div>
                <span className="form-divider-text">OR</span>
                <div className="form-divider-line"></div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
                {/* Email / Mobile */}
                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="emailOrMobile" required>Email ID / Mobile Number</InputLabel>
                    <Input
                        id="emailOrMobile"
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        placeholder="Enter Email ID / Mobile Number"
                        className="login-input-field h-10 px-3"
                    />
                    {/* Inline Error (Optional/Complementary) */}
                    {emailOrMobile && !IDENTIFIER_REGEX.test(emailOrMobile) && (
                        <p className="form-error-absolute form-error-offset-8">
                            Enter valid Email or 10-digit Mobile (6-9)
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="password" required>Password</InputLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="login-input-field h-10 pr-10 px-3"
                        />
                        <button
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
                        >
                            {showPassword ? (
                                <FiEyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                                <FiEye className="w-4 h-4" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    {/* Password Requirements */}
                    {password && !PASSWORD_REGEX.test(password) && (
                        <p className="form-error-absolute form-error-offset-4">
                            Password must be 8+ chars (upper, lower, num, special)
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="confirmPassword" required>Confirm Password</InputLabel>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter Password"
                            className="login-input-field h-10 pr-10 px-3"
                        />
                        <button
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
                        >
                            {showConfirmPassword ? (
                                <FiEyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                                <FiEye className="w-4 h-4" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="form-error-absolute form-error-offset-2">
                            Passwords do not match
                        </p>
                    )}
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center space-x-2 mt-1">
                    <Checkbox
                        id="terms"
                        checked={isTermsAccepted}
                        onCheckedChange={(checked) => setIsTermsAccepted(checked === true)}
                        className="themed-checkbox"
                    />
                    <label
                        htmlFor="terms"
                        className="text-[0.75rem] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sunbird-charcoal"
                    >
                        I understand & <a href="#" className="themed-link" onClick={(e) => e.preventDefault()}>accept the SUNBIRD Terms of Use</a>.
                    </label>
                </div>

                <PrimaryButton
                    disabled={!isStep1Valid}
                    onClick={handleContinue}
                    className="mt-4 h-[3rem]"
                >
                    Continue
                </PrimaryButton>

                <div className="text-center mt-3 text-[0.75rem] text-sunbird-charcoal font-medium">
                    Already have an account? <a href="/login" className="themed-link no-underline hover:underline">Login</a>
                </div>
            </div>
        </div>
    </>
);

interface Step2Props {
    otp: string[];
    setOtp: (val: string[]) => void;
    isOtpValid: boolean;
    handleVerifyOtp: () => void;
}

export const SignUpStep2 = ({ otp, setOtp, isOtpValid, handleVerifyOtp }: Step2Props) => {
    const [disableResendOtp, setDisableResendOtp] = useState(false);
    const [counter, setCounter] = useState(20);
    const [resendOtpCounter, setResendOtpCounter] = useState(1);

    useEffect(() => {
        setDisableResendOtp(true);
        setCounter(20);

        const interval = setInterval(() => {
            setCounter(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setDisableResendOtp(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resendOtpCounter]);

    const handleResendOtp = () => {
        setResendOtpCounter(prev => prev + 1);
        console.log("Resending OTP...");
    };

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Enter the code"
                subtitle="Enter the 6 digit code sent to your Email ID and complete the verification"
            />

            <div className="flex flex-col flex-1 justify-between h-full">
                <div className="text-center pt-2">
                    <p className="text-[0.75rem] font-medium text-sunbird-gray-75 mb-6">
                        OTP is valid for 30 minutes
                    </p>

                    <OTPInput otp={otp} setOtp={setOtp} />

                    <div className="text-center text-[0.75rem] font-medium mt-8">
                        <button
                            disabled={disableResendOtp}
                            onClick={handleResendOtp}
                            className="resend-otp-btn"
                        >
                            Resend OTP {counter > 0 && `(${counter})`}
                        </button>
                    </div>
                </div>

                <div className="pb-2 mt-20">
                    <PrimaryButton
                        disabled={!isOtpValid}
                        onClick={handleVerifyOtp}
                        className="h-[3rem]"
                    >
                        Submit
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};
