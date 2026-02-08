import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './AppRoutes';
import { initializeChannelId } from './utils/channelIdInit';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Initialize channel ID for anonymous users (non-blocking)
    initializeChannelId().catch((error) => {
      console.error('Channel ID initialization failed:', error);
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