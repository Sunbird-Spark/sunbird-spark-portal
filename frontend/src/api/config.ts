import { init, AxiosAdapter } from '../lib/http-client';

export const initializeApiClient = () => {
  const adapter = new AxiosAdapter({
    // apiPrefix is not provided, so it defaults to '/portal' as per adapter logic
    statusHandlers: {
      401: () => window.dispatchEvent(new CustomEvent('unauthorized')),
      403: () => window.dispatchEvent(new CustomEvent('forbidden')),
    },
  });

  init(adapter);
};
