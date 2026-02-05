import React from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Checkbox } from "@/components/checkbox";
import { Header, InputLabel, PrimaryButton } from "./AuthComponent";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from "@/lib/auth-utils";


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
            subtitle="Your learning journey starts here–log in to continue."
            className="mb-4"
        />

        <div className="space-y-3">
            {/* Google Sign In */}
            <Button
                variant="outline"
                className="w-full h-[2.5rem] bg-white border border-[#D0D5DD] text-[#344054] font-medium rounded-[0.5rem] flex items-center justify-center gap-2 hover:bg-gray-50 mb-0 text-[0.875rem]"
                onClick={() => console.log('Google Sign In')}
            >
                <FcGoogle className="w-5 h-5" />
                Sign in with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-1">
                <div className="h-[1px] flex-1 bg-[#E0E0E0]"></div>
                <span className="text-[#666666] text-[0.75rem] font-medium">OR</span>
                <div className="h-[1px] flex-1 bg-[#E0E0E0]"></div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
                {/* Email / Mobile */}
                <div className="form-group">
                    <InputLabel required className="mb-1">Email ID / Mobile Number</InputLabel>
                    <Input
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        placeholder="Enter Email ID / Mobile Number"
                        className="h-10 !bg-white rounded-[0.5rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-3 text-[0.875rem] placeholder:text-[#B2B2B2]"
                    />
                    {/* Inline Error (Optional/Complementary) */}
                    {emailOrMobile && !IDENTIFIER_REGEX.test(emailOrMobile) && (
                        <p className="text-[0.75rem] text-red-500 mt-1">
                            Enter valid Email or 10-digit Mobile (6-9)
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="form-group">
                    <InputLabel required className="mb-1">Password</InputLabel>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            className="h-10 !bg-white rounded-[0.5rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] pr-10 px-3 text-[0.875rem] placeholder:text-[#B2B2B2]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#333] p-1"
                        >
                            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                {/* Password Requirements */}
                {password && !PASSWORD_REGEX.test(password) && (
                    <p className="text-[0.75rem] text-red-500 mt-1">
                        Password must be 8+ chars with upper, lower, number & special character
                    </p>
                )}

                {/* Confirm Password */}
                <div className="form-group">
                    <InputLabel required className="mb-1">Confirm Password</InputLabel>
                    <div className="relative">
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter Password"
                            className="h-10 !bg-white rounded-[0.5rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] pr-10 px-3 text-[0.875rem] placeholder:text-[#B2B2B2]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#333] p-1"
                        >
                            {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-[0.75rem] text-red-500 mt-1">
                            Passwords do not match
                        </p>
                    )}
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start items-center space-x-2 mt-1">
                    <Checkbox
                        id="terms"
                        checked={isTermsAccepted}
                        onCheckedChange={(checked) => setIsTermsAccepted(checked === true)}
                        className="data-[state=checked]:bg-[#A85236] data-[state=checked]:border-[#A85236] border-[#828282] w-4 h-4 rounded-[0.25rem]"
                    />
                    <label
                        htmlFor="terms"
                        className="text-[0.75rem] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#333333]"
                    >
                        I understand & <a href="#" className="font-bold text-[#A85236] underline">accept the SUNBIRD Terms of Use</a>.
                    </label>
                </div>

                <PrimaryButton
                    disabled={!isStep1Valid}
                    onClick={handleContinue}
                    className="mt-4 h-[3rem]"
                >
                    Continue
                </PrimaryButton>

                <div className="text-center mt-3 text-[0.75rem] text-[#333333] font-medium">
                    Already have an account? <a href="/login" className="text-[#A85236] font-bold hover:underline">Login</a>
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

export const SignUpStep2 = ({ otp, setOtp, isOtpValid, handleVerifyOtp }: Step2Props) => (
    <>
        <Header
            title="Enter the code"
            subtitle="Enter the 6 digit code sent to your phone number and complete the verification"
        />

        <div className="space-y-5">
            <div className="space-y-6">
                <p className="otp-validity-text text-center text-[0.85rem] text-[#4A5568]">
                    OTP is valid for 30 minutes
                </p>

                <div className="otp-container flex justify-between gap-2 max-w-[25rem] mx-auto">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            className="otp-input w-[3.25rem] h-[3.25rem] border-2 border-[#A85236] !bg-white rounded-[0.25rem] text-center text-[1.25rem] focus:outline-none focus:shadow-[0_0_0_0.125rem_rgba(167,58,36,0.2)]"
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

                <div className="resend-otp-container text-center text-[0.875rem] font-medium text-[#4A5568] mt-6">
                    <span>04:00 </span>
                    <button className="text-[#A85236] hover:underline font-semibold ml-1">
                        Resend OTP
                    </button>
                </div>
            </div>

            <PrimaryButton
                disabled={!isOtpValid}
                onClick={handleVerifyOtp}
            >
                Confirm and Proceed
            </PrimaryButton>
        </div>
    </>
);
