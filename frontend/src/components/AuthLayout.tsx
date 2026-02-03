
import React from 'react';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import sunbirdLogo from '../assets/sunbird-logo.png';
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
      className="login-wrapper font-rubik min-h-screen w-full flex items-center justify-center relative bg-[#4A8C8C] auth-bg-wave overflow-x-hidden"
    >
      {/* Unified White Container */}
      <div
        className="login-split-container flex flex-col md:flex-row m-[0.625rem] md:m-auto bg-white rounded-[4rem] p-[0.375rem] relative z-10 shadow-2xl overflow-hidden"
        style={{ width: '1024px', height: '650px', minHeight: '650px' }}
      >

        {/* Inset Left Panel */}
        <div
          className="login-left-panel hidden md:flex flex-1 relative items-center justify-center overflow-hidden rounded-[3.5rem] auth-bg-wave"
        >
          {/* The visible white frame inset */}
          <div className="login-left-panel-container absolute inset-0 z-[3] border-0 rounded-[3.5rem] shadow-[0_0_0_2rem_rgba(255,255,255,0.05)]"></div>
          <div className="left-panel-content absolute z-[2] left-10 bottom-10 max-w-[calc(100%-5rem)]">
            <h2 className="left-panel-title !font-rubik text-[1.875rem] font-semibold text-white leading-[2.625rem]">
              Empower your future<br />
              through learning.
            </h2>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="login-card flex-[0.85] p-6 md:p-10 relative flex flex-col justify-center md:pt-8 pt-8">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="close-button absolute top-5 right-5 p-2 text-[#333333] hover:opacity-70 transition-opacity z-20"
          >
            <FiX className="w-6 h-6" />
          </button>

          <div className="mx-auto w-full max-w-sm flex flex-col justify-start">
            <div className="logo-container text-center mb-0">
              <div className="sunbird-logo mb-5">
                <a href="/">
                  <img
                    src={sunbirdLogo}
                    alt="Sunbird Logo"
                    className="h-10 w-auto mx-auto"
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
