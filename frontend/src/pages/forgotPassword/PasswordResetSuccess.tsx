import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Header, PrimaryButton } from './ForgotPasswordComponents';
import { getSafeRedirectUrl, isMobileApp } from '@/utils/forgotPasswordUtils';
import { useAppI18n } from '@/hooks/useAppI18n';

const PasswordResetSuccess: React.FC = () => {
    const { t } = useAppI18n();
    const isMobileRedirect = isMobileApp();

    const onProceedToLogin = () => {
        window.location.href = getSafeRedirectUrl();
    };

    return (
        <AuthLayout onClose={() => { window.location.href = getSafeRedirectUrl(); }} hideClose={isMobileRedirect}>
            <div className="flex flex-col items-center">
                <Header
                    title={t('passwordReset.congratulations', { defaultValue: 'Congratulations!' })}
                    subtitle={t('passwordReset.successMessage', { defaultValue: 'Your password has been successfully reset.' })}
                />

                <div className="flex justify-center mb-10">
                    <div className="success-icon-container">
                        <FiCheck className="success-icon-check" />
                    </div>
                </div>

                <PrimaryButton onClick={onProceedToLogin}>
                    {t('passwordReset.proceedToLogin', { defaultValue: 'Proceed to Login' })}
                </PrimaryButton>
            </div>
        </AuthLayout>
    );
};

export default PasswordResetSuccess;
