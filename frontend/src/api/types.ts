export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, any>;
}

export type StatusHandlerConfig = Record<number, (res: ApiResponse<any>) => void>;

export interface HttpClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  statusHandlers?: StatusHandlerConfig;
}

export interface IHttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  post<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  put<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  setAuthHeader(token: string): void;
  clearAuthHeader(): void;
}
