import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRouteForRole } from '../rbac/roleConfig';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Determine safe home page based on user role
  const getSafeHomePage = (): string => {
    if (!user) return '/login';
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
        <button onClick={handleGoBack}>
          Go Back
        </button>
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
