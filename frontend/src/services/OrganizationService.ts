import { getClient, ApiResponse } from '../lib/http-client';

export class OrganizationService {
  public async search<T = any>(request: any): Promise<ApiResponse<T>> {
    // Prefix '/portal' (or configured apiPrefix) is handled by the client
    return getClient().post<T>('/org/v2/search', request);
  }
}
