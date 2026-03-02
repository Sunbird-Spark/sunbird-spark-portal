import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Header, PrimaryButton } from './ForgotPasswordComponents';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/common/InputOTP';
import { OTP_REGEX } from '@/utils/ValidationUtils';
import { OtpIdentifier } from '../../types/forgotPasswordTypes';
import { redirectWithError } from '../../utils/forgotPasswordUtils';

interface VerifyOTPProps {
    selectedIdentifier: OtpIdentifier;
    googleCaptchaSiteKey: string;
    verifyOtp: (payload: any) => Promise<any>;
    resetPassword: (payload: any) => Promise<any>;
    generateOtp: (payload: any) => Promise<any>;
}

export const VerifyOTP: React.FC<VerifyOTPProps> = ({
    selectedIdentifier,
    googleCaptchaSiteKey,
    verifyOtp,
    resetPassword,
    generateOtp
}) => {
    const { t } = useAppI18n();
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [loading, setLoading] = useState(false);
    const [disableResendOtp, setDisableResendOtp] = useState(false);
    const [counter, setCounter] = useState(20);
    const [resendOtpCounter, setResendOtpCounter] = useState(1);
    const maxResendTry = 4;
    const captchaRef = React.useRef<ReCAPTCHA>(null);

    const handleOtpChange = (value: string) => {
        setOtp(value.replace(/[^0-9]/g, ''));
    };

    const isOtpValid = OTP_REGEX.test(otp);

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

    const handleVerifyOtp = async () => {
        setLoading(true);
        setOtpError('');

        try {
            const verifyRes = await verifyOtp({
                request: {
                    request: {
                        type: selectedIdentifier.type,
                        key: selectedIdentifier.value,
                        otp: otp,
                        userId: selectedIdentifier.id
                    }
                }
            });

            const resetRes = await resetPassword({
                request: {
                    request: {
                        type: selectedIdentifier.type,
                        key: selectedIdentifier.value,
                        userId: selectedIdentifier.id,
                        reqData: verifyRes?.data?.result?.reqData
                    }
                }
            });

            if (resetRes?.data?.link) {
                window.location.href = resetRes.data.link;
                return;
            }

            throw new Error(t('forgotPasswordPage.errorResetFailed'));
        } catch (err: any) {
            const remaining = err?.response?.data?.result?.remainingAttempt;

            if (remaining === 0) {
                const redirected = redirectWithError(t('forgotPasswordPage.errorMaxRetryLogin'));
                if (!redirected) {
                    setLoading(false);
                }
            } else {
                if (remaining) {
                    setOtpError(t('forgotPasswordPage.errorInvalidOtpRemaining', { remaining }));
                } else {
                    setOtpError(t('forgotPasswordPage.errorInvalidOtp'));
                }
                setLoading(false);
            }

            setOtp('');
        }
    };

    const handleResendOtp = () => {
        if (resendOtpCounter >= maxResendTry) {
            setOtpError(t('forgotPasswordPage.errorResendMaxReached'));
            return;
        }

        if (googleCaptchaSiteKey) {
            captchaRef.current?.execute();
        } else {
            executeResendOtp();
        }
    };

    const executeResendOtp = async (captchaResponse?: string) => {
        setDisableResendOtp(true);

        try {
            await generateOtp({
                request: {
                    request: {
                        type: selectedIdentifier.type,
                        key: selectedIdentifier.value,
                        userId: selectedIdentifier.id,
                        templateId: 'resetPasswordWithOtp'
                    }
                },
                captchaResponse: captchaResponse || ''
            });

            setResendOtpCounter(prev => prev + 1);
        } catch (error: any) {
            captchaRef.current?.reset();

            if (error?.response?.status === 429) {
                const redirected = redirectWithError(error?.response?.data?.params?.errmsg || t('forgotPasswordPage.errorTooManyRequests'));
                if (!redirected) {
                    setDisableResendOtp(false);
                }
                return;
            }

            setOtpError(t('forgotPasswordPage.errorResendFailed'));
            setDisableResendOtp(false);
        }
    };

    return (
        <>
            <Header
                title={t('forgotPasswordPage.enterCode')}
                subtitle={t('forgotPasswordPage.otpSentInstruction')}
            />

            <div className="space-y-5">
                <div className="space-y-6">
                    <p className="otp-validity-info">
                        {t('forgotPasswordPage.otpValidity')}
                    </p>

                    <div className="input-otp-container">
                        <InputOTP
                            value={otp}
                            onChange={handleOtpChange}
                            maxLength={6}
                            inputMode="numeric"
                            pattern="^[0-9]*$"
                            containerClassName="otp-input-container"
                        >
                            <InputOTPGroup className="gap-3">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot key={i} index={i} className="otp-input" />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <div className="resend-otp-container text-center text-[0.875rem] font-medium text-[#4A5568] mt-6">
                        <button
                            disabled={disableResendOtp}
                            onClick={handleResendOtp}
                            className="resend-otp-btn"
                        >
                            {t('forgotPasswordPage.resendOtp')} {counter > 0 && `(${counter})`}
                        </button>
                    </div>
                </div>

                <PrimaryButton
                    disabled={!isOtpValid || loading}
                    onClick={handleVerifyOtp}
                    loading={loading}
                >
                    {t('forgotPasswordPage.submitOtp')}
                </PrimaryButton>

                {otpError && (
                    <p className="text-red-600 text-sm text-center mt-2">
                        {otpError}
                    </p>
                )}

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={token => token && executeResendOtp(token)}
                    />
                )}
            </div>
        </>
    );
};
