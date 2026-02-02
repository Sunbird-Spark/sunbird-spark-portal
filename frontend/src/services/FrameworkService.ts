import { getClient, ApiResponse } from '../lib/http-client';

export class FrameworkService {
  public async read<T = any>(id: string): Promise<ApiResponse<T>> {
    return getClient().get<T>(`/api/framework/v1/read/${id}`);
  }
}
