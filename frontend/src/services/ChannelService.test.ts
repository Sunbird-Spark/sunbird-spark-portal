import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelService } from './ChannelService';
import { IHttpClient, init } from '../lib/http-client';

describe('ChannelService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('should call client.get with correct url', async () => {
    const service = new ChannelService();
    const id = '12345';

    // Service calls client with stripped path
    await service.read(id);

    expect(mockClient.get).toHaveBeenCalledWith(`/channel/v1/read/${id}`);
  });
});
