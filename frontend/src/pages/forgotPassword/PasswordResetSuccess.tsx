import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { Header, PrimaryButton } from './ForgotPasswordComponents';

const onProceedToLogin = () => {
    window.location.href = '/home';
}

const PasswordResetSuccess: React.FC = () => {
    return (
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
    );
};

export default PasswordResetSuccess;