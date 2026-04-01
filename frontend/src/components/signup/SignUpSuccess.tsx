import React from "react";
import { FiCheck } from "react-icons/fi";
import { Header } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { useAppI18n } from "@/hooks/useAppI18n";
import { getSafeRedirectUrl } from "@/utils/forgotPasswordUtils";

export const SignUpSuccess = () => {
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

            <a
                href={getSafeRedirectUrl()}
                className="primary-button w-full text-center"
            >
                {t("signUp.proceedToLogin")}
            </a>
        </div>
    );
};
