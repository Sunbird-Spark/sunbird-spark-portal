import axios, { AxiosRequestConfig } from 'axios';

export class HttpService {
  /**
   * Fetches data from a URL using GET method
   * @param url - Full URL to fetch from
   * @param config - Optional axios request config
   * @returns Parsed response data
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.get<T>(url, config);
      return response.data;
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error(`HttpService: Failed to fetch from ${url}:`, error);
      }
      throw error;
    }
  }

  static isCancel(error: unknown): boolean {
    return axios.isCancel(error);
  }
}
