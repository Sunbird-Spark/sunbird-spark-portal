import { IHttpClient } from './types';

let portalClient: IHttpClient | null = null;
let apiClient: IHttpClient | null = null;

export const init = (client: IHttpClient): void => {
  portalClient = client;
};

export const initApiClient = (client: IHttpClient): void => {
  apiClient = client;
};

export const getClient = (): IHttpClient => {
  if (!portalClient) {
    throw new Error('HttpClient not initialized. Call init() with an adapter instance first.');
  }
  return portalClient;
};

export const getApiClient = (): IHttpClient => {
  if (!apiClient) {
    throw new Error('API HttpClient not initialized. Call initApiClient() with an adapter instance first.');
  }
  return apiClient;
};

export * from './types';
export * from './BaseClient';
export * from './adapters/AxiosAdapter';
