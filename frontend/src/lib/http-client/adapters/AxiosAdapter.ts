import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BaseClient } from '../BaseClient';
import { ApiResponse, HeaderOperation, HttpClientConfig } from '../types';

export class AxiosAdapter extends BaseClient {
  private client: AxiosInstance;

  constructor(config: HttpClientConfig) {
    super(config);
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: config.defaultHeaders,
    });
  }

  private mapResponse<T>(axiosResponse: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: axiosResponse.data,
      status: axiosResponse.status,
      headers: axiosResponse.headers as Record<string, any>,
    };
  }

  private async request<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return this.mapResponse(response);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return this.mapResponse(error.response as AxiosResponse<T>);
      }
      throw error;
    }
  }

  protected async _get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request(() => this.client.get<T>(url, { headers }));
  }

  protected async _post<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request(() => this.client.post<T>(url, data, { headers }));
  }

  protected async _put<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request(() => this.client.put<T>(url, data, { headers }));
  }

  protected async _delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request(() => this.client.delete<T>(url, { headers }));
  }

  public updateHeaders(headers: HeaderOperation[]): void {
    headers.forEach(({ key, value, action }) => {
      if (action === 'add') {
        if (value) {
          this.client.defaults.headers.common[key] = value;
        }
      } else if (action === 'remove') {
        delete this.client.defaults.headers.common[key];
      }
    });
  }
}
