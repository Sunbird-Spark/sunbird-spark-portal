import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Header, PrimaryButton } from './ForgotPasswordComponents';
import { OtpIdentifier } from '../../types/forgotPasswordTypes';
import { maskIdentifier } from '@/utils/ValidationUtils';
import { redirectWithError } from '../../utils/forgotPasswordUtils';

interface SelectOTPDeliveryProps {
    validIdentifiers: OtpIdentifier[];
    googleCaptchaSiteKey: string;
    generateOtp: (payload: any) => Promise<any>;
    onSuccess: (identifier: OtpIdentifier) => void;
}

export const SelectOTPDelivery: React.FC<SelectOTPDeliveryProps> = ({
    validIdentifiers,
    googleCaptchaSiteKey,
    generateOtp,
    onSuccess
}) => {
    const { t } = useAppI18n();
    const [selectedIdentifier, setSelectedIdentifier] = useState<OtpIdentifier | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const captchaRef = React.useRef<ReCAPTCHA>(null);

    const handleSubmit = () => {
        if (googleCaptchaSiteKey) {
            captchaRef.current?.execute();
        } else {
            handleGenerateOtp();
        }
    };

    const handleGenerateOtp = async (captchaResponse?: string) => {
        if (!selectedIdentifier) return;

        try {
            setLoading(true);

            const res = await generateOtp({
                request: {
                    request: {
                        type: selectedIdentifier.type,
                        key: selectedIdentifier.value,
                        userId: selectedIdentifier.id,
                        templateId: "resetPasswordWithOtp"
                    }
                },
                captchaResponse: captchaResponse || ''
            });

            if (res.status !== 200) {
                throw new Error('Generate OTP failed');
            }

            onSuccess(selectedIdentifier);
        } catch (error: any) {
            captchaRef.current?.reset();

            if (error?.response?.status === 429) {
                const redirected = redirectWithError(error?.response?.data?.params?.errmsg || t('forgotPasswordPage.errorTooManyRequests'));
                if (!redirected) {
                    setLoading(false);
                }
                return;
            }

            const newErrorCount = errorCount + 1;
            setErrorCount(newErrorCount);

            if (newErrorCount >= 2) {
                const redirected = redirectWithError(t('forgotPasswordPage.errorGenerateOtp'));
                if (!redirected) {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <Header
                title={t('forgotPasswordTitle')}
                subtitle={t('forgotPasswordPage.otpInstruction')}
            />

            <div className="space-y-5">
                <p className="delivery-prompt">
                    {t('forgotPasswordPage.deliveryPrompt')}
                </p>
                {validIdentifiers.map(identifier => (
                    <div
                        key={`${identifier.type}-${identifier.value}`}
                        className={`delivery-option ${selectedIdentifier?.value === identifier.value ? 'delivery-option-selected' : ''}`}
                        onClick={() => setSelectedIdentifier(identifier)}
                    >
                        <input
                            type="radio"
                            checked={selectedIdentifier?.value === identifier.value}
                            readOnly
                            className="delivery-radio"
                        />
                        <span className="delivery-text">{maskIdentifier(identifier.value)}</span>
                    </div>
                ))}

                <PrimaryButton
                    disabled={!selectedIdentifier || loading}
                    onClick={handleSubmit}
                    loading={loading}
                >
                    {t('forgotPasswordPage.getOtp')}
                </PrimaryButton>

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={token => token && handleGenerateOtp(token)}
                    />
                )}
            </div>
        </>
    );
};
