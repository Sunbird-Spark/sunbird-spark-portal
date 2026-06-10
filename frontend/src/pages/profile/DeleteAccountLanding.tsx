import { FiAlertCircle } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import useImpression from "@/hooks/useImpression";
import sunbirdLogo from "@/assets/sunbird-logo.svg";

const DELETE_ACCOUNT_PATH = "/profile/delete";

const DeleteAccountLanding = () => {
    const { t } = useAppI18n();
    useImpression({ type: "view", pageid: "delete-account-landing", env: "profile" });

    const handleLogin = () => {
        const returnTo = encodeURIComponent(DELETE_ACCOUNT_PATH);
        window.location.href = `/portal/login?prompt=none&returnTo=${returnTo}`;
    };

    return (
        <main className="profile-main-content delete-account-main bg-white">
            <div className="delete-account-container">
                <img
                    src={sunbirdLogo}
                    alt="Sunbird"
                    className="delete-account-logo"
                />
                <div className="delete-account-page text-center">
                <div className="delete-account-icon-wrapper">
                    <span className="delete-account-icon-badge">
                        <FiAlertCircle className="delete-account-icon" aria-hidden="true" />
                    </span>
                </div>
                <h1 className="delete-account-title text-center">
                    {t("deleteAccountLanding.title")}
                </h1>
                <p className="delete-account-message">
                    {t("deleteAccountLanding.message")}
                </p>
                <button
                    type="button"
                    onClick={handleLogin}
                    className="delete-account-login-btn"
                    data-edataid="delete-account-landing-login"
                >
                    {t("deleteAccountLanding.loginCta")}
                </button>
                </div>
            </div>
        </main>
    );
};

export default DeleteAccountLanding;
