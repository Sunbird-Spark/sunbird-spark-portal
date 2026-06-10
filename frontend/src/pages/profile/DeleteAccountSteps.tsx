import { FiAlertTriangle, FiArrowLeft, FiClock, FiMail, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/common/InputOTP";
import { useAppI18n } from "@/hooks/useAppI18n";
import { OTP_REGEX } from "@/utils/ValidationUtils";
import { formatTime } from "@/utils/profileUtils";
import "./deleteAccount.css";

export { CONDITION_KEYS, ConsentStep } from "./ConsentStep";

interface OtpStepProps {
    email: string | undefined;
    otp: string;
    setOtp: (v: string) => void;
    resendCounter: number;
    resendDisabled: boolean;
    submitting: boolean;
    errorMessage: string;
    onResend: () => void;
    onConfirm: () => void;
    onBack: () => void;
}

export const OtpStep = ({
    email,
    otp,
    setOtp,
    resendCounter,
    resendDisabled,
    submitting,
    errorMessage,
    onResend,
    onConfirm,
    onBack,
}: OtpStepProps) => {
    const { t } = useAppI18n();
    return (
        <div className="otp-step-root">
            <div className="delete-step-header-row">
                <span className="delete-step-header-icon">
                    <FiMail className="delete-step-header-icon-svg" aria-hidden="true" />
                </span>
                <div className="delete-step-title-block">
                    <h2 className="delete-step-title">
                        {t("deleteAccount.otpTitle")}
                    </h2>
                    <p className="delete-step-subtitle">
                        {t("deleteAccount.otpSubtitle", { email: email || "" })}
                    </p>
                </div>
            </div>

            <div className="delete-step-warning">
                <span className="delete-step-warning-icon">
                    <FiAlertTriangle className="delete-step-warning-icon-svg" aria-hidden="true" />
                </span>
                <p className="delete-step-warning-text">
                    {t("deleteAccount.warning")}
                </p>
            </div>

            <div className="otp-step-input-section">
                <p className="otp-step-input-label">
                    {t("deleteAccount.otpLabel")}
                </p>
                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                    pattern="^[0-9]*$"
                    inputMode="numeric"
                >
                    <InputOTPGroup className="otp-step-slot-group">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="otp-step-slot" />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <div className="otp-step-meta">
                <div className="otp-step-meta-timer">
                    <FiClock className="otp-step-meta-timer-icon" aria-hidden="true" />
                    <span>
                        {t("deleteAccount.codeExpires")}{" "}
                        <span className="otp-step-meta-timer-value">
                            {formatTime(resendCounter)}
                        </span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={resendDisabled}
                    className="otp-step-resend"
                >
                    {t("deleteAccount.resend")}
                </button>
            </div>

            {errorMessage && <p className="delete-step-error">{errorMessage}</p>}

            <hr className="delete-step-divider" />

            <div className="delete-step-actions">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={submitting}
                    className="delete-step-btn-outline"
                >
                    <FiArrowLeft className="delete-step-btn-icon" aria-hidden="true" />
                    {t("back")}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={!OTP_REGEX.test(otp) || submitting}
                    className="delete-step-btn-primary"
                    data-edataid="delete-account-confirm"
                >
                    <FiTrash2 className="delete-step-btn-icon" aria-hidden="true" />
                    {submitting ? t("deleteAccount.deleting") : t("deleteAccount.confirm")}
                </Button>
            </div>
        </div>
    );
};
