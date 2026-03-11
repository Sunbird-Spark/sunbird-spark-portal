import React, { useState, useEffect } from 'react';

// Module-level flag — survives component remounts caused by navigation bounces
let redirectScheduled = false;

const UnauthorizedHandler: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const authErrorHandler = (msg: string) => () => {
      if (redirectScheduled) return;
      redirectScheduled = true;
      setMessage(msg);
      timeoutId = setTimeout(() => { window.location.href = '/portal/logout?redirect=login'; }, 2500);
    };

    const handleAuthError = authErrorHandler("You don't have access to perform this action. Redirecting to login.");

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
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4 text-center">
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default UnauthorizedHandler;
