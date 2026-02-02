import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './OrganizationService';
import { IHttpClient, init } from '../lib/http-client';

describe('OrganizationService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('should call client.post with correct url and payload', async () => {
    const service = new OrganizationService();
    const payload = { request: { filters: { slug: 'sunbird', isTenant: true } } };

    await service.search(payload);

    expect(mockClient.post).toHaveBeenCalledWith('/api/org/v2/search', payload);
  });
});
