import React from "react";
import { FiCheck } from "react-icons/fi";
import { Header, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";

interface Step3Props {
    handleProceed: () => void;
}

export const SignUpSuccess = ({ handleProceed }: Step3Props) => {
    return (
        <div className="flex flex-col items-center">
            <Header
                title="Congratulations!"
                subtitle="Your account has been successfully created."
            />

            <div className="flex justify-center mb-10">
                <div className="success-icon-container">
                    <FiCheck className="success-icon-check" />
                </div>
            </div>

            <PrimaryButton onClick={handleProceed}>
                Proceed to Login
            </PrimaryButton>
        </div>
    );
};
