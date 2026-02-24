import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermission';
import { getDefaultRouteForRole } from '../../rbac/roleConfig';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { primaryRole } = usePermissions();

  const handleGoToLogin = () => {
    navigate('/home');
  };

  // Determine safe home page based on user's primary role
  const getSafeHomePage = (): string => {
    return getDefaultRouteForRole(primaryRole);
  };

  const handleGoHome = () => {
    navigate(getSafeHomePage());
  };

  return (
    <div>
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p>
        You do not have the required permissions to access this page.
      </p>

      <div>
        <button onClick={handleGoHome}>
          Go Home
        </button>
        <button onClick={handleGoToLogin}>
          Change Role
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
