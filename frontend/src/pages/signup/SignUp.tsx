import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/useToast";
import { IDENTIFIER_REGEX, PASSWORD_REGEX, OTP_REGEX } from '@/utils/ValidationUtils';
import { SignUpStep1, SignUpStep2 } from '@/components/auth/SignUpSteps';
import { useSignup } from '@/hooks/useUser';
import { useVerifyOtp, useGenerateOtp } from '@/hooks/useOtp';
import { SystemSettingService } from '@/services/SystemSettingService';
import { hashPassword } from '@/utils/passwordUtils';

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const { toast } = useToast();

    // Mutations
    const signupMutation = useSignup();
    const verifyOtpMutation = useVerifyOtp();
    const generateOtpMutation = useGenerateOtp();

    // Captcha
    const [googleCaptchaSiteKey, setGoogleCaptchaSiteKey] = useState('');
    const captchaRef = React.useRef<ReCAPTCHA>(null);

    React.useEffect(() => {
        const systemSettingService = new SystemSettingService();
        systemSettingService.read('portal_google_recaptcha_site_key')
            .then(res => {
                if (res.data?.result?.value) {
                    setGoogleCaptchaSiteKey(res.data?.result?.value);
                }
            })
            .catch(err => console.error('Error fetching captcha site key:', err));
    }, []);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isLoading = signupMutation.isPending || verifyOtpMutation.isPending || generateOtpMutation.isPending;

    const isStep1Valid =
        firstName.trim().length > 0 &&
        emailOrMobile.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword &&
        isTermsAccepted;

    const isOtpValid = OTP_REGEX.test(otp.join(''));

    const handleContinue = async () => {
        // 1. Validate First Name
        if (!firstName.trim()) {
            toast({
                title: "First Name Required",
                description: "Please enter your first name.",
                variant: "destructive",
            });
            return;
        }

        // 2. Validate Identifier (Email or Mobile)
        if (!IDENTIFIER_REGEX.test(emailOrMobile)) {
            toast({
                title: "Invalid Email or Mobile",
                description: "Please enter a valid email or a 10-digit mobile number starting with 6-9.",
                variant: "destructive",
            });
            return;
        }

        // 3. Validate Password Strength
        if (!PASSWORD_REGEX.test(password)) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 8 characters, include an uppercase, a lowercase, a number, and a special character.",
                variant: "destructive",
            });
            return;
        }

        // 4. Validate Password Match
        if (password !== confirmPassword) {
            toast({
                title: "Passwords Mismatch",
                description: "The confirmed password does not match the entered password.",
                variant: "destructive",
            });
            return;
        }

        // 5. Validate Terms
        if (!isTermsAccepted) {
            toast({
                title: "Terms Not Accepted",
                description: "Please accept the Terms of Use to continue.",
                variant: "destructive",
            });
            return;
        }

        // Trigger captcha if configured, otherwise proceed directly
        if (googleCaptchaSiteKey) {
            captchaRef.current?.execute();
        } else {
            initiateOtpGeneration();
        }
    };

    const initiateOtpGeneration = async (captchaResponse?: string) => {
        // Generate OTP first
        const isEmail = emailOrMobile.includes('@');
        const otpRequest = {
            request: {
                key: emailOrMobile,
                type: isEmail ? 'email' : 'phone'
            }
        };

        generateOtpMutation.mutate(
            { request: otpRequest, captchaResponse },
            {
                onSuccess: (otpResponse) => {
                    if (otpResponse.status === 200) {
                        toast({
                            title: "OTP Sent",
                            description: "Please check your email/phone for the verification code.",
                            variant: "default",
                        });
                        setStep(2);
                    } else {
                        toast({
                            title: "OTP Generation Failed",
                            description: "Failed to send OTP. Please try again.",
                            variant: "destructive",
                        });
                    }
                    captchaRef.current?.reset();
                },
                onError: (error: any) => {
                    console.error('OTP generation error:', error);
                    captchaRef.current?.reset();
                    
                    if (error?.response?.status === 418) {
                        toast({
                            title: "Captcha Validation Failed",
                            description: "Please try again.",
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "OTP Generation Failed",
                            description: error.message || "Failed to send OTP. Please try again.",
                            variant: "destructive",
                        });
                    }
                }
            }
        );
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        const isEmail = emailOrMobile.includes('@');
        
        const request = {
            request: {
                key: emailOrMobile,
                type: isEmail ? 'email' : 'phone',
                otp: otpString
            }
        };
        
        // First verify OTP
        verifyOtpMutation.mutate(
            { request },
            {
                onSuccess: async (response) => {
                    if (response.status === 200) {
                        // OTP verified successfully, now call signup API
                        const deviceId = localStorage.getItem('deviceId') || undefined;
                        
                        // Hash the password with bcrypt before sending to backend
                        const hashedPassword = await hashPassword(password);
                        
                        signupMutation.mutate(
                            { firstName: firstName.trim(), identifier: emailOrMobile, password: hashedPassword, deviceId },
                            {
                                onSuccess: (signupResponse) => {
                                    if (signupResponse.status === 200) {
                                        toast({
                                            title: "Account Created",
                                            description: "You have successfully signed up. Redirecting...",
                                            variant: "default",
                                        });

                                        setTimeout(() => {
                                            navigate('/onboarding');
                                        }, 1000);
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
                            }
                        );
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

    const handleResendOtpClick = async () => {
        if (googleCaptchaSiteKey) {
            captchaRef.current?.execute();
        } else {
            resendOtp();
        }
    };

    const resendOtp = async (captchaResponse?: string) => {
        const isEmail = emailOrMobile.includes('@');
        
        const request = {
            request: {
                key: emailOrMobile,
                type: isEmail ? 'email' : 'phone'
            }
        };
        
        generateOtpMutation.mutate(
            { request, captchaResponse },
            {
                onSuccess: (response) => {
                    if (response.status === 200) {
                        toast({
                            title: "OTP Resent",
                            description: "A new verification code has been sent.",
                            variant: "default",
                        });
                    }
                    captchaRef.current?.reset();
                },
                onError: (error: any) => {
                    console.error('Resend OTP error:', error);
                    captchaRef.current?.reset();
                    
                    if (error?.response?.status === 418) {
                        toast({
                            title: "Captcha Validation Failed",
                            description: "Please try again.",
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "Resend Failed",
                            description: error.message || "Failed to resend OTP. Please try again.",
                            variant: "destructive",
                        });
                    }
                }
            }
        );
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
                        handleResendOtp={handleResendOtpClick}
                        isLoading={isLoading}
                    />
                )}

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={token => {
                            if (token) {
                                if (step === 1) {
                                    initiateOtpGeneration(token);
                                } else if (step === 2) {
                                    resendOtp(token);
                                }
                            }
                        }}
                    />
                )}
            </div>
        </AuthLayout>
    );
};

export default SignUp;
