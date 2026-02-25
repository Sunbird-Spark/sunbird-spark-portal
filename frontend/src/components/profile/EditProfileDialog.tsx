import React, { useState } from 'react';
import { FiCheck } from "react-icons/fi";
import { MdOutlineClose } from "react-icons/md";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/common/Dialog";
import VerifyOtpDialog from './VerifyOtpDialog';
import {
    OtpRequiredField,
    EditableField,
    FieldOtpState,
    EditProfileFormData,
    FIELD_OTP_TYPE_MAP,
} from '@/types/profileTypes';
import { PHONE_REGEX, EMAIL_REGEX } from '@/utils/profileUtils';

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    form: EditProfileFormData;
    updateField: (field: EditableField, value: string) => void;
    fieldStates: Record<OtpRequiredField, FieldOtpState>;
    initiateOtp: (field: OtpRequiredField, captchaResponse?: string) => Promise<void>;
    setFieldOtp: (field: OtpRequiredField, value: string) => void;
    verifyFieldOtp: (field: OtpRequiredField) => Promise<void>;
    resendFieldOtp: (field: OtpRequiredField, captchaResponse?: string) => Promise<void>;
    canSave: boolean;
    isSaving: boolean;
    handleSave: () => void;
    formatTime: (seconds: number) => string;
    triggerCaptcha: (callback: (token?: string) => void) => void;
}



const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
    isOpen,
    onClose,
    form,
    updateField,
    fieldStates,
    initiateOtp,
    setFieldOtp,
    verifyFieldOtp,
    resendFieldOtp,
    canSave,
    isSaving,
    handleSave,
    formatTime,
    triggerCaptcha,
}) => {
    const [activeOtpField, setActiveOtpField] = useState<OtpRequiredField | null>(null);

    const handleValidateClick = (field: OtpRequiredField) => {
        triggerCaptcha((token) => {
            setActiveOtpField(field);
            initiateOtp(field, token);
        });
    };

    const handleResendWithCaptcha = (field: OtpRequiredField) => {
        triggerCaptcha((token) => {
            resendFieldOtp(field, token);
        });
    };

    const renderOtpField = (
        field: OtpRequiredField,
        label: string,
        placeholder: string
    ) => {
        const state = fieldStates[field];
        const showValidateBtn = state.status === 'modified' || state.status === 'error';
        const showVerified = state.status === 'verified';
        const isInputDisabled = state.status === 'otp_sent' || state.status === 'otp_verifying' ||
            state.status === 'verified' || state.status === 'otp_sending';
        const otpType = FIELD_OTP_TYPE_MAP[field];

        return (
            <div key={field}>
                <label className="block text-[14px] text-[hsl(var(--sunbird-gray-75))] font-['Rubik'] mb-2">
                    {label}
                </label>
                <div className="flex items-center gap-2">
                    <input
                        value={form[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        disabled={isInputDisabled}
                        placeholder={placeholder}
                        className={`flex-1 border ${state.status === 'error' ? 'border-red-500' : 'border-[hsl(var(--sunbird-gray-d9))]'} rounded-[10px] h-[44px] px-4 text-[15px] font-medium text-[hsl(var(--sunbird-obsidian))] font-['Rubik'] outline-none focus:border-[hsl(var(--sunbird-ginger))] placeholder:text-[hsl(var(--sunbird-gray-b2))] disabled:bg-[hsl(var(--sunbird-gray-f3))] disabled:text-[hsl(var(--sunbird-gray-75))]`}
                    />
                    {state.status === 'otp_sending' && (
                        <span className="text-[hsl(var(--sunbird-brick))] text-[14px] font-medium font-['Rubik'] whitespace-nowrap">
                            Sending...
                        </span>
                    )}
                    {showValidateBtn && (
                        <button
                            type="button"
                            onClick={() => handleValidateClick(field)}
                            disabled={(() => {
                                const val = (form[field] || '').trim();
                                if (otpType === 'phone') return !PHONE_REGEX.test(val);
                                if (otpType === 'email') return !EMAIL_REGEX.test(val);
                                return !val;
                            })()}
                            className="text-[hsl(var(--sunbird-brick))] text-[14px] font-medium font-['Rubik'] whitespace-nowrap hover:text-[hsl(var(--sunbird-brick)/0.8)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Validate
                        </button>
                    )}
                    {showVerified && (
                        <span className="text-green-600 text-[14px] font-medium font-['Rubik'] flex items-center gap-1 whitespace-nowrap">
                            <FiCheck className="w-4 h-4" /> Verified
                        </span>
                    )}
                </div>

                {/* Validation error message (outside OTP section) */}
                {state.status === 'error' && state.errorMessage && (
                    <p className="text-red-500 text-[13px] font-['Rubik'] mt-1">{state.errorMessage}</p>
                )}
            </div>
        );
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent
                    hideCloseButton
                    className="fixed left-1/2 top-1/2 z-50 w-full max-w-[720px] h-[472px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white border-none px-10 pb-10 pt-8 shadow-lg flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <DialogTitle className="text-[22px] font-medium text-[hsl(var(--sunbird-obsidian))] font-['Rubik']">
                            Edit Personal Information
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Update your name, mobile number, email, and alternate email.
                        </DialogDescription>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                        >
                            <MdOutlineClose className="w-6 h-6 text-[hsl(var(--sunbird-brick))]" />
                        </button>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        {/* Row 1: Full Name and Mobile Number */}
                        <div>
                            <label className="block text-[13px] text-[hsl(var(--sunbird-gray-75))] font-['Rubik'] mb-2">
                                Full Name
                            </label>
                            <input
                                value={form.fullName}
                                onChange={(e) => updateField('fullName', e.target.value)}
                                className="w-full border border-[hsl(var(--sunbird-gray-d9))] rounded-[10px] h-[44px] px-4 text-[15px] font-medium text-[hsl(var(--sunbird-obsidian))] font-['Rubik'] outline-none focus:border-[hsl(var(--sunbird-ginger))] placeholder:text-[hsl(var(--sunbird-gray-b2))]"
                            />
                        </div>

                        {renderOtpField('mobileNumber', 'Mobile Number', 'Enter Mobile Number')}

                        {/* Row 2: Email ID and Alternate Email ID */}
                        {renderOtpField('emailId', 'Email ID', 'Enter Email ID')}
                        {renderOtpField('alternateEmail', 'Alternate Email ID', 'Enter Alternate Email ID')}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-auto">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!canSave || isSaving}
                            className="w-[210px] h-[46px] rounded-[10px] bg-[hsl(var(--sunbird-brick))] text-white text-[16px] font-medium font-['Rubik'] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {activeOtpField && (
                <VerifyOtpDialog
                    field={activeOtpField as OtpRequiredField}
                    fieldState={fieldStates[activeOtpField as OtpRequiredField]}
                    setFieldOtp={setFieldOtp}
                    verifyFieldOtp={verifyFieldOtp}
                    resendFieldOtp={handleResendWithCaptcha}
                    formatTime={formatTime}
                    onClose={() => setActiveOtpField(null)}
                />
            )}
        </>
    );
};

export default EditProfileDialog;
