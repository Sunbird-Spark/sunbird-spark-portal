import { getClient, ApiResponse } from '../lib/http-client';

export class ChannelService {
  public async read<T = any>(id: string): Promise<ApiResponse<T>> {
    return getClient().get<T>(`/api/channel/v1/read/${id}`);
  }
}
