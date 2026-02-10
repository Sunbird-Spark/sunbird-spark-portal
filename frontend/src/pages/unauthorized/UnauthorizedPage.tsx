import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getDefaultRouteForRole } from '../../rbac/roleConfig';

const UnauthorizedPage: React.FC = () => {
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
