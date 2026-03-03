import React, { useState, useEffect } from "react";
import { Header, PrimaryButton, OTPInput } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { useAppI18n } from "@/hooks/useAppI18n";

interface Step2Props {
    otp: string[];
    setOtp: (val: string[]) => void;
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

                    <OTPInput otp={otp} setOtp={setOtp} />

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
                        data-edataid="signup-verify-otp-btn"
                        data-pageid="signup"
                    >
                        {isLoading ? t("signUp.verifying") : t("signUp.submit")}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};
