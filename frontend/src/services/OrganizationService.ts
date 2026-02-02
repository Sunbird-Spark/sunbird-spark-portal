import { getClient, ApiResponse } from '../lib/http-client';

export class OrganizationService {
  public async search<T = any>(request: any): Promise<ApiResponse<T>> {
    return getClient().post<T>('/api/org/v2/search', request);
  }
}
