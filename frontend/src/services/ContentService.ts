import { getClient, ApiResponse } from '../lib/http-client';

export class ContentService {
  public async getContent<T = any>(): Promise<ApiResponse<T>> {
    return getClient().get<T>('/content');
  }
}
