import React from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Checkbox } from "@/components/common/CheckBox";
import { Header, InputLabel, PrimaryButton } from "../../pages/forgotPassword/ForgotPasswordComponents";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IDENTIFIER_REGEX, PASSWORD_REGEX } from "@/utils/ValidationUtils";
import { TermsAndConditionsDialog } from "@/components/termsAndCondition/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useGetTncUrl } from "@/hooks/useTnc";
import { useAppI18n } from "@/hooks/useAppI18n";

interface Step1Props {
    firstName: string;
    setFirstName: (val: string) => void;
    emailOrMobile: string;
    setEmailOrMobile: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    isTermsAccepted: boolean;
    setIsTermsAccepted: (val: boolean) => void;
    showPassword: boolean;
    setShowPassword: (val: React.SetStateAction<boolean>) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (val: React.SetStateAction<boolean>) => void;
    handleContinue: () => void;
    isStep1Valid: boolean;
    isLoading?: boolean;
}

export const SignUpForm = ({
    firstName, setFirstName,
    emailOrMobile, setEmailOrMobile,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isTermsAccepted, setIsTermsAccepted,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    handleContinue,
    isStep1Valid,
    isLoading = false
}: Step1Props) => {
    const { t } = useAppI18n();
    const { data: tncConfig, isSuccess: isTncConfigSuccess } = useSystemSetting('tncConfig');
    const { data: termsUrl } = useGetTncUrl(isTncConfigSuccess ? tncConfig : null);

    return (
    <>
        <Header
            title={t("signUp.welcomeTitle")}
            subtitle={t("signUp.welcomeSubtitle")}
        />

        <div className="space-y-3">
            <Button
                variant="outline"
                className="secondary-outline-button"
                onClick={() => { window.location.href = "/google/auth" }}
            >
                <FcGoogle className="w-5 h-5" />
                {t("signUp.signInWithGoogle")}
            </Button>

            <div className="form-divider-container">
                <div className="form-divider-line"></div>
                <span className="form-divider-text">{t("signUp.or")}</span>
                <div className="form-divider-line"></div>
            </div>

            <div className="space-y-3">
                <div className="form-group relative pb-4">
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

                <div className="form-group relative pb-4">
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
                </div>

                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="password" required>{t("password")}</InputLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t("signUp.enterPassword")}
                            className="login-input-field h-10 pr-10 px-3"
                        />
                        <button
                            aria-label={showPassword ? t("signUp.hidePassword") : t("signUp.showPassword")}
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
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

                <div className="form-group relative pb-4">
                    <InputLabel htmlFor="confirmPassword" required>{t("signUp.confirmPassword")}</InputLabel>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("signUp.reenterPassword")}
                            className="login-input-field h-10 pr-10 px-3"
                        />
                        <button
                            aria-label={showConfirmPassword ? t("signUp.hideConfirmPassword") : t("signUp.showConfirmPassword")}
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-gray-75 hover:text-sunbird-charcoal p-1"
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

                <div className="flex items-center space-x-2 mt-1">
                    <Checkbox
                        id="terms"
                        checked={isTermsAccepted}
                        onCheckedChange={(checked) => setIsTermsAccepted(checked === true)}
                        className="themed-checkbox"
                    />
                    <div className="text-[0.75rem] font-medium leading-none text-sunbird-charcoal">
                        <label htmlFor="terms" className="cursor-pointer">
                            {t("signUp.iUnderstand")}{' '}
                        </label>
                        {termsUrl ? (
                            <TermsAndConditionsDialog
                                termsUrl={termsUrl}
                                title={t("signUp.termsTitle")}
                            >
                                <button
                                    type="button"
                                    className="themed-link inline"
                                >
                                   {t("signUp.acceptTermsOfUse")}
                                </button>
                            </TermsAndConditionsDialog>
                        ) : (
                            <span className="themed-link inline">
                                {t("signUp.acceptTermsOfUse")}
                            </span>
                        )}.
                    </div>
                </div>

                <PrimaryButton
                    disabled={!isStep1Valid || isLoading}
                    onClick={handleContinue}
                    className="mt-4 h-[3rem]"
                >
                    {isLoading ? t("signUp.creatingAccount") : t("continue")}
                </PrimaryButton>

                <div className="text-center mt-3 text-[0.75rem] text-sunbird-charcoal font-medium">
                    {t("signUp.alreadyHaveAccount")} <a href="/login" className="themed-link no-underline hover:underline">{t("login")}</a>
                </div>
            </div>
        </div>
    </>
    );
};
