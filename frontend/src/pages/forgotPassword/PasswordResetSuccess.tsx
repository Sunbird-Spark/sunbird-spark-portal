import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Header, PrimaryButton } from './ForgotPasswordComponents';

const DEFAULT_LOGIN_URL = '/portal/login?prompt=none';

const getRedirectUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    if (redirectUri) {
        try {
            const parsed = new URL(redirectUri);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return redirectUri;
            }
        } catch (e) {
            console.warn('PasswordResetSuccess: invalid redirect_uri, ignoring', e);
        }
    }
    return DEFAULT_LOGIN_URL;
};

const onProceedToLogin = () => {
    window.location.href = getRedirectUrl();
};

const PasswordResetSuccess: React.FC = () => {
    const isMobileRedirect = !!new URLSearchParams(window.location.search).get('redirect_uri');

    return (
        <AuthLayout onClose={() => window.location.href = getRedirectUrl()} hideClose={isMobileRedirect}>
            <div className="flex flex-col items-center">
                <Header
                    title="Congratulations!"
                    subtitle="Your password has been successfully reset."
                />

                <div className="flex justify-center mb-10">
                    <div className="success-icon-container">
                        <FiCheck className="success-icon-check" />
                    </div>
                </div>

                <PrimaryButton onClick={onProceedToLogin}>
                    Proceed to Login
                </PrimaryButton>
            </div>
        </AuthLayout>
    );
};

export default PasswordResetSuccess;