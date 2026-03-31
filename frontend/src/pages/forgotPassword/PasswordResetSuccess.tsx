import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Header, PrimaryButton } from './ForgotPasswordComponents';
import { getSafeRedirectUrl, isMobileApp } from '@/utils/forgotPasswordUtils';

const onProceedToLogin = () => {
    console.log('[PasswordResetSuccess] Proceed to Login clicked');
    console.log('[PasswordResetSuccess] Current URL:', window.location.href);
    const redirectUrl = getSafeRedirectUrl();
    console.log('[PasswordResetSuccess] Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
};

const PasswordResetSuccess: React.FC = () => {
    console.log('[PasswordResetSuccess] Component mounted');
    console.log('[PasswordResetSuccess] Current URL:', window.location.href);
    const isMobileRedirect = isMobileApp();
    console.log('[PasswordResetSuccess] isMobileApp:', isMobileRedirect);
    console.log('[PasswordResetSuccess] hideClose:', isMobileRedirect);

    return (
        <AuthLayout onClose={() => window.location.href = getSafeRedirectUrl()} hideClose={isMobileRedirect}>
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