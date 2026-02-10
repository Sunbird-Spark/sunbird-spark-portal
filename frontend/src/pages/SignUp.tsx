import React, { useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/useToast";
import { IDENTIFIER_REGEX, PASSWORD_REGEX, OTP_REGEX } from '@/utils/ValidationUtils';
import { SignUpStep1, SignUpStep2 } from '@/components/SignUpSteps';

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const { toast } = useToast();

    // Form State
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isStep1Valid =
        emailOrMobile.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword &&
        isTermsAccepted;

    const isOtpValid = OTP_REGEX.test(otp.join(''));

    const handleContinue = () => {
        // 1. Validate Identifier (Email or Mobile)
        if (!IDENTIFIER_REGEX.test(emailOrMobile)) {
            toast({
                title: "Invalid Email or Mobile",
                description: "Please enter a valid email or a 10-digit mobile number starting with 6-9.",
                variant: "destructive",
            });
            return;
        }

        // 2. Validate Password Strength
        if (!PASSWORD_REGEX.test(password)) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 8 characters, include an uppercase, a lowercase, a number, and a special character.",
                variant: "destructive",
            });
            return;
        }

        // 3. Validate Password Match
        if (password !== confirmPassword) {
            toast({
                title: "Passwords Mismatch",
                description: "The confirmed password does not match the entered password.",
                variant: "destructive",
            });
            return;
        }

        // 4. Validate Terms
        if (!isTermsAccepted) {
            toast({
                title: "Terms Not Accepted",
                description: "Please accept the Terms of Use to continue.",
                variant: "destructive",
            });
            return;
        }

        // If all validations pass
        setStep(2);
    };

    const handleVerifyOtp = () => {
        // Verify OTP logic

        toast({
            title: "Account Created",
            description: "You have successfully signed up. Redirecting...",
            variant: "default",
        });

        // Redirect or show success
        setTimeout(() => {
            navigate('/onboarding');
        }, 1000);
    };

    return (
        <AuthLayout isOtpPage={step === 2}>
            <div className="w-full font-rubik">
                {step === 1 && (
                    <SignUpStep1
                        emailOrMobile={emailOrMobile}
                        setEmailOrMobile={setEmailOrMobile}
                        password={password}
                        setPassword={setPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        isTermsAccepted={isTermsAccepted}
                        setIsTermsAccepted={setIsTermsAccepted}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                        handleContinue={handleContinue}
                        isStep1Valid={isStep1Valid}
                    />
                )}

                {step === 2 && (
                    <SignUpStep2
                        otp={otp}
                        setOtp={setOtp}
                        isOtpValid={isOtpValid}
                        handleVerifyOtp={handleVerifyOtp}
                    />
                )}
            </div>
        </AuthLayout>
    );
};

export default SignUp;
