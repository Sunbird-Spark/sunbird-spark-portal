import { init, AxiosAdapter } from '../lib/http-client';

export const initializeApiClient = () => {
  const adapter = new AxiosAdapter({
    // apiPrefix is not provided, so it defaults to '/portal' as per adapter logic
    statusHandlers: {
      401: () => console.log('Unauthorized - Redirecting to login...'),
      403: () => console.log('Forbidden - Access denied...'),
    },
  });

  init(adapter);
};
