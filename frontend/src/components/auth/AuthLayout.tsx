import React from 'react';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import sunbirdLogo from '@/assets/sunbird-logo.svg';
import { useAppI18n } from '@/hooks/useAppI18n';

interface AuthLayoutProps {
  children: React.ReactNode;
  onClose?: () => void;
  isOtpPage?: boolean;
  hideClose?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onClose, isOtpPage, hideClose }) => {
  const navigate = useNavigate();
  const { t } = useAppI18n();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-container">
        {/* Inset Left Panel */}
        <div className="login-left-panel">
          {/* The visible white frame inset */}
          <div className="login-left-panel-container"></div>
          <div className="left-panel-content">
            <h2 className="left-panel-title">
              {t("authLayout.empowerTitle")}
            </h2>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="login-card">
          {/* Close Button — hidden when opened from mobile app */}
          {!hideClose && (
            <button onClick={handleClose} className="close-button">
              <FiX className="w-6 h-6" />
            </button>
          )}

          <div className="login-inner-container">
            <div className="logo-container">
              <div className="sunbird-logo-wrapper">
                <a href="/">
                  <img
                    src={sunbirdLogo}
                    alt={t("authLayout.logoAlt")}
                    className={`logo-image ${isOtpPage ? '-translate-y-10' : ''}`}
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