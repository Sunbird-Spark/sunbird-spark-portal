import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameworkService } from './FrameworkService';
import { IHttpClient, init } from '../lib/http-client';

describe('FrameworkService', () => {
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
    const service = new FrameworkService();
    const id = 'fw-123';

    // Service calls client with stripped path
    await service.read(id);

    expect(mockClient.get).toHaveBeenCalledWith(`/framework/v1/read/${id}`);
  });
});
