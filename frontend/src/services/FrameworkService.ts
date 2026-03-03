import { getClient, ApiResponse } from '../lib/http-client';

export class FrameworkService {
  public async read<T = unknown>(id: string): Promise<ApiResponse<T>> {
    // Prefix '/portal' (or configured apiPrefix) is handled by the client
    return getClient().get<T>(`/framework/v1/read/${id}`);
  }
}
