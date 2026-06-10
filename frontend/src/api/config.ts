import { init, initApiClient, AxiosAdapter, StatusHandlerConfig } from '../lib/http-client';

const statusHandlers: StatusHandlerConfig = {
  401: () => window.dispatchEvent(new CustomEvent('unauthorized')),
  403: () => window.dispatchEvent(new CustomEvent('forbidden')),
};

export const initializeApiClient = () => {
  // Default `/portal`-prefixed client (served directly by the portal BFF).
  init(new AxiosAdapter({ statusHandlers }));

  // `/api`-prefixed client (served via nginx → Kong → BFF; nginx strips `/api`).
  initApiClient(new AxiosAdapter({ apiPrefix: '/api', statusHandlers }));
};
