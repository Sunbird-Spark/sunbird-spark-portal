import axios, { AxiosRequestConfig } from 'axios';

export class HttpService {
  /**
   * Fetches data from a URL using GET method
   * @param url - Full URL to fetch from
   * @param headers - Optional headers
   * @returns Parsed response data
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        headers,
      };
      const response = await axios.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`HttpService: Failed to fetch from ${url}:`, error);
      throw error;
    }
  }
}
