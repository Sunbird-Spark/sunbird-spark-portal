import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './AppRoutes';
import { portalInitializer } from './utils/portalInitializer';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Initialize portal (non-blocking)
    portalInitializer().catch((error) => {
      console.error('Portal initialization failed:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}