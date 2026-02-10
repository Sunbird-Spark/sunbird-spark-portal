import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Header, PrimaryButton, OTPInput } from './ForgotPasswordComponents';
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
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [otpError, setOtpError] = useState('');
    const [loading, setLoading] = useState(false);
    const [disableResendOtp, setDisableResendOtp] = useState(false);
    const [counter, setCounter] = useState(20);
    const [resendOtpCounter, setResendOtpCounter] = useState(1);
    const maxResendTry = 4;
    const captchaRef = React.useRef<ReCAPTCHA>(null);

    const isOtpValid = OTP_REGEX.test(otp.join(''));

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
                        otp: otp.join(''),
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

            throw new Error('Reset password failed');
        } catch (err: any) {
            const remaining = err?.response?.data?.result?.remainingAttempt;

            if (remaining === 0) {
                const redirected = redirectWithError('You have exceeded maximum retry. Please login again.');
                if (!redirected) {
                    setLoading(false);
                }
            } else {
                if (remaining) {
                    setOtpError(`Invalid OTP. You have ${remaining} attempt(s) remaining.`);
                } else {
                    setOtpError('Invalid OTP. Please try again.');
                }
                setLoading(false);
            }

            setOtp(new Array(6).fill(''));
        }
    };

    const handleResendOtp = () => {
        if (resendOtpCounter >= maxResendTry) {
            setOtpError('OTP resend maximum retry reached.');
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
                const redirected = redirectWithError(error?.response?.data?.params?.errmsg || 'Too many requests. Please try again later.');
                if (!redirected) {
                    setDisableResendOtp(false);
                }
                return;
            }

            setOtpError('Resend OTP failed. Please try again.');
            setDisableResendOtp(false);
        }
    };

    return (
        <>
            <Header
                title="Enter the code"
                subtitle="Enter the 6 digit code sent to your email/phone number and complete the verification"
            />

            <div className="space-y-5">
                <div className="space-y-6">
                    <p className="otp-validity-info">
                        OTP is valid for 30 minutes
                    </p>

                    <OTPInput otp={otp} setOtp={setOtp} />

                    <div className="resend-otp-container text-center text-[0.875rem] font-medium text-[#4A5568] mt-6">
                        <button
                            disabled={disableResendOtp}
                            onClick={handleResendOtp}
                            className="resend-otp-btn"
                        >
                            Resend OTP {counter > 0 && `(${counter})`}
                        </button>
                    </div>
                </div>

                <PrimaryButton
                    disabled={!isOtpValid || loading}
                    onClick={handleVerifyOtp}
                    loading={loading}
                >
                    Submit OTP
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
