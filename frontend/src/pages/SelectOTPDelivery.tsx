import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Header, PrimaryButton } from './ForgotPasswordComponents';
import { OtpIdentifier } from './forgotPasswordTypes';
import { maskIdentifier } from '@/lib/auth-utils';
import { redirectWithError } from './forgotPasswordUtils';

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
            if (error?.response?.status === 429) {
                redirectWithError(error?.response?.data?.params?.errmsg || 'Too many requests. Please try again later.');
                return;
            }

            setErrorCount(prev => prev + 1);
            if (errorCount + 1 >= 2) {
                redirectWithError('Generate OTP failed. Please try again later');
            }
            captchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header
                title="Forgot Password"
                subtitle="You will receive an OTP. After you validate it, you can recover your account."
            />

            <div className="space-y-5">
                <p className="text-[0.875rem] font-medium text-center text-[#222222]">
                    Where would you like to receive the OTP?
                </p>
                {validIdentifiers.map(identifier => (
                    <div
                        key={`${identifier.type}-${identifier.value}`}
                        className={`flex items-center gap-3 p-4 border rounded-[0.625rem] cursor-pointer
              ${selectedIdentifier?.value === identifier.value
                                ? 'border-[#A85236] bg-[#FFF5F2] shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236]'
                                : 'border-[#828282] bg-[#ffffff]'}`}
                        onClick={() => setSelectedIdentifier(identifier)}
                    >
                        <input
                            type="radio"
                            checked={selectedIdentifier?.value === identifier.value}
                            readOnly
                            className="w-4 h-4 accent-[#A85236]"
                        />
                        <span className="text-[0.875rem] font-medium text-[#4A5568]">{maskIdentifier(identifier.value)}</span>
                    </div>
                ))}

                <PrimaryButton
                    disabled={!selectedIdentifier || loading}
                    onClick={handleSubmit}
                    loading={loading}
                >
                    Get OTP
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
