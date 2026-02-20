import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionService } from './CollectionService';
import { IHttpClient, init } from '../../lib/http-client';

describe('CollectionService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('should call client.get with correct url for getHierarchy', async () => {
    const service = new CollectionService();
    const identifier = 'do_123';

    await service.getHierarchy(identifier);

    expect(mockClient.get).toHaveBeenCalledWith('/course/v1/hierarchy/do_123');
  });

  it('should return response data from getHierarchy', async () => {
    const mockData = { content: { identifier: 'do_123', name: 'Test Course' } };
    mockClient.get = vi.fn().mockResolvedValue({ data: mockData, status: 200, headers: {} });

    const service = new CollectionService();
    const result = await service.getHierarchy('do_123');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });
});
