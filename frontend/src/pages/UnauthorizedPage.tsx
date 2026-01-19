import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/workspace');
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
          Go to Workspace
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
