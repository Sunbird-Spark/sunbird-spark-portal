import {
  ApiResponse,
  HttpClientConfig,
  IHttpClient,
  StatusHandlerConfig,
  HeaderOperation,
} from './types';

export abstract class BaseClient implements IHttpClient {
  protected statusHandlers: StatusHandlerConfig;

  constructor(config: HttpClientConfig) {
    this.statusHandlers = config.statusHandlers || {};
  }

  protected onResponse(response: ApiResponse<any>): void {
    const handler = this.statusHandlers[response.status];
    if (handler) {
      handler(response);
    }
  }

  // Abstract methods to be implemented by adapters
  protected abstract _get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  protected abstract _post<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  protected abstract _put<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  protected abstract _patch<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>>;
  protected abstract _delete<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>>;


  public abstract updateHeaders(headers: HeaderOperation[]): void;

  // Public API methods
  public async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await this._get<T>(url, headers);
    this.onResponse(response);
    return response;
  }

  public async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await this._post<T>(url, data, headers);
    this.onResponse(response);
    return response;
  }

  public async put<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await this._put<T>(url, data, headers);
    this.onResponse(response);
    return response;
  }

  public async patch<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await this._patch<T>(url, data, headers);
    this.onResponse(response);
    return response;
  }

  public async delete<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await this._delete<T>(url, data, headers);
    this.onResponse(response);
    return response;
  }
}
