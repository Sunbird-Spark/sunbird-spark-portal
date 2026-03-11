import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          const status = (error as Error & { status?: number }).status;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
