import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { Header, PrimaryButton } from './ForgotPasswordComponents';

interface PasswordResetSuccessProps {
    onProceedToLogin: () => void;
}

export const PasswordResetSuccess: React.FC<PasswordResetSuccessProps> = ({ onProceedToLogin }) => {
    return (
        <div className="flex flex-col items-center">
            <Header
                title="Congratulations!"
                subtitle="Your password has been successfully reset."
            />

            <div className="flex justify-center mb-10">
                <div className="success-icon w-[4.5rem] h-[4.5rem] rounded-full bg-[#2ECC71] flex items-center justify-center shadow-md">
                    <FiCheck className="text-white text-4xl" />
                </div>
            </div>

            <PrimaryButton onClick={onProceedToLogin}>
                Proceed to Login
            </PrimaryButton>
        </div>
    );
};
