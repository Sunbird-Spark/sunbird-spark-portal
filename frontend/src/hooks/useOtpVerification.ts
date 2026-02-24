import { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import { useGenerateOtp, useVerifyOtp } from './useOtp';
import {
    OtpRequiredField,
    FieldOtpState,
    EditProfileFormData,
    FIELD_OTP_TYPE_MAP,
    OTP_REQUIRED_FIELDS,
    RESEND_COOLDOWN_SECONDS,
} from '../types/profileTypes';
import { createInitialFieldStates, validateFieldFormat } from '../utils/profileUtils';

export const useOtpVerification = (form: EditProfileFormData, isOpen: boolean) => {
    const [fieldStates, setFieldStates] = useState<Record<OtpRequiredField, FieldOtpState>>(createInitialFieldStates());
    const generateOtpMutation = useGenerateOtp();
    const verifyOtpMutation = useVerifyOtp();

    const updateFieldState = useCallback((field: OtpRequiredField, updates: Partial<FieldOtpState>) => {
        setFieldStates(prev => ({
            ...prev,
            [field]: { ...prev[field], ...updates },
        }));
    }, []);

    const initiateOtp = useCallback(async (field: OtpRequiredField, captchaResponse?: string) => {
        const state = fieldStates[field];
        if (state.status !== 'modified' && state.status !== 'error') return;

        const validationError = validateFieldFormat(field, form[field]);
        if (validationError) {
            updateFieldState(field, { status: 'error', errorMessage: validationError });
            return;
        }

        updateFieldState(field, { status: 'otp_sending', errorMessage: '' });

        try {
            await generateOtpMutation.mutateAsync({
                request: {
                    request: {
                        key: _.trim(form[field]),
                        type: FIELD_OTP_TYPE_MAP[field],
                    },
                },
                captchaResponse,
            });
            updateFieldState(field, {
                status: 'otp_sent',
                otp: '',
                resendTimer: RESEND_COOLDOWN_SECONDS,
                errorMessage: '',
            });
        } catch (err) {
            const isCaptchaError = (err as any)?.response?.status === 418;
            const message = isCaptchaError
                ? 'Captcha validation failed. Please try again.'
                : err instanceof Error ? err.message : 'Unable to generate OTP';
            updateFieldState(field, { status: 'error', errorMessage: message });
        }
    }, [fieldStates, form, updateFieldState, generateOtpMutation]);

    const setFieldOtp = useCallback((field: OtpRequiredField, value: string) => {
        updateFieldState(field, { otp: value });
    }, [updateFieldState]);

    const verifyFieldOtp = useCallback(async (field: OtpRequiredField) => {
        const state = fieldStates[field];
        if (state.status !== 'otp_sent' || state.otp.length !== 6) return;

        updateFieldState(field, { status: 'otp_verifying', errorMessage: '' });

        try {
            await verifyOtpMutation.mutateAsync({
                request: {
                    request: {
                        key: _.trim(form[field]),
                        type: FIELD_OTP_TYPE_MAP[field],
                        otp: state.otp,
                    },
                },
            });
            updateFieldState(field, {
                status: 'verified',
                otp: '',
                errorMessage: '',
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'OTP verification failed';
            updateFieldState(field, {
                status: 'otp_sent',
                otp: '',
                errorMessage: message,
            });
        }
    }, [fieldStates, form, updateFieldState, verifyOtpMutation]);

    const resendFieldOtp = useCallback(async (field: OtpRequiredField, captchaResponse?: string) => {
        const state = fieldStates[field];
        if (state.resendTimer > 0 || state.resendCount >= state.maxResendAttempts) return;

        const newResendCount = state.resendCount + 1;
        updateFieldState(field, { resendCount: newResendCount, errorMessage: '' });

        try {
            await generateOtpMutation.mutateAsync({
                request: {
                    request: {
                        key: _.trim(form[field]),
                        type: FIELD_OTP_TYPE_MAP[field],
                    },
                },
                captchaResponse,
            });
            updateFieldState(field, {
                otp: '',
                resendTimer: RESEND_COOLDOWN_SECONDS,
                errorMessage: '',
            });
        } catch (err) {
            const isCaptchaError = (err as any)?.response?.status === 418;
            const message = isCaptchaError
                ? 'Captcha validation failed. Please try again.'
                : err instanceof Error ? err.message : 'Unable to resend OTP';
            updateFieldState(field, { errorMessage: message });
        }
    }, [fieldStates, form, updateFieldState, generateOtpMutation]);

    // Single interval timer for all field resend countdowns
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setFieldStates(prev => {
                let changed = false;
                const next = { ...prev };

                _.forEach(OTP_REQUIRED_FIELDS, (field) => {
                    if (next[field].status === 'otp_sent' && next[field].resendTimer > 0) {
                        next[field] = { ...next[field], resendTimer: next[field].resendTimer - 1 };
                        changed = true;
                    }
                });

                return changed ? next : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    return {
        fieldStates,
        setFieldStates,
        updateFieldState,
        initiateOtp,
        setFieldOtp,
        verifyFieldOtp,
        resendFieldOtp
    };
};
