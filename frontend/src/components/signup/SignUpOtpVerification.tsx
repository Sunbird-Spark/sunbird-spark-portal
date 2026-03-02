import React, { useState, useEffect } from "react";
import { Header, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/common/InputOTP";
import { useAppI18n } from "@/hooks/useAppI18n";

interface Step2Props {
    otp: string;
    setOtp: (val: string) => void;
    isOtpValid: boolean;
    handleVerifyOtp: () => void;
    handleResendOtp: () => void;
    isLoading?: boolean;
}

export const SignUpOtpVerification = ({ otp, setOtp, isOtpValid, handleVerifyOtp, handleResendOtp, isLoading = false }: Step2Props) => {
    const { t } = useAppI18n();
    const [disableResendOtp, setDisableResendOtp] = useState(false);
    const [counter, setCounter] = useState(20);
    const [resendOtpCounter, setResendOtpCounter] = useState(1);

    const handleOtpChange = (value: string) => {
        setOtp(value.replace(/[^0-9]/g, ''));
    };

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

    const onResendClick = () => {
        setResendOtpCounter(prev => prev + 1);
        handleResendOtp();
    };

    return (
        <div className="flex flex-col h-full">
            <Header
                title={t("forgotPasswordPage.enterCode")}
                subtitle={t("signUp.enterCodeSubtitle")}
            />

            <div className="flex flex-col flex-1 justify-between h-full">
                <div className="text-center pt-2">
                    <p className="text-[0.75rem] font-medium text-sunbird-gray-75 mb-6">
                        {t("forgotPasswordPage.otpValidity")}
                    </p>

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

                    <div className="text-center text-[0.75rem] font-medium mt-8">
                        <button
                            disabled={disableResendOtp}
                            onClick={onResendClick}
                            className="resend-otp-btn"
                        >
                            {t("forgotPasswordPage.resendOtp")} {counter > 0 && `(${counter})`}
                        </button>
                    </div>
                </div>

                <div className="pb-2 mt-20">
                    <PrimaryButton
                        disabled={!isOtpValid || isLoading}
                        onClick={handleVerifyOtp}
                        className="h-[3rem]"
                    >
                        {isLoading ? t("signUp.verifying") : t("signUp.submit")}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};
