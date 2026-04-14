import React, { useRef, useEffect } from 'react';
import { MdOutlineClose } from "react-icons/md";
import { Dialog, DialogContent, DialogTitle } from "@/components/common/Dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/common/InputOTP";
import { useAppI18n } from '@/hooks/useAppI18n';
import {
    OtpRequiredField,
    FieldOtpState,
    FIELD_OTP_TYPE_MAP,
} from '@/types/profileTypes';

interface VerifyOtpDialogProps {
    field: OtpRequiredField;
    fieldState: FieldOtpState;
    setFieldOtp: (field: OtpRequiredField, value: string) => void;
    verifyFieldOtp: (field: OtpRequiredField) => Promise<void>;
    resendFieldOtp: (field: OtpRequiredField) => void;
    formatTime: (seconds: number) => string;
    onClose: () => void;
}

const VerifyOtpDialog: React.FC<VerifyOtpDialogProps> = ({
    field,
    fieldState,
    setFieldOtp,
    verifyFieldOtp,
    resendFieldOtp,
    formatTime,
    onClose,
}) => {
    const { t } = useAppI18n();
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    // Effect to close when verified
    useEffect(() => {
        if (fieldState.status === 'verified') {
            onClose();
        }
    }, [fieldState.status, onClose]);

    useEffect(() => {
        if (fieldState.otp.length === 6) {
            submitBtnRef.current?.focus();
        }
    }, [fieldState.otp.length]);

    return (
        <Dialog
            open={true}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent hideCloseButton className="fixed left-1/2 top-1/2 z-50 w-full max-w-[720px] h-[472px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white px-10 pb-10 pt-8 shadow-lg flex flex-col">
                <div className="relative flex items-center justify-center mb-4">
                    <DialogTitle className="text-[22px] font-medium text-[hsl(var(--sunbird-obsidian))] font-rubik text-center">
                        {t("forgotPasswordPage.enterCode")}
                    </DialogTitle>
                    <button
                        onClick={onClose}
                        className="absolute right-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                    >
                        <MdOutlineClose className="w-6 h-6 text-[hsl(var(--sunbird-brick))]" />
                    </button>
                </div>
                <p className="text-[13px] text-[hsl(var(--sunbird-gray-75))] font-rubik text-center mb-6">
                    {FIELD_OTP_TYPE_MAP[field] === 'phone'
                        ? t("editProfile.enterDigitCodePhone")
                        : t("editProfile.enterDigitCodeEmail")}
                </p>
                <p className="text-[13px] text-[hsl(var(--sunbird-gray-75))] font-rubik text-center mb-4">
                    {t("forgotPasswordPage.otpValidity")}
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                    <InputOTP
                        maxLength={6}
                        value={fieldState.otp}
                        onChange={(value) => setFieldOtp(field, value.replace(/[^0-9]/g, ''))}
                        pattern="^[0-9]*$"
                        inputMode="numeric"
                    >
                        <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className="w-[50px] h-[50px] text-[18px] font-semibold border border-[hsl(var(--sunbird-gray-d9))] rounded-[10px] font-rubik focus:border-[hsl(var(--sunbird-ginger))] focus:ring-1 focus:ring-[hsl(var(--sunbird-ginger))]"
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                {fieldState.errorMessage && (
                    <p className="text-red-500 text-[13px] font-rubik text-center -mt-2 mb-2">
                        {fieldState.errorMessage}
                    </p>
                )}
                <div className="flex items-center justify-center gap-2 mt-1 text-[13px] font-rubik mb-6">
                    <span className="text-[hsl(var(--sunbird-obsidian))] font-medium">
                        {formatTime(fieldState.resendTimer)}
                    </span>
                    <button
                        type="button"
                        onClick={() => resendFieldOtp(field)}
                        disabled={
                            fieldState.resendTimer > 0 ||
                            fieldState.resendCount >= fieldState.maxResendAttempts
                        }
                        className="text-[hsl(var(--sunbird-brick))] hover:text-[hsl(var(--sunbird-brick)/0.8)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t("forgotPasswordPage.resendOtp")}
                    </button>
                </div>
                <button
                    ref={submitBtnRef}
                    type="button"
                    onClick={async () => {
                        await verifyFieldOtp(field);
                    }}
                    disabled={
                        fieldState.otp.length !== 6 ||
                        fieldState.status === 'otp_verifying'
                    }
                    className="mt-auto w-[360px] h-[46px] mx-auto rounded-[12px] bg-[hsl(var(--sunbird-brick))] text-white text-[16px] font-medium font-rubik hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {fieldState.status === 'otp_verifying' ? t("editProfile.submitting") : t("signUp.submit")}
                </button>
            </DialogContent>
        </Dialog>
    );
};

export default VerifyOtpDialog;
