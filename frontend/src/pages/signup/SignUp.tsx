import React, { useState, useRef, useMemo } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useToast } from "@/hooks/useToast";
import { OTP_REGEX } from '@/utils/ValidationUtils';
import { SignUpForm } from '@/components/signup/SignUpForm';
import { SignUpOtpVerification } from '@/components/signup/SignUpOtpVerification';
import { SignUpSuccess } from '@/components/signup/SignUpSuccess';
import { useSignup } from '@/hooks/useUser';
import { useVerifyOtp, useGenerateOtp } from '@/hooks/useOtp';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useAcceptTnc } from '@/hooks/useTnc';
import { SignupService } from '@/services/SignupService';

const SignUp: React.FC = () => {
    const { toast } = useToast();
    const captchaRef = useRef<ReCAPTCHA>(null);
    const signupService = useMemo(() => new SignupService(), []);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [firstName, setFirstName] = useState('');
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data: captchaSiteKeyData } = useSystemSetting('portal_google_recaptcha_site_key');
    const googleCaptchaSiteKey = (captchaSiteKeyData?.data as any)?.response?.value || '';
    const { data: tncConfig } = useSystemSetting('tncConfig');

    const signupMutation = useSignup();
    const verifyOtpMutation = useVerifyOtp();
    const generateOtpMutation = useGenerateOtp();
    const acceptTncMutation = useAcceptTnc();

    const isLoading = signupMutation.isPending || verifyOtpMutation.isPending || generateOtpMutation.isPending;
    const isStep1Valid = !!(firstName.trim() && emailOrMobile.trim() && password && confirmPassword && password === confirmPassword && isTermsAccepted);
    const isOtpValid = OTP_REGEX.test(otp.join(''));

    const handleOtpSuccess = (response: any, isResend = false) => {
        captchaRef.current?.reset();

        if (response.status !== 200) {
            toast({
                title: "OTP Generation Failed",
                description: "Failed to send OTP. Please try again.",
                variant: "destructive",
            });
            return;
        }

        const title = isResend ? "OTP Resent" : "OTP Sent";
        const description = isResend
            ? "A new verification code has been sent."
            : "Please check your email/phone for the verification code.";

        toast({ title, description, variant: "default" });

        if (!isResend) {
            setStep(2);
        }
    };

    const handleOtpError = (error: any, isResend = false) => {
        console.error('OTP generation error:', error);
        captchaRef.current?.reset();

        const isCaptchaError = error?.response?.status === 418;
        const title = isCaptchaError
            ? "Captcha Validation Failed"
            : isResend ? "Resend Failed" : "OTP Generation Failed";
        const description = isCaptchaError
            ? "Please try again."
            : error.message || "Failed to send OTP. Please try again.";

        toast({ title, description, variant: "destructive" });
    };

    const handleOtpMutation = (captchaResponse?: string, isResend = false) => {
        const request = signupService.createOtpGenerationRequest(emailOrMobile);

        generateOtpMutation.mutate(
            { request, captchaResponse },
            {
                onSuccess: (response) => handleOtpSuccess(response, isResend),
                onError: (error) => handleOtpError(error, isResend)
            }
        );
    };

    const handleContinue = () => {
        const validation = signupService.validateSignupForm(firstName, emailOrMobile, password, confirmPassword, isTermsAccepted);

        if (!validation.isValid && validation.error) {
            toast({
                title: validation.error.title,
                description: validation.error.description,
                variant: "destructive",
            });
            return;
        }

        googleCaptchaSiteKey ? captchaRef.current?.execute() : handleOtpMutation();
    };

    const handleSignupSuccess = (signupResponse: any) => {
        if (signupResponse.status !== 200) {
            toast({
                title: "Signup Failed",
                description: "OTP verified but account creation failed. Please try again.",
                variant: "destructive",
            });
            return;
        }

        // Accept TNC if terms were accepted during signup
        if (isTermsAccepted && tncConfig) {
            acceptTncMutation.mutate({ tncConfig, identifier: emailOrMobile });
        }

        setStep(3);
    };

    const handleSignupError = (error: any) => {
        toast({
            title: "Signup Failed",
            description: error.message || "OTP verified but account creation failed. Please try again.",
            variant: "destructive",
        });
    };

    const handleOtpVerificationSuccess = (response: any) => {
        if (response.status !== 200) {
            toast({
                title: "Verification Failed",
                description: "Invalid OTP. Please try again.",
                variant: "destructive",
            });
            return;
        }

        const deviceId = localStorage.getItem('deviceId') || undefined;

        signupMutation.mutate({
            firstName,
            identifier: emailOrMobile,
            password: signupService.encodePassword(password),
            deviceId
        }, {
            onSuccess: handleSignupSuccess,
            onError: handleSignupError
        });
    };

    const handleOtpVerificationError = (error: any) => {
        toast({
            title: "Verification Failed",
            description: error.message || "An error occurred during verification. Please try again.",
            variant: "destructive",
        });
    };

    const handleVerifyOtp = () => {
        const request = signupService.createOtpVerificationRequest(emailOrMobile, otp.join(''));

        verifyOtpMutation.mutate(
            { request },
            {
                onSuccess: handleOtpVerificationSuccess,
                onError: handleOtpVerificationError
            }
        );
    };

    const handleResendOtp = () => {
        googleCaptchaSiteKey ? captchaRef.current?.execute() : handleOtpMutation(undefined, true);
    };

    const handleProceedToLogin = () => {
        window.location.href = '/portal/login';
    };

    return (
        <AuthLayout isOtpPage={step === 2}>
            <div className="w-full font-rubik">
                {step === 1 && (
                    <SignUpForm
                        firstName={firstName}
                        setFirstName={setFirstName}
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
                        isLoading={isLoading}
                    />
                )}

                {step === 2 && (
                    <SignUpOtpVerification
                        otp={otp}
                        setOtp={setOtp}
                        isOtpValid={isOtpValid}
                        handleVerifyOtp={handleVerifyOtp}
                        handleResendOtp={handleResendOtp}
                        isLoading={isLoading}
                    />
                )}

                {step === 3 && (
                    <SignUpSuccess
                        handleProceed={handleProceedToLogin}
                    />
                )}

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={token => token && handleOtpMutation(token, step === 2)}
                        onLoad={() => console.log('ReCAPTCHA API loaded successfully')}
                        onErrored={() => console.error('ReCAPTCHA error occurred')}
                    />
                )}
            </div>
        </AuthLayout>
    );
};

export default SignUp;
