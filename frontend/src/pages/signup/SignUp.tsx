/* eslint-disable max-lines */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useToast } from "@/hooks/useToast";
import { IDENTIFIER_REGEX, OTP_REGEX } from '@/utils/ValidationUtils';
import { SignUpForm } from '@/components/signup/SignUpForm';
import { SignUpOtpVerification } from '@/components/signup/SignUpOtpVerification';
import { SignUpSuccess } from '@/components/signup/SignUpSuccess';
import { useSignup, useCheckUserExists } from '@/hooks/useUser';
import { useVerifyOtp, useGenerateOtp } from '@/hooks/useOtp';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { SignupService } from '@/services/SignupService';
import { getSafeRedirectUrl, isMobileApp, persistMobileContext } from '@/utils/forgotPasswordUtils';
import { useAppI18n } from '@/hooks/useAppI18n';
import { TelemetryTracker } from '@/components/telemetry/TelemetryTracker';
import useDebounce from '@/hooks/useDebounce';

import useImpression from '@/hooks/useImpression';
import { useTelemetry } from '@/hooks/useTelemetry';

const SignUp: React.FC = () => {
    const { toast } = useToast();
    const { t } = useAppI18n();
    const captchaRef = useRef<ReCAPTCHA>(null);
    const signupService = useMemo(() => new SignupService(), []);

    useImpression({ type: 'view', pageid: 'signup' });
    const telemetry = useTelemetry();

    // Persist mobile context to sessionStorage on mount (only for mobile app)
    useEffect(() => {
        if (isMobileApp()) {
            persistMobileContext();
        }
    }, []);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [firstName, setFirstName] = useState('');
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const captchaActionRef = useRef<'checkExistence' | 'generateOtp'>('checkExistence');

    const { data: captchaSiteKeyData } = useSystemSetting('portal_google_recaptcha_site_key');
    const googleCaptchaSiteKey = (captchaSiteKeyData?.data as any)?.response?.value || '';

    const [existenceStatus, setExistenceStatus] = useState<'idle' | 'checking' | 'exists' | 'error'>('idle');
    const debouncedIdentifier = useDebounce(emailOrMobile, 100);

    const signupMutation = useSignup();
    const verifyOtpMutation = useVerifyOtp();
    const generateOtpMutation = useGenerateOtp();
    const checkUserExistsMutation = useCheckUserExists();

    const isLoading = signupMutation.isPending || verifyOtpMutation.isPending || generateOtpMutation.isPending;
    const isStep1Valid = !!(firstName.trim() && emailOrMobile.trim() && password && confirmPassword && password === confirmPassword);
    const isOtpValid = OTP_REGEX.test(otp);

    useEffect(() => { setExistenceStatus('idle'); }, [emailOrMobile]);

    useEffect(() => {
        if (!IDENTIFIER_REGEX.test(debouncedIdentifier)) return;
        setExistenceStatus('checking');
        captchaActionRef.current = 'checkExistence';
        if (googleCaptchaSiteKey) {
            captchaRef.current?.reset();
            captchaRef.current?.execute();
        } else {
            handleExistenceResult();
        }
    }, [debouncedIdentifier]);

    const handleExistenceResult = (captchaResponse?: string) => {
        checkUserExistsMutation.mutate(
            { identifier: debouncedIdentifier, captchaResponse },
            {
                onSuccess: (response) => { setExistenceStatus(response.data?.exists === true ? 'exists' : 'idle'); },
                onError: () => {
                    setExistenceStatus('error');
                    toast({
                        title: t("signUpPage.captchaFailed"),
                        description: t("signUpPage.pleaseTryAgain"),
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const handleCaptchaResolved = (token: string) => {
        if (captchaActionRef.current === 'checkExistence') {
            handleExistenceResult(token);
        } else {
            handleOtpMutation(token, step === 2);
        }
    };

    const handleOtpSuccess = (response: any, isResend = false) => {
        captchaRef.current?.reset();

        if (response.status !== 200) {
            toast({
                title: t("signUpPage.otpGenerationFailed"),
                description: t("signUpPage.failedToSendOtp"),
                variant: "destructive",
            });
            return;
        }

        const title = isResend ? t("signUpPage.otpResent") : t("signUpPage.otpSent");
        const description = isResend
            ? t("signUpPage.newCodeSent")
            : t("signUpPage.checkEmailPhone");

        telemetry.log({
            edata: {
                type: 'api',
                level: 'INFO',
                message: isResend ? 'OTP resent to user' : 'OTP sent to user',
                pageid: 'signup',
            },
        });

        toast({ title, description, variant: "success" });

        if (!isResend) {
            setStep(2);
        }
    };

    const handleOtpError = (error: any, isResend = false) => {
        console.error('OTP generation error:', error);
        captchaRef.current?.reset();

        const isCaptchaError = error?.response?.status === 418;
        const title = isCaptchaError
            ? t("signUpPage.captchaFailed")
            : isResend ? t("signUpPage.resendFailed") : t("signUpPage.otpGenerationFailed");
        const description = isCaptchaError
            ? t("signUpPage.pleaseTryAgain")
            : error.message || t("signUpPage.failedToSendOtp");

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
        const validation = signupService.validateSignupForm(firstName, emailOrMobile, password, confirmPassword);

        if (!validation.isValid && validation.error) {
            toast({
                title: validation.error.title,
                description: validation.error.description,
                variant: "destructive",
            });
            return;
        }

        captchaActionRef.current = 'generateOtp';
        if (googleCaptchaSiteKey) {
            captchaRef.current?.reset();
            captchaRef.current?.execute();
        } else {
            handleOtpMutation();
        }
    };

    const handleSignupSuccess = (signupResponse: any) => {
        if (signupResponse.status !== 200) {
            toast({
                title: t("signUpPage.signupFailed"),
                description: t("signUpPage.otpButFailed"),
                variant: "destructive",
            });
            return;
        }

        telemetry.log({
            edata: {
                type: 'api',
                level: 'INFO',
                message: 'User sign-up completed',
                pageid: 'signup',
            },
        });

        setStep(3);
    };

    const handleOtpVerificationSuccess = (response: any) => {
        if (response.status !== 200) {
            toast({ title: t("signUpPage.verificationFailed"), description: t("signUpPage.invalidOtp"), variant: "destructive" });
            return;
        }

        telemetry.log({ edata: { type: 'api', level: 'INFO', message: 'OTP verified successfully', pageid: 'signup' } });

        const deviceId = localStorage.getItem('deviceId') || undefined;
        signupMutation.mutate({
            firstName, identifier: emailOrMobile, password: signupService.encodePassword(password), deviceId
        }, {
            onSuccess: handleSignupSuccess,
            onError: (error: any) => {
                toast({ title: t("signUpPage.signupFailed"), description: error.message || t("signUpPage.otpButFailed"), variant: "destructive" });
            }
        });
    };

    const handleVerifyOtp = () => {
        const request = signupService.createOtpVerificationRequest(emailOrMobile, otp);
        verifyOtpMutation.mutate({ request }, {
            onSuccess: handleOtpVerificationSuccess,
            onError: (error: any) => {
                toast({ title: t("signUpPage.verificationFailed"), description: error.message || t("signUpPage.verificationError"), variant: "destructive" });
            }
        });
    };

    const handleResendOtp = () => {
        googleCaptchaSiteKey ? captchaRef.current?.execute() : handleOtpMutation(undefined, true);
    };

    const handleProceedToLogin = () => {
        window.location.href = getSafeRedirectUrl();
    };

    const isMobileRedirect = isMobileApp();

    const handleClose = () => {
        window.location.href = isMobileRedirect ? getSafeRedirectUrl() : '/portal/login?prompt=none';
    };

    return (
        <AuthLayout hideClose={isMobileRedirect} onClose={handleClose}>
            <TelemetryTracker 
                startEventInput={{ type: 'workflow', mode: 'signup', pageid: 'signup-page' }}
                endEventInput={{ type: 'workflow', mode: 'signup', pageid: 'signup-page' }}
            />
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
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                        handleContinue={handleContinue}
                        isStep1Valid={isStep1Valid && existenceStatus === 'idle'}
                        isLoading={isLoading}
                        userExists={existenceStatus === 'exists'}
                        isCheckingUser={existenceStatus === 'checking'}
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
                        onChange={token => token && handleCaptchaResolved(token)}
                        onLoad={() => console.log('ReCAPTCHA API loaded successfully')}
                        onErrored={() => console.error('ReCAPTCHA error occurred')}
                    />
                )}
            </div>
        </AuthLayout>
    );
};

export default SignUp;
