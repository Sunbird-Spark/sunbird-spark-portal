import { init, AxiosAdapter } from '../lib/http-client';

export const initializeApiClient = () => {
  const adapter = new AxiosAdapter({
    baseURL: 'https://jsonplaceholder.typicode.com',
    statusHandlers: {
      401: () => console.log('Unauthorized - Redirecting to login...'),
      403: () => console.log('Forbidden - Access denied...'),
    },
  });

  init(adapter);
};
