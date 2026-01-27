import { ApiResponse, IHttpClient } from '../api/types';

export class ContentService {
  constructor(private client: IHttpClient) {}

  public async getContent<T = any>(): Promise<ApiResponse<T>> {
    return this.client.get<T>('/content');
  }
}
