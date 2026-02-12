import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentService } from './ContentService';
import { IHttpClient, init } from '../lib/http-client';

describe('ContentService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: [], status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    // Initialize the singleton with our mock
    init(mockClient);
  });

  it('should call client.get with correct url', async () => {
    const service = new ContentService();
    await service.getContent();
    expect(mockClient.get).toHaveBeenCalledWith('/content');
  });
});
