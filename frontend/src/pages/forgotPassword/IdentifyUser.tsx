import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Input } from '@/components/common/Input';
import { Header, InputLabel, PrimaryButton } from './ForgotPasswordComponents';
import { IdentifierStatus, OtpIdentifier } from '../../types/forgotPasswordTypes';
import { IDENTIFIER_REGEX } from '@/utils/ValidationUtils';
import { buildValidIdentifiers, redirectWithError } from '../../utils/forgotPasswordUtils';

interface IdentifyUserProps {
    googleCaptchaSiteKey: string;
    searchUser: (params: { identifier: string; name: string; captchaResponse?: string }) => Promise<any>;
    onSuccess: (identifiers: OtpIdentifier[]) => void;
}

export const IdentifyUser: React.FC<IdentifyUserProps> = ({
    googleCaptchaSiteKey,
    searchUser,
    onSuccess
}) => {
    const { t } = useAppI18n();
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
            const response = await searchUser({ identifier, name, captchaResponse });
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
            captchaRef.current?.reset();

            if (error?.response?.status === 418) {
                setIdentifierStatus('VALIDATING_FAILED');
            } else {
                setIdentifierStatus('NOT_MATCHED');
            }

            const newErrorCount = errorCount + 1;
            setErrorCount(newErrorCount);

            if (newErrorCount >= 2) {
                const redirected = redirectWithError(t('forgotPasswordPage.errorMaxRetry'));
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
                title={t('forgotPassword')}
                subtitle={t('forgotPasswordPage.subtitle')}
            />

            <div className="space-y-5">
                <div className="form-group mb-5">
                    <InputLabel required>{t('forgotPasswordPage.emailOrMobile')}</InputLabel>
                    <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={t('forgotPasswordPage.enterEmailOrMobile')}
                        className="login-input-field"
                    />
                    <p className="login-form-instruction">
                        {t('forgotPasswordPage.emailOrMobileInstruction')}
                    </p>
                </div>

                <div className="form-group mb-5">
                    <InputLabel required>{t('forgotPasswordPage.nameRegistered')}</InputLabel>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('forgotPasswordPage.enterName')}
                        className="login-input-field"
                    />
                    {identifierStatus && (
                        <p className="login-error-message">
                            {identifierStatus === 'NOT_MATCHED' && t('forgotPasswordPage.errorNotMatched')}
                            {identifierStatus === 'MATCHED' && t('forgotPasswordPage.errorNameNotMatched')}
                            {identifierStatus === 'VALIDATING_FAILED' && t('forgotPasswordPage.errorCaptcha')}
                        </p>
                    )}
                </div>

                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!isRecoverValid}
                    loading={loading}
                    className="mt-8"
                >
                    {t('continue')}
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
