import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/useToast";
import { OTP_REGEX } from '@/utils/ValidationUtils';
import { SignUpStep1 } from '@/components/auth/SignUpStep1';
import { SignUpStep2 } from '@/components/auth/SignUpStep2';
import { SignUpStep3 } from '@/components/auth/SignUpStep3';
import { useSignup } from '@/hooks/useUser';
import { useVerifyOtp, useGenerateOtp } from '@/hooks/useOtp';
import { SystemSettingService } from '@/services/SystemSettingService';
import { SignupService } from '@/services/SignupService';

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const captchaRef = useRef<ReCAPTCHA>(null);
    const signupService = useMemo(() => new SignupService(), []);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [googleCaptchaSiteKey, setGoogleCaptchaSiteKey] = useState('');
    const [firstName, setFirstName] = useState('');
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const signupMutation = useSignup();
    const verifyOtpMutation = useVerifyOtp();
    const generateOtpMutation = useGenerateOtp();

    const isLoading = signupMutation.isPending || verifyOtpMutation.isPending || generateOtpMutation.isPending;
    const isStep1Valid = !!(firstName.trim() && emailOrMobile.trim() && password && confirmPassword && password === confirmPassword && isTermsAccepted);
    const isOtpValid = OTP_REGEX.test(otp.join(''));

    useEffect(() => {
        const systemSettingService = new SystemSettingService();
        systemSettingService.read('portal_google_recaptcha_site_key')
        .then(res => {
        if (res.data?.result?.value) {
        setGoogleCaptchaSiteKey(res.data.result.value);
        }
})
        .catch(err => console.error('Error fetching captcha site key:', err));
    }, []);

    const handleOtpMutation = (captchaResponse?: string, isResend = false) => {
        const request = signupService.createOtpGenerationRequest(emailOrMobile);

        generateOtpMutation.mutate(
            { request, captchaResponse },
            {
                onSuccess: (response) => {
                    captchaRef.current?.reset();
                    if (response.status === 200) {
                        toast({
                            title: isResend ? "OTP Resent" : "OTP Sent",
                            description: isResend ? "A new verification code has been sent." : "Please check your email/phone for the verification code.",
                            variant: "default",
                        });
                        if (!isResend) setStep(2);
                    } else {
                        toast({
                            title: "OTP Generation Failed",
                            description: "Failed to send OTP. Please try again.",
                            variant: "destructive",
                        });
                    }
                },
                onError: (error: any) => {
                    console.error('OTP generation error:', error);
                    captchaRef.current?.reset();
                    toast({
                        title: error?.response?.status === 418 ? "Captcha Validation Failed" : isResend ? "Resend Failed" : "OTP Generation Failed",
                        description: error?.response?.status === 418 ? "Please try again." : error.message || "Failed to send OTP. Please try again.",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    const handleContinue = () => {
        const validation = signupService.validateStep1(firstName, emailOrMobile, password, confirmPassword, isTermsAccepted);

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

    const handleVerifyOtp = () => {
        const request = signupService.createOtpVerificationRequest(emailOrMobile, otp.join(''));

        verifyOtpMutation.mutate(
            { request },
            {
                onSuccess: (response) => {
                    if (response.status === 200) {
                        const deviceId = localStorage.getItem('deviceId') || undefined;

                        signupMutation.mutate({
                            firstName,
                            identifier: emailOrMobile,
                            password: btoa(password),
                            deviceId
                        }, {
                            onSuccess: (signupResponse) => {
                                if (signupResponse.status === 200) {
                                    setStep(3);
                                } else {
                                    toast({
                                        title: "Signup Failed",
                                        description: "OTP verified but account creation failed. Please try again.",
                                        variant: "destructive",
                                    });
                                }
                            },
                            onError: (error: any) => {
                                console.error('Signup error:', error);
                                toast({
                                    title: "Signup Failed",
                                    description: error.message || "OTP verified but account creation failed. Please try again.",
                                    variant: "destructive",
                                });
                            }
                        });
                    } else {
                        toast({
                            title: "Verification Failed",
                            description: "Invalid OTP. Please try again.",
                            variant: "destructive",
                        });
                    }
                },
                onError: (error: any) => {
                    console.error('OTP verification error:', error);
                    toast({
                        title: "Verification Failed",
                        description: error.message || "An error occurred during verification. Please try again.",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    const handleResendOtp = () => {
        googleCaptchaSiteKey ? captchaRef.current?.execute() : handleOtpMutation(undefined, true);
    };

    const handleProceedToLogin = () => {
        navigate('/profile');
    };

    return (
        <AuthLayout isOtpPage={step === 2}>
            <div className="w-full font-rubik">
                {step === 1 && (
                    <SignUpStep1
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
                    <SignUpStep2
                        otp={otp}
                        setOtp={setOtp}
                        isOtpValid={isOtpValid}
                        handleVerifyOtp={handleVerifyOtp}
                        handleResendOtp={handleResendOtp}
                        isLoading={isLoading}
                    />
                )}

                {step === 3 && (
                    <SignUpStep3
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
