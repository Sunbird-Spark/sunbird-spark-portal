import React, { useState, useEffect } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';

// Module-level flag — survives component remounts caused by navigation bounces
let redirectScheduled = false;

const UnauthorizedHandler: React.FC = () => {
  const { t } = useAppI18n();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const authErrorHandler = (msg: string) => () => {
      if (redirectScheduled) return;
      redirectScheduled = true;
      setMessage(msg);
      timeoutId = setTimeout(() => { window.location.href = '/portal/logout'; }, 2500);
    };

    const handleAuthError = authErrorHandler(t('authErrorRedirectMessage'));

    window.addEventListener('unauthorized', handleAuthError);
    window.addEventListener('forbidden', handleAuthError);
    return () => {
      window.removeEventListener('unauthorized', handleAuthError);
      window.removeEventListener('forbidden', handleAuthError);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-describedby="auth-error-message"
        className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4 text-center"
      >
        <p id="auth-error-message" className="text-gray-800 font-medium" aria-live="assertive">{message}</p>
      </div>
    </div>
  );
};

export default UnauthorizedHandler;
