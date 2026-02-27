import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getDefaultRouteForRole } from '../../rbac/roleConfig';
import { useAppI18n } from '@/hooks/useAppI18n';

const UnauthorizedPage: React.FC = () => {
  const { t } = useAppI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToLogin = () => {
    navigate('/home');
  };

  // Determine safe home page based on user role
  const getSafeHomePage = (): string => {
    if (!user) return '/home';
    return getDefaultRouteForRole(user.role);
  };

  const handleGoHome = () => {
    navigate(getSafeHomePage());
  };

  return (
    <div>
      <h1>{t("unauthorizedPage.code")}</h1>
      <h2>{t("unauthorizedPage.title")}</h2>
      <p>
        {t("unauthorizedPage.message")}
      </p>

      <div>
        <button onClick={handleGoHome}>
          {t("unauthorizedPage.goHome")}
        </button>
        <button onClick={handleGoToLogin}>
          {t("unauthorizedPage.changeRole")}
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
