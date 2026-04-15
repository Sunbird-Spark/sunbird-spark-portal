import React from "react";
import { Input } from "@/components/common/Input";
import { Header, InputLabel, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from "@/utils/ValidationUtils";
import { useAppI18n } from "@/hooks/useAppI18n";
import { isMobileApp, getSafeRedirectUrl } from "@/utils/forgotPasswordUtils";

interface Step1Props {
    firstName: string;
    setFirstName: (val: string) => void;
    emailOrMobile: string;
    setEmailOrMobile: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: React.SetStateAction<boolean>) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (val: React.SetStateAction<boolean>) => void;
    handleContinue: () => void;
    isStep1Valid: boolean;
    isLoading?: boolean;
    userExists?: boolean;
    isCheckingUser?: boolean;
}

export const SignUpForm = ({
    firstName, setFirstName,
    emailOrMobile, setEmailOrMobile,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    handleContinue,
    isStep1Valid,
    isLoading = false,
    userExists = false,
    isCheckingUser = false
}: Step1Props) => {
    const { t } = useAppI18n();

    const isMobile = isMobileApp();

    return (
    <>
        <Header
            title={t("signUp.welcomeTitle")}
            subtitle={t("signUp.welcomeSubtitle")}
        />

        <div className="space-y-3">
            <div className="space-y-1">
                <div className="form-group relative pb-3">
                    <InputLabel htmlFor="firstName" required>{t("signUp.firstName")}</InputLabel>
                    <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t("signUp.enterFirstName")}
                        className="login-input-field h-10 px-3"
                    />
                    {firstName && firstName.trim().length === 0 && (
                        <p className="form-error-absolute form-error-offset-8">
                            {t("signUp.firstNameRequired")}
                        </p>
                    )}
                </div>

                <div className="form-group relative pb-3">
                    <InputLabel htmlFor="emailOrMobile" required>{t("signUp.emailOrMobileLabel")}</InputLabel>
                    <Input
                        id="emailOrMobile"
                        value={emailOrMobile}
                        onChange={(e) => setEmailOrMobile(e.target.value)}
                        placeholder={t("signUp.enterEmailOrMobile")}
                        className="login-input-field h-10 px-3"
                    />
                    {emailOrMobile && !IDENTIFIER_REGEX.test(emailOrMobile) && (
                        <p className="form-error-absolute form-error-offset-8">
                            {t("signUp.invalidEmailOrMobile")}
                        </p>
                    )}
                    {userExists && IDENTIFIER_REGEX.test(emailOrMobile) && (
                        <p className="form-error-absolute form-error-offset-8">
                            {emailOrMobile.includes('@')
                                ? t("signUpPage.emailAlreadyRegistered")
                                : t("signUpPage.phoneAlreadyRegistered")}
                        </p>
                    )}
                </div>

                <div className="form-group relative pb-3">
                    <InputLabel htmlFor="password" required>{t("password")}</InputLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t("signUp.enterPassword")}
                            className="login-input-field h-10 pe-10 ps-3"
                        />
                        <button
                            aria-label={showPassword ? t("signUp.hidePassword") : t("signUp.showPassword")}
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
                        >
                            {showPassword ? (
                                <FiEyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                                <FiEye className="w-4 h-4" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    {password && !PASSWORD_REGEX.test(password) && (
                        <p className="form-error-absolute form-error-offset-4">
                            {t("signUp.passwordRequirements")}
                        </p>
                    )}
                </div>

                <div className="form-group relative pb-3">
                    <InputLabel htmlFor="confirmPassword" required>{t("signUp.confirmPassword")}</InputLabel>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("signUp.reenterPassword")}
                            className="login-input-field h-10 pe-10 ps-3"
                        />
                        <button
                            aria-label={showConfirmPassword ? t("signUp.hideConfirmPassword") : t("signUp.showConfirmPassword")}
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
                        >
                            {showConfirmPassword ? (
                                <FiEyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                                <FiEye className="w-4 h-4" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="form-error-absolute form-error-offset-2">
                            {t("signUp.passwordsDoNotMatch")}
                        </p>
                    )}
                </div>

                <PrimaryButton
                    disabled={!isStep1Valid || isLoading || isCheckingUser}
                    onClick={handleContinue}
                    className="mt-4 h-[3rem]"
                    data-edataid="signup-continue-btn"
                    data-pageid="signup"
                >
                    {isLoading ? t("signUp.creatingAccount") : t("continue")}
                </PrimaryButton>

                <div className="text-center mt-3 text-[0.75rem] text-sunbird-charcoal font-medium">
                    {t("signUp.alreadyHaveAccount")} <a href={isMobile ? getSafeRedirectUrl() : "/portal/login?prompt=none"} className="themed-link no-underline hover:underline">{t("login")}</a>
                </div>
            </div>
        </div>
    </>
    );
};
