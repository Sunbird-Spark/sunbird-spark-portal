
import React from 'react';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import sunbirdLogo from '../assets/sunbird-logo.svg';
interface AuthLayoutProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="auth-wrapper"
    >
      {/* Unified White Container */}
      <div
        className="login-split-container"
      >

        {/* Inset Left Panel */}
        <div
          className="auth-left-panel"
        >
          {/* The visible white frame inset */}
          <div className="auth-left-panel-frame"></div>
          <div className="auth-left-panel-content">
            <h2 className="auth-left-panel-title">
              Empower your future<br />
              through learning.
            </h2>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="auth-right-panel">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="auth-close-btn"
          >
            <FiX className="w-6 h-6" />
          </button>

          <div className="auth-content-wrapper">
            <div className="auth-logo-container">
              <div className="auth-logo-wrapper">
                <a href="/">
                  <img
                    src={sunbirdLogo}
                    alt="Sunbird Logo"
                    className="auth-logo-img"
                  />
                </a>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export { AuthLayout };
