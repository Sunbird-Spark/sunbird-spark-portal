import React from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Checkbox } from "@/components/common/CheckBox";
import { Header, InputLabel, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from "@/utils/ValidationUtils";

interface Step1Props {
    firstName: string;
    setFirstName: (val: string) => void;
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
    isLoading?: boolean;
}

export const SignUpStep1 = ({
    firstName, setFirstName,
    emailOrMobile, setEmailOrMobile,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isTermsAccepted, setIsTermsAccepted,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    handleContinue,
    isStep1Valid,
    isLoading = false
}: Step1Props) => (
    <>
        <Header
            title="Welcome to Sunbird!"
            subtitle="Your learning journey starts here - sign up to get started."
        />

        <div className="space-y-3">
            <Button
                variant="outline"
                className="secondary-outline-button"
                onClick={() => { window.location.href = "/google/auth" }}
            >
                <FcGoogle className="w-5 h-5" />
                Sign in with Google
            </Button>

            <div className="form-divider-container">
                <div className="form-divider-line"></div>
                <span className="form-divider-text">OR</span>
                <div className="form-divider-line"></div>
            </div>

            <div className="space-y-3">
                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="firstName" required>First Name</InputLabel>
                    <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter First Name"
                        className="login-input-field h-10 px-3"
                    />
                    {firstName && firstName.trim().length === 0 && (
                        <p className="form-error-absolute form-error-offset-8">
                            First name is required
                        </p>
                    )}
                </div>

                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="emailOrMobile" required>Email ID / Mobile Number</InputLabel>
                    <Input
                        id="emailOrMobile"
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        placeholder="Enter Email ID / Mobile Number"
                        className="login-input-field h-10 px-3"
                    />
                    {emailOrMobile && !IDENTIFIER_REGEX.test(emailOrMobile) && (
                        <p className="form-error-absolute form-error-offset-8">
                            Enter valid Email or 10-digit Mobile (6-9)
                        </p>
                    )}
                </div>

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
                    {password && !PASSWORD_REGEX.test(password) && (
                        <p className="form-error-absolute form-error-offset-4">
                            Password must be 8+ chars (upper, lower, num, special)
                        </p>
                    )}
                </div>

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
                    disabled={!isStep1Valid || isLoading}
                    onClick={handleContinue}
                    className="mt-4 h-[3rem]"
                >
                    {isLoading ? 'Creating Account...' : 'Continue'}
                </PrimaryButton>

                <div className="text-center mt-3 text-[0.75rem] text-sunbird-charcoal font-medium">
                    Already have an account? <a href="/login" className="themed-link no-underline hover:underline">Login</a>
                </div>
            </div>
        </div>
    </>
);
