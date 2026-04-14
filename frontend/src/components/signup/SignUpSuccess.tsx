import React from "react";
import { FiCheck } from "react-icons/fi";
import { Header, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { useAppI18n } from "@/hooks/useAppI18n";

interface Step3Props {
    handleProceed: () => void;
}

export const SignUpSuccess = ({ handleProceed }: Step3Props) => {
    const { t } = useAppI18n();
    return (
        <div className="flex flex-col items-center">
            <Header
                title={t("signUp.congratulations")}
                subtitle={t("signUp.accountCreated")}
            />

            <div className="flex justify-center mb-10">
                <div className="success-icon-container">
                    <FiCheck className="success-icon-check" />
                </div>
            </div>

            <PrimaryButton onClick={handleProceed}>
                {t("signUp.proceedToLogin")}
            </PrimaryButton>
        </div>
    );
};
