import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import AppRoutes from './AppRoutes';
import PageLoader from '@/components/common/PageLoader';
import { portalInitializer } from './utils/portalInitializer';

const queryClient = new QueryClient();

export default function App() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initPortal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await portalInitializer();
    } catch (err) {
      console.error('Portal initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Portal initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initPortal();
  }, [initPortal]);

  if (isLoading) {
    return <PageLoader message={t("loading")} fullPage={true} />;
  }

  if (error) {
    return <PageLoader message={t("loading")} error={error} onRetry={initPortal} fullPage={true} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}