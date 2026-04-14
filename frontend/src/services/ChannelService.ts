import { getClient, ApiResponse } from '../lib/http-client';

export class ChannelService {
  public async read<T = unknown>(id: string): Promise<ApiResponse<T>> {
    // Prefix '/portal' (or configured apiPrefix) is handled by the client
    return getClient().get<T>(`/channel/v1/read/${id}`);
  }
}
