import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Input } from '@/components/input';
import { Header, InputLabel, PrimaryButton } from './ForgotPasswordComponents';
import { IdentifierStatus, OtpIdentifier } from './forgotPasswordTypes';
import { IDENTIFIER_REGEX } from '@/lib/auth-utils';
import { buildValidIdentifiers, redirectWithError } from './forgotPasswordUtils';

interface IdentifyUserProps {
    googleCaptchaSiteKey: string;
    searchUser: (payload: any) => Promise<any>;
    onSuccess: (identifiers: OtpIdentifier[]) => void;
}

export const IdentifyUser: React.FC<IdentifyUserProps> = ({
    googleCaptchaSiteKey,
    searchUser,
    onSuccess
}) => {
    const [identifier, setIdentifier] = useState('');
    const [name, setName] = useState('');
    const [identifierStatus, setIdentifierStatus] = useState<IdentifierStatus>('');
    const [loading, setLoading] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const captchaRef = React.useRef<ReCAPTCHA>(null);

    const isRecoverValid = IDENTIFIER_REGEX.test(identifier.trim()) && name.trim().length > 0;

    const handleSubmit = () => {
        setIdentifierStatus('');
        if (googleCaptchaSiteKey) {
            captchaRef.current?.execute();
        } else {
            initiateFuzzySearch();
        }
    };

    const initiateFuzzySearch = async (captchaResponse?: string) => {
        setLoading(true);
        try {
            const isPhone = /^[6-9]\d{9}$/.test(identifier.trim());

            const payload: any = {
                request: {
                    filters: {
                        isDeleted: 'false',
                        fuzzy: { firstName: name.trim() },
                        $or: {},
                    },
                },
            };

            if (isPhone) {
                payload.request.filters.$or = {
                    phone: identifier.trim(),
                    prevUsedPhone: identifier.trim(),
                };
            } else {
                payload.request.filters.$or = {
                    email: identifier.trim(),
                    prevUsedEmail: identifier.trim(),
                };
            }

            const response = await searchUser({ request: payload, captchaResponse });
            const users = response?.data?.response?.content || [];
            const identifiers = buildValidIdentifiers(users);

            if (response.status === 418) {
                setIdentifierStatus('VALIDATING_FAILED');
                captchaRef.current?.reset();
                return;
            }

            if (!identifiers.length) {
                setIdentifierStatus('NOT_MATCHED');
                captchaRef.current?.reset();
                return;
            }

            onSuccess(identifiers);
        } catch (error: any) {
            setErrorCount(prev => prev + 1);
            if (error?.response?.status === 418) {
                setIdentifierStatus('VALIDATING_FAILED');
            } else {
                setIdentifierStatus('NOT_MATCHED');
            }
            if (errorCount + 1 >= 2) {
                redirectWithError('You have exceeded maximum retry. Please try after some time');
            }
            captchaRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header
                title="Forgot Password?"
                subtitle="Don't worry! Share your details and we will send you a code to reset your password."
            />

            <div className="space-y-5">
                <div className="form-group mb-5">
                    <InputLabel required>Email ID / Mobile Number</InputLabel>
                    <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter Email ID / Mobile Number"
                        className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                    />
                    <p className="text-[0.75rem] text-[#757575] mt-1">
                        Email (e.g. user@example.com) or Mobile Number (10 digits starting with 6-9)
                    </p>
                </div>

                <div className="form-group mb-5">
                    <InputLabel required>Name (as registered)</InputLabel>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter name"
                        className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                    />
                    {identifierStatus && (
                        <p className="text-red-600 text-sm mt-2">
                            {identifierStatus === 'NOT_MATCHED' && 'Email / mobile number or name does not match'}
                            {identifierStatus === 'MATCHED' && 'Name does not match our records'}
                            {identifierStatus === 'VALIDATING_FAILED' && 'Captcha validation failed'}
                        </p>
                    )}
                </div>

                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!isRecoverValid}
                    loading={loading}
                    className="mt-8"
                >
                    Continue
                </PrimaryButton>

                {googleCaptchaSiteKey && (
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={googleCaptchaSiteKey}
                        size="invisible"
                        onChange={token => token && initiateFuzzySearch(token)}
                    />
                )}
            </div>
        </>
    );
};
