import { getClient, ApiResponse } from '../lib/http-client';

export class ContentService {
  public async getContent<T = unknown>(): Promise<ApiResponse<T>> {
    // Prefix '/portal' (or configured apiPrefix) is handled by the client
    return getClient().get<T>('/content');
  }
}
