import { getClient, ApiResponse } from '../lib/http-client';

export class SystemSettingService {
  public async read<T = any>(id: string): Promise<ApiResponse<T>> {
    return getClient().get<T>(`portal/data/v1/system/settings/get/${id}`);
  }
}
