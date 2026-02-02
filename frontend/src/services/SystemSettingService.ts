import { getClient, ApiResponse } from '../lib/http-client';

export class SystemSettingService {
  public async read<T = any>(id: string): Promise<ApiResponse<T>> {
    // Prefix '/portal' (or configured apiPrefix) is handled by the client
    // Previously: portal/data/v1/system/settings/get/${id}
    // Now becomes: /data/v1/system/settings/get/${id}
    // Resulting URL with default prefix: /portal/data/v1/system/settings/get/${id}
    return getClient().get<T>(`/data/v1/system/settings/get/${id}`);
  }
}
