import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useUserRoles } from "@/hooks/useUser";

const AccountManagement = () => {
    const { t } = useAppI18n();
    const { data: roles, isLoading } = useUserRoles();

    if (isLoading || (roles ?? []).some((r) => r.role === "ORG_ADMIN")) {
        return null;
    }

    return (
        <section className="account-management-card">
            <div className="account-management-header">
                <div className="personal-info-title-wrapper">
                    <span className="learning-title-accent" aria-hidden="true" />
                    <h2 className="account-management-title">
                        {t("accountManagement.title")}
                    </h2>
                </div>
            </div>
            <p className="account-management-subtitle">
                {t("accountManagement.subtitle")}
            </p>

            <div className="account-management-danger-banner">
                <div className="account-management-danger-content">
                    <span className="account-management-danger-icon">
                        <FiTrash2 aria-hidden="true" />
                    </span>
                    <div>
                        <p className="account-management-danger-title">
                            {t("accountManagement.deleteTitle")}
                        </p>
                        <p className="account-management-danger-description">
                            {t("accountManagement.deleteDescription")}
                        </p>
                    </div>
                </div>
                <Link
                    to="/profile/delete"
                    className="account-management-danger-cta"
                    data-edataid="profile-delete-account-link"
                >
                    <FiTrash2 aria-hidden="true" />
                    {t("accountManagement.deleteCta")}
                </Link>
            </div>
        </section>
    );
};

export default AccountManagement;
