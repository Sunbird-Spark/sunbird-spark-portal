import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Header } from './ForgotPasswordComponents';
import { getSafeRedirectUrl, isMobileApp } from '@/utils/forgotPasswordUtils';

const PasswordResetSuccess: React.FC = () => {
    const isMobileRedirect = isMobileApp();

    return (
        <AuthLayout onClose={() => { window.location.href = getSafeRedirectUrl(); }} hideClose={isMobileRedirect}>
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

                <a
                    href={getSafeRedirectUrl()}
                    className="login-primary-button w-full text-center inline-block"
                >
                    Proceed to Login
                </a>
            </div>
        </AuthLayout>
    );
};

export default PasswordResetSuccess;
