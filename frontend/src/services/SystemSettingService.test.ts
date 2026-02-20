import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemSettingService } from './SystemSettingService';
import { IHttpClient, init } from '../lib/http-client';

describe('SystemSettingService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('should call client.get with correct url', async () => {
    const service = new SystemSettingService();
    const id = 'sys-123';

    // Service calls client with stripped path
    // Note: SystemSettingService now uses /data/... not /portal/data/...
    await service.read(id);

    expect(mockClient.get).toHaveBeenCalledWith(`/data/v1/system/settings/get/${id}`);
  });
});
