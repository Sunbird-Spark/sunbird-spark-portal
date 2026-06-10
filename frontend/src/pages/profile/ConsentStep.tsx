import type { ComponentType, SVGProps } from "react";
import {
    FiAlertTriangle,
    FiDatabase,
    FiDownload,
    FiKey,
    FiMail,
    FiTrash2,
    FiUsers,
} from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { useAppI18n } from "@/hooks/useAppI18n";
import "./deleteAccount.css";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface ConsentSection {
    titleKey: string;
    Icon: IconType;
    iconClass: string;
    keys: string[];
}

const CONSENT_SECTIONS: ConsentSection[] = [
    {
        titleKey: "deleteAccount.sections.data",
        Icon: FiDatabase,
        iconClass: "bg-red-50 text-red-600",
        keys: [
            "deleteAccount.conditions.permanent",
            "deleteAccount.conditions.featureLoss",
            "deleteAccount.conditions.noRestore",
        ],
    },
    {
        titleKey: "deleteAccount.sections.access",
        Icon: FiKey,
        iconClass: "bg-amber-50 text-amber-600",
        keys: [
            "deleteAccount.conditions.ssoNoRecreate",
            "deleteAccount.conditions.contentLoss",
        ],
    },
    {
        titleKey: "deleteAccount.sections.content",
        Icon: FiUsers,
        iconClass: "bg-orange-50 text-orange-600",
        keys: ["deleteAccount.conditions.dataRetention"],
    },
    {
        titleKey: "deleteAccount.sections.proceed",
        Icon: FiDownload,
        iconClass: "bg-emerald-50 text-emerald-600",
        keys: ["deleteAccount.conditions.understand"],
    },
];

export const CONDITION_KEYS = CONSENT_SECTIONS.flatMap((s) => s.keys) as readonly string[];

interface ConsentStepProps {
    email: string | undefined;
    checkedConditions: Record<string, boolean>;
    toggleCondition: (key: string) => void;
    allConditionsAccepted: boolean;
    isSending: boolean;
    errorMessage: string;
    onSendOtp: () => void;
    onCancel: () => void;
}

export const ConsentStep = ({
    email,
    checkedConditions,
    toggleCondition,
    allConditionsAccepted,
    isSending,
    errorMessage,
    onSendOtp,
    onCancel,
}: ConsentStepProps) => {
    const { t } = useAppI18n();
    const total = CONDITION_KEYS.length;
    const acknowledged = CONDITION_KEYS.filter((k) => checkedConditions[k]).length;
    const progress = total === 0 ? 0 : Math.round((acknowledged / total) * 100);

    return (
        <div className="consent-step-root">
            <div>
                <div className="consent-step-header">
                    <div className="consent-step-header-main">
                        <span className="delete-step-header-icon">
                            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="delete-step-title-block flex-1">
                            <h1 className="delete-step-title">
                                {t("deleteAccount.title")}
                            </h1>
                            <p className="delete-step-subtitle">
                                {t("deleteAccount.subtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="consent-step-counter">
                        <p className="consent-step-counter-label">
                            {t("deleteAccount.acknowledged")}
                        </p>
                        <p className="consent-step-counter-value">
                            <span className="consent-step-counter-num">{acknowledged}</span>
                            <span className="consent-step-counter-total">/{total}</span>
                        </p>
                    </div>
                </div>
                <div
                    className="consent-step-progress"
                    role="progressbar"
                    aria-valuenow={acknowledged}
                    aria-valuemin={0}
                    aria-valuemax={total}
                >
                    <div
                        className="consent-step-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <hr className="delete-step-divider" />

            <div className="delete-step-warning">
                <span className="delete-step-warning-icon">
                    <FiAlertTriangle className="delete-step-warning-icon-svg" aria-hidden="true" />
                </span>
                <p className="delete-step-warning-text">
                    {t("deleteAccount.warning")}
                </p>
            </div>

            {CONSENT_SECTIONS.map(({ titleKey, Icon, iconClass, keys }) => (
                <section key={titleKey} className="consent-step-section">
                    <div className="consent-step-section-header">
                        <span className={`consent-step-section-icon ${iconClass}`}>
                            <Icon className="consent-step-section-icon-svg" aria-hidden="true" />
                        </span>
                        <h2 className="consent-step-section-title">
                            {t(titleKey)}
                        </h2>
                        <span className="consent-step-section-line" />
                    </div>
                    <ul className="consent-step-list">
                        {keys.map((key) => (
                            <li key={key}>
                                <label htmlFor={key} className="consent-step-list-item">
                                    <input
                                        type="checkbox"
                                        id={key}
                                        checked={!!checkedConditions[key]}
                                        onChange={() => toggleCondition(key)}
                                        className="consent-step-checkbox"
                                    />
                                    <span className="consent-step-list-text">
                                        {t(key)}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {errorMessage && <p className="delete-step-error">{errorMessage}</p>}

            <hr className="delete-step-divider" />

            <div className="consent-step-footer">
                <div className="consent-step-otp-delivery">
                    <FiMail className="consent-step-otp-delivery-icon" aria-hidden="true" />
                    <span className="consent-step-otp-delivery-text">
                        {t("deleteAccount.otpDelivery")}{" "}
                        <strong className="consent-step-otp-delivery-email">{email || "—"}</strong>
                    </span>
                </div>
                <div className="consent-step-footer-actions">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="delete-step-btn-outline"
                        data-edataid="delete-account-cancel"
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        onClick={onSendOtp}
                        disabled={!allConditionsAccepted || !email || isSending}
                        className="delete-step-btn-primary"
                        data-edataid="delete-account-send-otp"
                    >
                        <FiTrash2 className="delete-step-btn-icon" aria-hidden="true" />
                        {isSending ? t("deleteAccount.sending") : t("deleteAccount.sendOtp")}
                    </Button>
                </div>
            </div>
        </div>
    );
};
